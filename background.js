// Initialize experiment API and attach to windows. Retry on install/startup to avoid needing a manual reload.
async function ensureInitAndAttach() {
	try {
		if (browser.cardModifier && typeof browser.cardModifier.init === 'function') {
			try { browser.cardModifier.init(); } catch (e) { }
		}
	} catch (e) {
	}

	// Give the platform a short moment, then attach to existing windows
	try {
		await new Promise(r => setTimeout(r, 250));
		const windows = await browser.windows.getAll();
		for (const w of windows) {
			try {
				if (w.type === 'normal') {
					await browser.cardModifier.add(w.id);
				}
			} catch (e) {
			}
		}
	} catch (e) {
	}
}

// Run immediately (background script load) and on lifecycle events
ensureInitAndAttach();

browser.runtime.onStartup.addListener(() => {
	// runtime.onStartup may fire before windows are ready; delay a bit
	setTimeout(() => ensureInitAndAttach(), 500);
});

browser.runtime.onInstalled.addListener((details) => {
	// onInstalled: try to attach after short delay; when updating/installing the extension
	setTimeout(() => ensureInitAndAttach(), 500);
});

// Listen for new windows and instruct the experiment to add the UI for them
browser.windows.onCreated.addListener(async (windowInfo) => {
	try {
		// windowInfo from onCreated is already the Window object
		if (windowInfo.type === 'normal') {
			await browser.cardModifier.add(windowInfo.id);
		} else {
			// skip non-normal windows
		}
	} catch (e) {
	}
});


// Clean up when a window is removed
browser.windows.onRemoved.addListener(async (windowId) => {
	try {
		if (browser.cardModifier && typeof browser.cardModifier.remove === 'function') {
			await browser.cardModifier.remove(windowId);
		}
	} catch (e) {
	}
});