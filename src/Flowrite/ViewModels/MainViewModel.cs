using CommunityToolkit.Mvvm.ComponentModel;
using Flowrite.Data.Repositories;
using Flowrite.Models;

namespace Flowrite.ViewModels;

/// <summary>
/// Root ViewModel. Owns navigation by swapping CurrentPage.
/// All other ViewModels are created/destroyed on demand to keep memory lean.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly EssayRepository _essays;
    private readonly SettingsRepository _settingsRepo;

    [ObservableProperty]
    private ObservableObject? _currentPage;

    public AppSettings Settings { get; private set; }

    public MainViewModel(EssayRepository essays, SettingsRepository settingsRepo)
    {
        _essays = essays;
        _settingsRepo = settingsRepo;
        Settings = _settingsRepo.Load();

        NavigateHome();
    }

    public void NavigateHome()
    {
        CurrentPage = new HomeViewModel(_essays, this);
    }

    public void NavigateToNewSession(string? parentEssayId = null)
    {
        CurrentPage = new NewSessionViewModel(Settings, this, parentEssayId);
    }

    public void NavigateToWriting(SessionConfig config)
    {
        CurrentPage = new WritingViewModel(config, _essays, Settings, this);
    }

    public void NavigateToLibrary()
    {
        CurrentPage = new EssayLibraryViewModel(_essays, this);
    }

    public void NavigateToEssay(Essay essay)
    {
        CurrentPage = new EssayDetailViewModel(essay, _essays, Settings, this);
    }

    public void NavigateToSearch()
    {
        CurrentPage = new SearchViewModel(_essays, this);
    }

    public void NavigateToSettings()
    {
        CurrentPage = new SettingsViewModel(Settings, _settingsRepo, this);
    }

    /// <summary>Called by SettingsViewModel when settings are saved.</summary>
    public void OnSettingsSaved(AppSettings updated)
    {
        Settings = updated;
        NavigateHome();
    }
}
