using System.Diagnostics;

namespace RestaurantPrintTray.Services;

public sealed class AgentSupervisor : IDisposable
{
    private readonly object _gate = new();
    private readonly StatusReader _statusReader = new();
    private Process? _process;
    private bool _intentionalStop;
    private int _restartCount;
    private DateTime _restartWindowStart = DateTime.UtcNow;

    public event EventHandler? AgentExited;
    public event EventHandler? AgentStarted;

    public bool IsRunning
    {
        get
        {
            lock (_gate)
            {
                return _process is { HasExited: false };
            }
        }
    }

    public int? ProcessId
    {
        get
        {
            lock (_gate)
            {
                return _process is { HasExited: false } ? _process.Id : null;
            }
        }
    }

    public void Start()
    {
        lock (_gate)
        {
            if (_process is { HasExited: false })
            {
                TrayBootstrapLogger.Info("Agent start skipped — process already running");
                return;
            }

            if (!File.Exists(AppPaths.AgentExecutable))
            {
                var message = $"Agent executable not found: {AppPaths.AgentExecutable}";
                TrayBootstrapLogger.Error(message);
                throw new FileNotFoundException(
                    "لم يتم العثور على RestaurantPrintAgent.exe",
                    AppPaths.AgentExecutable);
            }

            _intentionalStop = false;

            var startInfo = AgentLaunchHelper.CreateStartInfo("start");
            _process = Process.Start(startInfo);
            if (_process == null)
            {
                TrayBootstrapLogger.Error("Process.Start returned null for agent launch");
                throw new InvalidOperationException("تعذر تشغيل وكيل الطباعة");
            }

            _process.EnableRaisingEvents = true;
            _process.Exited += OnProcessExited;

            TrayBootstrapLogger.Info(
                $"Agent started pid={_process.Id} cwd={startInfo.WorkingDirectory}");

            AgentStarted?.Invoke(this, EventArgs.Empty);
        }
    }

    public async Task<bool> WaitForStatusReadyAsync(int timeoutMs = 5000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);

        while (DateTime.UtcNow < deadline)
        {
            if (!IsRunning)
            {
                TrayBootstrapLogger.Warn("Agent exited before status.json became ready");
                return false;
            }

            if (File.Exists(AppPaths.StatusFile))
            {
                var status = _statusReader.Read();
                if (status.AgentRunning)
                {
                    TrayBootstrapLogger.Info(
                        $"status.json ready agentRunning=true updatedAt={status.UpdatedAt}");
                    return true;
                }
            }

            await Task.Delay(250).ConfigureAwait(false);
        }

        var running = IsRunning;
        TrayBootstrapLogger.Warn(
            running
                ? "Timed out waiting for status.json agentRunning=true (process still alive)"
                : "Timed out waiting for status.json (process not running)");

        return running;
    }

    public void Stop()
    {
        lock (_gate)
        {
            _intentionalStop = true;
            if (_process is { HasExited: false })
            {
                try
                {
                    TrayBootstrapLogger.Info($"Stopping agent pid={_process.Id}");
                    _process.Kill(entireProcessTree: true);
                    _process.WaitForExit(5000);
                }
                catch (Exception ex)
                {
                    TrayBootstrapLogger.Warn($"Failed to stop agent pid={_process?.Id}: {ex.Message}");
                }
            }

            _process?.Dispose();
            _process = null;
        }
    }

    public void Restart()
    {
        TrayBootstrapLogger.Info("Restarting agent");
        Stop();
        Thread.Sleep(1000);
        Start();
    }

    private void OnProcessExited(object? sender, EventArgs e)
    {
        int exitCode;
        int? pid;

        lock (_gate)
        {
            exitCode = _process?.ExitCode ?? -1;
            pid = _process?.Id;
        }

        TrayBootstrapLogger.Warn(
            $"Agent exited pid={pid?.ToString() ?? "?"} exitCode={exitCode} intentionalStop={_intentionalStop}");

        AgentExited?.Invoke(this, EventArgs.Empty);

        lock (_gate)
        {
            if (_intentionalStop)
            {
                return;
            }

            var now = DateTime.UtcNow;
            if ((now - _restartWindowStart).TotalMinutes > 5)
            {
                _restartWindowStart = now;
                _restartCount = 0;
            }

            _restartCount++;
            if (_restartCount > 10)
            {
                TrayBootstrapLogger.Error(
                    "Agent restart watchdog stopped after 10 restarts in 5 minutes");
                return;
            }
        }

        var attempt = _restartCount;
        Task.Delay(3000).ContinueWith(_ =>
        {
            try
            {
                TrayBootstrapLogger.Info($"Watchdog restart attempt {attempt}");
                Start();
            }
            catch (Exception ex)
            {
                TrayBootstrapLogger.Error("Watchdog failed to restart agent", ex);
            }
        });
    }

    public void Dispose()
    {
        Stop();
    }
}
