using System.Buffers.Binary;
using System.Globalization;
using System.Text;
using Reloaded.Mod.Interfaces;

namespace gbfr.dev.savewatch;

// Polls the live units and appends each change to live.jsonl, which tools/mod-log.ts renders.
// A dump.request file in the folder asks for every unit in units.json, for tools/mod-check.ts.
internal sealed class LiveLog
{
    private const int IntervalMs = 500;
    // More added, removed or changed units than this in one poll (loading a save) is logged as one event.
    private const int MaxListedChanges = 1000;

    private readonly SaveUnits _units;
    private readonly string _dir;
    private readonly ILogger _logger;

    public LiveLog(SaveUnits units, string dir, ILogger logger)
    {
        _units = units;
        _dir = dir;
        _logger = logger;
    }

    public void Run()
    {
        Directory.CreateDirectory(_dir);
        string request = Path.Combine(_dir, "dump.request");
        using var stream = new FileStream(Path.Combine(_dir, "live.jsonl"), FileMode.Append, FileAccess.Write,
            FileShare.ReadWrite);
        using var writer = new StreamWriter(stream);
        writer.WriteLine($"{{\"t\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"event\":\"start\"}}");
        writer.Flush();

        SaveUnits.Registry? registry = null;
        Snapshot? last = null;
        while (true)
        {
            Thread.Sleep(IntervalMs);
            var now = _units.ReadRegistry();
            if (now is null)
                continue;
            long t = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            Snapshot next;
            if (last is null || !now.SameAs(registry))
            {
                var list = _units.Scan(now, out int unread);
                next = Snapshot.Take(new Plan(list));
                writer.WriteLine($"{{\"t\":{t},\"event\":\"registry\",\"registry\":{now.Count},\"map\":{now.MapSize}," +
                                 $"\"units\":{list.Count},\"unread\":{unread}}}");
                _logger.WriteLine($"[savewatch] registry {now.Count}, map {now.MapSize}, {list.Count} units, {unread} unread");
                if (last is not null)
                    DiffByKey(writer, t, last, next);
                registry = now;
            }
            else
            {
                next = Snapshot.Take(last.Plan);
                var changed = new List<(int, int)>();
                for (int i = 0; i < next.Plan.Units.Count; i++)
                    if (next.Read[i] && last.Read[i] && !next.Values(i).SequenceEqual(last.Values(i)))
                        changed.Add((i, i));
                WriteChanges(writer, t, last, next, changed);
            }
            writer.Flush();
            last = next;

            if (File.Exists(request))
            {
                Dump(last, Path.Combine(_dir, "units.json"));
                File.Delete(request);
            }
        }
    }

    private static void DiffByKey(StreamWriter writer, long t, Snapshot before, Snapshot after)
    {
        var added = after.Plan.Index.Keys.Where(k => !before.Plan.Index.ContainsKey(k)).ToList();
        var removed = before.Plan.Index.Keys.Where(k => !after.Plan.Index.ContainsKey(k)).ToList();
        if (added.Count + removed.Count <= MaxListedChanges)
        {
            foreach (var key in removed)
            {
                int i = before.Plan.Index[key];
                if (before.Read[i])
                    writer.WriteLine(Line(t, "unit-removed", before.Plan.Units[i], before.Values(i), null));
            }
            foreach (var key in added)
            {
                int i = after.Plan.Index[key];
                if (after.Read[i])
                    writer.WriteLine(Line(t, "unit-added", after.Plan.Units[i], after.Values(i), null));
            }
        }
        var changed = new List<(int, int)>();
        foreach (var (key, i) in after.Plan.Index)
        {
            if (!before.Plan.Index.TryGetValue(key, out int j) || !after.Read[i] || !before.Read[j])
                continue;
            if (after.Plan.Units[i].Layout.Size == before.Plan.Units[j].Layout.Size &&
                !after.Values(i).SequenceEqual(before.Values(j)))
                changed.Add((i, j));
        }
        WriteChanges(writer, t, before, after, changed);
    }

    // Each change as a unit line, or one bulk event when there are too many to list.
    private static void WriteChanges(StreamWriter writer, long t, Snapshot before, Snapshot after,
        List<(int After, int Before)> changed)
    {
        if (changed.Count > MaxListedChanges)
        {
            writer.WriteLine($"{{\"t\":{t},\"event\":\"bulk\",\"changed\":{changed.Count}}}");
            return;
        }
        foreach (var (i, j) in changed)
            writer.WriteLine(Line(t, "unit", after.Plan.Units[i], after.Values(i), before.Values(j)));
    }

    private static void Dump(Snapshot snapshot, string path)
    {
        var sb = new StringBuilder("[");
        for (int i = 0; i < snapshot.Plan.Units.Count; i++)
        {
            if (!snapshot.Read[i])
                continue;
            if (sb.Length > 1)
                sb.Append(",\n");
            sb.Append('{');
            Unit(sb, snapshot.Plan.Units[i], snapshot.Values(i));
            sb.Append('}');
        }
        sb.Append(']');
        File.WriteAllText(path + ".tmp", sb.ToString());
        File.Move(path + ".tmp", path, true);
    }

