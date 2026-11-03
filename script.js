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
const io = "IntersectionObserver" in window && !reducedMotion
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 })
  : null;

function reveal(el) {
  if (io) io.observe(el);
  else el.classList.add("is-visible");
}
document.querySelectorAll(".reveal").forEach(reveal);

// Work grid: built from videos.json. Title + channel come from YouTube's oEmbed endpoint.
const videoGrid = document.getElementById("video-grid");

// Accepts a bare ID or any YouTube URL (youtu.be/…, watch?v=…, shorts/…)
function parseVideoId(value) {
  const m = String(value).trim().match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : String(value).trim();
}

async function fetchVideoInfo(id) {
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`;
    const res = await fetch(url);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

// maxresdefault doesn't exist for every video; YouTube then serves a 120x90 grey placeholder
function setThumbnail(el, id) {
  const hq = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const max = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  el.style.backgroundImage = `url(${hq})`;
  const img = new Image();
  img.onload = () => { if (img.naturalWidth > 120) el.style.backgroundImage = `url(${max})`; };
  img.src = max;
}

function buildClip(video, info) {
  const col = document.createElement("div");
  col.className = "col-md-6 reveal";

  const link = document.createElement("a");
  link.className = "clip";
  link.href = `https://youtu.be/${video.id}`;
  link.target = "_blank";
  link.rel = "noopener";

  const thumb = document.createElement("div");
  thumb.className = "thumb ratio ratio-16x9";
  setThumbnail(thumb, video.id);
  if (video.duration) {
    const dur = document.createElement("span");
    dur.className = "duration small-text";
    dur.textContent = video.duration;
    thumb.append(dur);
  }

  const title = document.createElement("h3");
  title.textContent = video.title || info.title || "Watch on YouTube";

  const meta = document.createElement("p");
  meta.className = "meta";
  const watch = document.createElement("span");
  watch.textContent = "Watch";
  meta.append(video.channel || info.author_name || "", watch);

  link.append(thumb, title, meta);
  col.append(link);
  return col;
}

async function loadVideos() {
  if (!videoGrid) return;
  try {
    const res = await fetch("videos.json", { cache: "no-cache" });
    const config = await res.json();

    // Each entry can be "VIDEO_ID", a URL, or { "id": "...", "channel": "...", "duration": "..." }
    const videos = (config.videos || [])
      .map(v => (typeof v === "string" ? { id: v } : { ...v }))
      .map(v => ({ ...v, id: parseVideoId(v.id) }))
      .filter(v => v.id);

    // The JSON is oldest -> newest (add new videos at the bottom)
    if (config.newestFirst !== false) videos.reverse();

    const infos = await Promise.all(videos.map(v => fetchVideoInfo(v.id)));
    videos.forEach((v, i) => {
      const clip = buildClip(v, infos[i]);
      videoGrid.append(clip);
      reveal(clip);
    });
  } catch (err) {
    console.error("Could not load videos.json", err);
  }
}
loadVideos();

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
