const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;


/* Portfolio game entry */
const entryScreen = document.getElementById("entry-screen");
const entryPrompt = document.getElementById("entry-prompt");
const missionPanel = document.getElementById("mission-panel");
const playIntro = document.getElementById("play-intro");
const skipIntro = document.getElementById("skip-intro");
const missionSkip = document.getElementById("mission-skip");
const missionCards = [...document.querySelectorAll(".mission-card")];

const setPortfolioLive = () => {
  document.body.classList.remove("game-locked");
  document.body.classList.add("portfolio-live");
};

const showAccessToast = (message = "ACCESS GRANTED // WELCOME") => {
  const toast = document.createElement("div");
  toast.className = "access-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 250);
  }, 1500);
};

const unlockPortfolio = (message, targetId = "") => {
  try { sessionStorage.setItem("cnaPortfolioUnlockedV2", "1"); } catch (_) {}
  setPortfolioLive();

  if (entryScreen) {
    entryScreen.classList.add("is-hidden");
    window.setTimeout(() => {
      entryScreen.hidden = true;
    }, prefersReducedMotion ? 0 : 560);
  }

  showAccessToast(message);

  if (targetId) {
    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }, prefersReducedMotion ? 20 : 650);
  }
};

let alreadyUnlocked = false;
try { alreadyUnlocked = sessionStorage.getItem("cnaPortfolioUnlockedV2") === "1"; } catch (_) {}
if (alreadyUnlocked) {
  if (entryScreen) entryScreen.hidden = true;
  setPortfolioLive();
}

if (playIntro) {
  playIntro.addEventListener("click", () => {
    if (entryPrompt) entryPrompt.hidden = true;
    if (missionPanel) missionPanel.hidden = false;
    missionCards[0]?.focus();
  });
}

if (skipIntro) {
  skipIntro.addEventListener("click", () => unlockPortfolio("PORTFOLIO UNLOCKED // FULL ACCESS"));
}

if (missionSkip) {
  missionSkip.addEventListener("click", () => unlockPortfolio("PORTFOLIO UNLOCKED // FULL ACCESS"));
}

missionCards.forEach((card) => {
  card.addEventListener("click", () => {
    const targetId = card.dataset.target || "work";
    const label = card.dataset.label || "SELECTED PATH";
    unlockPortfolio(`MISSION SELECTED // ${label}`, targetId);
  });
});

/* Lightweight game HUD and section tracking */
const siteHeader = document.querySelector(".site-header");
const hudProgress = document.getElementById("hud-progress");
const hudPercent = document.getElementById("hud-percent");
const navItems = [...document.querySelectorAll(".nav-links a[href^='#']")];
const trackedSections = navItems
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const updateGameHUD = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  if (hudProgress) hudProgress.style.transform = `scaleX(${ratio})`;
  if (hudPercent) {\n    const percent = Math.round(ratio * 100);\n    hudPercent.textContent = percent >= 100 ? "Still more to go with experience" : `${String(percent).padStart(2, "0")}%`;\n  }
  if (siteHeader) siteHeader.classList.toggle("scrolled", window.scrollY > 24);

  let currentId = "";
  trackedSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150) currentId = section.id;
  });
  navItems.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
  });
};

updateGameHUD();
window.addEventListener("scroll", updateGameHUD, { passive: true });
window.addEventListener("resize", updateGameHUD);

if (!prefersReducedMotion && finePointer) {
  let lastTrail = 0;
  window.addEventListener("mousemove", (event) => {
    const now = performance.now();
    if (now - lastTrail < 42) return;
    lastTrail = now;
    const particle = document.createElement("span");
    particle.className = "cursor-particle";
    particle.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    document.body.appendChild(particle);
    window.setTimeout(() => particle.remove(), 560);
  }, { passive: true });

  document.addEventListener("pointerdown", (event) => {
    const burst = document.createElement("span");
    burst.className = "click-burst";
    burst.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), 520);
  });
}

const revealItems = [...document.querySelectorAll(".reveal")];

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

/* Scroll progress */
const progress = document.createElement("div");
progress.className = "scroll-progress";
progress.setAttribute("aria-hidden", "true");
document.body.appendChild(progress);

const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progress.style.transform = `scaleX(${ratio})`;
};

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

