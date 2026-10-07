const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;


/* Portfolio game entry */
const entryScreen = document.getElementById("entry-screen");
const entryPrompt = document.getElementById("entry-prompt");
const companionPanel = document.getElementById("companion-panel");
const companionSkip = document.getElementById("companion-skip");
const companionCards = [...document.querySelectorAll(".companion-card")];
const missionPanel = document.getElementById("mission-panel");
const playIntro = document.getElementById("play-intro");
const skipIntro = document.getElementById("skip-intro");
const missionSkip = document.getElementById("mission-skip");
const missionCards = [...document.querySelectorAll(".mission-card")];

const applyCompanionMode = (mode = "pets") => {
  const normalized = mode === "car" ? "car" : "pets";
  document.body.classList.toggle("experience-car", normalized === "car");
  document.body.classList.toggle("experience-pets", normalized === "pets");
  try { sessionStorage.setItem("cnaCompanionMode", normalized); } catch (_) {}
  return normalized;
};

let savedCompanionMode = "pets";
try { savedCompanionMode = sessionStorage.getItem("cnaCompanionMode") || "pets"; } catch (_) {}
applyCompanionMode(savedCompanionMode);

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
  try { sessionStorage.setItem("cnaPortfolioUnlockedV3", "1"); } catch (_) {}
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
try { alreadyUnlocked = sessionStorage.getItem("cnaPortfolioUnlockedV3") === "1"; } catch (_) {}
if (alreadyUnlocked) {
  if (entryScreen) entryScreen.hidden = true;
  setPortfolioLive();
}

if (playIntro) {
  playIntro.addEventListener("click", () => {
    if (entryPrompt) entryPrompt.hidden = true;
    if (companionPanel) companionPanel.hidden = false;
    companionCards[0]?.focus();
  });
}

companionCards.forEach((card) => {
  card.addEventListener("click", () => {
    applyCompanionMode(card.dataset.mode || "pets");
    if (companionPanel) companionPanel.hidden = true;
    if (missionPanel) missionPanel.hidden = false;
    missionCards[0]?.focus();
  });
});

if (companionSkip) {
  companionSkip.addEventListener("click", () => {
    applyCompanionMode("pets");
    if (companionPanel) companionPanel.hidden = true;
    if (missionPanel) missionPanel.hidden = false;
    missionCards[0]?.focus();
  });
}

