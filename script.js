const root = document.documentElement;
const body = document.body;
const siteShell = document.querySelector("#site-shell");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const motionToggle = document.querySelector(".motion-toggle");
const tiltNodes = [...document.querySelectorAll("[data-tilt]")];
const revealNodes = [...document.querySelectorAll("[data-reveal]")];
const magneticNodes = [...document.querySelectorAll("[data-magnetic]")];
const galleryLinks = [...document.querySelectorAll("[data-lightbox-src]")];
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector("#lightbox-title");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxSource = document.querySelector(".lightbox-source");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileMenuMedia = window.matchMedia("(max-width: 920px)");
const motionStorageKey = "catrinar-v6-motion";
const focusableSelector = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

let explicitMotionPreference = readMotionPreference();
let lightboxOpener = null;
let menuWasOpenedByKeyboard = false;
let revealObserver = null;

function safeStorage(method, key, value) {
  try {
    if (!("localStorage" in window)) {
      return null;
    }

    if (method === "get") {
      return window.localStorage.getItem(key);
    }

    if (method === "set") {
      window.localStorage.setItem(key, value);
      return value;
    }

    if (method === "remove") {
      window.localStorage.removeItem(key);
    }
  } catch {
    return null;
  }

  return null;
}

function readMotionPreference() {
  const stored = safeStorage("get", motionStorageKey);
  return stored === "on" || stored === "off" ? stored : null;
}

function writeMotionPreference(value) {
  if (value === null) {
    safeStorage("remove", motionStorageKey);
    return;
  }

  safeStorage("set", motionStorageKey, value);
}

function getEffectiveMotion() {
  if (explicitMotionPreference === "on") {
    return true;
  }

  if (explicitMotionPreference === "off") {
    return false;
  }

  return !prefersReducedMotion.matches;
}

