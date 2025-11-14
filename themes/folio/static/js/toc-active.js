d<script src="/js/toc-active.js"></script>ocument.addEventListener("DOMContentLoaded", () => {
  const headings = document.querySelectorAll("h1, h2, h3");
  const tocLinks = document.querySelectorAll(".floating-toc a");

  if (!headings.length || !tocLinks.length) return;

  const observe = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let id = entry.target.getAttribute("id");
          tocLinks.forEach((link) => {
            link.parentElement.classList.remove("active-section");
            if (link.getAttribute("href") === "#" + id) {
              link.parentElement.classList.add("active-section");
            }
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );

  headings.forEach((h) => observe.observe(h));
});
