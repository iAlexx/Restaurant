using System.Diagnostics;

namespace RestaurantPrintTray.Services;

public static class AgentLaunchHelper
{
    public const string ShowConsoleEnvVar = "RPA_SHOW_CONSOLE";
    public const string ShowConsoleValue = "1";

    public static ProcessStartInfo CreateStartInfo(string arguments)
    {
        var installDir = AppPaths.InstallDirectory;
        var agentExe = AppPaths.AgentExecutable;

        var startInfo = new ProcessStartInfo
        {
            FileName = agentExe,
            Arguments = arguments,
            WorkingDirectory = installDir,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden,
        };

        ApplyAgentEnvironment(startInfo);

        TrayBootstrapLogger.Info(
            "Prepared agent launch" + Environment.NewLine +
            $"  executable: {agentExe}" + Environment.NewLine +
            $"  arguments: {arguments}" + Environment.NewLine +
            $"  workingDirectory: {installDir}" + Environment.NewLine +
            $"  {ShowConsoleEnvVar}={startInfo.Environment[ShowConsoleEnvVar]}" + Environment.NewLine +
            $"  LOCALAPPDATA={startInfo.Environment["LOCALAPPDATA"]}");

        return startInfo;
    }

    public static void ApplyAgentEnvironment(ProcessStartInfo startInfo)
    {
        // Accessing Environment copies the current process environment in .NET.
        _ = startInfo.Environment;

        startInfo.Environment[ShowConsoleEnvVar] = ShowConsoleValue;
        startInfo.Environment["LOCALAPPDATA"] =
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        startInfo.Environment["USERPROFILE"] =
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        startInfo.Environment["APPDATA"] =
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
    }
}
