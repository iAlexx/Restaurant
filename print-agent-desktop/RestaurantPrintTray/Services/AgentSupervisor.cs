using System.Diagnostics;

namespace RestaurantPrintTray.Services;

public sealed class AgentSupervisor : IDisposable
{
    private readonly object _gate = new();
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

    public void Start()
    {
        lock (_gate)
        {
            if (_process is { HasExited: false })
            {
                return;
            }

            if (!File.Exists(AppPaths.AgentExecutable))
            {
                throw new FileNotFoundException(
                    "لم يتم العثور على RestaurantPrintAgent.exe",
                    AppPaths.AgentExecutable);
            }

            _intentionalStop = false;

            var startInfo = new ProcessStartInfo
            {
                FileName = AppPaths.AgentExecutable,
                Arguments = "start",
                WorkingDirectory = AppPaths.InstallDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
            };

            _process = Process.Start(startInfo);
            if (_process == null)
            {
                throw new InvalidOperationException("تعذر تشغيل وكيل الطباعة");
            }

            _process.EnableRaisingEvents = true;
            _process.Exited += OnProcessExited;
            AgentStarted?.Invoke(this, EventArgs.Empty);
        }
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
                    _process.Kill(entireProcessTree: true);
                    _process.WaitForExit(5000);
                }
                catch
                {
                    // ignore kill failures
                }
            }

            _process?.Dispose();
            _process = null;
        }
    }

    public void Restart()
    {
        Stop();
        Thread.Sleep(1000);
        Start();
    }

    private void OnProcessExited(object? sender, EventArgs e)
    {
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
                return;
            }
        }

        Task.Delay(3000).ContinueWith(_ =>
        {
            try
            {
                Start();
            }
            catch
            {
                // watchdog gives up until tray reconnect action
            }
        });
    }

    public void Dispose()
    {
        Stop();
    }
}
