const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const motionToggle = document.querySelector(".motion-toggle");
const tiltNodes = document.querySelectorAll("[data-tilt]");
const galleryButtons = document.querySelectorAll("[data-lightbox-src]");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector("#lightbox-title");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxBackdrop = document.querySelector("[data-close-lightbox]");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionStorageKey = "catrinar-v6-motion";

function setMotionState(enabled) {
  body.dataset.motion = enabled ? "on" : "off";
  motionToggle.textContent = enabled ? "Motion on" : "Motion off";
  motionToggle.setAttribute("aria-pressed", String(!enabled));
  localStorage.setItem(motionStorageKey, enabled ? "on" : "off");
}

function initializeMotion() {
  const saved = localStorage.getItem(motionStorageKey);
  if (saved === "off" || (!saved && prefersReducedMotion.matches)) {
    setMotionState(false);
    return;
  }
  setMotionState(true);
}

function closeMenu() {
  body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function openLightbox(button) {
  lightboxImage.src = button.dataset.lightboxSrc;
  lightboxImage.alt = button.dataset.lightboxAlt;
  lightboxTitle.textContent = button.dataset.lightboxTitle;
  lightbox.hidden = false;
  body.classList.add("lightbox-open");
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  body.classList.remove("lightbox-open");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

motionToggle?.addEventListener("click", () => {
  const enabled = body.dataset.motion !== "on";
  setMotionState(enabled);
});

tiltNodes.forEach((node) => {
  node.addEventListener("pointermove", (event) => {
    if (body.dataset.motion !== "on") {
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

galleryButtons.forEach((button) => {
  button.addEventListener("click", () => openLightbox(button));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxBackdrop?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    if (!lightbox.hidden) {
      closeLightbox();
    }
  }
});

prefersReducedMotion.addEventListener("change", (event) => {
  if (localStorage.getItem(motionStorageKey) === null) {
    setMotionState(!event.matches);
  }
});

initializeMotion();
