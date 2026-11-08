using Reloaded.Hooks.Definitions;
using Reloaded.Mod.Interfaces;

using IReloadedHooks = Reloaded.Hooks.ReloadedII.Interfaces.IReloadedHooks;

namespace gbfr.dev.quickstart;

// Ends the countdown on the score and reward screens. Offsets are from v2.0.6.
public sealed unsafe class ResultTimer
{
    // in ControllerResultGuide: its TimeSetter
    private const int GuideTimer = 0x1B0;

    // in the TimeSetter
    private const int TimerLeft = 0xA4;
    private const int TimerRunning = 0xC8;

    private const float AlmostDone = 0.001f;

    private delegate void GuideUpdate(nint guide);

    private readonly ILogger _logger;
    private readonly nint _session;
    private readonly IHook<GuideUpdate> _hook;
    private bool _logged;

    public ResultTimer(IReloadedHooks hooks, ILogger logger, nint guideUpdate, nint session)
    {
        _logger = logger;
        _session = session;
        _hook = hooks.CreateHook<GuideUpdate>(GuideUpdateImpl, guideUpdate).Activate();
    }

    private void GuideUpdateImpl(nint guide)
    {
        _hook.OriginalFunction(guide);
        nint timer = *(nint*)(guide + GuideTimer);
        if (timer == 0
            || *(byte*)(timer + TimerRunning) == 0
            || *(float*)(timer + TimerLeft) <= AlmostDone
            || Boosts.IsOnline(_session))
            return;
        *(float*)(timer + TimerLeft) = AlmostDone;
        if (!_logged)
        {
            _logged = true;
            _logger.WriteLine("[quick] first result timer ended");
        }
    }
}
