using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Models;

namespace Flowrite.ViewModels;

public enum PromptMode { None, Random, Custom }

public partial class NewSessionViewModel : ObservableObject
{
    private readonly MainViewModel _nav;
    private readonly string? _parentEssayId;

    // ── Duration ──────────────────────────────────────────────────────────────
    // Stored as decimal so NumericUpDown (which binds decimal?) never throws on clear
    [ObservableProperty] private decimal _durationMinutes = 10;
    [ObservableProperty] private bool _isCustomDuration;

    // ── Word count ────────────────────────────────────────────────────────────
    [ObservableProperty] private decimal _minWordCount = 300;
    [ObservableProperty] private bool _isCustomWordCount;

    // ── Idle timeout ──────────────────────────────────────────────────────────
    [ObservableProperty] private decimal _idleTimeoutSeconds = 5;

    // ── Prompt ────────────────────────────────────────────────────────────────
    [ObservableProperty] private PromptMode _promptMode = PromptMode.None;
    [ObservableProperty] private string _customPromptText = string.Empty;
    [ObservableProperty] private string _resolvedPrompt = string.Empty;

    // ── Display label (updates when DurationMinutes changes) ──────────────────
    public string DurationLabel => $"{(int)DurationMinutes} min";

    partial void OnDurationMinutesChanged(decimal value)
        => OnPropertyChanged(nameof(DurationLabel));

    private static readonly string[] _randomPrompts =
    [
        "What do you actually believe, and why?",
        "Describe a moment you changed your mind about something important.",
        "Write about something you understand now that you wish you'd known earlier.",
        "What are you afraid to say out loud?",
        "Describe the texture of a thought you can't quite articulate.",
        "Write about a decision that still haunts you.",
        "What would you do if you knew nobody would judge you?",
        "Describe the last time you were genuinely surprised.",
        "What do you keep avoiding, and why?",
        "Write about something you've never told anyone.",
        "What does ambition actually feel like from the inside?",
        "Describe a place that no longer exists.",
        "Write about the gap between who you are and who you want to be.",
        "What does home mean to you right now?",
        "Describe the moment just before a major decision.",
    ];

    public NewSessionViewModel(AppSettings settings, MainViewModel nav, string? parentEssayId)
    {
        _nav = nav;
        _parentEssayId = parentEssayId;

        // Load defaults — stored as seconds in settings, shown as minutes here
        DurationMinutes = settings.DefaultDurationSeconds / 60m;
        MinWordCount    = settings.DefaultMinWordCount;
        IdleTimeoutSeconds = settings.DefaultIdleTimeoutSeconds;
    }

    // ── Duration presets ──────────────────────────────────────────────────────
    [RelayCommand] private void Set5Min()  { DurationMinutes = 5;  IsCustomDuration = false; }
    [RelayCommand] private void Set10Min() { DurationMinutes = 10; IsCustomDuration = false; }
    [RelayCommand] private void Set20Min() { DurationMinutes = 20; IsCustomDuration = false; }
    [RelayCommand] private void SetCustomDurationCmd() => IsCustomDuration = true;

    // ── Word-count presets ────────────────────────────────────────────────────
    [RelayCommand] private void Set300Words() { MinWordCount = 300; IsCustomWordCount = false; }
    [RelayCommand] private void Set500Words() { MinWordCount = 500; IsCustomWordCount = false; }
    [RelayCommand] private void Set800Words() { MinWordCount = 800; IsCustomWordCount = false; }
    [RelayCommand] private void SetCustomWordCountCmd() => IsCustomWordCount = true;

    // ── Prompt mode ───────────────────────────────────────────────────────────
    [RelayCommand] private void SetNoPrompt()     { PromptMode = PromptMode.None;   ResolvedPrompt = string.Empty; }
    [RelayCommand] private void SetRandomPrompt() { PromptMode = PromptMode.Random; ResolvedPrompt = PickRandomPrompt(); }
    [RelayCommand] private void SetCustomPrompt() { PromptMode = PromptMode.Custom; ResolvedPrompt = CustomPromptText; }

    partial void OnCustomPromptTextChanged(string value)
    {
        if (PromptMode == PromptMode.Custom) ResolvedPrompt = value;
    }

    private static string PickRandomPrompt() =>
        _randomPrompts[Random.Shared.Next(_randomPrompts.Length)];

    // ── Start ─────────────────────────────────────────────────────────────────
    [RelayCommand]
    private void Start()
    {
        // Clamp to safe ranges, treating 0/null as defaults
        var durationSecs = (int)Math.Max(60, DurationMinutes * 60);
        var wordGoal     = (int)Math.Max(10, MinWordCount);
        var idleSecs     = (int)Math.Max(3,  IdleTimeoutSeconds);

        var config = new SessionConfig
        {
            DurationSeconds    = durationSecs,
            MinWordCount       = wordGoal,
            IdleTimeoutSeconds = idleSecs,
            Prompt             = string.IsNullOrWhiteSpace(ResolvedPrompt) ? null : ResolvedPrompt,
            ParentEssayId      = _parentEssayId
        };

        _nav.NavigateToWriting(config);
    }

    [RelayCommand]
    private void GoBack() => _nav.NavigateHome();
}
