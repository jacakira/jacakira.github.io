// themes/folio/static/js/spotify-now-playing.js
(function () {
  let lastState = null;
  let lastActive = 0;
  const GRACE_PERIOD = 15000;

  // Restore from localStorage
  const stored = localStorage.getItem("spotify_last_state");
  if (stored) {
    try {
      lastState = JSON.parse(stored);
    } catch (_) {
      lastState = null;
    }
  }

  function setDisplay(element, label, url) {
    element.innerHTML = ""; // clear content

    const a = document.createElement("a");
    a.className = "now-playing-link";
    a.textContent = label;

    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    element.appendChild(a);
  }

  async function update(element) {
    const nowEndpoint = element.getAttribute("data-now-endpoint");
    const lastEndpoint = element.getAttribute("data-last-endpoint");
    const now = Date.now();

    try {
      // ===== 1. Try now-playing endpoint =====
      if (nowEndpoint) {
        const r = await fetch(nowEndpoint, { cache: "no-store" });
        const data = await r.json();

        if (data && data.isPlaying) {
          lastActive = now;
          lastState = {
            track: data.track,
            artist: data.artist,
            url: data.url,
          };
          localStorage.setItem("spotify_last_state", JSON.stringify(lastState));

          setDisplay(
            element,
            "Now playing: " + data.track + " — " + data.artist,
            data.url,
          );
          return;
        }
      }

      // ===== 2. Grace period =====
      if (lastState && now - lastActive < GRACE_PERIOD) {
        setDisplay(
          element,
          "Now playing: " + lastState.track + " — " + lastState.artist,
          lastState.url,
        );
        return;
      }

      // ===== 3. Last-played endpoint =====
      if (lastEndpoint) {
        try {
          const r2 = await fetch(lastEndpoint, { cache: "no-store" });
          const cache = await r2.json();

          if (cache && cache.track) {
            lastState = {
              track: cache.track,
              artist: cache.artist,
              url: cache.url,
            };

            localStorage.setItem(
              "spotify_last_state",
              JSON.stringify(lastState),
            );

            setDisplay(
              element,
              "Last played: " + cache.track + " — " + cache.artist,
              cache.url,
            );
            return;
          }
        } catch (_) {}
      }

      // ===== 4. LocalStorage fallback =====
      if (lastState) {
        setDisplay(
          element,
          "Last played: " + lastState.track + " — " + lastState.artist,
          lastState.url,
        );
        return;
      }

      // ===== 5. Nothing =====
      element.textContent = "";
    } catch (_) {
      if (lastState) {
        setDisplay(
          element,
          "Last played: " + lastState.track + " — " + lastState.artist,
          lastState.url,
        );
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const el = document.querySelector("[data-now-playing]");
    if (!el) return;

    update(el);
    setInterval(() => update(el), 8000);
  });
})();
