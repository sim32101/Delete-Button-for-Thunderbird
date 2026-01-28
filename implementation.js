var cardModifier = class extends (globalThis.ExtensionCommon?.ExtensionAPI || class {}) {
  getAPI(context) {
    // Track per-window listeners and injected styles so we can clean up on shutdown
    const registry = new Map();

    function addDynamicCSS(document, id, css) {
      try {
        const existing = document.getElementById(id);
        if (existing) {
          existing.remove();
        }
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
      } catch (e) {
        console.error('addDynamicCSS error', e);
      }
    }

    const cssText = `
.thread-card-icon-info {
    position: absolute !important;
    bottom: -20px !important;
    right: 0px !important;
    top: auto !important;

    display: flex !important;
    gap: 6px !important;
    z-index: 9999 !important;
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

    // Ensure we remove injected styles and listeners if the experiment is shut down
    // Register shutdown cleanup using whichever API the context provides
    try {
      const cleanup = () => {
        try {
          for (const [windowId, entry] of registry.entries()) {
            try { entry.doc.removeEventListener('mousedown', entry.handler, true); } catch (e) {}
            try { const style = entry.doc.getElementById(entry.styleId); if (style) style.remove(); } catch (e) {}
          }
        } catch (e) {}
        registry.clear();
      };

      if (context) {
        if (typeof context.once === 'function') {
          try { context.once('shutdown', cleanup); } catch (e) {}
        }
        if (context.onShutdown && typeof context.onShutdown.addListener === 'function') {
          try { context.onShutdown.addListener(cleanup); } catch (e) {}
        }
      }
    } catch (e) {}

    return {
      cardModifier: {
        init() {
          // no-op: initialization is performed from the extension background script
        },

        async add(windowId) {
          try {
            console.log('cardModifier.add called for windowId', windowId);

            // Convert the extension windowId to the native window object
            let win;
            try {
              win = context.extension.windowManager.get(windowId).window;
            } catch (e) {
              console.error('cardModifier: could not get window from windowManager', e, windowId);
              return;
            }
            if (!win) {
              console.error('cardModifier: native window not available for', windowId);
              return;
            }

            // Robustly obtain the about:3pane document. It may not be immediately available.
            const getAbout3PaneDocument = async (w, attempts = 6, delayMs = 250) => {
              for (let i = 0; i < attempts; i++) {
                try {
                  const doc = w.gTabmail?.currentAbout3Pane?.document;
                  if (doc) return doc;
                } catch (e) {
                  // ignore and retry
                }
                await new Promise(r => w.setTimeout(r, delayMs));
              }
              return null;
            };

            let about3paneDocument = await getAbout3PaneDocument(win);
            let observer = null;
            if (!about3paneDocument) {
              console.warn('cardModifier: about3paneDocument not found immediately for window', windowId, '- attaching MutationObserver fallback');
              // Fallback: observe the top-level document for changes that enable gTabmail/currentAbout3Pane
              try {
                const root = win.document && win.document.documentElement;
                if (root) {
                  await new Promise((resolve) => {
                    const timeoutId = win.setTimeout(() => {
                      if (observer) {
                        try { observer.disconnect(); } catch (e) {}
                      }
                      resolve(null);
                    }, 15000);

                    observer = new win.MutationObserver(() => {
                      try {
                        const doc = win.gTabmail?.currentAbout3Pane?.document;
                        if (doc) {
                          try { observer.disconnect(); } catch (e) {}
                          win.clearTimeout(timeoutId);
                          resolve(doc);
                        }
                      } catch (e) {}
                    });
                    try {
                      observer.observe(root, { childList: true, subtree: true });
                    } catch (e) {
                      console.warn('cardModifier: observer.observe failed', e);
                      resolve(null);
                    }
                  });
                }
              } catch (e) {
                console.warn('cardModifier: MutationObserver fallback failed', e);
              }
              about3paneDocument = win.gTabmail?.currentAbout3Pane?.document || null;
            }

            if (!about3paneDocument) {
              console.error('cardModifier: about3paneDocument not available after fallback for window', windowId);
              if (observer) try { observer.disconnect(); } catch (e) {}
              return;
            }

            const styleId = 'styles-from-add-delete-button-addon';
            addDynamicCSS(about3paneDocument, styleId, cssText);

            // verify injection
            try {
              const verify = about3paneDocument.getElementById(styleId);
              if (verify) console.log('cardModifier: injected style element', styleId, 'for window', windowId);
              else console.warn('cardModifier: style element not present after injection', styleId, windowId);
            } catch (e) {
              console.warn('cardModifier: error verifying injected style', e);
            }

            const handler = (e) => {
              try {
                const iconContainer = e.target.closest('.thread-card-icon-info');
                if (!iconContainer) return;
                const rect = iconContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (clickX < (rect.width - 25)) return;

                const card = iconContainer.closest('tr, li, thread-card');
                if (card) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  console.log('cardModifier: delete click detected, window', windowId);
                  card.click();
                  // allow selection to settle before deleting
                  win.setTimeout(() => {
                    try {
                      win.goDoCommand('cmd_delete');
                    } catch (err) {
                      console.error('delete command failed', err);
                    }
                  }, 100);
                }
              } catch (err) {
                console.error('cardModifier handler error', err);
              }
            };

            about3paneDocument.addEventListener('mousedown', handler, true);

            registry.set(windowId, { doc: about3paneDocument, handler, styleId, observer });
          } catch (err) {
            console.error('cardModifier.add error', err);
          }
        },

        async remove(windowId) {
          try {
            const entry = registry.get(windowId);
            if (!entry) return;
            try {
              entry.doc.removeEventListener('mousedown', entry.handler, true);
            } catch (e) {
              console.warn('remove listener failed', e);
            }
            try {
              const style = entry.doc.getElementById(entry.styleId);
              if (style) style.remove();
            } catch (e) {
              console.warn('remove style failed', e);
            }
            try {
              if (entry.observer && typeof entry.observer.disconnect === 'function') {
                try { entry.observer.disconnect(); } catch (e) { }
              }
            } catch (e) {
              console.warn('remove style failed', e);
            }
            registry.delete(windowId);
          } catch (err) {
            console.error('cardModifier.remove error', err);
          }
        }
      }
    };
  }
  // Clean up when the experiment is unloaded
  /* Note: context.onShutdown is available in the Experiment implementation scope */
  constructor() {
    super(...arguments);
    try {
      const self = this;
      // register shutdown handler
      if (this && this.getAPI) {
        // no-op here; cleanup is handled via getAPI registry when context provides onShutdown
      }
    } catch (e) {
      // ignore
    }
  }
};