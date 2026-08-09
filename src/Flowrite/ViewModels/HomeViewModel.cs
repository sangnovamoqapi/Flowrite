using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;

namespace Flowrite.ViewModels;

public partial class HomeViewModel : ObservableObject
{
    private readonly EssayRepository _essays;
    private readonly MainViewModel _nav;

    [ObservableProperty]
    private ObservableCollection<Essay> _recentEssays = [];

    public HomeViewModel(EssayRepository essays, MainViewModel nav)
    {
        _essays = essays;
        _nav = nav;
        LoadRecent();
    }

    private void LoadRecent()
    {
        RecentEssays = new ObservableCollection<Essay>(_essays.GetRecent(6));
    }

    [RelayCommand]
    private void StartNewSession() => _nav.NavigateToNewSession();

    [RelayCommand]
    private void OpenLibrary() => _nav.NavigateToLibrary();

    [RelayCommand]
    private void OpenSearch() => _nav.NavigateToSearch();

    [RelayCommand]
    private void OpenSettings() => _nav.NavigateToSettings();

    [RelayCommand]
    private void OpenEssay(Essay essay) => _nav.NavigateToEssay(essay);
}
