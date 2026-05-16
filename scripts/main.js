const copy = {
  ru: {
    title: ["Создайте своё", "пространство мыслей"],
    subtitle: "лето 2026",
  },
  en: {
    title: ["Build your", "mindspace"],
    subtitle: "summer 2026",
  },
};

const videos = ["loop1", "loop2", "loop3"];
const breakpoints = [
  { name: "mobile", max: 767 },
  { name: "tablet", max: 1199 },
  { name: "desktop", max: Infinity },
];

const state = {
  variant: "",
  currentVideo: "",
  extension: supportsWebm() ? "webm" : "mp4",
  opened: false,
  openingQueued: false,
  ready: false,
};

const video = document.querySelector("[data-motion-video]");
const logo = document.querySelector(".site-logo");
const preloaderBrand = document.querySelector(".preloader__brand");
const title = document.querySelector("[data-i18n='title']");
const subtitle = document.querySelector("[data-i18n='subtitle']");
const languageToggle = document.querySelector("[data-language-toggle]");
const menu = document.querySelector(".glass-menu");
const menuGlow = document.querySelector(".glass-menu__glow");
const rippleLayer = document.querySelector(".glass-menu__ripple-layer");
const soonButton = document.querySelector(".soon-button");
const soonGlow = document.querySelector(".soon-button__glow");
const soonRippleLayer = document.querySelector(".soon-button__ripple-layer");

const canUseStorage = () => {
  try {
    localStorage.setItem("__nexyevo_test", "1");
    localStorage.removeItem("__nexyevo_test");
    return true;
  } catch {
    return false;
  }
};

const storageEnabled = canUseStorage();

const getVariant = () => breakpoints.find((item) => window.innerWidth <= item.max).name;

