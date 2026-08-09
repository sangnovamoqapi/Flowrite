using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Flowrite.Data.Repositories;
using Flowrite.Models;
using Flowrite.Services;
using System.Collections.ObjectModel;

namespace Flowrite.ViewModels;

public partial class EssayDetailViewModel : ObservableObject
{
    private readonly EssayRepository _essays;
    private readonly AppSettings _settings;
    private readonly MainViewModel _nav;

    [ObservableProperty] private Essay _essay;
    [ObservableProperty] private string _editableTitle;
    [ObservableProperty] private bool _isEditingTitle;
    [ObservableProperty] private bool _isGeneratingSummary;
    [ObservableProperty] private string _aiStatusMessage = string.Empty;
    [ObservableProperty] private ObservableCollection<Essay> _childEssays = [];
    [ObservableProperty] private Essay? _parentEssay;

    public bool HasAi => !string.IsNullOrWhiteSpace(_settings.AiEndpoint);
    public bool HasParent => ParentEssay is not null;
    public bool HasChildren => ChildEssays.Count > 0;

    public EssayDetailViewModel(
        Essay essay,
        EssayRepository essays,
        AppSettings settings,
        MainViewModel nav)
    {
        _essay = essay;
        _editableTitle = essay.Title;
        _essays = essays;
        _settings = settings;
        _nav = nav;

        LoadRelated();
    }

    private void LoadRelated()
    {
        ChildEssays = new ObservableCollection<Essay>(_essays.GetChildren(Essay.Id));

        if (!string.IsNullOrWhiteSpace(Essay.ParentEssayId))
            ParentEssay = _essays.GetById(Essay.ParentEssayId);
    }

    [RelayCommand]
    private void BeginEditTitle() => IsEditingTitle = true;

    [RelayCommand]
    private void CommitTitle()
    {
        if (string.IsNullOrWhiteSpace(EditableTitle))
            EditableTitle = Essay.Title;

        Essay.Title = EditableTitle;
        _essays.UpdateTitle(Essay.Id, EditableTitle);
        IsEditingTitle = false;
        OnPropertyChanged(nameof(Essay));
    }

    [RelayCommand]
    private void CancelEditTitle()
    {
        EditableTitle = Essay.Title;
        IsEditingTitle = false;
    }

    [RelayCommand]
    private void ContinueWriting() => _nav.NavigateToNewSession(Essay.Id);

    [RelayCommand]
    private void OpenParent()
    {
        if (ParentEssay is not null)
            _nav.NavigateToEssay(ParentEssay);
    }

    [RelayCommand]
    private void OpenChild(Essay child) => _nav.NavigateToEssay(child);

    [RelayCommand]
    private async Task GenerateSummary()
    {
        IsGeneratingSummary = true;
        AiStatusMessage = "Generating summary…";

        var service = new AiSummaryService();
        var summary = await service.GenerateSummaryAsync(Essay, _settings);

        if (summary is not null)
        {
            Essay.AiSummary = summary;
            _essays.UpdateAiSummary(Essay.Id, summary);
            AiStatusMessage = string.Empty;
            OnPropertyChanged(nameof(Essay));
        }
        else
        {
            AiStatusMessage = "Summary generation failed. Check your AI settings.";
        }

        IsGeneratingSummary = false;
    }

    [RelayCommand]
    private async Task ExportToMarkdown()
    {
        var exporter = new ExportService();
        var dir = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        var safe = string.Concat(Essay.Title.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
        var path = Path.Combine(dir, $"{safe}.md");
        await exporter.ExportToMarkdownAsync(Essay, path);
        AiStatusMessage = $"Exported to {path}";
    }

    [RelayCommand]
    private void GoBack() => _nav.NavigateToLibrary();

    [RelayCommand]
    private void GoHome() => _nav.NavigateHome();
}
