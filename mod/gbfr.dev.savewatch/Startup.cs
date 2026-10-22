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

    public void StartEx(IModLoaderV1 loaderApi, IModConfigV1 modConfig)
    {
        var loader = (IModLoader)loaderApi;
        _logger = (ILogger)loader.GetLogger();
        _dir = loader.GetDirectoryForModId(modConfig.ModId);
        new Thread(Run) { IsBackground = true, Name = "savewatch" }.Start();
    }

    private void Run()
    {
        try
        {
            nint global = FindManagerGlobal();
            if (global == 0)
            {
                _logger.WriteLine("[savewatch] save manager signature not found");
                return;
            }
            _logger.WriteLine($"[savewatch] writing to {_dir}");
            new LiveLog(new SaveUnits(global), _dir, _logger).Run();
        }
        catch (Exception e)
        {
            _logger.WriteLine($"[savewatch] stopped: {e}");
        }
    }

    // Retries while SteamStub may still be unpacking the code.
    private static unsafe nint FindManagerGlobal()
    {
        var module = Process.GetCurrentProcess().MainModule!;
        for (int attempt = 0; attempt < 60; attempt++)
        {
            var scanner = new Scanner((byte*)module.BaseAddress, module.ModuleMemorySize);
            var result = scanner.FindPattern(ManagerSignature);
            if (result.Found)
            {
                nint at = module.BaseAddress + result.Offset;
                return at + GlobalNext + *(int*)(at + GlobalDisp);
            }
            Thread.Sleep(1000);
        }
        return 0;
    }

    public void Suspend() { }
    public void Resume() { }
    public void Unload() { }
    public bool CanUnload() => false;
    public bool CanSuspend() => false;
    public Action Disposing => () => { };
}
