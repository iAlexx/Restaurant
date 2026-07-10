using RestaurantPrintTray.Services;
using Xunit;

namespace RestaurantPrintTray.Tests;

public sealed class AgentLaunchHelperTests
{
    [Fact]
    public void CreateStartInfo_matches_manual_foreground_launch()
    {
        var startInfo = AgentLaunchHelper.CreateStartInfo("start");

        Assert.Equal(AppPaths.AgentExecutable, startInfo.FileName);
        Assert.Equal("start", startInfo.Arguments);
        Assert.Equal(AppPaths.InstallDirectory, startInfo.WorkingDirectory);
        Assert.False(startInfo.UseShellExecute);
        Assert.True(startInfo.CreateNoWindow);
        Assert.Equal(
            AgentLaunchHelper.ShowConsoleValue,
            startInfo.Environment[AgentLaunchHelper.ShowConsoleEnvVar]);
    }

    [Fact]
    public void CreateStartInfo_sets_profile_environment()
    {
        var startInfo = AgentLaunchHelper.CreateStartInfo("start");

        Assert.False(string.IsNullOrWhiteSpace(startInfo.Environment["LOCALAPPDATA"]));
        Assert.False(string.IsNullOrWhiteSpace(startInfo.Environment["USERPROFILE"]));
        Assert.False(string.IsNullOrWhiteSpace(startInfo.Environment["APPDATA"]));
        Assert.Equal(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            startInfo.Environment["LOCALAPPDATA"]);
    }

    [Fact]
    public void CreateStartInfo_does_not_expose_device_token_env()
    {
        var startInfo = AgentLaunchHelper.CreateStartInfo("start");

        foreach (var key in startInfo.Environment.Keys)
        {
            Assert.DoesNotContain("token", key, StringComparison.OrdinalIgnoreCase);
        }
    }
}

public sealed class TrayBootstrapLoggerTests : IDisposable
{
    private readonly string _tempDir;

    public TrayBootstrapLoggerTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "rpa-tray-bootstrap-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
        AppPaths.OverrideConfigDirectoryForTests = _tempDir;
    }

    public void Dispose()
    {
        AppPaths.OverrideConfigDirectoryForTests = null;
        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
        catch
        {
            // ignore cleanup races
        }
    }

    [Fact]
    public void Bootstrap_logger_writes_to_config_logs_directory()
    {
        TrayBootstrapLogger.Info("test bootstrap line");

        var logPath = TrayBootstrapLogger.BootstrapLogPath();
        Assert.True(File.Exists(logPath));
        var content = File.ReadAllText(logPath);
        Assert.Contains("test bootstrap line", content, StringComparison.Ordinal);
        Assert.Contains("[INFO]", content, StringComparison.Ordinal);
    }
}
