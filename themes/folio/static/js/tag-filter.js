document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tag-filter-button");
  const entries = document.querySelectorAll("[data-entry]");
  const yearGroups = document.querySelectorAll("[data-year-group]");

  if (!buttons.length) return;

  function applyFilter(tag) {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.tag === tag));

    entries.forEach((entry) => {
      const tags = JSON.parse(entry.dataset.tags || "[]").map((t) =>
        t.toLowerCase(),
      );
      const show = tag === "all" || tags.includes(tag);

      entry.style.display = show ? "" : "none";
    });

    // Hide empty year groups
    yearGroups.forEach((group) => {
      const visible = [...group.querySelectorAll("[data-entry]")].some(
        (e) => e.style.display !== "none",
      );

      group.style.display = visible ? "" : "none";
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.tag);
    });
  });
});
