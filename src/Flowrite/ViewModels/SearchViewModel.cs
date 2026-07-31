using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;

namespace Flowrite.ViewModels;

public partial class SearchViewModel : ObservableObject
{
    private readonly EssayRepository _essays;
    private readonly MainViewModel _nav;

    [ObservableProperty]
    private string _query = string.Empty;

    [ObservableProperty]
    private ObservableCollection<Essay> _results = [];

    [ObservableProperty]
    private bool _hasResults;

    [ObservableProperty]
    private bool _hasSearched;

    public SearchViewModel(EssayRepository essays, MainViewModel nav)
    {
        _essays = essays;
        _nav = nav;
    }

    partial void OnQueryChanged(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Results = [];
            HasResults = false;
            HasSearched = false;
            return;
        }

        var found = _essays.Search(value).ToList();
        Results = new ObservableCollection<Essay>(found);
        HasResults = found.Count > 0;
        HasSearched = true;
    }

    [RelayCommand]
    private void OpenEssay(Essay essay) => _nav.NavigateToEssay(essay);

    [RelayCommand]
    private void GoBack() => _nav.NavigateHome();
}
