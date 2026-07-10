using RestaurantPrintTray.Models;

namespace RestaurantPrintTray.Services;

public static class SettingsValidator
{
    public const string TokenSavedMaskedLabel = "تم حفظ التوكن ••••";
    public const int MinPollIntervalMs = 3000;
    public const int MaxPollIntervalMs = 10000;

    public static IReadOnlyList<string> Validate(
        SettingsSaveInput input,
        IReadOnlyList<string> installedPrinters,
        bool hasStoredToken)
    {
        var errors = new List<string>();

        errors.AddRange(ValidateApiUrl(input.ApiBaseUrl));

        if (string.IsNullOrWhiteSpace(input.PrinterName))
        {
            errors.Add("يجب اختيار طابعة");
        }
        else if (
            installedPrinters.Count > 0
            && !installedPrinters.Contains(input.PrinterName, StringComparer.OrdinalIgnoreCase))
        {
            errors.Add("الطابعة المختارة غير موجودة في Windows");
        }

        errors.AddRange(ValidatePollInterval(input.PollIntervalMs));

        if (input.ReplaceToken || !hasStoredToken)
        {
            if (string.IsNullOrWhiteSpace(input.NewToken))
            {
                errors.Add("رمز الجهاز مطلوب");
            }
        }

        return errors;
    }

    public static IReadOnlyList<string> ValidateApiUrl(string apiUrl)
    {
        var errors = new List<string>();
        var trimmed = apiUrl.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
        {
            errors.Add("عنوان API مطلوب");
            return errors;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            errors.Add("عنوان API غير صالح");
            return errors;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("يجب أن يبدأ عنوان API بـ https://");
        }

        return errors;
    }

    public static IReadOnlyList<string> ValidatePollInterval(int pollIntervalMs)
    {
        if (pollIntervalMs < MinPollIntervalMs || pollIntervalMs > MaxPollIntervalMs)
        {
            return
            [
                $"فترة الاستطلاع يجب أن تكون بين {MinPollIntervalMs} و {MaxPollIntervalMs} مللي ثانية",
            ];
        }

        return [];
    }
}
