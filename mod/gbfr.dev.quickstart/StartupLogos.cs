using System.Runtime.InteropServices;
using System.Text;
using Reloaded.Hooks.Definitions;
using Reloaded.Mod.Interfaces;

using IReloadedHooks = Reloaded.Hooks.ReloadedII.Interfaces.IReloadedHooks;

namespace gbfr.dev.quickstart;

// Skips the company and technology logos at game start.
public sealed unsafe class StartupLogos
{
    private const string BootFsm = "ui_boot_fsm_ingame.";

    // in the parsed data file
    private const int DataFileRoot = 0x18;

    // msgpack-c object
    private const int ObjectType = 0x0;
    private const int ObjectSize = 0x8;
    private const int ObjectPointer = 0x10;
    private const int ObjectLength = 0x18;
    private const int PairLength = 0x30;
    private const uint TypePositiveInteger = 2;
    private const uint TypeString = 5;
    private const uint TypeMap = 7;

    // boot flow node guids
    private const ulong StartNode = 1604913444;
    private const ulong LogoNode = 1137125987;
    private const ulong LoadNode = 2012070459;

    private delegate void LoadDataFile(nint dataFile, nint path);

    private readonly ILogger _logger;
    private readonly IHook<LoadDataFile> _hook;
    private bool _logged;

    public StartupLogos(IReloadedHooks hooks, ILogger logger, nint loadDataFile)
    {
        _logger = logger;
        _hook = hooks.CreateHook<LoadDataFile>(LoadDataFileImpl, loadDataFile).Activate();
    }

    private void LoadDataFileImpl(nint dataFile, nint path)
    {
        _hook.OriginalFunction(dataFile, path);
        if (path == 0 || !(Marshal.PtrToStringUTF8(path)?.Contains(BootFsm, StringComparison.OrdinalIgnoreCase) ?? false))
            return;
        nint holder = *(nint*)dataFile;
        if (holder == 0)
            return;
        bool skipped = SkipLogos(holder + DataFileRoot);
        if (_logged)
            return;
        _logged = true;
        _logger.WriteLine(skipped ? "[gbfr.dev.quickstart] startup logos skipped" : "[gbfr.dev.quickstart] boot flow logo transition not found");
    }

    // Retargets the start node's logo transition to the load node.
    private static bool SkipLogos(nint root)
    {
        if (*(uint*)(root + ObjectType) != TypeMap)
            return false;
        bool found = false;
        uint count = *(uint*)(root + ObjectSize);
        nint pairs = *(nint*)(root + ObjectPointer);
        for (uint i = 0; i < count; i++)
        {
            nint key = pairs + (nint)i * PairLength;
            nint value = key + ObjectLength;
            if (!IsString(key, "Transition") || *(uint*)(value + ObjectType) != TypeMap)
                continue;
            nint from = Find(value, "toNodeGuid_");
            nint to = Find(value, "fromNodeGuid_");
            if (from == 0 || to == 0 || Integer(from) != StartNode)
                continue;
            if (Integer(to) == LogoNode)
                *(ulong*)(to + ObjectSize) = LoadNode;
            found |= Integer(to) == LoadNode;
        }
        return found;
    }

    private static nint Find(nint map, string name)
    {
        uint count = *(uint*)(map + ObjectSize);
        nint pairs = *(nint*)(map + ObjectPointer);
        for (uint i = 0; i < count; i++)
        {
            nint key = pairs + (nint)i * PairLength;
            if (IsString(key, name))
                return key + ObjectLength;
        }
        return 0;
    }

    private static ulong Integer(nint value) =>
        *(uint*)(value + ObjectType) == TypePositiveInteger ? *(ulong*)(value + ObjectSize) : ulong.MaxValue;

    private static bool IsString(nint value, string text)
    {
        if (*(uint*)(value + ObjectType) != TypeString)
            return false;
        uint length = *(uint*)(value + ObjectSize);
        return length == text.Length
            && Encoding.ASCII.GetString((byte*)*(nint*)(value + ObjectPointer), (int)length) == text;
    }
}
