/* =====================================================================
   FaithBasedPilot.net — shared behaviour
   - Footer year
   - Mobile navigation drawer
   - Video share buttons (.share-fab) for YouTube and Rumble embeds
   - YouTube thumbnail resolution fallback (maxres -> hq -> sd)
   ===================================================================== */
(function () {
  "use strict";

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Mobile nav drawer */
  (function nav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.getElementById("primary-nav");
    var backdrop = document.querySelector("[data-nav-backdrop]");
    if (!toggle || !menu) return;
    function close() { menu.classList.remove("open"); if (backdrop) backdrop.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
    function open() { menu.classList.add("open"); if (backdrop) backdrop.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
    toggle.addEventListener("click", function () { menu.classList.contains("open") ? close() : open(); });
    if (backdrop) backdrop.addEventListener("click", close);
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) close(); });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) close(); });
  })();

  /* Share buttons — derive a public watch URL from the embed URL */
  function embedToWatchUrl(embedUrl) {
    if (!embedUrl) return "";
    try {
      var u = new URL(embedUrl);
      if (/rumble\.com$/.test(u.hostname) || u.hostname.indexOf("rumble") !== -1) {
        var rid = u.pathname.split("/")[2];
        return rid ? "https://rumble.com/" + rid + ".html" : embedUrl;
      }
      // YouTube
      var parts = u.pathname.split("/");
      var vid = parts[parts.length - 1].split("?")[0];
      var start = u.searchParams.get("start");
      return "https://www.youtube.com/watch?v=" + vid + (start ? "&t=" + parseInt(start, 10) + "s" : "");
    } catch (e) { return embedUrl; }
  }
  document.querySelectorAll(".share-fab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var title = btn.dataset.title || document.title;
      var url = embedToWatchUrl(btn.dataset.embed);
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          btn.title = "Link copied!";
          setTimeout(function () { btn.removeAttribute("title"); }, 1200);
        }).catch(function () { window.open(url, "_blank", "noopener"); });
      } else {
        window.open(url, "_blank", "noopener");
      }
    });
  });

  /* YouTube thumbnails.
     Not every video has a maxresdefault image. When it's missing, YouTube
     doesn't 404 — it serves a 120x90 grey "no thumbnail" placeholder with a
     200 status, so a plain onerror handler never fires. We detect that grey
     placeholder by its size on load and step down to a quality that always
     exists (sd -> hq -> mq). If somehow nothing works, show a branded panel. */
  var YT_STEPS = ["maxresdefault", "sddefault", "hqdefault", "mqdefault"];
  document.querySelectorAll('.vid-wrap img[src*="img.youtube.com"]').forEach(function (img) {
    function stepDown() {
      var m = img.src.match(/\/(\w+default)\.jpg/);
      var cur = m ? m[1] : "";
      var i = YT_STEPS.indexOf(cur);
      if (i > -1 && i < YT_STEPS.length - 1) { img.src = img.src.replace(cur + ".jpg", YT_STEPS[i + 1] + ".jpg"); return true; }
      return false;
    }
    function brand() {
      var wrap = img.closest(".vid-wrap");
      if (wrap) { wrap.classList.add("vid-wrap--brand"); img.style.display = "none"; }
    }
    function check() {
      // 120px wide == YouTube's grey "no thumbnail" placeholder
      if (img.naturalWidth && img.naturalWidth <= 120) { if (!stepDown()) brand(); }
    }
    img.addEventListener("load", check);
    img.addEventListener("error", function () { if (!stepDown()) brand(); });
    if (img.complete && img.naturalWidth) check();
  });
})();
