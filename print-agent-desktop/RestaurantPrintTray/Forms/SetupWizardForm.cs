using RestaurantPrintTray.Models;
using RestaurantPrintTray.Services;

namespace RestaurantPrintTray.Forms;

public sealed class SetupWizardForm : Form
{
    private readonly ConfigService _configService = new();
    private readonly TextBox _apiUrlBox = new() { Dock = DockStyle.Fill };
    private readonly ComboBox _printerBox = new() { Dock = DockStyle.Fill, DropDownStyle = ComboBoxStyle.DropDownList };
    private readonly TextBox _tokenBox = new() { Dock = DockStyle.Fill, UseSystemPasswordChar = true };
    private readonly Label _statusLabel = new() { Dock = DockStyle.Fill, AutoSize = false, Height = 48 };

    public SetupWizardForm()
    {
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
        saveButton.Click += async (_, _) => await OnSaveClicked(saveButton);
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

    private async Task OnSaveClicked(Button saveButton)
    {
        saveButton.Enabled = false;
        _statusLabel.Text = "جاري الحفظ...";

        try
        {
            var apiUrl = _apiUrlBox.Text.Trim();
            var printer = _printerBox.SelectedItem?.ToString()?.Trim() ?? "";
            var token = _tokenBox.Text.Trim();

            if (string.IsNullOrWhiteSpace(apiUrl))
            {
                throw new InvalidOperationException("عنوان API مطلوب");
            }

            if (!Uri.TryCreate(apiUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("عنوان API غير صالح");
            }

            if (string.IsNullOrWhiteSpace(printer))
            {
                throw new InvalidOperationException("يجب اختيار طابعة");
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                throw new InvalidOperationException("رمز الجهاز مطلوب");
            }

            var config = new AgentConfig
            {
                ApiBaseUrl = apiUrl,
                WindowsPrinterName = printer,
                PrintMode = "windows",
                PollIntervalMs = 4000,
                ReceiptWidthPx = 576,
            };

            _configService.SaveConfig(config, token);
            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            _statusLabel.Text = ex.Message;
            saveButton.Enabled = true;
        }

        await Task.CompletedTask;
    }
}
