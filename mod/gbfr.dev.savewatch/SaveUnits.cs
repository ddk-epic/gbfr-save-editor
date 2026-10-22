using System.Buffers.Binary;
using System.Runtime.InteropServices;

namespace gbfr.dev.savewatch;

// Reads the save manager's SaveDataUnit registries, see docs/live-save.md. Every read goes through
// ReadProcessMemory on this process, which fails on unmapped memory instead of faulting.
internal sealed unsafe class SaveUnits
{
    public static readonly string[] TypeNames =
        ["bool", "byte", "ubyte", "short", "ushort", "int", "uint", "long", "ulong", "float"];
    private static readonly int[] TypeSizes = [1, 1, 1, 2, 2, 4, 4, 8, 8, 4];

    // The slot data save context on the manager; the others, 0x228 apart, hold settings. Its units are in a sorted
    // registry of {key, unit} pairs (count at +0x00, pairs at +0x20) and an std::map serialized on every save
    // (head at +0x100, size at +0x108).
    private const int Context = 0x0;
    private const int RegistryData = 0x20, MapHead = 0x100, MapSize = 0x108;
    private const string Section = "slotData";
    private const long MaxUnits = 10_000_000;

    public sealed record Layout(int Type, int Count, int DataAt)
    {
        public int Size => TypeSizes[Type] * Count;
    }

    public readonly record struct Unit(string Section, ulong Key, Layout Layout, nint Data);

    private readonly nint _managerGlobal;
    private readonly Dictionary<nint, Layout?> _layouts = new();

    public SaveUnits(nint managerGlobal) => _managerGlobal = managerGlobal;

    [DllImport("kernel32.dll")]
    private static extern bool ReadProcessMemory(nint process, nint address, byte* buffer, nint size, out nint read);

    private const nint Self = -1;

    public static bool TryRead(nint address, Span<byte> into)
    {
        fixed (byte* p = into)
            return ReadProcessMemory(Self, address, p, into.Length, out _);
    }

    private static bool TryRead64(nint address, out nint value)
    {
        long v = 0;
        bool ok = ReadProcessMemory(Self, address, (byte*)&v, 8, out _);
        value = (nint)v;
        return ok;
    }

    private nint Manager() =>
        TryRead64(_managerGlobal, out nint holder) && holder != 0 && TryRead64(holder + 0x18, out nint manager)
            ? manager
            : 0;

    // The registry's {key, unit} pairs and the map's size; a change in either means units were added, removed or
    // rebuilt. Null before the manager exists.
    public sealed record Registry(byte[] Pairs, long MapSize)
    {
        public long Count => Pairs.Length / 16;

        public bool SameAs(Registry? other) =>
            other is not null && MapSize == other.MapSize && Pairs.AsSpan().SequenceEqual(other.Pairs);
    }

    public Registry? ReadRegistry()
    {
        nint manager = Manager();
        if (manager == 0 || !TryRead64(manager + Context, out nint count) ||
            !TryRead64(manager + Context + MapSize, out nint map) || !TryRead64(manager + Context + RegistryData, out nint data))
            return null;
        if (count < 0 || count > MaxUnits || map < 0 || map > MaxUnits)
            return null;
        var pairs = new byte[count * 16];
        return count == 0 || TryRead(data, pairs) ? new Registry(pairs, map) : null;
    }

    // Every decodable unit, the registry's first, then the map's not already seen.
    public List<Unit> Scan(Registry registry, out int unread)
    {
        unread = 0;
        var units = new List<Unit>();
        var seen = new HashSet<ulong>();
        nint manager = Manager();
        if (manager == 0)
            return units;

        for (int i = 0; i < registry.Count; i++)
            Add(units, seen, BinaryPrimitives.ReadUInt64LittleEndian(registry.Pairs.AsSpan(i * 16)),
                (nint)BinaryPrimitives.ReadInt64LittleEndian(registry.Pairs.AsSpan(i * 16 + 8)), ref unread);

        // MSVC tree nodes: left +0x00, parent +0x08, right +0x10, nil flag +0x19, key +0x20, unit +0x28.
        if (TryRead64(manager + Context + MapHead, out nint head) && TryRead64(head + 8, out nint root))
        {
            var stack = new Stack<nint>();
            stack.Push(root);
            var node = new byte[0x30];
            long visited = 0;
            while (stack.Count > 0 && visited <= registry.MapSize)
            {
                nint at = stack.Pop();
                if (at == 0 || at == head || !TryRead(at, node) || node[0x19] != 0)
                    continue;
                visited++;
                stack.Push((nint)BinaryPrimitives.ReadInt64LittleEndian(node));
                stack.Push((nint)BinaryPrimitives.ReadInt64LittleEndian(node.AsSpan(0x10)));
                Add(units, seen, BinaryPrimitives.ReadUInt64LittleEndian(node.AsSpan(0x20)),
                    (nint)BinaryPrimitives.ReadInt64LittleEndian(node.AsSpan(0x28)), ref unread);
            }
        }
        return units;
    }

    private void Add(List<Unit> units, HashSet<ulong> seen, ulong key, nint unit, ref int unread)
    {
        if (!seen.Add(key))
            return;
        var layout = TryRead64(unit, out nint vtable) ? LayoutOf(vtable) : null;
        if (layout is null || !TryRead64(unit + layout.DataAt, out nint values))
            unread++;
        else
            units.Add(new Unit(Section, key, layout, values));
    }

    // Decodes slots 1 (value type), 2 (count) and 9 (live pointer) from their one-instruction bodies.
    private Layout? LayoutOf(nint vtable)
    {
        if (_layouts.TryGetValue(vtable, out var known))
            return known;
        Layout? layout = null;
        Span<byte> slots = stackalloc byte[80];
        if (TryRead(vtable, slots))
        {
            int? type = ReturnedInt(SlotCode(slots, 1));
            int? count = ReturnedInt(SlotCode(slots, 2));
            int? dataAt = ReturnedField(SlotCode(slots, 9));
            if (type is >= 0 and < 10 && count is > 0 && dataAt is not null)
                layout = new Layout(type.Value, count.Value, dataAt.Value);
        }
        _layouts[vtable] = layout;
        return layout;
    }

    private static byte[] SlotCode(ReadOnlySpan<byte> slots, int slot)
    {
        var code = new byte[8];
        TryRead((nint)BinaryPrimitives.ReadInt64LittleEndian(slots[(slot * 8)..]), code);
        return code;
    }

    private static int? ReturnedInt(byte[] code)
    {
        if (code[0] == 0xB8 && code[5] == 0xC3) // mov eax, imm32; ret
            return BinaryPrimitives.ReadInt32LittleEndian(code.AsSpan(1));
        if (code[0] is 0x31 or 0x33 && code[1] == 0xC0 && code[2] == 0xC3) // xor eax, eax; ret
            return 0;
        return null;
    }

    private static int? ReturnedField(byte[] code)
    {
        if (code[0] == 0x48 && code[1] == 0x8B && code[2] == 0x41 && code[4] == 0xC3) // mov rax, [rcx+disp8]; ret
            return code[3];
        if (code[0] == 0x48 && code[1] == 0x8B && code[2] == 0x81 && code[7] == 0xC3) // mov rax, [rcx+disp32]; ret
            return BinaryPrimitives.ReadInt32LittleEndian(code.AsSpan(3));
        return null;
    }
}
