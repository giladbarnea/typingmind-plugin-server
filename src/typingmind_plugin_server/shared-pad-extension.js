// shared-pad-ext.js (chat-only mount)
(() => {
  const API_URL = "https://typingmind-plugin-server-j330.onrender.com/pad";
  const PANEL_ID = "tm-shared-pad";
  const PANEL_WIDTH = 420; // px

  // ---- Utilities ----
  const isChatView = () => {
    // Two cheap signals:
    // 1) TypingMind commonly has #chat=<id> in URL (used by community extensions)
    // 2) A chat root container with a data-element-id is present (per docs)
    if (location.hash.includes("#chat=")) return true;
    return document.querySelector('[data-element-id="chat-root"], [data-element-id="chat-view"]') !== null;
  };

  const mounted = () => document.getElementById(PANEL_ID) != null;

  const setBodyRightMargin = (px) => {
    // reserve space only if panel exists
    document.body.style.marginRight = px ? `${px}px` : "";
  };

  // ---- Panel ----
  const mountPanel = () => {
    if (mounted()) return;

    // style once
    if (!document.getElementById(`${PANEL_ID}-style`)) {
      const style = document.createElement("style");
      style.id = `${PANEL_ID}-style`;
      style.textContent = `
        #${PANEL_ID}{
          position: fixed; top:0; right:0; height:100vh; width:${PANEL_WIDTH}px;
          background:#fff; border-left:1px solid #ccc; z-index:2147483647;
          display:flex; flex-direction:column; font-family:monospace;
        }
        #${PANEL_ID} header{ padding:6px 8px; border-bottom:1px solid #ccc; }
        #${PANEL_ID} header button{ font-family:monospace; margin-right:6px; }
        #${PANEL_ID} #status{ color:#555; margin-left:6px; }
        #${PANEL_ID} textarea{
          flex:1; width:100%; border:none; outline:none; resize:none;
          font:14px/1.4 monospace; padding:8px; background:#fff;
        }
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

    // wire
    const $ = (sel) => panel.querySelector(sel);
    const padEl = $("#tm-pad-text");
    const statusEl = $("#status");

    const setStatus = (msg) => (statusEl.textContent = msg || "");

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
    window.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key === "s") || (!isMac && e.ctrlKey && e.key === "s")) {
        e.preventDefault();
        savePad();
      }
    });

    // initial load
    refreshPad();
  };

  const unmountPanel = () => {
    const el = document.getElementById(PANEL_ID);
    if (el) el.remove();
    setBodyRightMargin(0);
  };

  // ---- Router awareness: run at start, on hash changes, and when DOM changes ----
  const reevaluate = () => {
    if (isChatView()) mountPanel(); else unmountPanel();
  };

  // initial
  reevaluate();

  // hash-based navigation (TypingMind uses hash for chat routing in many builds)
  window.addEventListener("hashchange", reevaluate);

  // DOM mutations (route transitions without hash or late-loading chat root)
  const mo = new MutationObserver(() => {
    // cheap throttle: only act if mount state mismatches view
    const shouldMount = isChatView();
    if (shouldMount && !mounted()) mountPanel();
    else if (!shouldMount && mounted()) unmountPanel();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();