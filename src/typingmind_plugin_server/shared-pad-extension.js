// shared-pad-ext.js
(() => {
	// --- Config ---
	const API_URL = "https://typingmind-plugin-server-j330.onrender.com/pad"; // your POST /pad endpoint
	const PANEL_WIDTH = 420; // px, fixed; simple & non-collapsible (MVP)
  
	// --- Basic styles + layout adjustments (1995 vibes, but readable) ---
	const style = document.createElement("style");
	style.textContent = `
	  #tm-shared-pad {
		position: fixed; top: 0; right: 0; height: 100vh; width: ${PANEL_WIDTH}px;
		background: #fff; border-left: 1px solid #ccc; z-index: 2147483647;
		display: flex; flex-direction: column; font-family: monospace;
	  }
	  #tm-shared-pad header { padding: 6px 8px; border-bottom: 1px solid #ccc; }
	  #tm-shared-pad header button { font-family: monospace; margin-right: 6px; }
	  #tm-shared-pad #status { color: #555; margin-left: 6px; }
	  #tm-shared-pad textarea {
		flex: 1; width: 100%; border: none; outline: none; resize: none;
		font: 14px/1.4 monospace; padding: 8px; background: #fff;
	  }
	`;
	document.head.appendChild(style);
  
	// Nudge the app so the panel does not cover it (coarse but effective).
	// You can remove this if you prefer the overlay to float above.
	document.body.style.marginRight = `${PANEL_WIDTH}px`;
  
	// --- Panel markup ---
	const panel = document.createElement("div");
	panel.id = "tm-shared-pad";
	panel.innerHTML = `
	  <header>
		<button id="tm-pad-refresh">Refresh</button>
		<button id="tm-pad-save">Save</button>
		<span id="tm-pad-status"></span>
	  </header>
	  <textarea id="tm-pad-text" spellcheck="false" placeholder="Shared pad…"></textarea>
	`;
	document.body.appendChild(panel);
  
	const $ = (sel) => panel.querySelector(sel);
	const padEl = $("#tm-pad-text");
	const statusEl = $("#tm-pad-status");
  
	function setStatus(msg) { statusEl.textContent = msg || ""; }
  
	async function refreshPad() {
	  try {
		setStatus("Loading…");
		const res = await fetch(API_URL, {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({ action: "get" })
		});
		const data = await res.json();
		padEl.value = data.text || "";
		setStatus("Loaded");
	  } catch (e) {
		console.error(e);
		setStatus("Load failed");
	  }
	}
  
	async function savePad() {
	  try {
		setStatus("Saving…");
		const text = padEl.value;
		await fetch(API_URL, {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({ action: "set", text })
		});
		setStatus("Saved");
	  } catch (e) {
		console.error(e);
		setStatus("Save failed");
	  }
	}
  
	$("#tm-pad-refresh").addEventListener("click", refreshPad);
	$("#tm-pad-save").addEventListener("click", savePad);
  
	// Ctrl/Cmd+S as Save
	window.addEventListener("keydown", (e) => {
	  const isMac = navigator.platform.toUpperCase().includes("MAC");
	  if ((isMac && e.metaKey && e.key === "s") || (!isMac && e.ctrlKey && e.key === "s")) {
		e.preventDefault();
		savePad();
	  }
	});
  
	// Load once on start
	refreshPad();
  })();
  