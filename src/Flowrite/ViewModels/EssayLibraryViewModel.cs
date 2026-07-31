using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;
using Flowrite.Services;

namespace Flowrite.ViewModels;

public partial class EssayLibraryViewModel : ObservableObject
{
    private readonly EssayRepository _essays;
    private readonly MainViewModel _nav;

    [ObservableProperty]
    private ObservableCollection<Essay> _items = [];

    [ObservableProperty]
    private string _searchQuery = string.Empty;

    [ObservableProperty]
    private Essay? _selectedEssay;

    public EssayLibraryViewModel(EssayRepository essays, MainViewModel nav)
    {
        _essays = essays;
        _nav = nav;
        LoadAll();
    }

    private void LoadAll()
    {
        Items = new ObservableCollection<Essay>(_essays.GetAll());
    }

    partial void OnSearchQueryChanged(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            LoadAll();
        else
            Items = new ObservableCollection<Essay>(_essays.Search(value));
    }

    [RelayCommand]
    private void OpenEssay(Essay essay) => _nav.NavigateToEssay(essay);

    [RelayCommand]
    private void DeleteEssay(Essay essay)
    {
        _essays.Delete(essay.Id);
        Items.Remove(essay);
    }

    [RelayCommand]
    private void DuplicateEssay(Essay essay)
    {
        var copy = new Essay
        {
            Title = essay.Title + " (copy)",
            Date = DateTime.UtcNow,
            Prompt = essay.Prompt,
            DurationSeconds = essay.DurationSeconds,
            WordCount = essay.WordCount,
            CharCount = essay.CharCount,
            Body = essay.Body,
            ParentEssayId = essay.ParentEssayId
        };
        _essays.Save(copy);
        Items.Insert(0, copy);
    }

    [RelayCommand]
    private async Task ExportEssay(Essay essay)
    {
        var exporter = new ExportService();
        var dir = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        var safe = string.Concat(essay.Title.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
        var path = Path.Combine(dir, $"{safe}.md");
        await exporter.ExportToMarkdownAsync(essay, path);
    }

    [RelayCommand]
    private void GoBack() => _nav.NavigateHome();

    [RelayCommand]
    private void NewSession() => _nav.NavigateToNewSession();
}
