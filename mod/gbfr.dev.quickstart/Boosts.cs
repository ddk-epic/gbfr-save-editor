using Reloaded.Hooks.Definitions;
using Reloaded.Mod.Interfaces;

using IReloadedHooks = Reloaded.Hooks.ReloadedII.Interfaces.IReloadedHooks;

namespace gbfr.dev.quickstart;

// Offsets are from v2.0.6.
public sealed unsafe class Boosts
{
    // in BehaviorPlayerBase
    private const int ComponentPlayer = 0x2300;

    // in the hit
    private const int HitDamage = 0xD4;
    private const int HitDamageLimit = 0x2BC;

    // FUN_141fb8a70
    private const int MaxDamage = 99_999_999;

    // in the player
    private const int PlayerEntity = 0x28;
    private const int PlayerControl = 0xE80;

    // in the control component's vtable
    private const int IsManualSlot = 0xB8;

    // in the player's entity
    private const int EntityHolder = 0x18;

    // in the holder's time object
    private const int TimeRate = 0x18;
    private const int TimeTargetRate = 0x1C;
    private const int TimeTimed = 0x24;
    private const int TimeFramesLeft = 0x28;
    private const int TimeDelay = 0x2C;

    private const float BoostFrames = 10f;

    // in the session global
    private const int SessionState = 4;
    private const int SessionOnline = 3;

    private delegate void CalculateHit(nint component, nint hit, nint victim);
    private delegate void RunUpdate(nint self);

    private readonly Settings _settings;
    private readonly ILogger _logger;
    private readonly nint _session;
    private readonly IHook<CalculateHit> _hitHook;
    private readonly IHook<RunUpdate> _runHook;
    private bool _loggedHit;
    private bool _loggedRun;
    private bool _loggedNoTime;

    public Boosts(IReloadedHooks hooks, Settings settings, ILogger logger, nint calculateHit, nint runUpdate, nint session)
    {
        _settings = settings;
        _logger = logger;
        _session = session;
        _hitHook = hooks.CreateHook<CalculateHit>(CalculateHitImpl, calculateHit).Activate();
        _runHook = hooks.CreateHook<RunUpdate>(RunUpdateImpl, runUpdate).Activate();
    }

    private void CalculateHitImpl(nint component, nint hit, nint victim)
    {
        _hitHook.OriginalFunction(component, hit, victim);
        nint player = *(nint*)(component + ComponentPlayer);
        if (player == 0 || !IsBoosted(player) || victim == Holder(player))
            return;
        int damage = *(int*)(hit + HitDamage);
        if (damage <= 0)
            return;
        int boosted = (int)Math.Min((long)damage * _settings.DamageMultiplier, MaxDamage);
        *(int*)(hit + HitDamage) = boosted;
        *(int*)(hit + HitDamageLimit) = MaxDamage;
        if (!_loggedHit)
        {
            _loggedHit = true;
            _logger.WriteLine($"[gbfr.dev.quickstart] first boosted hit: {damage} -> {boosted}");
        }
    }

    private void RunUpdateImpl(nint self)
    {
        nint player = *(nint*)(self - 8);
        if (player != 0 && IsBoosted(player))
            BoostTime(player);
        _runHook.OriginalFunction(self);
    }

    private void BoostTime(nint player)
    {
        nint holder = Holder(player);
        nint time = holder == 0 ? 0 : *(nint*)holder;
        if (time == 0)
        {
            if (!_loggedNoTime)
            {
                _loggedNoTime = true;
                _logger.WriteLine("[gbfr.dev.quickstart] the character has no time object; run speed unchanged");
            }
            return;
        }
        float rate = _settings.RunSpeedMultiplier;
        *(byte*)(time + TimeTimed) = 1;
        *(float*)(time + TimeTargetRate) = rate;
        *(float*)(time + TimeRate) = rate;
        *(float*)(time + TimeFramesLeft) = BoostFrames;
        *(float*)(time + TimeDelay) = 0f;
        if (!_loggedRun)
        {
            _loggedRun = true;
            _logger.WriteLine($"[gbfr.dev.quickstart] first boosted run: rate {rate}");
        }
    }

    // Hit victim holding the time object; null for some entities.
    private static nint Holder(nint player) => *(nint*)(*(nint*)(player + PlayerEntity) + EntityHolder);

    private bool IsBoosted(nint player)
    {
        if (IsOnline(_session))
            return false;
        nint control = player + PlayerControl;
        var isManual = (delegate* unmanaged<nint, int>)*(nint*)(*(nint*)control + IsManualSlot);
        return isManual(control) != 0;
    }

    // True until the session global exists.
    public static bool IsOnline(nint sessionGlobal)
    {
        nint session = *(nint*)sessionGlobal;
        return session == 0 || *(int*)(session + SessionState) == SessionOnline;
    }
}
