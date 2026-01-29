# Quick Card Delete for Thunderbird

This add-on allows you to delete messages directly from the message card list by clicking a trash icon.


> **⚠️ Important — Functionality:**
>
> The logic behind this add-on is a practical but "clunky" workaround: when you click the designated icon area, the add-on first selects the card and then triggers the delete command after a 130ms delay.
>
> This synchronization delay is crucial. If the delay is too short for your specific system performance, the delete command might trigger before the new message is fully selected. This could result in deleting the previously selected email instead of the one you intended to delete. While this timing works reliably in my tests, please use it with caution, as system latency can affect the outcome.

> **ℹ️ About this add-on:**
>
> This add-on was created with the help of AI and is provided as-is; it will most likely not receive future updates or active maintenance.

## 📥 Installation (.xpi File)

The add-on might be available in the official Thunderbird Add-ons Store — please check there first: https://addons.thunderbird.net/de/thunderbird/addon/quick-card-delete-button/. If you need to install it manually, use the following instructions.

Follow these manual installation steps:

1. **Download** the `Quick Card Delete Button.xpi` file from this repository.
2. **Open Thunderbird** and go to **Settings**.
3. Select **Add-ons & Themes**.
4. Click the **Extensions** tab on the left.
5. Click the gear icon (⚙️) in the upper right area and choose **Install Add-on From File...**
6. Select the downloaded `.xpi` file and click **Open**.
7. **Confirm** the installation when prompted.
8. **Restart Thunderbird** if requested.

Optional: If you want to inspect the contents of the `.xpi`, open it with any ZIP tool.