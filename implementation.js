var cardModifier = class extends (globalThis.ExtensionCommon?.ExtensionAPI || class {}) {
  getAPI(context) {
    const registry = new Map();

    // Try to obtain Services for a robust shutdown fallback
    let Services = null;
    try {
      if (typeof ChromeUtils !== 'undefined' && ChromeUtils.import) {
        try {
          Services = ChromeUtils.import('resource://gre/modules/Services.jsm').Services;
        } catch (e) {
          Services = ChromeUtils.import('resource://gre/modules/Services.jsm');
        }
      } else if (typeof Components !== 'undefined' && Components.utils && Components.utils.import) {
        try {
          Services = Components.utils.import('resource://gre/modules/Services.jsm').Services;
        } catch (e) {
          Services = null;
        }
      }
    } catch (e) {
      Services = null;
    }

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

    async function getAbout3PaneDocument(win, retries = 5, delay = 200) {
      for (let i = 0; i < retries; i++) {
        try {
          const doc = win.gTabmail?.currentAbout3Pane?.document;
          if (doc) return doc;
        } catch (_) {}
        await new Promise(r => win.setTimeout(r, delay));
      }
      return null;
    }

    async function waitForThreadCards(doc, retries = 10, delay = 200) {
      for (let i = 0; i < retries; i++) {
        if (doc.querySelector(".thread-card-icon-info")) {
          return true;
        }
        await new Promise(r => doc.defaultView.setTimeout(r, delay));
      }
      return false;
    }

    function cleanupAll() {
      // First, remove handlers/styles we know about from the registry
      for (const entry of registry.values()) {
        try {
          entry.doc.removeEventListener("mousedown", entry.handler, true);
        } catch (_) {}

        try {
          const style = entry.doc.getElementById(entry.styleId);
          if (style) style.remove();
        } catch (_) {}
      }
      registry.clear();

      // Fallback: if Services is available, enumerate all mail:3pane windows
      // and remove any leftover handlers/styles that may have been attached directly to documents.
      try {
        if (Services && Services.wm) {
          const enumerator = Services.wm.getEnumerator('mail:3pane');
          while (enumerator.hasMoreElements()) {
            try {
              const win = enumerator.getNext();
              const doc = win.gTabmail && win.gTabmail.currentAbout3Pane && win.gTabmail.currentAbout3Pane.document;
              if (!doc) continue;

              try {
                // If the doc stored handler references, remove them
                const handler = doc._quickDeleteHandler;
                if (handler) {
                  try { doc.removeEventListener('mousedown', handler, true); } catch (e) {}
                  try { delete doc._quickDeleteHandler; } catch (e) {}
                }
              } catch (e) {}

              try {
                const sid = doc._quickDeleteStyleId || 'styles-from-add-delete-button-addon';
                const style = doc.getElementById(sid);
                if (style) style.remove();
                try { delete doc._quickDeleteStyleId; } catch (e) {}
              } catch (e) {}
            } catch (e) {
              // ignore per-window errors
            }
          }
        }
      } catch (e) {
        // swallow fallback errors to avoid noisy failures during shutdown
      }
    }

    context.callOnClose({
      close() {
        cleanupAll();
      }
    });

    return {
      cardModifier: {
        async add(windowId) {
          if (registry.has(windowId)) {
            return;
          }

          let win;
          try {
            win = context.extension.windowManager.get(windowId).window;
          } catch (e) {
            return;
          }

          const doc = await getAbout3PaneDocument(win);
          if (!doc) {
            return;
          }

          const styleId = "styles-from-add-delete-button-addon";

          // First CSS injection (early)
          addDynamicCSS(doc, styleId, cssText);

          // Wait until thread cards exist
          await waitForThreadCards(doc);

          // Re-apply CSS to ensure ::after takes effect
          addDynamicCSS(doc, styleId, cssText);

          const handler = (e) => {
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

              card.click();
              win.setTimeout(() => {
                try {
                  win.goDoCommand("cmd_delete");
                } catch (err) {
                  // ignore deletion errors
                }
              }, 130);
            } catch (err) {
              // swallow handler errors
            }
          };

          doc.addEventListener("mousedown", handler, true);
          // store references on the document itself to help Services-based cleanup
          try {
            doc._quickDeleteHandler = handler;
            doc._quickDeleteStyleId = styleId;
          } catch (e) {
            // ignore if properties cannot be set
          }

          registry.set(windowId, { doc, handler, styleId });
        },

        async remove(windowId) {
          const entry = registry.get(windowId);
          if (!entry) return;

          try {
            entry.doc.removeEventListener("mousedown", entry.handler, true);
          } catch (_) {}

          try {
            const style = entry.doc.getElementById(entry.styleId);
            if (style) style.remove();
          } catch (_) {}

          registry.delete(windowId);
        }
      }
    };
  }
};
