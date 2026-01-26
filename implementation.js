var cardModifier = class extends (globalThis.ExtensionCommon?.ExtensionAPI || class {}) {
  getAPI(context) {
    return {
      cardModifier: {
        init() {
          try {
            const windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                   .getService(Components.interfaces.nsIWindowMediator);
            const win = windowMediator.getMostRecentWindow("mail:3pane");
            if (!win) return;
            win.document.addEventListener("mousedown", (e) => {
              // 1. Check if we are within the info zone (your icon area)
              const iconContainer = e.target.closest(".thread-card-icon-info");
              if (!iconContainer) return;
              // 2. Check click position (only delete if clicked on the right side)
              const rect = iconContainer.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              if (clickX < (rect.width - 25)) return; 

              // 3. Find the corresponding message card
              const card = iconContainer.closest("tr, li, thread-card");
              if (card) {
                e.stopImmediatePropagation();
                e.preventDefault();
                // Simulate a click on the card itself to force Thunderbird to focus on this email.
                card.click();
                // Short delay to allow the background selection process to take effect
                win.setTimeout(() => {
                  win.goDoCommand("cmd_delete");
                }, 100);
              }
            }, true);
          } catch (err) {
            console.error("WebExtensions: DEBUG: Error: " + err);
          }
        }
      }
    };
  }
};