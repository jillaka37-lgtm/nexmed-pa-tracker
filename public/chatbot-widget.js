(function () {
  "use strict";

  var SITE_URL = (document.currentScript && document.currentScript.getAttribute("data-site")) || "https://nexmed.com";
  var EMBED_URL = SITE_URL + "/chat/embed";
  var OPEN = false;

  // Inject styles
  var style = document.createElement("style");
  style.textContent = [
    "#nexmed-widget-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,.4);z-index:9998;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}",
    "#nexmed-widget-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(37,99,235,.5);}",
    "#nexmed-widget-panel{position:fixed;bottom:92px;right:24px;width:370px;height:560px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:9999;border:1px solid #e5e7eb;display:none;flex-direction:column;background:#fff;}",
    "@media(max-width:420px){#nexmed-widget-panel{width:calc(100vw - 16px);right:8px;bottom:80px;height:70vh;}}",
    "#nexmed-widget-panel iframe{flex:1;border:none;width:100%;height:100%;}",
    "#nexmed-widget-close{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.45);border:none;color:#fff;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:14px;line-height:26px;text-align:center;z-index:1;}",
  ].join("");
  document.head.appendChild(style);

  // Bubble button
  var btn = document.createElement("button");
  btn.id = "nexmed-widget-btn";
  btn.setAttribute("aria-label", "Open NexMed chat");
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  document.body.appendChild(btn);

  // Panel
  var panel = document.createElement("div");
  panel.id = "nexmed-widget-panel";

  var closeBtn = document.createElement("button");
  closeBtn.id = "nexmed-widget-close";
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.textContent = "×";
  panel.appendChild(closeBtn);

  var iframe = document.createElement("iframe");
  iframe.setAttribute("title", "NexMed AI Assistant");
  iframe.setAttribute("allow", "autoplay");
  panel.appendChild(iframe);

  document.body.appendChild(panel);

  function open() {
    if (!iframe.src) iframe.src = EMBED_URL;
    panel.style.display = "flex";
    btn.setAttribute("aria-expanded", "true");
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    OPEN = true;
  }

  function close() {
    panel.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    OPEN = false;
  }

  btn.addEventListener("click", function () { OPEN ? close() : open(); });
  closeBtn.addEventListener("click", close);
})();
