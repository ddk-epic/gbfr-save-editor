using System.Diagnostics;
using Reloaded.Memory.Sigscan;
using Reloaded.Mod.Interfaces;
using Reloaded.Mod.Interfaces.Internal;

namespace gbfr.dev.savewatch;

public class Startup : IMod
{
    // Write state 0 (FUN_1408a82b0); the mov at +0x16 loads the save manager global.
    private const string ManagerSignature =
        "56 48 83 EC 20 48 8B 31 B9 E0 03 00 00 48 03 4E 08 E8 ?? ?? ?? ?? 48 8B 05 ?? ?? ?? ?? " +
        "0F B6 56 58 48 8B 48 18 C7 81 38 03 00 00 00 00 00 00 B9 28 02 00 00 48 03 48 18 E8";
    private const int GlobalDisp = 0x19, GlobalNext = 0x1D;

    private ILogger _logger = null!;
    private string _dir = null!;
    private nint _global;

    public void StartEx(IModLoaderV1 loaderApi, IModConfigV1 modConfig)
    {
        var loader = (IModLoader)loaderApi;
        _logger = (ILogger)loader.GetLogger();
        _dir = loader.GetDirectoryForModId(modConfig.ModId);
        _global = FindManagerGlobal();
        if (_global == 0)
        {
            _logger.WriteLine("[gbfr.dev.savewatch] save manager signature not found");
            return;
        }
        new Thread(Run) { IsBackground = true, Name = "savewatch" }.Start();
    }

    private void Run()
    {
        try
        {
            _logger.WriteLine($"[gbfr.dev.savewatch] writing to {_dir}");
            new LiveLog(new SaveUnits(_global), _dir, _logger).Run();
        }
        catch (Exception e)
        {
            _logger.WriteLine($"[gbfr.dev.savewatch] stopped: {e}");
        }
    }

    private static unsafe nint FindManagerGlobal()
    {
        var module = Process.GetCurrentProcess().MainModule!;
        var result = new Scanner((byte*)module.BaseAddress, module.ModuleMemorySize).FindPattern(ManagerSignature);
        if (!result.Found)
            return 0;
        nint at = module.BaseAddress + result.Offset;
        return at + GlobalNext + *(int*)(at + GlobalDisp);
    }

    public void Suspend() { }
    public void Resume() { }
    public void Unload() { }
    public bool CanUnload() => false;
    public bool CanSuspend() => false;
    public Action Disposing => () => { };
}
