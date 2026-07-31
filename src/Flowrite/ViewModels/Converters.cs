using System;
using System.Globalization;
using Avalonia.Data.Converters;
using Flowrite.Services;

namespace Flowrite.ViewModels;

/// <summary>Converts an enum value to bool by comparing against ConverterParameter string.</summary>
public sealed class EnumToBoolConverter : IValueConverter
{
    public static readonly EnumToBoolConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is null || parameter is null) return false;
        return value.ToString() == parameter.ToString();
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Returns true when the string is non-null and non-empty.</summary>
public sealed class StringNotEmptyConverter : IValueConverter
{
    public static readonly StringNotEmptyConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is string s && !string.IsNullOrWhiteSpace(s);

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Inverts a bool.</summary>
public sealed class InverseBoolConverter : IValueConverter
{
    public static readonly InverseBoolConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is bool b && !b;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is bool b && !b;
}

/// <summary>Converts SessionState enum to bool.</summary>
public sealed class SessionStateConverter : IValueConverter
{
    public static readonly SessionStateConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is null || parameter is null) return false;
        return value.ToString() == parameter.ToString();
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>
/// Returns true (IsReadOnly=true) only when the session is Failed or Idle.
/// Running and Completed both allow editing.
/// </summary>
public sealed class SessionStateNotRunningConverter : IValueConverter
{
    public static readonly SessionStateNotRunningConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is SessionState s && (s == SessionState.Failed || s == SessionState.Idle);

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Converts IdleProgress (0..1) to a pixel width given max width in ConverterParameter.</summary>
public sealed class ProgressToWidthConverter : IValueConverter
{
    public static readonly ProgressToWidthConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is double progress && parameter is string s && double.TryParse(s, out var max))
            return Math.Max(0, progress * max);
        return 0.0;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Converts a FailReason to a human-readable message.</summary>
public sealed class FailReasonMessageConverter : IValueConverter
{
    public static readonly FailReasonMessageConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is FailReason reason ? reason switch
        {
            FailReason.IdleTimeout => "You stopped typing for too long.",
            FailReason.PasteAbuse  => "Large paste detected. No shortcuts allowed.",
            _                      => string.Empty
        } : string.Empty;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>
/// Converts bool to one of two strings: "TrueString|FalseString" in ConverterParameter.
/// </summary>
public sealed class BoolToStringConverter : IValueConverter
{
    public static readonly BoolToStringConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (parameter is not string s) return string.Empty;
        var parts = s.Split('|');
        if (parts.Length != 2) return string.Empty;
        return value is true ? parts[0] : parts[1];
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Converts seconds (int) to a "X min" label.</summary>
public sealed class SecondsToMinConverter : IValueConverter
{
    public static readonly SecondsToMinConverter Instance = new();

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is int secs)
            return $"{secs / 60} min session";
        return string.Empty;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
