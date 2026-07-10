using System.Diagnostics;
using System.Text;

namespace RestaurantPrintTray.Services;

public sealed class AgentCommandService
{
    public async Task<(bool Success, string Message)> RunCommandAsync(
        string command,
        int timeoutMs = 120000,
        string? extraEnv = null)
    {
        if (!File.Exists(AppPaths.AgentExecutable))
        {
            return (false, "لم يتم العثور على RestaurantPrintAgent.exe");
        }

        var startInfo = AgentLaunchHelper.CreateStartInfo(command);
        startInfo.RedirectStandardOutput = true;
        startInfo.RedirectStandardError = true;
        startInfo.StandardOutputEncoding = Encoding.UTF8;
        startInfo.StandardErrorEncoding = Encoding.UTF8;

        if (!string.IsNullOrWhiteSpace(extraEnv))
        {
            startInfo.Environment["RPA_SETUP_TOKEN"] = extraEnv;
        }

        using var process = Process.Start(startInfo);
        if (process == null)
        {
            return (false, "تعذر تشغيل الأمر");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        var completed = await Task.Run(() => process.WaitForExit(timeoutMs));

        if (!completed)
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch
            {
                // ignore
            }

            return (false, "انتهت مهلة تنفيذ الأمر");
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;
        var output = string.IsNullOrWhiteSpace(stdout) ? stderr : stdout;

        return process.ExitCode == 0
            ? (true, string.IsNullOrWhiteSpace(output) ? "تم التنفيذ بنجاح" : output.Trim())
            : (false, string.IsNullOrWhiteSpace(output) ? $"فشل الأمر ({process.ExitCode})" : output.Trim());
    }

    public Task<(bool Success, string Message)> TestPrintAsync() =>
        RunCommandAsync("test-print");
}
