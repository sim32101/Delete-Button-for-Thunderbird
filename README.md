# Quick Card Delete for Thunderbird

This add-on allows you to delete messages directly from the message card list by clicking a trash icon. It bypasses the need to manually select a message first by utilizing a smart 'Selection-then-Delete' logic with a 100ms synchronization delay.

Note: This add-on was created with the help of AI. Please be aware that it is provided as-is and will most likely not receive future updates or active maintenance.

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
