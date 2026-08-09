using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;

namespace Flowrite.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly SettingsRepository _repo;
    private readonly MainViewModel _nav;

    // Appearance
    [ObservableProperty] private int _fontSize;

    // Session defaults
    [ObservableProperty] private int _defaultDurationMinutes;
    [ObservableProperty] private int _defaultMinWordCount;
    [ObservableProperty] private int _defaultIdleTimeoutSeconds;
    [ObservableProperty] private int _pasteAbuseThresholdWords;

    // Storage
    [ObservableProperty] private string _storageDirectory = string.Empty;

    // AI
    [ObservableProperty] private string _aiEndpoint = string.Empty;
    [ObservableProperty] private string _aiApiKey = string.Empty;
    [ObservableProperty] private string _aiModel = string.Empty;
    [ObservableProperty] private double _aiTemperature;

    [ObservableProperty] private string _saveMessage = string.Empty;

    public SettingsViewModel(AppSettings settings, SettingsRepository repo, MainViewModel nav)
    {
        _repo = repo;
        _nav = nav;

        FontSize = settings.FontSize;
        DefaultDurationMinutes = settings.DefaultDurationSeconds / 60;
        DefaultMinWordCount = settings.DefaultMinWordCount;
        DefaultIdleTimeoutSeconds = settings.DefaultIdleTimeoutSeconds;
        PasteAbuseThresholdWords = settings.PasteAbuseThresholdWords;
        StorageDirectory = settings.StorageDirectory;
        AiEndpoint = settings.AiEndpoint;
        AiApiKey = settings.AiApiKey;
        AiModel = settings.AiModel;
        AiTemperature = settings.AiTemperature;
    }

    [RelayCommand]
    private void Save()
    {
        var updated = new AppSettings
        {
            FontSize = Math.Clamp(FontSize, 12, 32),
            DefaultDurationSeconds = Math.Max(60, DefaultDurationMinutes * 60),
            DefaultMinWordCount = Math.Max(10, DefaultMinWordCount),
            DefaultIdleTimeoutSeconds = Math.Max(3, DefaultIdleTimeoutSeconds),
            PasteAbuseThresholdWords = Math.Max(10, PasteAbuseThresholdWords),
            StorageDirectory = StorageDirectory,
            AiEndpoint = AiEndpoint,
            AiApiKey = AiApiKey,
            AiModel = AiModel,
            AiTemperature = Math.Clamp(AiTemperature, 0.0, 2.0)
        };

        _repo.Save(updated);
        SaveMessage = "Settings saved.";
        _nav.OnSettingsSaved(updated);
    }

    [RelayCommand]
    private void GoBack() => _nav.NavigateHome();
}
