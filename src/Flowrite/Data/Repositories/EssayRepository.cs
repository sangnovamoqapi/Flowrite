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
    /// Full-text search using FTS5. Returns essays with rank ordering.
    /// </summary>
    public IEnumerable<Essay> Search(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return GetAll();

        // FTS5 query: wrap terms for phrase matching safety
        var ftsQuery = string.Join(" OR ", query.Trim().Split(' ',
            StringSplitOptions.RemoveEmptyEntries)
            .Select(w => $"\"{w}\""));

        return _db.Connection.Query<Essay>("""
            SELECT e.*
            FROM Essays e
            JOIN EssaysFts f ON e.Id = f.Id
            WHERE EssaysFts MATCH @ftsQuery
            ORDER BY rank
            """, new { ftsQuery });
    }

    /// <summary>Returns the most recently written essays.</summary>
    public IEnumerable<Essay> GetRecent(int count = 5)
    {
        return _db.Connection.Query<Essay>(
            "SELECT * FROM Essays ORDER BY Date DESC LIMIT @count",
            new { count });
    }
}
