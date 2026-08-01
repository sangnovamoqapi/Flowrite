using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;
using Flowrite.Services;
using Serilog;

namespace Flowrite.ViewModels;

public partial class WritingViewModel : ObservableObject, IDisposable
{
    private readonly WritingSessionService _session;
    private readonly EssayRepository _essays;
    private readonly AppSettings _settings;
    private readonly MainViewModel _nav;
    private readonly SessionConfig _config;

    // The saved essay (set on session completion, updated on each keystroke after)
    private Essay? _savedEssay;

    [ObservableProperty] private string _bodyText = string.Empty;
    [ObservableProperty] private int _wordCount;
    [ObservableProperty] private string _timeRemaining = "00:00";
    [ObservableProperty] private double _idleProgress = 1.0;
    [ObservableProperty] private double _idleSecondsLeft;
    [ObservableProperty] private SessionState _sessionState = SessionState.Idle;
    [ObservableProperty] private FailReason _failReason = FailReason.None;
    [ObservableProperty] private string? _prompt;
    [ObservableProperty] private int _sessionFontSize;
    [ObservableProperty] private bool _showRecoveryBanner;
    [ObservableProperty] private string _recoveryText = string.Empty;

    /// <summary>True after timer expiry — shown as a subtle top banner while writing continues.</summary>
    [ObservableProperty] private bool _showCompletionBanner;

    /// <summary>Word count at the moment the session completed.</summary>
    [ObservableProperty] private int _completedWordCount;

    private bool _started;

    public WritingViewModel(
        SessionConfig config,
        EssayRepository essays,
        AppSettings settings,
        MainViewModel nav)
    {
        _config = config;
        _essays = essays;
        _settings = settings;
        _nav = nav;
        _sessionFontSize = settings.FontSize;

        var recoveryDir = string.IsNullOrWhiteSpace(settings.StorageDirectory)
            ? AppDataDir()
            : settings.StorageDirectory;
        Directory.CreateDirectory(recoveryDir);

        _session = new WritingSessionService(
            config,
            action => Dispatcher.UIThread.Post(action),
            recoveryDir,
            settings.PasteAbuseThresholdWords);

        _session.Tick += OnTick;
        _session.SessionEnded += OnSessionEnded;

        Prompt = config.Prompt;
        UpdateTimerDisplay();

        // Recovery file from previous crashed session
        if (_session.HasRecoveryFile())
        {
            RecoveryText = _session.ReadRecoveryFile();
            if (!string.IsNullOrWhiteSpace(RecoveryText))
                ShowRecoveryBanner = true;
        }
    }

    /// <summary>Called by WritingView.OnLoaded — starts the session and focuses the editor.</summary>
    public void BeginSession()
    {
        if (_started) return;
        _started = true;
        _session.Start();
        SessionState = SessionState.Running;
        UpdateTimerDisplay();
    }

    /// <summary>Called by WritingView on every TextChanged event.</summary>
    public void HandleTextChanged(string newText)
    {
        // Allow editing after completion (free writing)
        if (SessionState == SessionState.Failed) return;

        var ok = _session.OnTextChanged(newText);
        BodyText = newText;
        WordCount = _session.WordCount;

        if (!ok)
        {
            // Paste abuse — session failed
            SessionState = _session.State;
            FailReason = _session.FailReason;
            return;
        }

        // If session already completed, update the saved essay in the DB on each keystroke
        if (SessionState == SessionState.Completed && _savedEssay is not null)
            UpdateSavedEssay(newText);
    }

    private void OnTick()
    {
        UpdateTimerDisplay();
        var idleElapsed = _session.IdleSecondsElapsed;
        IdleSecondsLeft = Math.Max(0, _config.IdleTimeoutSeconds - idleElapsed);
        IdleProgress = Math.Clamp(1.0 - (idleElapsed / _config.IdleTimeoutSeconds), 0, 1);
        WordCount = _session.WordCount;
    }

    private void OnSessionEnded()
    {
        SessionState = _session.State;
        FailReason = _session.FailReason;
        UpdateTimerDisplay();

        if (SessionState == SessionState.Completed)
        {
            CompletedWordCount = _session.WordCount;
            SaveEssay();
            ShowCompletionBanner = true;
        }
    }

    private void SaveEssay()
    {
        var text = _session.GetCurrentText();
        _savedEssay = new Essay
        {
            Title         = Essay.DeriveTitle(text),
            Date          = DateTime.UtcNow,
            Prompt        = _config.Prompt,
            DurationSeconds = _config.DurationSeconds,
            WordCount     = _session.WordCount,
            CharCount     = text.Length,
            Body          = text,
            ParentEssayId = _config.ParentEssayId
        };
        _essays.Save(_savedEssay);
        Log.Information("Essay saved: {Id} ({Words} words)", _savedEssay.Id, _savedEssay.WordCount);
    }

    private void UpdateSavedEssay(string newText)
    {
        if (_savedEssay is null) return;
        _savedEssay.Body      = newText;
        _savedEssay.WordCount = WritingSessionService.CountWords(newText);
        _savedEssay.CharCount = newText.Length;
        _essays.Save(_savedEssay);
    }

    // ── Commands ──────────────────────────────────────────────────────────────

    [RelayCommand]
    private void DismissCompletionBanner() => ShowCompletionBanner = false;

    [RelayCommand]
    private void ViewEssay()
    {
        if (_savedEssay is not null)
        {
            // Re-load from DB so child/parent links are fresh
            var fresh = _essays.GetById(_savedEssay.Id) ?? _savedEssay;
            Dispose();
            _nav.NavigateToEssay(fresh);
        }
    }

    [RelayCommand]
    private void RestoreRecovery()
    {
        // Pre-seed the session's internal word count BEFORE touching BodyText.
        // If we don't do this, the TextChanged handler sees a jump from 0 words
        // to N words and the paste-abuse check fails the session immediately.
        _session.SetInitialText(RecoveryText);
        BodyText = RecoveryText;
        WordCount = _session.WordCount;
        ShowRecoveryBanner = false;
        // Recovery is now live in the editor — the file is no longer needed.
        _session.DeleteRecoveryFile();
    }

    [RelayCommand]
    private void DismissRecovery()
    {
        _session.DeleteRecoveryFile();
        ShowRecoveryBanner = false;
    }

    [RelayCommand]
    private void TryAgain()
    {
        Dispose();
        _nav.NavigateToNewSession(_config.ParentEssayId);
    }

    [RelayCommand]
    private void GoHome()
    {
        Dispose();
        _nav.NavigateHome();
    }

    private void UpdateTimerDisplay()
    {
        var secs = _session.SecondsRemaining;
        TimeRemaining = $"{secs / 60:D2}:{secs % 60:D2}";
    }

    private static string AppDataDir() =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Flowrite");

    public void Dispose() => _session.Dispose();
}
