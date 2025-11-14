(function () {
  let lastState = null; // last known track info from backend
  let lastActive = 0; // timestamp of last "isPlaying:true"
  const GRACE_PERIOD = 15000; // 15 seconds
  const CACHE_URL = "http://127.0.0.1:3000/api/spotify-cache";

  // Load last saved state from localStorage (survives refresh)
  const stored = localStorage.getItem("spotify_last_state");
  if (stored) {
    try {
      lastState = JSON.parse(stored);
    } catch (_) {}
  }

  async function update(element) {
    try {
      const npEndpoint = element.getAttribute("data-endpoint");
      const r = await fetch(npEndpoint, { cache: "no-store" });
      const data = await r.json();
      const now = Date.now();

      // ============== CASE 1: ACTUALLY PLAYING ==============
      if (data && data.isPlaying) {
        lastActive = now;
        lastState = { track: data.track, artist: data.artist };

        localStorage.setItem("spotify_last_state", JSON.stringify(lastState));

        element.textContent =
          "Now playing: " + data.track + " — " + data.artist;
        return;
      }

      // ========== CASE 2: GRACE PERIOD (avoid flicker) =======
      if (lastState && now - lastActive < GRACE_PERIOD) {
        element.textContent =
          "Now playing: " + lastState.track + " — " + lastState.artist;
        return;
      }

      // ========== CASE 3: TRY BACKEND CACHE ==================
      try {
        const r2 = await fetch(CACHE_URL, { cache: "no-store" });
        const cache = await r2.json();

        if (cache && cache.track) {
          element.textContent =
            "Last played: " + cache.track + " — " + cache.artist;

          // Save for offline
          localStorage.setItem("spotify_last_state", JSON.stringify(cache));
          return;
        }
      } catch (_) {
        // backend cache unreachable → ignore
      }

      // ========== CASE 4: FALLBACK TO localStorage ===========
      if (lastState) {
        element.textContent =
          "Last played: " + lastState.track + " — " + lastState.artist;
        return;
      }

      // ========== CASE 5: NOTHING AVAILABLE ==================
      element.textContent = "";
    } catch (err) {
      // Full fallback
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
    setInterval(() => update(el), 8000);
  });
})();
