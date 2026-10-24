using System.Buffers.Binary;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace gbfr.dev.savewatch;

// Reads the save manager's SaveDataUnit registries through ReadProcessMemory, see docs/live-save.md.
internal sealed unsafe class SaveUnits
{
    public static readonly string[] TypeNames =
        ["bool", "byte", "ubyte", "short", "ushort", "int", "uint", "long", "ulong", "float"];
    private static readonly int[] TypeSizes = [1, 1, 1, 2, 2, 4, 4, 8, 8, 4];

    // The slot data save context on the manager.
    private const int Context = 0x0;
    private const int RegistryData = 0x20, MapHead = 0x100, MapSize = 0x108;
    private const string Section = "slotData";
    private const long MaxUnits = 10_000_000;
    private const int MaxVectorBytes = 1 << 20;

    public sealed record Layout(int Type, int Count, int DataAt, bool Variable = false)
    {
        public int ElementSize => TypeSizes[Type];
        public int Size => Variable ? 0 : ElementSize * Count;
    }

    public readonly record struct Unit(string Section, ulong Key, Layout Layout, nint Data);

    public sealed record Unread(SortedSet<uint> Attributes, SortedSet<long> Vtables)
    {
        public int Count;
    }

    private readonly nint _managerGlobal;
    private readonly nint _exe = Process.GetCurrentProcess().MainModule!.BaseAddress;
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

    // A registry snapshot; null before the manager exists.
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
    public List<Unit> Scan(Registry registry, out Unread unread)
    {
        unread = new Unread(new SortedSet<uint>(), new SortedSet<long>());
        var units = new List<Unit>();
        var seen = new HashSet<ulong>();
        nint manager = Manager();
        if (manager == 0)
            return units;

        for (int i = 0; i < registry.Count; i++)
            Add(units, seen, BinaryPrimitives.ReadUInt64LittleEndian(registry.Pairs.AsSpan(i * 16)),
                (nint)BinaryPrimitives.ReadInt64LittleEndian(registry.Pairs.AsSpan(i * 16 + 8)), unread);

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
                    (nint)BinaryPrimitives.ReadInt64LittleEndian(node.AsSpan(0x28)), unread);
            }
        }
        return units;
    }

    private void Add(List<Unit> units, HashSet<ulong> seen, ulong key, nint unit, Unread unread)
    {
        if (!seen.Add(key))
            return;
        bool hasVtable = TryRead64(unit, out nint vtable);
        var layout = hasVtable ? LayoutOf(vtable) : null;
        if (layout is not null && TryRead64(unit + layout.DataAt, out nint values))
        {
            units.Add(new Unit(Section, key, layout, values));
            return;
        }
        unread.Count++;
        unread.Attributes.Add((uint)(key >> 32));
        if (hasVtable)
            unread.Vtables.Add(vtable - _exe);
    }

    public static byte[]? ReadVector(Unit unit)
    {
        Span<byte> header = stackalloc byte[16];
        if (!TryRead(unit.Data, header))
            return null;
        long begin = BinaryPrimitives.ReadInt64LittleEndian(header);
        long size = BinaryPrimitives.ReadInt64LittleEndian(header[8..]) - begin;
        if (size < 0 || size > MaxVectorBytes || size % unit.Layout.ElementSize != 0)
            return null;
        var values = new byte[size];
        return size == 0 || TryRead((nint)begin, values) ? values : null;
    }

    // Decodes slots 1 (value type), 2 (count) and 9 (live pointer) from their short bodies.
    private Layout? LayoutOf(nint vtable)
    {
        if (_layouts.TryGetValue(vtable, out var known))
            return known;
        Layout? layout = null;
        Span<byte> slots = stackalloc byte[80];
        if (TryRead(vtable, slots))
        {
            int? type = ReturnedInt(SlotCode(slots, 1));
            byte[] countCode = SlotCode(slots, 2);
            int? count = ReturnedInt(countCode);
            int? dataAt = ReturnedField(SlotCode(slots, 9));
            if (type is >= 0 and < 10 && dataAt is not null)
            {
                if (count is > 0)
                    layout = new Layout(type.Value, count.Value, dataAt.Value);
                else if (VectorShift(countCode) is int shift && 1 << shift == TypeSizes[type.Value])
                    layout = new Layout(type.Value, 0, dataAt.Value, Variable: true);
            }
        }
        _layouts[vtable] = layout;
        return layout;
    }

    private static byte[] SlotCode(ReadOnlySpan<byte> slots, int slot)
    {
        var code = new byte[16];
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

    private static readonly byte[] VectorCount =
        [0x48, 0x8B, 0x49, 0x10, 0x48, 0x8B, 0x41, 0x08, 0x48, 0x2B, 0x01, 0x48, 0xC1, 0xF8];

    private static int? VectorShift(byte[] code) =>
        code.AsSpan(0, VectorCount.Length).SequenceEqual(VectorCount) && code[15] == 0xC3 ? code[14] : null;

    private static int? ReturnedField(byte[] code)
    {
        if (code[0] == 0x48 && code[1] == 0x8B && code[2] == 0x41 && code[4] == 0xC3) // mov rax, [rcx+disp8]; ret
            return code[3];
        if (code[0] == 0x48 && code[1] == 0x8B && code[2] == 0x81 && code[7] == 0xC3) // mov rax, [rcx+disp32]; ret
            return BinaryPrimitives.ReadInt32LittleEndian(code.AsSpan(3));
        return null;
    }
}