if (skipIntro) {
  skipIntro.addEventListener("click", () => {
    applyCompanionMode(savedCompanionMode || "pets");
    unlockPortfolio("PORTFOLIO UNLOCKED // FULL ACCESS");
  });
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
    <div class="pet-hint">move near a pet and click to shoot the ball</div>
  `;
  document.body.appendChild(playground);

  const dog = playground.querySelector("#pet-dog");
  const cat = playground.querySelector("#pet-cat");
  const hint = playground.querySelector(".pet-hint");
  let lastBallTime = 0;
  let lastPawTime = 0;
  let nearFinish = false;
  let celebrated = false;
  let scrollTimer = 0;

  const spawnPaw = (pet, rotate = 0) => {
    if (!pet || !document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-pets")) return;
    const rect = pet.getBoundingClientRect();
    const paw = document.createElement("span");
    paw.className = "pet-paw";
    paw.textContent = "•";
    paw.style.left = `${Math.max(12, Math.min(window.innerWidth - 12, rect.left + rect.width / 2))}px`;
    paw.style.setProperty("--paw-rotate", `${rotate}deg`);
    playground.appendChild(paw);
    window.setTimeout(() => paw.remove(), 1950);
  };

  const spawnSparkBurst = (x, y, count = 8) => {
    if (prefersReducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "pet-spark";
      const angle = (Math.PI * 2 * i) / count;
      const distance = 18 + (i % 3) * 9;
      spark.style.setProperty("--spark-x", `${x}px`);
      spark.style.setProperty("--spark-y", `${y}px`);
      spark.style.setProperty("--spark-dx", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-dy", `${Math.sin(angle) * distance - 12}px`);
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 820);
    }
  };

  const showEmote = (pet, value) => {
    if (!pet) return;
    const emote = document.createElement("span");
    emote.className = "pet-emote";
    emote.textContent = value;
    const rect = pet.getBoundingClientRect();
    emote.style.left = `${Math.max(10, Math.min(window.innerWidth - 54, rect.left))}px`;
    playground.appendChild(emote);
    window.setTimeout(() => emote.remove(), 1200);
  };

  const celebrateFinish = () => {
    if (celebrated || prefersReducedMotion) return;
    celebrated = true;
    playground.classList.add("celebrate");
    const dogRect = dog?.getBoundingClientRect();
    const catRect = cat?.getBoundingClientRect();
    if (dogRect) spawnSparkBurst(dogRect.left + dogRect.width / 2, window.innerHeight - 34, 10);
    if (catRect) spawnSparkBurst(catRect.left + catRect.width / 2, window.innerHeight - 34, 10);
    showEmote(dog, "★");
    showEmote(cat, "★");
    window.setTimeout(() => playground.classList.remove("celebrate"), 2300);
  };

  const updatePetState = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    nearFinish = ratio > 0.965;
    playground.classList.toggle("near-finish", nearFinish);
    if (nearFinish) celebrateFinish();
    if (!nearFinish && ratio < 0.92) celebrated = false;
  };

  updatePetState();
  window.addEventListener("scroll", () => {
    updatePetState();
    playground.classList.add("scrolling");
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => playground.classList.remove("scrolling"), 180);

    const now = performance.now();
    if (!nearFinish && now - lastPawTime > 760) {
      lastPawTime = now;
      spawnPaw(dog, -8);
      window.setTimeout(() => spawnPaw(cat, 8), 180);
    }
  }, { passive: true });
  window.addEventListener("resize", updatePetState);

  if (!prefersReducedMotion && finePointer) {
    const runIdleAction = () => {
      if (!document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-pets") || nearFinish) return;
      if (Math.random() > .5) {
        dog?.classList.add("excited");
        showEmote(dog, "!");
        window.setTimeout(() => dog?.classList.remove("excited"), 1300);
      } else {
        cat?.classList.add("pounce");
        showEmote(cat, "✦");
        window.setTimeout(() => cat?.classList.remove("pounce"), 850);
      }
    };

    window.setInterval(runIdleAction, 5200);

    let targetPet = dog;

    const chooseTargetPet = (x, y) => {
      const pets = [dog, cat].filter(Boolean);
      if (!pets.length) return null;
      let nearest = pets[0];
      let nearestDistance = Infinity;
      pets.forEach((pet) => {
        const rect = pet.getBoundingClientRect();
        const px = rect.left + rect.width / 2;
        const py = rect.top + rect.height / 2;
        const distance = Math.hypot(x - px, y - py);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = pet;
        }
      });
      return nearest;
    };

    window.addEventListener("mousemove", (event) => {
      if (!document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-pets")) return;
      const nextTarget = chooseTargetPet(event.clientX, event.clientY);
      if (nextTarget !== targetPet) {
        targetPet?.classList.remove("targeted");
        targetPet = nextTarget;
      }
      targetPet?.classList.add("targeted");
    }, { passive: true });

    document.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-pets")) return;
      if (event.button !== 0) return;

      const now = performance.now();
      if (now - lastBallTime < 650) return;
      lastBallTime = now;

      const selectedPet = chooseTargetPet(event.clientX, event.clientY);
      if (!selectedPet) return;

      const petRect = selectedPet.getBoundingClientRect();
      const endX = petRect.left + petRect.width / 2;
      const endY = petRect.top + petRect.height / 2;
      const midX = event.clientX + (endX - event.clientX) * 0.52;
      const midY = Math.min(event.clientY, endY) - Math.max(58, Math.abs(endY - event.clientY) * 0.18);

      const ball = document.createElement("span");
      ball.className = "pet-ball";
      ball.style.setProperty("--ball-start-x", `${event.clientX}px`);
      ball.style.setProperty("--ball-start-y", `${event.clientY}px`);
      ball.style.setProperty("--ball-mid-x", `${midX}px`);
      ball.style.setProperty("--ball-mid-y", `${midY}px`);
      ball.style.setProperty("--ball-end-x", `${endX}px`);
      ball.style.setProperty("--ball-end-y", `${endY}px`);
      playground.appendChild(ball);

      if (hint) hint.classList.add("hidden");

      selectedPet.classList.add("targeted");
      if (selectedPet === dog) {
        dog?.classList.add("excited");
        showEmote(dog, "⚡");
      } else {
        cat?.classList.add("pounce");
        showEmote(cat, "⚡");
      }

      window.setTimeout(() => spawnSparkBurst(endX, endY, 10), 760);

      window.setTimeout(() => {
        dog?.classList.remove("excited");
        cat?.classList.remove("pounce");
      }, 1100);

      window.setTimeout(() => ball.remove(), 1250);
    });
  }
})();


/* Cursor-driven car playground */
(() => {
  const carPlayground = document.createElement("div");
  carPlayground.className = "car-playground";
  carPlayground.setAttribute("aria-hidden", "true");
  carPlayground.innerHTML = `
    <div class="car-road"></div>
    <div class="car-machine" id="cursor-car">
      <span class="car-exhaust"></span>
      <span class="car-shell"><span class="car-light"></span></span>
      <span class="car-wheel back"></span>
      <span class="car-wheel front"></span>
    </div>
    <div class="car-hint">move cursor to steer • click to boost</div>
    <div class="car-finish">FINISH // STILL MORE TO GO</div>
  `;
  document.body.appendChild(carPlayground);

  const car = carPlayground.querySelector("#cursor-car");
  const carHint = carPlayground.querySelector(".car-hint");
  let targetX = Math.min(window.innerWidth * .35, 360);
  let carX = targetX;
  let lastX = targetX;
  let lastMove = performance.now();
  let boostTimer = 0;
  let finishCelebrated = false;

  const clampCarX = (x) => Math.max(18, Math.min(window.innerWidth - 108, x - 46));

  const animateCar = () => {
    if (document.body.classList.contains("portfolio-live") && document.body.classList.contains("experience-car") && finePointer && !prefersReducedMotion) {
      carX += (targetX - carX) * .14;
      if (car) car.style.transform = `translate3d(${carX}px,0,0)`;
      const moving = Math.abs(targetX - carX) > .7 || performance.now() - lastMove < 140;
      carPlayground.classList.toggle("driving", moving);
    }
    requestAnimationFrame(animateCar);
  };

  const spawnSpeedLines = () => {
    if (!car) return;
    const rect = car.getBoundingClientRect();
    for (let i = 0; i < 5; i += 1) {
      const line = document.createElement("span");
      line.className = "car-speed-line";
      line.style.left = `${rect.left + 8 - i * 8}px`;
      line.style.top = `${rect.top + 15 + i * 4}px`;
      document.body.appendChild(line);
      window.setTimeout(() => line.remove(), 620);
    }
  };

  const updateCarFinish = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    const nearFinish = ratio > .965;
    carPlayground.classList.toggle("near-finish", nearFinish);
    if (nearFinish && !finishCelebrated && document.body.classList.contains("experience-car")) {
      finishCelebrated = true;
      carPlayground.classList.add("boosting");
      spawnSpeedLines();
      window.setTimeout(() => carPlayground.classList.remove("boosting"), 900);
    }
    if (!nearFinish && ratio < .92) finishCelebrated = false;
  };

  if (finePointer && !prefersReducedMotion) {
    window.addEventListener("mousemove", (event) => {
      if (!document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-car")) return;
      targetX = clampCarX(event.clientX);
      lastMove = performance.now();
      if (Math.abs(targetX - lastX) > 2) {
        carPlayground.classList.add("driving");
        lastX = targetX;
      }
    }, { passive: true });

    document.addEventListener("pointerdown", (event) => {
      if (!document.body.classList.contains("portfolio-live") || !document.body.classList.contains("experience-car")) return;
      if (event.button !== 0) return;
      window.clearTimeout(boostTimer);
      carPlayground.classList.add("boosting", "driving");
      if (carHint) carHint.classList.add("hidden");
      spawnSpeedLines();
      boostTimer = window.setTimeout(() => carPlayground.classList.remove("boosting"), 720);
    });

    window.addEventListener("scroll", updateCarFinish, { passive: true });
    window.addEventListener("resize", () => {
      targetX = clampCarX(targetX + 46);
      updateCarFinish();
    });
    updateCarFinish();
    animateCar();
  }
})();
