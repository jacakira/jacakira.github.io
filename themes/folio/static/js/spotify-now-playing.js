// themes/folio/static/js/spotify-now-playing.js
(function () {
  let lastState = null; // last known track info
  let lastActive = 0; // timestamp when we last saw isPlaying=true
  const GRACE_PERIOD = 15000; // 15 seconds

  // Restore from localStorage (persists between page loads)
  const stored = localStorage.getItem("spotify_last_state");
  if (stored) {
    try {
      lastState = JSON.parse(stored);
    } catch (_) {
      lastState = null;
    }
  }

  async function update(element) {
    const nowEndpoint = element.getAttribute("data-now-endpoint");
    const lastEndpoint = element.getAttribute("data-last-endpoint");
    const now = Date.now();

    try {
      // ===== 1. Try "now playing" =====
      if (nowEndpoint) {
        const r = await fetch(nowEndpoint, { cache: "no-store" });
        const data = await r.json();

        if (data && data.isPlaying) {
          lastActive = now;
          lastState = { track: data.track, artist: data.artist };

          localStorage.setItem("spotify_last_state", JSON.stringify(lastState));

          element.textContent =
            "Now playing: " + data.track + " — " + data.artist;
          return;
        }
      }

      // ===== 2. Grace period: still show last track briefly =====
      if (lastState && now - lastActive < GRACE_PERIOD) {
        element.textContent =
          "Now playing: " + lastState.track + " — " + lastState.artist;
        return;
      }

      // ===== 3. Query "last played" from backend =====
      if (lastEndpoint) {
        try {
          const r2 = await fetch(lastEndpoint, { cache: "no-store" });
          const cache = await r2.json();

          if (cache && cache.track) {
            const track = cache.track;
            const artist = cache.artist;

            element.textContent = "Last played: " + track + " — " + artist;

            localStorage.setItem(
              "spotify_last_state",
              JSON.stringify({ track, artist }),
            );
            return;
          }
        } catch (_) {
          // ignore, fall back below
        }
      }

      // ===== 4. Fallback to localStorage only =====
      if (lastState) {
        element.textContent =
          "Last played: " + lastState.track + " — " + lastState.artist;
        return;
      }

      // ===== 5. Nothing to show =====
      element.textContent = "";
    } catch (err) {
      // On any error, fallback to cached state if we have one
      if (lastState) {
        element.textContent =
          "Last played: " + lastState.track + " — " + lastState.artist;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const el = document.querySelector("[data-now-playing]");
    if (!el) return;

    update(el);
    setInterval(function () {
      update(el);
    }, 8000);
  });
})();
