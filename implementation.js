var cardModifier = class extends (ExtensionCommon.ExtensionAPI) {
  getAPI(context) {
    const styleId = "styles-from-add-delete-button-addon";

    function addDynamicCSS(document, id, css) {
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
      const style = document.createElement("style");
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    }

    const cssText = `
.thread-card-icon-info {
  position: absolute !important;
  bottom: -20px !important;
  right: 0px !important;
  top: auto !important;

  display: flex !important;
  gap: 6px !important;
  z-index: 10 !important;

  pointer-events: auto !important;
  width: auto !important;
}

/* Fix for Thread Top cards (parents) which need different positioning */
:is(tr, li)[aria-expanded] .thread-card-icon-info {
  bottom: -2px !important;
}

.thread-card-icon-info::after {
  content: "" !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  background-image: url("chrome://messenger/skin/icons/delete.svg") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: 16px 16px !important;
  opacity: 0.6 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  pointer-events: auto !important;
}

.thread-card-icon-info::after:hover {
  opacity: 1 !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-radius: 4px !important;
}

.thread-card-icon-info::after:active {
  transform: scale(0.85) !important;
  background-color: rgba(255, 255, 255, 0.25) !important;
}

.thread-card-icon-info > * {
  pointer-events: auto !important;
}
`;

    async function waitForThreadCards(doc, retries = 10, delay = 200) {
      for (let i = 0; i < retries; i++) {
        if (doc.querySelector(".thread-card-icon-info")) {
          return true;
        }
        await new Promise(r => doc.defaultView.setTimeout(r, delay));
      }
      return false;
    }

    context.callOnClose({
      close() {
        const windows = Array.from(Services.wm.getEnumerator("mail:3pane"));
        // Cleanup all windows.
        for (let window of windows) {
          // Cleanup all mail tabs in the given window.
          for (let nativeTab of window.gTabmail.tabInfo.filter(t => t.mode.name === "mail3PaneTab")) {
            const doc = nativeTab?.chromeBrowser?.contentDocument
            if (!doc) {
              continue;
            }
            const style = doc.getElementById(styleId);
            if (style) {
              style.remove();
            }
            if (doc._quickDeleteHandler) {
              doc.removeEventListener("mousedown", doc._quickDeleteHandler, true);
              delete doc._quickDeleteHandler;
            }
            if (doc._quickDeleteDblHandler) {
              doc.removeEventListener("dblclick", doc._quickDeleteDblHandler, true);
              delete doc._quickDeleteDblHandler;
              delete doc._quickDeleteSuppressUntil;
            }
          }
        }      
      }
    });

    return {
      cardModifier: {
        async add(tabId) {
          let nativeTab = context.extension.tabManager.get(tabId).nativeTab;
          const doc = nativeTab?.chromeBrowser?.contentDocument
          if (!doc) {
            return;
          }

          // Wait until thread cards exist.
          await waitForThreadCards(doc);

          // Apply CSS.
          addDynamicCSS(doc, styleId, cssText);
          // Suppress dblclicks briefly after a quick-delete action to avoid
          // Thunderbird treating rapid clicks across cards as a double-click.
          doc._quickDeleteSuppressUntil = 0;
          doc._quickDeleteDblHandler = (ev) => {
            try {
              if (doc._quickDeleteSuppressUntil && Date.now() < doc._quickDeleteSuppressUntil) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
              }
            } catch (err) {
              // ignore
            }
          };
          doc.addEventListener("dblclick", doc._quickDeleteDblHandler, true);

          doc._quickDeleteHandler = (e) => {
            try {
              const iconContainer = e.target.closest(".thread-card-icon-info");
              if (!iconContainer) return;

              const rect = iconContainer.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              if (clickX < rect.width - 25) return;

              const card = iconContainer.closest("tr, li, thread-card");
              if (!card) return;

              e.preventDefault();
              e.stopImmediatePropagation();

              // Set suppression window to ignore dblclick events that follow
              // quickly (clicks on different cards can otherwise be seen as dblclick).
              doc._quickDeleteSuppressUntil = Date.now() + 450;

              // Perform selection and delete. We keep the synthetic click to keep
              // UI selection behavior but suppress following dblclick events.
              card.click();
              const win = e.target.ownerDocument.defaultView;
              win.setTimeout(() => {
                try {
                  win.goDoCommand("cmd_delete");
                } catch (err) {
                  // ignore deletion errors
                }
              }, 130);
            } catch (err) {
              console.error("Error in quick delete handler:", err);
            }
          };

          doc.addEventListener("mousedown", doc._quickDeleteHandler, true);
        },
      }
    };
  }
};