/* Single custom cursor: outer ring + inner dot */
if (!prefersReducedMotion && finePointer) {
  const aura = document.createElement("div");
  aura.className = "mouse-aura";
  aura.setAttribute("aria-hidden", "true");

  const cursorRing = document.createElement("div");
  cursorRing.className = "cursor-ring";
  cursorRing.setAttribute("aria-hidden", "true");

  const cursorDot = document.createElement("div");
  cursorDot.className = "cursor-dot";
  cursorDot.setAttribute("aria-hidden", "true");

  document.body.append(aura, cursorRing, cursorDot);
  document.body.classList.add("cursor-custom-ready");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let auraX = mouseX;
  let auraY = mouseY;

  const animateCursor = () => {
    ringX += (mouseX - ringX) * 0.22;
    ringY += (mouseY - ringY) * 0.22;
    auraX += (mouseX - auraX) * 0.075;
    auraY += (mouseY - auraY) * 0.075;

    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    aura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(animateCursor);
  };

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.body.classList.add("cursor-active");
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    document.body.classList.remove("cursor-active");
  });

  document.documentElement.addEventListener("mouseenter", () => {
    document.body.classList.add("cursor-active");
  });

  document.addEventListener("pointerdown", () => {
    document.body.classList.add("cursor-pressed");
  });

  document.addEventListener("pointerup", () => {
    document.body.classList.remove("cursor-pressed");
  });

  const interactiveSelector = "a, button, .project-card, .skill-card, .principle-card, .stat-card, .principle-list article, .mission-card";
  document.querySelectorAll(interactiveSelector).forEach((element) => {
    element.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    element.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });

  animateCursor();
}

/* Soft 3D tilt + cursor-position glow for cards */
if (!prefersReducedMotion && finePointer) {
  const tiltCards = document.querySelectorAll(
    ".project-card, .skill-card, .principle-card, .stat-card, .principle-list article"
  );

  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const rotateY = (px - 0.5) * 5;
      const rotateX = (0.5 - py) * 5;

      card.style.setProperty("--card-x", `${px * 100}%`);
      card.style.setProperty("--card-y", `${py * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.removeProperty("--card-x");
      card.style.removeProperty("--card-y");
    });
  });
}

/* Slight magnetic movement on primary actions */
if (!prefersReducedMotion && finePointer) {
  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12 - 2}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}


/* Portfolio pet playground */
(() => {
  const playground = document.createElement("div");
  playground.className = "pet-playground";
  playground.setAttribute("aria-hidden", "true");
  playground.innerHTML = `
    <div class="pet-lane"></div>
    <div class="pet pet-dog" id="pet-dog"><span class="pet-body">🐕</span></div>
    <div class="pet pet-cat" id="pet-cat"><span class="pet-body">🐈</span></div>
    <div class="pet-hint">click to toss the ball</div>
  `;
  document.body.appendChild(playground);

  const dog = playground.querySelector("#pet-dog");
  const cat = playground.querySelector("#pet-cat");
  const hint = playground.querySelector(".pet-hint");
  let lastBallTime = 0;

  const updatePetState = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    playground.classList.toggle("near-finish", ratio > 0.965);
  };

  updatePetState();
  window.addEventListener("scroll", updatePetState, { passive: true });
  window.addEventListener("resize", updatePetState);

  if (!prefersReducedMotion && finePointer) {
    document.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("portfolio-live")) return;
      if (event.button !== 0) return;

      const now = performance.now();
      if (now - lastBallTime < 650) return;
      lastBallTime = now;

      const ball = document.createElement("span");
      ball.className = "pet-ball";
      ball.style.setProperty("--ball-start-x", `${event.clientX}px`);
      ball.style.setProperty("--ball-start-y", `${event.clientY}px`);
      ball.style.setProperty("--ball-end-x", `${Math.max(36, Math.min(window.innerWidth - 36, event.clientX))}px`);
      playground.appendChild(ball);

      if (hint) hint.classList.add("hidden");

      const dogTarget = Math.max(24, Math.min(window.innerWidth - 76, event.clientX - 28));
      dog?.classList.add("chasing");
      dog?.style.setProperty("--dog-chase-x", `${dogTarget}px`);

      window.setTimeout(() => {
        dog?.classList.remove("chasing");
        dog?.style.removeProperty("--dog-chase-x");
      }, 1250);

      window.setTimeout(() => ball.remove(), 1300);
    });
  }
})();
