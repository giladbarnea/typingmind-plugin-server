// shared-pad-ext.js (chat-only; per-chat pad)
(() => {
	const API_URL = "https://typingmind-plugin-server-j330.onrender.com/pad";
	const PANEL_ID = "tm-shared-pad";
	const PANEL_WIDTH = 420;
  
	const isChatView = () => {
	  if (location.hash.includes("#chat=")) return true;
	  return document.querySelector('[data-element-id="chat-root"], [data-element-id="chat-view"]') !== null;
	};
  
	// Try best-effort chat id extraction. Fallback to "default".
	function getChatId() {
	  // Hash form: ...#chat=<uuid-or-id>[&...]
	  const m = location.hash.match(/#chat=([^&]+)/);
	  if (m && m[1]) return decodeURIComponent(m[1]);
  
	  // If TypingMind adds data attributes later, look for them:
	  const el = document.querySelector('[data-element-id="chat-root"], [data-element-id="chat-view"]');
	  if (el && el.dataset && el.dataset.chatId) return el.dataset.chatId;
  
	  return "default";
	}
  
	const mounted = () => document.getElementById(PANEL_ID) != null;
	const setBodyRightMargin = (px) => { document.body.style.marginRight = px ? `${px}px` : ""; };
  
	const mountPanel = () => {
	  if (mounted()) return;
  
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
	  const setStatus = (msg) => (statusEl.textContent = msg || "");
  
	  async function refreshPad() {
		const chat_id = getChatId();
		try {
		  setStatus("Loading…");
		  const res = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "get", chat_id })
		  });
		  const data = await res.json();
		  padEl.value = data.text || "";
		  setStatus(`Loaded (${chat_id.slice(0,8)})`);
		} catch (e) {
		  console.error(e); setStatus("Load failed");
		}
	  }
  
	  async function savePad() {
		const chat_id = getChatId();
		try {
		  setStatus("Saving…");
		  const text = padEl.value;
		  await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "set", text, chat_id })
		  });
		  setStatus(`Saved (${chat_id.slice(0,8)})`);
		} catch (e) {
		  console.error(e); setStatus("Save failed");
		}
	  }
  
	  $("#tm-pad-refresh").addEventListener("click", refreshPad);
	  $("#tm-pad-save").addEventListener("click", savePad);
  
	  // Ctrl/Cmd+S to save
	  window.addEventListener("keydown", (e) => {
		const isMac = navigator.platform.toUpperCase().includes("MAC");
		if ((isMac && e.metaKey && e.key === "s") || (!isMac && e.ctrlKey && e.key === "s")) {
		  e.preventDefault(); savePad();
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
  
	const reevaluate = () => { if (isChatView()) mountPanel(); else unmountPanel(); };
  
	// Initial + route/DOM changes
	reevaluate();
	window.addEventListener("hashchange", reevaluate);
	new MutationObserver(() => {
	  const shouldMount = isChatView();
	  if (shouldMount && !mounted()) mountPanel();
	  else if (!shouldMount && mounted()) unmountPanel();
	}).observe(document.documentElement, { childList: true, subtree: true });
  })();
  