using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;

namespace RestaurantPrintTray.Forms;

public sealed class SettingsForm : Form
{
    private readonly ConfigService _configService = new();
    private readonly SettingsCoordinator _coordinator;
    private readonly Action _onSaved;
    private readonly TextBox _apiUrlBox = new() { Dock = DockStyle.Fill };
    private readonly ComboBox _printerBox = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly NumericUpDown _pollIntervalBox = new()
    {
        Dock = DockStyle.Left,
        Minimum = SettingsValidator.MinPollIntervalMs,
        Maximum = SettingsValidator.MaxPollIntervalMs,
        Increment = 500,
        Width = 120,
    };
    private readonly Label _tokenStatusLabel = new()
    {
        Dock = DockStyle.Fill,
        TextAlign = ContentAlignment.MiddleLeft,
        AutoSize = false,
    };
    private readonly TextBox _tokenBox = new()
    {
        Dock = DockStyle.Fill,
        UseSystemPasswordChar = true,
        Visible = false,
    };
    private readonly Button _changeTokenButton = new() { Text = "تغيير التوكن", AutoSize = true };
    private readonly Label _statusLabel = new() { Dock = DockStyle.Fill, AutoSize = false, Height = 48 };
    private bool _replaceToken;

    public SettingsForm(Action onSaved)
    {
        _onSaved = onSaved;
        _coordinator = new SettingsCoordinator(_configService);

        Text = "إعدادات وكيل الطباعة";
        RightToLeft = RightToLeft.Yes;
        RightToLeftLayout = true;
        Font = new Font("Segoe UI", 10F);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(560, 430);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 7,
            Padding = new Padding(16),
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 34));
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 66));

        var config = _configService.LoadConfig();
        _apiUrlBox.Text = config.ApiBaseUrl;
        _pollIntervalBox.Value = Math.Clamp(
            config.PollIntervalMs,
            SettingsValidator.MinPollIntervalMs,
            SettingsValidator.MaxPollIntervalMs);

        foreach (var printer in PrinterService.ListInstalledPrinters())
        {
            _printerBox.Items.Add(printer);
        }

        if (_printerBox.Items.Count == 0)
        {
            _printerBox.Items.Add(config.WindowsPrinterName);
        }

        if (_printerBox.Items.Contains(config.WindowsPrinterName))
        {
            _printerBox.SelectedItem = config.WindowsPrinterName;
        }
        else if (_printerBox.Items.Count > 0)
        {
            _printerBox.SelectedIndex = 0;
        }

        UpdateTokenPresentation();

        _changeTokenButton.Click += (_, _) =>
        {
            _replaceToken = true;
            _tokenStatusLabel.Visible = false;
            _changeTokenButton.Visible = false;
            _tokenBox.Visible = true;
            _tokenBox.Focus();
        };

        var tokenPanel = new Panel { Dock = DockStyle.Fill, Height = 32 };
        tokenPanel.Controls.Add(_tokenBox);
        tokenPanel.Controls.Add(_tokenStatusLabel);
        tokenPanel.Controls.Add(_changeTokenButton);
        _changeTokenButton.Dock = DockStyle.Left;
        _tokenStatusLabel.Dock = DockStyle.Fill;

        AddRow(layout, 0, "عنوان API", _apiUrlBox);
        AddRow(layout, 1, "رمز الجهاز", tokenPanel);
        AddRow(layout, 2, "طابعة Windows", _printerBox);

        var advancedGroup = new GroupBox
        {
            Text = "إعدادات متقدمة",
            Dock = DockStyle.Fill,
            Padding = new Padding(12),
        };
        var advancedLayout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
        };
        advancedLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40));
        advancedLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 60));
        advancedLayout.Controls.Add(
            new Label
            {
                Text = "فترة الاستطلاع (ms)",
                TextAlign = ContentAlignment.MiddleRight,
                Dock = DockStyle.Fill,
            },
            0,
            0);
        advancedLayout.Controls.Add(_pollIntervalBox, 1, 0);
        advancedGroup.Controls.Add(advancedLayout);

        layout.Controls.Add(advancedGroup, 0, 3);
        layout.SetColumnSpan(advancedGroup, 2);

        layout.Controls.Add(_statusLabel, 0, 4);
        layout.SetColumnSpan(_statusLabel, 2);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            RightToLeft = RightToLeft.Yes,
        };

        var saveButton = new Button { Text = "حفظ", AutoSize = true };
        var cancelButton = new Button { Text = "إلغاء", AutoSize = true, DialogResult = DialogResult.Cancel };
        saveButton.Click += (_, _) => OnSaveClicked(saveButton);
        buttons.Controls.Add(saveButton);
        buttons.Controls.Add(cancelButton);

        layout.Controls.Add(buttons, 0, 5);
        layout.SetColumnSpan(buttons, 2);

        Controls.Add(layout);
        AcceptButton = saveButton;
        CancelButton = cancelButton;
    }

    private void UpdateTokenPresentation()
    {
        var hasToken = TokenStore.ValidateStoredToken();
        if (hasToken)
        {
            _tokenStatusLabel.Text = SettingsValidator.TokenSavedMaskedLabel;
            _tokenStatusLabel.Visible = true;
            _changeTokenButton.Visible = true;
            _tokenBox.Visible = false;
            _replaceToken = false;
            return;
        }

        _tokenStatusLabel.Visible = false;
        _changeTokenButton.Visible = false;
        _tokenBox.Visible = true;
        _replaceToken = true;
    }

    private static void AddRow(TableLayoutPanel layout, int row, string label, Control control)
    {
        layout.Controls.Add(new Label
        {
            Text = label,
            TextAlign = ContentAlignment.MiddleRight,
            Dock = DockStyle.Fill,
            AutoSize = false,
        }, 0, row);
        layout.Controls.Add(control, 1, row);
    }

    private void OnSaveClicked(Button saveButton)
    {
        saveButton.Enabled = false;
        _statusLabel.Text = "جاري الحفظ...";

        var input = new SettingsSaveInput
        {
            ApiBaseUrl = _apiUrlBox.Text,
            PrinterName = _printerBox.SelectedItem?.ToString() ?? "",
            PollIntervalMs = (int)_pollIntervalBox.Value,
            ReplaceToken = _replaceToken,
            NewToken = _replaceToken ? _tokenBox.Text : null,
        };

        var result = _coordinator.TrySave(input, _onSaved);
        if (!result.Success)
        {
            _statusLabel.Text = string.Join(" — ", result.Errors);
            saveButton.Enabled = true;
            return;
        }

        DialogResult = DialogResult.OK;
        Close();
    }
}
