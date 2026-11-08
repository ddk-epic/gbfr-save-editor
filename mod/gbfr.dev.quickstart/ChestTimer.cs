using Reloaded.Hooks.Definitions;
using Reloaded.Mod.Interfaces;

using IReloadedHooks = Reloaded.Hooks.ReloadedII.Interfaces.IReloadedHooks;

namespace gbfr.dev.quickstart;

// Ends the 30 second chest wait after a boss. Offsets are from v2.0.6.
public sealed unsafe class ChestTimer
{
    // in ReceptionQuestFlow
    private const int FlowState = 0x2D8;
    private const int FlowTimeLeft = 0x6F4;
    private const int FlowEventRunning = 0x6FC;
    private const int FlowTimerStarted = 0x6FD;

    private const uint StateWaitChests = 0x15;

    private delegate uint FlowUpdate(nint flow);

    private readonly ILogger _logger;
    private readonly nint _session;
    private readonly IHook<FlowUpdate> _hook;
    private bool _logged;

    public ChestTimer(IReloadedHooks hooks, ILogger logger, nint flowUpdate, nint session)
    {
        _logger = logger;
        _session = session;
        _hook = hooks.CreateHook<FlowUpdate>(FlowUpdateImpl, flowUpdate).Activate();
    }

    // Zeroes the time left so the update opens every chest.
    private uint FlowUpdateImpl(nint flow)
    {
        if (*(uint*)(flow + FlowState) == StateWaitChests
            && *(byte*)(flow + FlowEventRunning) == 0
            && *(byte*)(flow + FlowTimerStarted) != 0
            && *(float*)(flow + FlowTimeLeft) > 0f
            && !Boosts.IsOnline(_session))
        {
            *(float*)(flow + FlowTimeLeft) = 0f;
            if (!_logged)
            {
                _logged = true;
                _logger.WriteLine("[gbfr.dev.quickstart] first chest timer ended");
            }
        }
        return _hook.OriginalFunction(flow);
    }
}
