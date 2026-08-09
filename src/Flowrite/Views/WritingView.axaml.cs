using Avalonia.Controls;
using Avalonia.Interactivity;
using Flowrite.ViewModels;

namespace Flowrite.Views;

public partial class WritingView : UserControl
{
    public WritingView()
    {
        InitializeComponent();
    }

    protected override void OnLoaded(RoutedEventArgs e)
    {
        base.OnLoaded(e);

        // Start the session as soon as the writing screen is visible
        if (DataContext is WritingViewModel vm)
        {
            vm.BeginSession();

            // Focus the writing area immediately
            var textBox = this.FindControl<TextBox>("WritingArea");
            textBox?.Focus();
        }
    }

    // Wire text changes from the TextBox to the ViewModel
    // (TextBox.TextChanged is not directly bindable with two-way for this use case,
    //  so we wire it in code-behind to call our handler)
    protected override void OnDataContextChanged(EventArgs e)
    {
        base.OnDataContextChanged(e);

        var textBox = this.FindControl<TextBox>("WritingArea");
        if (textBox is null) return;

        textBox.TextChanged -= OnWritingAreaTextChanged;
        if (DataContext is WritingViewModel)
            textBox.TextChanged += OnWritingAreaTextChanged;
    }

    private void OnWritingAreaTextChanged(object? sender, TextChangedEventArgs e)
    {
        if (DataContext is WritingViewModel vm && sender is TextBox tb)
            vm.HandleTextChanged(tb.Text ?? string.Empty);
    }
}
