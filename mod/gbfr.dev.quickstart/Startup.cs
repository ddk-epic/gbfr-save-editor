using System.Diagnostics;
using Reloaded.Memory.Sigscan;
using Reloaded.Mod.Interfaces;
using Reloaded.Mod.Interfaces.Internal;

using IReloadedHooks = Reloaded.Hooks.ReloadedII.Interfaces.IReloadedHooks;

namespace gbfr.dev.quickstart;

public class Startup : IMod
{
    // BehaviorPlayerBase's hit calculation, vtable slot 11 (FUN_1409c1ac0)
    private const string CalculateHitSignature =
        "55 41 57 41 56 41 55 41 54 56 57 53 48 81 EC 58 01 00 00 48 8D AC 24 ?? ?? ?? ?? C5 78 29 BD ?? ?? ?? ?? " +
        "C5 78 29 B5 ?? ?? ?? ?? C5 78 29 AD ?? ?? ?? ?? C5 78 29 A5 ?? ?? ?? ?? C5 78 29 9D ?? ?? ?? ?? " +
        "C5 ?? ?? ?? ?? C5 ?? ?? ?? ?? C5 ?? ?? ?? ?? C5 ?? ?? ?? ?? C5 ?? ?? ?? ?? 48 C7 45 28 ?? ?? ?? ?? 4C 89 C3";

    // ExActRun's update, vtable slot 3 (FUN_14278c1f0)
    private const string RunUpdateSignature =
        "41 56 56 57 53 48 83 EC 68 48 89 CE 48 8B 79 F8 48 8B 87 18 32 00 00 C5 FA 10 80 54 04 00 00";

    // ReceptionQuestFlow's update (FUN_141fca260)
    private const string FlowUpdateSignature =
        "55 41 57 41 56 41 55 41 54 56 57 53 48 81 EC 38 04 00 00 48 8D AC 24 ?? ?? ?? ?? C5 78 29 BD ?? ?? ?? ?? " +
        "C5 78 29 B5 ?? ?? ?? ?? C5 78 29 AD ?? ?? ?? ?? C5 78 29 A5 ?? ?? ?? ?? C5 78 29 9D ?? ?? ?? ?? " +
        "C5 78 29 95 ?? ?? ?? ?? C5 78 29 8D ?? ?? ?? ??";

    // ControllerResultGuide's update, vtable slot 31 (FUN_140c0d6c0)
    private const string GuideUpdateSignature =
        "41 56 56 57 53 48 83 EC 38 48 89 CE 80 B9 00 02 00 00 00 74 ?? 48 8B 86 38 01 00 00";

    // returns a data file parsed into msgpack objects, cached by path (FUN_143b73680)
    private const string LoadDataFileSignature =
        "55 41 57 41 56 56 57 53 48 81 EC 88 00 00 00 48 8D AC 24 ?? ?? ?? ?? 48 C7 45 00 ?? ?? ?? ?? 48 89 D7";

    // in the run update: mov rax, [session global]
    private const int SessionMov = 0xBD, SessionDisp = 0xC0, SessionNext = 0xC4;

    private ILogger _logger = null!;
    private IReloadedHooks? _hooks;
    private Settings _settings = null!;
    private Boosts? _boosts;
    private ChestTimer? _chestTimer;
    private ResultTimer? _resultTimer;
    private StartupLogos? _startupLogos;

    public void StartEx(IModLoaderV1 loaderApi, IModConfigV1 modConfig)
    {
        var loader = (IModLoader)loaderApi;
        _logger = (ILogger)loader.GetLogger();
        loader.GetController<IReloadedHooks>()?.TryGetTarget(out _hooks);
        if (_hooks == null)
        {
            _logger.WriteLine("[gbfr.dev.quickstart] Reloaded hooks not available");
            return;
        }
        _settings = Settings.Load(loader.GetDirectoryForModId(modConfig.ModId));
        try
        {
            HookFunctions();
        }
        catch (Exception e)
        {
            _logger.WriteLine($"[gbfr.dev.quickstart] stopped: {e}");
        }
    }

    private unsafe void HookFunctions()
    {
        var module = Process.GetCurrentProcess().MainModule!;
        var scanner = new Scanner((byte*)module.BaseAddress, module.ModuleMemorySize);
        var hit = scanner.FindPattern(CalculateHitSignature);
        var run = scanner.FindPattern(RunUpdateSignature);
        var flow = scanner.FindPattern(FlowUpdateSignature);
        var guide = scanner.FindPattern(GuideUpdateSignature);
        var load = scanner.FindPattern(LoadDataFileSignature);
        if (!hit.Found || !run.Found || !flow.Found || !guide.Found || !load.Found)
        {
            _logger.WriteLine("[gbfr.dev.quickstart] signatures not found; nothing hooked; is this game version 2.0.6?");
            return;
        }
        nint runUpdate = module.BaseAddress + run.Offset;
        byte* mov = (byte*)runUpdate + SessionMov;
        if (mov[0] != 0x48 || mov[1] != 0x8B || mov[2] != 0x05)
        {
            _logger.WriteLine("[gbfr.dev.quickstart] session global not found; nothing hooked");
            return;
        }
        nint session = runUpdate + SessionNext + *(int*)(runUpdate + SessionDisp);
        _boosts = new Boosts(_hooks!, _settings, _logger, module.BaseAddress + hit.Offset, runUpdate, session);
        if (_settings.SkipChestTimer)
            _chestTimer = new ChestTimer(_hooks!, _logger, module.BaseAddress + flow.Offset, session);
        if (_settings.SkipResultTimer)
            _resultTimer = new ResultTimer(_hooks!, _logger, module.BaseAddress + guide.Offset, session);
        if (_settings.SkipStartupLogos)
            _startupLogos = new StartupLogos(_hooks!, _logger, module.BaseAddress + load.Offset);
        _logger.WriteLine(
            $"[gbfr.dev.quickstart] hooked: damage x{_settings.DamageMultiplier}, run x{_settings.RunSpeedMultiplier}, " +
            $"skip chest timer {_settings.SkipChestTimer}, skip result timer {_settings.SkipResultTimer}, " +
            $"skip startup logos {_settings.SkipStartupLogos}");
    }

    public void Suspend() { }
    public void Resume() { }
    public void Unload() { }
    public bool CanUnload() => false;
    public bool CanSuspend() => false;
    public Action Disposing => () => { };
}
