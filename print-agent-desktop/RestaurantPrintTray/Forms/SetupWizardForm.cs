using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;

namespace RestaurantPrintTray.Forms;

public sealed class SetupWizardForm : Form
{
    private readonly ConfigService _configService = new();
    private readonly SettingsCoordinator _coordinator;
    private readonly Action _onSaved;
    private readonly TextBox _apiUrlBox = new() { Dock = DockStyle.Fill };
    private readonly ComboBox _printerBox = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly TextBox _tokenBox = new() { Dock = DockStyle.Fill, UseSystemPasswordChar = true };
    private readonly Label _statusLabel = new() { Dock = DockStyle.Fill, AutoSize = false, Height = 48 };

    public SetupWizardForm(Action onSaved)
    {
        _onSaved = onSaved;
        _coordinator = new SettingsCoordinator(_configService);

        Text = "إعداد وكيل الطباعة — مطعم النخة";
        RightToLeft = RightToLeft.Yes;
        RightToLeftLayout = true;
        Font = new Font("Segoe UI", 10F);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(520, 360);

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 6,
            Padding = new Padding(16),
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 35));
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 65));

        var config = _configService.LoadConfig();
        _apiUrlBox.Text = config.ApiBaseUrl;

        foreach (var printer in PrinterService.ListInstalledPrinters())
        {
            _printerBox.Items.Add(printer);
        }

        if (_printerBox.Items.Count == 0)
        {
            _printerBox.Items.Add(config.WindowsPrinterName);
        }

        var selectedPrinter = config.WindowsPrinterName;
        if (_printerBox.Items.Contains(selectedPrinter))
        {
            _printerBox.SelectedItem = selectedPrinter;
        }
        else if (_printerBox.Items.Count > 0)
        {
            _printerBox.SelectedIndex = 0;
        }

        AddRow(layout, 0, "عنوان API", _apiUrlBox);
        AddRow(layout, 1, "طابعة Windows", _printerBox);
        AddRow(layout, 2, "رمز الجهاز", _tokenBox);

        var help = new Label
        {
            Text = "الصق رمز جهاز الطباعة من لوحة الإدارة (يُعرض مرة واحدة فقط).",
            Dock = DockStyle.Fill,
            AutoSize = false,
            Height = 40,
        };
        layout.Controls.Add(help, 0, 3);
        layout.SetColumnSpan(help, 2);

        layout.Controls.Add(_statusLabel, 0, 4);
        layout.SetColumnSpan(_statusLabel, 2);

        var buttons = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            FlowDirection = FlowDirection.LeftToRight,
            RightToLeft = RightToLeft.Yes,
        };

        var saveButton = new Button { Text = "حفظ وبدء", AutoSize = true, DialogResult = DialogResult.None };
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
            PollIntervalMs = _configService.LoadConfig().PollIntervalMs,
            ReplaceToken = true,
            NewToken = _tokenBox.Text,
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
