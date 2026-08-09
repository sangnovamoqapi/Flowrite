using Flowrite.Models;
using Serilog;

namespace Flowrite.Services;

public enum SessionState
{
    Idle,
    Running,
    /// <summary>Timer reached zero. Essay saved. Editor stays open for free writing.</summary>
    Completed,
    Failed
}

public enum FailReason
{
    None,
    IdleTimeout,
    PasteAbuse
}

/// <summary>
/// Core writing session state machine.
///
/// Lifecycle:
///   Idle → Running → Completed (word goal met OR timer reached zero)
///                  → Failed    (idle timeout or paste abuse)
///
/// Completion fires as soon as the word goal is reached — the timer
/// is stopped at that point.  After Completed the editor stays open
/// for free writing; the essay is saved immediately and updated on
/// every subsequent keystroke.
/// </summary>
public sealed class WritingSessionService : IDisposable
{
    private readonly SessionConfig _config;
    private readonly Action<Action> _onUiThread;

    private System.Timers.Timer? _sessionTimer;
    private System.Timers.Timer? _tickTimer;

    private DateTime _lastKeypress;
    private int _wordCount;
    private int _secondsElapsed;
    private string _currentText = string.Empty;

    private readonly string _recoveryPath;
    private readonly int _pasteAbuseThreshold;

    public SessionState State { get; private set; } = SessionState.Idle;
    public FailReason FailReason { get; private set; } = FailReason.None;
    public int WordCount => _wordCount;
    public int SecondsRemaining => Math.Max(0, _config.DurationSeconds - _secondsElapsed);
    public double IdleSecondsElapsed =>
        State == SessionState.Running
            ? (DateTime.UtcNow - _lastKeypress).TotalSeconds
            : 0;

    /// <summary>Fires every second while Running — update UI from this.</summary>
    public event Action? Tick;
    /// <summary>Fires when the session transitions to Completed or Failed.</summary>
    public event Action? SessionEnded;

    public WritingSessionService(
        SessionConfig config,
        Action<Action> uiThreadDispatch,
        string recoveryDir,
        int pasteAbuseThreshold = 50)
    {
        _config = config;
        _onUiThread = uiThreadDispatch;
        _recoveryPath = Path.Combine(recoveryDir, "recovery.txt");
        _pasteAbuseThreshold = pasteAbuseThreshold;
    }

    public void Start()
    {
        if (State != SessionState.Idle) return;

        _lastKeypress = DateTime.UtcNow;
        State = SessionState.Running;
        Log.Information("Session started — duration={D}s wordGoal={W} idle={I}s",
            _config.DurationSeconds, _config.MinWordCount, _config.IdleTimeoutSeconds);

        // 1-second tick for UI and idle checking
        _tickTimer = new System.Timers.Timer(1000) { AutoReset = true };
        _tickTimer.Elapsed += OnTick;
        _tickTimer.Start();

        // Main session countdown
        _sessionTimer = new System.Timers.Timer(_config.DurationSeconds * 1000.0) { AutoReset = false };
        _sessionTimer.Elapsed += OnSessionExpired;
        _sessionTimer.Start();
    }

    /// <summary>
    /// Called on every text-change event from the editor.
    /// Returns false if the session fails (paste abuse).
    /// After Completed, updates the live text but does NOT fail.
    /// </summary>
    public bool OnTextChanged(string newText)
    {
        var newWordCount = CountWords(newText);

        if (State == SessionState.Running)
        {
            var added = newWordCount - _wordCount;

            // Paste abuse: sudden large jump
            if (added > _pasteAbuseThreshold)
            {
                Log.Warning("Paste abuse detected: +{Words} words in one event", added);
                _currentText = newText;
                _wordCount = newWordCount;
                Fail(FailReason.PasteAbuse);
                return false;
            }

            _lastKeypress = DateTime.UtcNow;
        }

        _wordCount = newWordCount;
        _currentText = newText;
        TryWriteRecovery(newText);

        // ── Word-goal completion ───────────────────────────────────────────────
        // Fires as soon as the goal is hit while the session is still running.
        // The timer is cancelled; we don't wait for it to expire.
        if (State == SessionState.Running && _wordCount >= _config.MinWordCount)
            Complete();

        return true;
    }

    /// <summary>
    /// Pre-seeds the session's word count without triggering any checks.
    /// Call this before setting BodyText to a restored value so the
    /// paste-abuse detector doesn't see a giant jump from 0.
    /// </summary>
    public void SetInitialText(string text)
    {
        _currentText = text;
        _wordCount = CountWords(text);
    }

    private void OnTick(object? sender, System.Timers.ElapsedEventArgs e)
    {
        if (State != SessionState.Running) return;

        _secondsElapsed++;

        // Idle check
        if ((DateTime.UtcNow - _lastKeypress).TotalSeconds >= _config.IdleTimeoutSeconds)
        {
            Fail(FailReason.IdleTimeout);
            return;
        }

        _onUiThread(() => Tick?.Invoke());
    }

    private void OnSessionExpired(object? sender, System.Timers.ElapsedEventArgs e)
    {
        if (State != SessionState.Running) return;
        Complete();
    }

    /// <summary>Shared completion path — called from timer expiry or word-goal hit.</summary>
    private void Complete()
    {
        _sessionTimer?.Stop();
        // Keep _tickTimer alive briefly so IdleSecondsElapsed reads correctly;
        // the ViewModel disposes the service when navigating away.
        _tickTimer?.Stop();

        State = SessionState.Completed;
        Log.Information("Session completed — {Words} words (goal={Goal})",
            _wordCount, _config.MinWordCount);

        DeleteRecovery();
        _onUiThread(() => SessionEnded?.Invoke());
    }

    private void Fail(FailReason reason)
    {
        _sessionTimer?.Stop();
        _tickTimer?.Stop();
        State = SessionState.Failed;
        FailReason = reason;
        Log.Information("Session failed — {Reason}", reason);
        _onUiThread(() => SessionEnded?.Invoke());
    }

    public string GetCurrentText() => _currentText;

    public static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        var count = 0;
        var inWord = false;
        foreach (var ch in text)
        {
            if (char.IsWhiteSpace(ch)) { inWord = false; }
            else if (!inWord) { inWord = true; count++; }
        }
        return count;
    }

    private void TryWriteRecovery(string text)
    {
        try { File.WriteAllText(_recoveryPath, text); }
        catch (Exception ex) { Log.Warning(ex, "Recovery write failed"); }
    }

    private void DeleteRecovery()
    {
        try { if (File.Exists(_recoveryPath)) File.Delete(_recoveryPath); }
        catch { /* best effort */ }
    }

    public bool HasRecoveryFile() => File.Exists(_recoveryPath);
    public string ReadRecoveryFile() =>
        File.Exists(_recoveryPath) ? File.ReadAllText(_recoveryPath) : string.Empty;
    public void DeleteRecoveryFile() => DeleteRecovery();

    public void Dispose()
    {
        _sessionTimer?.Stop();
        _tickTimer?.Stop();
        _sessionTimer?.Dispose();
        _tickTimer?.Dispose();
    }
}