    private static string Line(long t, string kind, SaveUnits.Unit unit, ReadOnlySpan<byte> values,
        ReadOnlySpan<byte> before)
    {
        var sb = new StringBuilder();
        sb.Append($"{{\"t\":{t},\"event\":\"{kind}\",");
        Unit(sb, unit, values);
        if (kind == "unit")
        {
            sb.Append(",\"before\":");
            Values(sb, unit.Layout, before);
        }
        return sb.Append('}').ToString();
    }

    // The unit's fields, without braces.
    private static void Unit(StringBuilder sb, SaveUnits.Unit unit, ReadOnlySpan<byte> values)
    {
        sb.Append($"\"section\":\"{unit.Section}\",\"attribute\":{unit.Key >> 32},\"entity\":{unit.Key & 0xFFFFFFFF}," +
                  $"\"type\":\"{SaveUnits.TypeNames[unit.Layout.Type]}\",\"values\":");
        Values(sb, unit.Layout, values);
    }

    // Long and ulong as strings, which JSON numbers cannot hold exactly.
    private static void Values(StringBuilder sb, SaveUnits.Layout layout, ReadOnlySpan<byte> raw)
    {
        var inv = CultureInfo.InvariantCulture;
        int size = raw.Length / layout.Count;
        sb.Append('[');
        for (int i = 0; i < layout.Count; i++)
        {
            if (i > 0)
                sb.Append(',');
            var v = raw.Slice(i * size, size);
            switch (layout.Type)
            {
                case 0: sb.Append(v[0] != 0 ? "true" : "false"); break;
                case 1: sb.Append((sbyte)v[0]); break;
                case 2: sb.Append(v[0]); break;
                case 3: sb.Append(BinaryPrimitives.ReadInt16LittleEndian(v)); break;
                case 4: sb.Append(BinaryPrimitives.ReadUInt16LittleEndian(v)); break;
                case 5: sb.Append(BinaryPrimitives.ReadInt32LittleEndian(v)); break;
                case 6: sb.Append(BinaryPrimitives.ReadUInt32LittleEndian(v)); break;
                case 7: sb.Append('"').Append(BinaryPrimitives.ReadInt64LittleEndian(v)).Append('"'); break;
                case 8: sb.Append('"').Append(BinaryPrimitives.ReadUInt64LittleEndian(v)).Append('"'); break;
                default:
                    double f = BinaryPrimitives.ReadSingleLittleEndian(v);
                    if (double.IsFinite(f))
                        sb.Append(f.ToString("R", inv));
                    else
                        sb.Append('"').Append(f.ToString(inv)).Append('"');
                    break;
            }
        }
        sb.Append(']');
    }
}

// The units of one registry scan, with their data grouped into few large reads.
internal sealed class Plan
{
    private const int Gap = 0x1000;

    public readonly List<SaveUnits.Unit> Units;
    public readonly int[] Offsets;
    public readonly int Size;
    public readonly List<(nint Start, int Size, int[] Members)> Regions = new();
    private Dictionary<(string, ulong), int>? _index;

    public Dictionary<(string, ulong), int> Index
    {
        get
        {
            if (_index is not null)
                return _index;
            _index = new Dictionary<(string, ulong), int>(Units.Count);
            for (int i = 0; i < Units.Count; i++)
                _index.TryAdd((Units[i].Section, Units[i].Key), i);
            return _index;
        }
    }

    public Plan(List<SaveUnits.Unit> units)
    {
        Units = units;
        Offsets = new int[units.Count];
        for (int i = 0; i < units.Count; i++)
        {
            Offsets[i] = Size;
            Size += units[i].Layout.Size;
        }
        var members = new List<int>();
        nint start = 0, end = 0;
        foreach (int i in Enumerable.Range(0, units.Count).OrderBy(i => (long)units[i].Data))
        {
            nint at = units[i].Data, stop = at + units[i].Layout.Size;
            if (members.Count > 0 && at - end > Gap)
            {
                Regions.Add((start, (int)(end - start), members.ToArray()));
                members.Clear();
            }
            if (members.Count == 0)
                start = at;
            members.Add(i);
            end = Math.Max(end, stop);
        }
        if (members.Count > 0)
            Regions.Add((start, (int)(end - start), members.ToArray()));
    }
}

internal sealed class Snapshot
{
    public readonly Plan Plan;
    public readonly byte[] Data;
    public readonly bool[] Read;

    private Snapshot(Plan plan)
    {
        Plan = plan;
        Data = new byte[plan.Size];
        Read = new bool[plan.Units.Count];
    }

    public ReadOnlySpan<byte> Values(int i) => Data.AsSpan(Plan.Offsets[i], Plan.Units[i].Layout.Size);

    // A region crossing an unmapped page falls back to one read per unit.
    public static Snapshot Take(Plan plan)
    {
        var snapshot = new Snapshot(plan);
        foreach (var (start, size, members) in plan.Regions)
        {
            var block = new byte[size];
            bool whole = SaveUnits.TryRead(start, block);
            foreach (int i in members)
            {
                var unit = plan.Units[i];
                var into = snapshot.Data.AsSpan(plan.Offsets[i], unit.Layout.Size);
                if (whole)
                {
                    block.AsSpan((int)(unit.Data - start), unit.Layout.Size).CopyTo(into);
                    snapshot.Read[i] = true;
                }
                else
                    snapshot.Read[i] = SaveUnits.TryRead(unit.Data, into);
            }
        }
        return snapshot;
    }
}
