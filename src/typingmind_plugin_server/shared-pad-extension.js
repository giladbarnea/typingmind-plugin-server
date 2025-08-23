// shared-pad-extension.js (chat-only; per-chat pad)
/**
 * Executes a callback when the page has "settled" down.
 * This is useful for modern, reactive websites where content loads asynchronously.
 *
 * @param {() => void} callback The function to call when the page is settled.
 * @param {number} [settleTime=500] The time in milliseconds of inactivity to wait for.
 * @param {Element} [targetNode=document.body] The DOM element to observe for mutations.
 */
function onPageSettled(callback, settleTime = 500, targetNode = document.body) {
	let settleTimer;

	// Create an observer instance linked to a callback function
	const observer = new MutationObserver((mutationsList, obs) => {
		// We've detected a mutation, so we clear the existing timer
		clearTimeout(settleTimer);

		// And start a new one
		settleTimer = setTimeout(() => {
			// If this timer completes, it means no mutations have occurred in `settleTime` ms.
			console.log("[onPageSettled] Page has settled. Firing callback.");

			// We can now disconnect the observer to prevent further checks
			obs.disconnect();

			// And execute the user's callback function
			callback();
		}, settleTime);
	});

	// Configuration for the observer:
	const config = {
		childList: true,
		subtree: true,
		attributes: true,
	};

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);

	// We also start the initial timer, in case the page is already static
	// or loads faster than the observer can be set up.
	settleTimer = setTimeout(() => {
		console.log(
			"[onPageSettled] Initial settle time reached. Firing callback.",
		);
		observer.disconnect();
		callback();
	}, settleTime);
}

onPageSettled(() => {
	const API_URL = "https://typingmind-plugin-server-j330.onrender.com/pad";
	const PANEL_ID = "tm-shared-pad";
	const PANEL_WIDTH = 420;

	const isChatView = () => {
		return location.hash.includes("#chat=");
	};

	function getChatId() {
		// Hash form: ...#chat=<uuid-or-id>[&...]
		const m = location.hash.match(/#chat=([^&]+)/);
		if (m?.[1]) return decodeURIComponent(m[1]);
		throw new Error(
			`[Shared Pad getChatId] No chat id found for location.hash=${location.hash}`,
		);
	}

	const mounted = () => document.getElementById(PANEL_ID) != null;
	const setBodyRightMargin = (px) => {
		document.body.style.marginRight = px ? `${px}px` : "";
	};

	const mountPanel = () => {
		if (mounted()) {
			console.log("[Shared Pad mountPanel] Panel already mounted");
			return;
		}
		console.log("[Shared Pad mountPanel] Mounting panel");

		if (!document.getElementById(`${PANEL_ID}-style`)) {
			const style = document.createElement("style");
			style.id = `${PANEL_ID}-style`;
			style.textContent = `
		  #${PANEL_ID}{position:fixed;top:0;right:0;height:100vh;width:${PANEL_WIDTH}px;
			background:#fff;border-left:1px solid #ccc;z-index:2147483647;display:flex;flex-direction:column;font-family:monospace;}
		  #${PANEL_ID} header{padding:6px 8px;border-bottom:1px solid #ccc;}
		  #${PANEL_ID} header button{font-family:monospace;margin-right:6px;}
		  #${PANEL_ID} #status{color:#555;margin-left:6px;}
		  #${PANEL_ID} textarea{flex:1;width:100%;border:none;outline:none;resize:none;font:14px/1.4 monospace;padding:8px;background:#fff;}
		`;
			document.head.appendChild(style);
		}

		const panel = document.createElement("div");
		panel.id = PANEL_ID;
		panel.innerHTML = `
		<header>
		  <button id="tm-pad-refresh">Refresh</button>
		  <button id="tm-pad-save">Save</button>
		  <span id="status"></span>
		</header>
		<textarea id="tm-pad-text" spellcheck="false" placeholder="Shared pad…"></textarea>
	  `;
		document.body.appendChild(panel);
		setBodyRightMargin(PANEL_WIDTH);

		const $ = (sel) => panel.querySelector(sel);
		const padEl = $("#tm-pad-text");
		const statusEl = $("#status");
		const setStatus = (msg) => {
			statusEl.textContent = msg || "";
			console.log(`[Shared Pad setStatus] ${msg}`);
		};

		async function refreshPad() {
			try {
				const chat_id = getChatId();
				setStatus("Loading…");
				const res = await fetch(API_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "get", chat_id }),
				});
				const data = await res.json();
				padEl.value = data.text || "";
				setStatus(`Loaded (${chat_id.slice(0, 8)})`);
			} catch (e) {
				console.error(e);
				setStatus("Load failed");
			}
		}

		async function savePad() {
			try {
				const chat_id = getChatId();
				setStatus("Saving…");
				const text = padEl.value;
				await fetch(API_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "set", text, chat_id }),
				});
				setStatus(`Saved (${chat_id.slice(0, 8)})`);
			} catch (e) {
				console.error(e);
				setStatus("Save failed");
			}
		}

		$("#tm-pad-refresh").addEventListener("click", refreshPad);
		$("#tm-pad-save").addEventListener("click", savePad);

		// Ctrl/Cmd+S to save
		window.addEventListener("keydown", (e) => {
			const isMac = navigator.platform.toUpperCase().includes("MAC");
			if (
				(isMac && e.metaKey && e.key === "s") ||
				(!isMac && e.ctrlKey && e.key === "s")
			) {
				e.preventDefault();
				savePad();
			}
		});

		// Initial load
		refreshPad();
	};

	const unmountPanel = () => {
		const el = document.getElementById(PANEL_ID);
		if (el) el.remove();
		setBodyRightMargin(0);
	};

	const reevaluate = () => {
		if (isChatView()) mountPanel();
		else unmountPanel();
	};

	// Initial + route/DOM changes
	reevaluate();
	window.addEventListener("hashchange", reevaluate);
	new MutationObserver(() => {
		const shouldMount = isChatView();
		if (shouldMount && !mounted()) mountPanel();
		else if (!shouldMount && mounted()) unmountPanel();
	}).observe(document.documentElement, { childList: true, subtree: true });
});