function clearInteractiveMotion() {
  tiltNodes.forEach((node) => {
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  });

  magneticNodes.forEach((node) => {
    const content = node.querySelector(".button-content");
    content?.style.setProperty("--magnetic-x", "0px");
    content?.style.setProperty("--magnetic-y", "0px");
  });

  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

function updateMotionToggle(enabled) {
  if (!motionToggle) {
    return;
  }

  motionToggle.textContent = enabled ? "Turn motion off" : "Turn motion on";
  motionToggle.setAttribute("aria-pressed", String(!enabled));
}

function refreshRevealObserver() {
  revealObserver?.disconnect();
  revealObserver = null;

  if (!getEffectiveMotion() || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealNodes.forEach((node) => {
    if (!node.classList.contains("is-visible")) {
      revealObserver?.observe(node);
    }
  });
}

function applyMotionState() {
  const enabled = getEffectiveMotion();
  root.dataset.motion = enabled ? "on" : "off";
  updateMotionToggle(enabled);

  if (!enabled) {
    clearInteractiveMotion();
  }

  refreshRevealObserver();
}

function isMobileMenu() {
  return mobileMenuMedia.matches;
}

function setMenuOpen(open, { restoreFocus = false } = {}) {
  if (!menuToggle || !siteNav) {
    return;
  }

  const nextOpen = isMobileMenu() ? open : false;
  body.classList.toggle("menu-open", nextOpen);
  menuToggle.setAttribute("aria-expanded", String(nextOpen));
  menuToggle.setAttribute(
    "aria-label",
    nextOpen ? "Close navigation menu" : "Open navigation menu"
  );

  if (root.classList.contains("js") && isMobileMenu()) {
    siteNav.hidden = !nextOpen;
  } else {
    siteNav.hidden = false;
  }

  if (nextOpen) {
    const firstFocusable = siteNav.querySelector(focusableSelector);
    firstFocusable?.focus();
  } else if (restoreFocus && menuWasOpenedByKeyboard) {
    menuToggle.focus();
  }
}

function syncMenuState() {
  if (!menuToggle || !siteNav) {
    return;
  }

  if (!isMobileMenu()) {
    body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    siteNav.hidden = false;
    return;
  }

  siteNav.hidden = !body.classList.contains("menu-open");
}

function isLightboxOpen() {
  return Boolean(lightbox && lightbox.hasAttribute("open"));
}

function setBackgroundInert(active) {
  if (!siteShell) {
    return;
  }

  if ("inert" in siteShell) {
    siteShell.inert = active;
    return;
  }

  siteShell.setAttribute("aria-hidden", active ? "true" : "false");
}

function getLightboxFocusables() {
  return lightbox ? [...lightbox.querySelectorAll(focusableSelector)] : [];
}

function openLightbox(link) {
  if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxSource) {
    return;
  }

  lightboxOpener = document.activeElement instanceof HTMLElement ? document.activeElement : link;
  lightboxImage.src = link.dataset.lightboxSrc || link.getAttribute("href") || "";
  lightboxImage.alt = link.dataset.lightboxAlt || "";
  lightboxTitle.textContent = link.dataset.lightboxTitle || "Image preview";
  lightboxSource.href = link.getAttribute("href") || lightboxImage.src;

  if (typeof lightbox.showModal === "function") {
    if (!lightbox.open) {
      lightbox.showModal();
    }
  } else {
    lightbox.setAttribute("open", "");
  }

  body.classList.add("lightbox-open");
  setBackgroundInert(true);
  lightboxClose?.focus();
}

function closeLightbox({ restoreFocus = true } = {}) {
  if (!lightbox || !isLightboxOpen()) {
    return;
  }

  if (typeof lightbox.close === "function") {
    lightbox.close();
  } else {
    lightbox.removeAttribute("open");
  }

  body.classList.remove("lightbox-open");
  setBackgroundInert(false);

  if (restoreFocus && lightboxOpener instanceof HTMLElement) {
    lightboxOpener.focus();
  }
}

menuToggle?.addEventListener("click", () => {
  menuWasOpenedByKeyboard = document.activeElement === menuToggle;
  setMenuOpen(!body.classList.contains("menu-open"));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

motionToggle?.addEventListener("click", () => {
  explicitMotionPreference = getEffectiveMotion() ? "off" : "on";
  writeMotionPreference(explicitMotionPreference);
  applyMotionState();
});

tiltNodes.forEach((node) => {
  node.addEventListener("pointermove", (event) => {
    if (!getEffectiveMotion()) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--tilt-x", `${-offsetY * 8}deg`);
    node.style.setProperty("--tilt-y", `${offsetX * 10}deg`);
  });

  node.addEventListener("pointerleave", () => {
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  });
});

magneticNodes.forEach((node) => {
  const content = node.querySelector(".button-content");
  if (!content) {
    return;
  }

  node.addEventListener("pointermove", (event) => {
    if (!getEffectiveMotion()) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    content.style.setProperty("--magnetic-x", `${offsetX.toFixed(2)}px`);
    content.style.setProperty("--magnetic-y", `${offsetY.toFixed(2)}px`);
  });

  node.addEventListener("pointerleave", () => {
    content.style.setProperty("--magnetic-x", "0px");
    content.style.setProperty("--magnetic-y", "0px");
  });
});

galleryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!lightbox) {
      return;
    }

    event.preventDefault();
    openLightbox(link);
  });
});

lightboxClose?.addEventListener("click", () => closeLightbox());
lightbox?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeLightbox();
});
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});
lightbox?.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    const focusables = getLightboxFocusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (isLightboxOpen()) {
      closeLightbox();
      return;
    }

    if (body.classList.contains("menu-open")) {
      setMenuOpen(false, { restoreFocus: true });
    }
  }
});

prefersReducedMotion.addEventListener("change", () => {
  if (explicitMotionPreference === null) {
    applyMotionState();
  }
});

mobileMenuMedia.addEventListener("change", () => {
  if (!mobileMenuMedia.matches) {
    body.classList.remove("menu-open");
  }

  syncMenuState();
});

window.addEventListener("resize", syncMenuState);

applyMotionState();
syncMenuState();
