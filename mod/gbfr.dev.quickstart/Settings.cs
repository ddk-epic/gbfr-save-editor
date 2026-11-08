using System.Text.Json;

namespace gbfr.dev.quickstart;

// config.json in the mod's folder, read at game start.
public sealed class Settings
{
    public int DamageMultiplier { get; set; } = 10000;
    public float RunSpeedMultiplier { get; set; } = 3f;
    public bool SkipChestTimer { get; set; } = true;
    public bool SkipResultTimer { get; set; } = true;
    public bool SkipStartupLogos { get; set; } = true;

    private static readonly JsonSerializerOptions Options = new() { WriteIndented = true };

    public static Settings Load(string dir)
    {
        string path = Path.Combine(dir, "config.json");
        if (File.Exists(path))
            return JsonSerializer.Deserialize<Settings>(File.ReadAllText(path)) ?? new Settings();
        var defaults = new Settings();
        File.WriteAllText(path, JsonSerializer.Serialize(defaults, Options));
        return defaults;
    }
}
