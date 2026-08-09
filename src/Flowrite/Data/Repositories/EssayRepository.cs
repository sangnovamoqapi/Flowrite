using Dapper;
using Flowrite.Models;
using Serilog;

namespace Flowrite.Data.Repositories;

public sealed class EssayRepository
{
    private readonly Database _db;

    public EssayRepository(Database db) => _db = db;

    public void Save(Essay essay)
    {
        Log.Debug("Saving essay {Id} '{Title}'", essay.Id, essay.Title);
        _db.Connection.Execute("""
            INSERT OR REPLACE INTO Essays
                (Id, Title, Date, Prompt, DurationSeconds, WordCount, CharCount, Body, ParentEssayId, AiSummary)
            VALUES
                (@Id, @Title, @Date, @Prompt, @DurationSeconds, @WordCount, @CharCount, @Body, @ParentEssayId, @AiSummary)
            """, essay);
    }

    public Essay? GetById(string id)
    {
        return _db.Connection.QueryFirstOrDefault<Essay>(
            "SELECT * FROM Essays WHERE Id = @id", new { id });
    }

    public IEnumerable<Essay> GetAll()
    {
        return _db.Connection.Query<Essay>(
            "SELECT * FROM Essays ORDER BY Date DESC");
    }

    public IEnumerable<Essay> GetChildren(string parentId)
    {
        return _db.Connection.Query<Essay>(
            "SELECT * FROM Essays WHERE ParentEssayId = @parentId ORDER BY Date ASC",
            new { parentId });
    }

    public void UpdateTitle(string id, string newTitle)
    {
        _db.Connection.Execute(
            "UPDATE Essays SET Title = @newTitle WHERE Id = @id",
            new { id, newTitle });
    }

    public void UpdateAiSummary(string id, string summary)
    {
        _db.Connection.Execute(
            "UPDATE Essays SET AiSummary = @summary WHERE Id = @id",
            new { id, summary });
    }

    public void Delete(string id)
    {
        Log.Information("Deleting essay {Id}", id);
        // Detach children before deleting (FK ON DELETE SET NULL handles this)
        _db.Connection.Execute("DELETE FROM Essays WHERE Id = @id", new { id });
    }

    /// <summary>
    /// Full-text search using FTS5 with prefix matching.
    /// Falls back to a LIKE scan if the FTS query is malformed.
    /// </summary>
    public IEnumerable<Essay> Search(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return GetAll();

        // Build an FTS5 query: each word gets a trailing * for prefix matching.
        // e.g. "hello world" → "hello* world*"
        var terms = query.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var ftsQuery = string.Join(" ", terms.Select(w => w + "*"));

        try
        {
            // FTS5 rowid maps directly to the Essays.rowid (SQLite implicit rowid).
            return _db.Connection.Query<Essay>("""
                SELECT e.*
                FROM Essays e
                WHERE e.rowid IN (
                    SELECT rowid FROM EssaysFts WHERE EssaysFts MATCH @ftsQuery
                )
                ORDER BY e.Date DESC
                """, new { ftsQuery });
        }
        catch (Exception ex)
        {
            // Malformed FTS query (user typed a bare special char like "-").
            // Fall back to a simple LIKE scan so the UI doesn't crash.
            Log.Warning(ex, "FTS5 query failed ({Query}), falling back to LIKE", ftsQuery);
            var like = $"%{query.Trim()}%";
            return _db.Connection.Query<Essay>("""
                SELECT * FROM Essays
                WHERE Title LIKE @like OR Body LIKE @like
                ORDER BY Date DESC
                """, new { like });
        }
    }

    /// <summary>Returns the most recently written essays.</summary>
    public IEnumerable<Essay> GetRecent(int count = 5)
    {
        return _db.Connection.Query<Essay>(
            "SELECT * FROM Essays ORDER BY Date DESC LIMIT @count",
            new { count });
    }
}
