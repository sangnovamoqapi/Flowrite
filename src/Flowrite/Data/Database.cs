using Microsoft.Data.Sqlite;
using Serilog;

namespace Flowrite.Data;

/// <summary>
/// Manages the SQLite connection and schema migrations.
/// Single shared connection is safe for a desktop app with sequential access.
/// </summary>
public sealed class Database : IDisposable
{
    private readonly SqliteConnection _connection;

    public SqliteConnection Connection => _connection;

    public Database(string dbPath)
    {
        Log.Debug("Opening database at {Path}", dbPath);
        _connection = new SqliteConnection($"Data Source={dbPath}");
        _connection.Open();

        // WAL mode gives better write performance without locking the reader
        using var pragma = _connection.CreateCommand();
        pragma.CommandText = "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;";
        pragma.ExecuteNonQuery();

        Migrate();
    }

    private void Migrate()
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS Essays (
                Id             TEXT    PRIMARY KEY,
                Title          TEXT    NOT NULL,
                Date           TEXT    NOT NULL,
                Prompt         TEXT,
                DurationSeconds INTEGER NOT NULL,
                WordCount      INTEGER NOT NULL,
                CharCount      INTEGER NOT NULL,
                Body           TEXT    NOT NULL,
                ParentEssayId  TEXT,
                AiSummary      TEXT,
                FOREIGN KEY (ParentEssayId) REFERENCES Essays(Id) ON DELETE SET NULL
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS EssaysFts USING fts5(
                Id      UNINDEXED,
                Title,
                Body,
                Prompt,
                content=Essays,
                content_rowid=rowid
            );

            CREATE TRIGGER IF NOT EXISTS essays_ai AFTER INSERT ON Essays BEGIN
                INSERT INTO EssaysFts(rowid, Id, Title, Body, Prompt)
                VALUES (new.rowid, new.Id, new.Title, new.Body, new.Prompt);
            END;

            CREATE TRIGGER IF NOT EXISTS essays_ad AFTER DELETE ON Essays BEGIN
                INSERT INTO EssaysFts(EssaysFts, rowid, Id, Title, Body, Prompt)
                VALUES ('delete', old.rowid, old.Id, old.Title, old.Body, old.Prompt);
            END;

            CREATE TRIGGER IF NOT EXISTS essays_au AFTER UPDATE ON Essays BEGIN
                INSERT INTO EssaysFts(EssaysFts, rowid, Id, Title, Body, Prompt)
                VALUES ('delete', old.rowid, old.Id, old.Title, old.Body, old.Prompt);
                INSERT INTO EssaysFts(rowid, Id, Title, Body, Prompt)
                VALUES (new.rowid, new.Id, new.Title, new.Body, new.Prompt);
            END;

            CREATE TABLE IF NOT EXISTS Settings (
                Id                         INTEGER PRIMARY KEY CHECK (Id = 1),
                Theme                      TEXT    NOT NULL DEFAULT 'Dark',
                FontSize                   INTEGER NOT NULL DEFAULT 18,
                DefaultDurationSeconds     INTEGER NOT NULL DEFAULT 600,
                DefaultMinWordCount        INTEGER NOT NULL DEFAULT 300,
                DefaultIdleTimeoutSeconds  INTEGER NOT NULL DEFAULT 5,
                StorageDirectory           TEXT    NOT NULL DEFAULT '',
                AiEndpoint                 TEXT    NOT NULL DEFAULT '',
                AiApiKey                   TEXT    NOT NULL DEFAULT '',
                AiModel                    TEXT    NOT NULL DEFAULT '',
                AiTemperature              REAL    NOT NULL DEFAULT 0.7,
                PasteAbuseThresholdWords   INTEGER NOT NULL DEFAULT 50
            );

            INSERT OR IGNORE INTO Settings (Id) VALUES (1);
            """;
        cmd.ExecuteNonQuery();
        Log.Debug("Database migration complete");
    }

    public void Dispose()
    {
        _connection.Close();
        _connection.Dispose();
    }
}
