using Dapper;
using Flowrite.Models;
using Serilog;

namespace Flowrite.Data.Repositories;

public sealed class SettingsRepository
{
    private readonly Database _db;

    public SettingsRepository(Database db) => _db = db;

    public AppSettings Load()
    {
        var settings = _db.Connection.QueryFirstOrDefault<AppSettings>(
            "SELECT * FROM Settings WHERE Id = 1");

        if (settings is null)
        {
            Log.Warning("Settings row missing — inserting defaults");
            settings = new AppSettings();
            Save(settings);
        }

        return settings;
    }

    public void Save(AppSettings settings)
    {
        _db.Connection.Execute("""
            INSERT OR REPLACE INTO Settings
                (Id, Theme, FontSize, DefaultDurationSeconds, DefaultMinWordCount,
                 DefaultIdleTimeoutSeconds, StorageDirectory, AiEndpoint, AiApiKey,
                 AiModel, AiTemperature, PasteAbuseThresholdWords)
            VALUES
                (1, @Theme, @FontSize, @DefaultDurationSeconds, @DefaultMinWordCount,
                 @DefaultIdleTimeoutSeconds, @StorageDirectory, @AiEndpoint, @AiApiKey,
                 @AiModel, @AiTemperature, @PasteAbuseThresholdWords)
            """, settings);
    }
}
