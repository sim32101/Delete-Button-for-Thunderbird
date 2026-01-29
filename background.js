// Initialize experiment API and attach to windows. Retry on install/startup to avoid needing a manual reload.
async function init() {
	// Give the platform a short moment, then attach to existing windows
	await new Promise(r => setTimeout(r, 250));
	const tabs = await browser.tabs.query({type: 'mail'});
	for (const tabInfo of tabs) {
		await browser.cardModifier.add(tabInfo.id);
	}
}

// Run immediately on add-on startup.
init();

// Listen for new tabs and instruct the experiment to add the UI for them.
browser.tabs.onCreated.addListener(async (tabInfo) => {
	if (tabInfo.type === 'mail') {
		await browser.cardModifier.add(tabInfo.id);
	}
});
