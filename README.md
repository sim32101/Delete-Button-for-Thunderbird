# Quick Card Delete for Thunderbird

This add-on allows you to delete messages directly from the message card list by clicking a trash icon.

> **Note — CSS installation:** See the "Enable Stylesheet Customization" section below for instructions on how to install the required CSS file.

> **⚠️ Important — Functionality:**
>
> The logic behind this add-on is a practical but "clunky" workaround: when you click the designated icon area, the add-on first selects the card and then triggers the delete command after a 100ms delay.
>
> This synchronization delay is crucial. If the delay is too short for your specific system performance, the delete command might trigger before the new message is fully selected. This could result in deleting the previously selected email instead of the one you intended to delete. While this timing works reliably in my tests, please use it with caution, as system latency can affect the outcome.

> **ℹ️ About this add-on:**
>
> This add-on was created with the help of AI and is provided as-is; it will most likely not receive future updates or active maintenance.

## 📥 Installation (.xpi File)

Note: The add-on might be available in the official Thunderbird Add-ons Store — please check there first. If you need to install it manually, use the following instructions.

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

## 🛠 Configuration (Mandatory)

### 1. Enable Stylesheet Customization
For Thunderbird to recognize custom CSS, you must enable this hidden setting:
1. Open Thunderbird and go to **Settings**.
2. Scroll to the bottom and click **Config Editor...** (search for `about:config`).
3. Search for: `toolkit.legacyUserProfileCustomizations.stylesheets`
4. Set it to **true**.
5. Restart Thunderbird.

### 2. Create userChrome.css
1. Find your **Profile Folder**: Help > Troubleshooting Information > Profile Folder > Open Folder.
2. Create a folder named `chrome` (all lowercase).
3. Inside `chrome`, create a file named `userChrome.css`.
4. Paste the following CSS code:

```css
/* =========================================
   Icon Bar: The Container
   ========================================= */
.thread-card-icon-info {
    position: absolute !important;
    bottom: -20px !important; 
    right: 0px !important;
    top: auto !important; 

    display: flex !important;
    gap: 6px !important;
    z-index: 9999 !important;
    
    /* We must allow pointer-events so that ::after can be hovered */
    pointer-events: auto !important; 
    width: auto !important;
}

/* =================================
   The Trash Can Icon (Thunderbird native)
   ================================= */
.thread-card-icon-info::after {
    content: "" !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    width: 24px !important;
    height: 24px !important;

    /* Native Thunderbird delete icon */
    background-image: url("chrome://messenger/skin/icons/delete.svg") !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    background-size: 16px 16px !important;

    opacity: 0.6 !important;
    cursor: pointer !important;
    
    transition: all 0.15s ease !important;
    
    /* Ensure the icon itself captures clicks */
    pointer-events: auto !important; 
}

/* =========================================
   Hover Logic
   ========================================= */
.thread-card-icon-info::after:hover {
    opacity: 1 !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
    border-radius: 4px !important;
}

/* Click Animation */
.thread-card-icon-info::after:active {
    transform: scale(0.85) !important;
    background-color: rgba(255, 255, 255, 0.25) !important;
}

/* =========================================
   Safety: prevent other icons reacting
   ========================================= */
.thread-card-icon-info > * {
    pointer-events: auto !important;
}
