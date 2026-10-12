document.getElementById("year").textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Running timecode in the hero (HH:MM:SS:FF at 30fps)
const timecode = document.getElementById("timecode");
if (timecode && !reducedMotion) {
  const start = performance.now();
  const pad = n => String(n).padStart(2, "0");
  let lastFrame = -1;

  function tick(now) {
    const frames = Math.floor((now - start) / (1000 / 30));
    if (frames !== lastFrame) {
      lastFrame = frames;
      const s = Math.floor(frames / 30);
      timecode.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 30)}`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Fade sections in on scroll
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("is-visible"));
}

// Close the mobile menu after picking a link
const nav = document.getElementById("nav");
nav.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => bootstrap.Collapse.getInstance(nav)?.hide());
});

// Discord has no profile link, so clicking the handle copies it
document.querySelectorAll(".copy").forEach(btn => {
  const label = btn.textContent;
  btn.addEventListener("click", () => {
    navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = label; }, 1500);
    });
  });
});
