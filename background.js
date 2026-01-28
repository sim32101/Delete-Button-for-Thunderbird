// Listen for new windows and instruct the experiment to add the UI for them
browser.windows.onCreated.addListener(async (windowInfo) => {
	try {
		// windowInfo from onCreated is already the Window object
		if (windowInfo.type === 'normal') {
			await browser.cardModifier.add(windowInfo.id);
		} else {
			console.log('Skipping non-normal window onCreated', windowInfo.id, windowInfo.type);
		}
	} catch (e) {
		console.error("cardModifier.add error:", e);
	}
});

(async () => {
	try {
		const windows = await browser.windows.getAll();
		for (const w of windows) {
			try {
				if (w.type === 'normal') {
					await browser.cardModifier.add(w.id);
				} else {
					console.log('Skipping non-normal existing window', w.id, w.type);
				}
			} catch (e) {
				console.error("cardModifier.add error for existing window:", e);
			}
		}
	} catch (e) {
		console.error("Error enumerating windows:", e);
	}
})();

// Clean up when a window is removed
browser.windows.onRemoved.addListener(async (windowId) => {
	try {
		if (browser.cardModifier && typeof browser.cardModifier.remove === 'function') {
			await browser.cardModifier.remove(windowId);
		}
	} catch (e) {
		console.error('cardModifier.remove error on window removed:', e);
	}
});