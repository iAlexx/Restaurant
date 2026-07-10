using RestaurantPrintTray.Services;

namespace RestaurantPrintTray.Forms;

public sealed class PrinterPickerForm : Form
{
    private readonly ConfigService _configService = new();
    public string? SelectedPrinter { get; private set; }

    public PrinterPickerForm()
    {
        Text = "اختيار الطابعة";
        RightToLeft = RightToLeft.Yes;
        RightToLeftLayout = true;
        Font = new Font("Segoe UI", 10F);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(420, 160);

        var config = _configService.LoadConfig();
        var combo = new ComboBox
        {
            Dock = DockStyle.Top,
            DropDownStyle = ComboBoxStyle.DropDownList,
            Height = 32,
        };

        foreach (var printer in PrinterService.ListInstalledPrinters())
        {
            combo.Items.Add(printer);
        }

        if (combo.Items.Contains(config.WindowsPrinterName))
        {
            combo.SelectedItem = config.WindowsPrinterName;
        }
        else if (combo.Items.Count > 0)
        {
            combo.SelectedIndex = 0;
        }

        var save = new Button { Text = "حفظ", Dock = DockStyle.Bottom, Height = 36 };
        save.Click += (_, _) =>
        {
            SelectedPrinter = combo.SelectedItem?.ToString();
            if (string.IsNullOrWhiteSpace(SelectedPrinter))
            {
                MessageBox.Show(this, "اختر طابعة", "تنبيه", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _configService.UpdatePrinter(SelectedPrinter);
            DialogResult = DialogResult.OK;
            Close();
        };

        Controls.Add(save);
        Controls.Add(combo);
    }
}
