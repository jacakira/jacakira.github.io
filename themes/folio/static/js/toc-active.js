// static/js/toc-active.js

document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = document.querySelectorAll(".floating-toc a");
  const headers = [...document.querySelectorAll("h1, h2, h3, h4")];

  if (!tocLinks.length || !headers.length) return;

  // Map heading tag to numeric level
  function headerLevel(el) {
    switch (el.tagName) {
      case "H1":
        return 1;
      case "H2":
        return 2;
      case "H3":
        return 3;
      case "H4":
        return 4;
      default:
        return 10;
    }
  }

  function updateActive() {
    const offset = window.scrollY + 120; // same offset as before
    let currentIndex = 0;

    // Find last heading whose top is above the offset
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].offsetTop <= offset) {
        currentIndex = i;
      } else {
        break;
      }
    }

    let current = headers[currentIndex];

    // 1) Try to find a link that matches this heading exactly
    let activeId = current.getAttribute("id");
    let activeLink =
      activeId &&
      document.querySelector('.floating-toc a[href="#' + activeId + '"]');

    // 2) If no matching TOC entry (e.g. current is H4), walk backwards
    //    to the nearest H2/H3 that *does* have a TOC link.
    if (!activeLink) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const h = headers[i];
        const lvl = headerLevel(h);

        // Only consider levels that actually appear in the TOC.
        // If your TOC includes H2 & H3 only, this is correct.
        if (lvl > 3) continue;

        const id = h.getAttribute("id");
        if (!id) continue;

        const candidate = document.querySelector(
          '.floating-toc a[href="#' + id + '"]',
        );
        if (candidate) {
          activeId = id;
          activeLink = candidate;
          break;
        }
      }
    }

    // 3) If still nothing, don't highlight anything
    if (!activeLink) return;

    // 4) Clear all and highlight the chosen one
    tocLinks.forEach((a) => a.classList.remove("active"));
    activeLink.classList.add("active");
  }

  updateActive();
  window.addEventListener("scroll", updateActive);
});
