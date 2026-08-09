using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Flowrite.Data;
using Flowrite.Data.Repositories;
using Flowrite.ViewModels;
using Flowrite.Views;
using Serilog;
using System;
using System.IO;

namespace Flowrite;

public class App : Application
{
    private Database? _db;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var appData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Flowrite");
            Directory.CreateDirectory(appData);

            var dbPath = Path.Combine(appData, "flowrite.db");
            _db = new Database(dbPath);

            var essayRepo = new EssayRepository(_db);
            var settingsRepo = new SettingsRepository(_db);
            var mainVm = new MainViewModel(essayRepo, settingsRepo);

            desktop.MainWindow = new MainWindow
            {
                DataContext = mainVm
            };

            desktop.Exit += (_, _) =>
            {
                Log.Information("Application exiting");
                _db.Dispose();
            };
        }

        base.OnFrameworkInitializationCompleted();
    }
}