function supportsWebm() {
  const probe = document.createElement("video");
  return probe.canPlayType('video/webm; codecs="vp9"') !== "";
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loadStartedAt = performance.now();
const minimumLoaderTime = prefersReducedMotion ? 0 : 1900;

const getStoredLanguage = () => {
  if (!storageEnabled) return "ru";
  const stored = localStorage.getItem("nexyevo-language");
  return stored === "en" || stored === "ru" ? stored : "ru";
};

const setLanguage = (language) => {
  const currentCopy = copy[language] || copy.ru;
  title.replaceChildren(...currentCopy.title.map((line) => {
    const span = document.createElement("span");
    span.textContent = line;
    return span;
  }));
  title.dataset.language = language;
  subtitle.textContent = currentCopy.subtitle;
  document.documentElement.lang = language;
  languageToggle.dataset.currentLanguage = language;
  if (storageEnabled) {
    localStorage.setItem("nexyevo-language", language);
  }
};

const randomVideo = (previous = "") => {
  const pool = videos.length > 1 ? videos.filter((item) => item !== previous) : videos;
  return pool[Math.floor(Math.random() * pool.length)];
};

const getPosterPath = (key) => `public/assets/video/optimized/${key}-poster.jpg`;

const getVideoPath = (key, variant) => `public/assets/video/optimized/${key}-${variant}.${state.extension}`;

const playVideo = (key, reset = true) => {
  const variant = getVariant();
  const src = getVideoPath(key, variant);
  state.variant = variant;
  state.currentVideo = key;

  if (video.getAttribute("src") !== src) {
    const poster = getPosterPath(key);
    document.documentElement.style.setProperty("--motion-poster", `url("${poster}")`);
    video.poster = poster;
    video.src = src;
    video.load();
  }

  if (reset) {
    try {
      video.currentTime = 0;
    } catch {}
  }

  const playAttempt = video.play();
  if (playAttempt) {
    playAttempt.catch(() => {});
  }
};

const fallbackToMp4 = () => {
  if (state.extension !== "webm") {
    openPage();
    return;
  }

  state.extension = "mp4";
  playVideo(state.currentVideo || randomVideo(), true);
};

const setPreloaderTarget = () => {
  if (!logo || !preloaderBrand) return;

  const logoRect = logo.getBoundingClientRect();
  const brandRect = preloaderBrand.getBoundingClientRect();
  const x = logoRect.left + logoRect.width / 2 - (brandRect.left + brandRect.width / 2);
  const y = logoRect.top + logoRect.height / 2 - (brandRect.top + brandRect.height / 2);
  const scale = logoRect.width / brandRect.width;

  document.documentElement.style.setProperty("--preloader-x", `${x}px`);
  document.documentElement.style.setProperty("--preloader-y", `${y}px`);
  document.documentElement.style.setProperty("--preloader-scale", String(scale));
};

const openPage = () => {
  if (state.opened || state.openingQueued) return;

  const remaining = minimumLoaderTime - (performance.now() - loadStartedAt);
  if (remaining > 0) {
    state.openingQueued = true;
    window.setTimeout(() => {
      state.openingQueued = false;
      openPage();
    }, remaining);
    return;
  }

  state.opened = true;
  setPreloaderTarget();
  document.body.classList.add("is-opening");
  window.setTimeout(() => {
    document.body.classList.add("is-loaded");
  }, prefersReducedMotion ? 0 : 760);
};

const markVideoReady = () => {
  state.ready = true;
  video.classList.add("is-visible");
  openPage();
};

const handleVideoEnded = () => {
  playVideo(randomVideo(state.currentVideo), true);
};

const handleResize = () => {
  const nextVariant = getVariant();
  if (nextVariant === state.variant) return;
  playVideo(state.currentVideo || randomVideo(), false);
};

const createRipple = (event, target, layer, className) => {
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = className;
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  layer.append(ripple);
  window.setTimeout(() => ripple.remove(), 760);
};

const setGlow = (target, enabled) => {
  target.classList.toggle("is-glowing", enabled);
};

const clearTouchGlow = (target) => {
  window.setTimeout(() => setGlow(target, false), 140);
};

const moveGlow = (event) => {
  const rect = menu.getBoundingClientRect();
  menuGlow.style.left = `${event.clientX - rect.left}px`;
  menuGlow.style.top = `${event.clientY - rect.top}px`;
  setGlow(menu, true);
};

const moveSoonGlow = (event) => {
  const rect = soonButton.getBoundingClientRect();
  soonGlow.style.left = `${event.clientX - rect.left}px`;
  soonGlow.style.top = `${event.clientY - rect.top}px`;
  setGlow(soonButton, true);
};

languageToggle.addEventListener("click", () => {
  const next = document.documentElement.lang === "ru" ? "en" : "ru";
  setLanguage(next);
});

video.addEventListener("canplay", markVideoReady, { once: true });
video.addEventListener("loadeddata", markVideoReady, { once: true });
video.addEventListener("ended", handleVideoEnded);
video.addEventListener("error", fallbackToMp4);

menu.addEventListener("pointermove", moveGlow);
menu.addEventListener("pointerenter", moveGlow);
menu.addEventListener("pointerleave", () => setGlow(menu, false));
menu.addEventListener("pointercancel", () => setGlow(menu, false));
menu.addEventListener("pointerdown", (event) => {
  moveGlow(event);
  createRipple(event, menu, rippleLayer, "glass-menu__ripple");
});
menu.addEventListener("pointerup", (event) => {
  if (event.pointerType === "touch") clearTouchGlow(menu);
});
soonButton.addEventListener("pointermove", moveSoonGlow);
soonButton.addEventListener("pointerenter", moveSoonGlow);
soonButton.addEventListener("pointerleave", () => setGlow(soonButton, false));
soonButton.addEventListener("pointercancel", () => setGlow(soonButton, false));
soonButton.addEventListener("pointerdown", (event) => {
  moveSoonGlow(event);
  createRipple(event, soonButton, soonRippleLayer, "soon-button__ripple");
});
soonButton.addEventListener("pointerup", (event) => {
  if (event.pointerType === "touch") clearTouchGlow(soonButton);
});

let resizeTimer = 0;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(handleResize, 160);
});

setLanguage(getStoredLanguage());
playVideo(randomVideo(), true);

window.setTimeout(openPage, prefersReducedMotion ? 0 : 3200);
