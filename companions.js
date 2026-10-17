(function startViewportCompanions() {
  "use strict";
  if (prefersReducedMotion || !globalThis.CompanionMotion) return;

  const motion = globalThis.CompanionMotion;
  const isActive = (mode) => document.body.classList.contains("portfolio-live") &&
    document.body.classList.contains(`experience-${mode}`);
  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  const interactive = (target) => target instanceof Element &&
    !!target.closest("a, button, input, textarea, select, summary, [role='button'], [contenteditable='true']");

  let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let lastPointerMove = 0;

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    pointer = { x: event.clientX, y: event.clientY };
    lastPointerMove = performance.now();
  }, { passive: true });

  // Touchscreen visitors can tap empty space without hijacking scrolling or links.
  let tapStart = null;
  window.addEventListener("pointerdown", (event) => {
    if (finePointer || event.pointerType !== "touch" || interactive(event.target)) return;
    tapStart = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() };
  }, { passive: true });
  window.addEventListener("pointerup", (event) => {
    if (!tapStart || event.pointerId !== tapStart.id) return;
    const elapsed = performance.now() - tapStart.time;
    if (elapsed < 550 && Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) < 14) {
      pointer = { x: event.clientX, y: event.clientY };
      lastPointerMove = performance.now();
    }
    tapStart = null;
  }, { passive: true });
  window.addEventListener("pointercancel", () => { tapStart = null; }, { passive: true });

  // Companions live on a full-viewport, click-through layer, not in a footer lane.
  const playground = document.createElement("div");
  playground.className = "pet-playground";
  playground.setAttribute("aria-hidden", "true");
  playground.innerHTML = `
    <div class="pet pet-dog" id="pet-dog"><span class="pet-body">🐕</span></div>
    <div class="pet pet-cat" id="pet-cat"><span class="pet-body">🐈</span></div>
    <div class="pet-hint">guide the pets with your cursor • click to throw the ball</div>
  `;
  document.body.appendChild(playground);

  const dog = playground.querySelector("#pet-dog");
  const cat = playground.querySelector("#pet-cat");
  const petHint = playground.querySelector(".pet-hint");
  if (!finePointer) petHint.textContent = "tap empty space to guide the pets";
  const pets = [
    { element: dog, position: { x: pointer.x - 100, y: pointer.y + 75 }, offset: { x: -80, y: 62 }, smoothing: 0.085, facing: 1, pawRotation: -9 },
    { element: cat, position: { x: pointer.x + 40, y: pointer.y + 50 }, offset: { x: 32, y: 36 }, smoothing: 0.135, facing: 1, pawRotation: 9 }
  ];

  let lastPaw = 0;
  let fetchState = null;
  let fetchBall = null;
  let lastThrow = 0;
  let lastFetcher = -1;
  let previousPetFrame = performance.now();

  const sparkBurst = (x, y, count = 8) => {
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "pet-spark";
      const angle = Math.PI * 2 * i / count;
      const travel = 18 + (i % 3) * 9;
      spark.style.setProperty("--spark-x", `${x}px`);
      spark.style.setProperty("--spark-y", `${y}px`);
      spark.style.setProperty("--spark-dx", `${Math.cos(angle) * travel}px`);
      spark.style.setProperty("--spark-dy", `${Math.sin(angle) * travel}px`);
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 820);
    }
  };

  const pawPrint = (pet) => {
    const paw = document.createElement("span");
    paw.className = "pet-paw";
    paw.textContent = "•";
    paw.style.left = `${pet.position.x + 18}px`;
    paw.style.top = `${pet.position.y + 40}px`;
    paw.style.setProperty("--paw-rotate", `${pet.pawRotation}deg`);
    playground.appendChild(paw);
    window.setTimeout(() => paw.remove(), 1950);
  };

  const emote = (pet, symbol) => {
    const mark = document.createElement("span");
    mark.className = "pet-emote";
    mark.textContent = symbol;
    mark.style.left = `${pet.position.x + 7}px`;
    mark.style.top = `${pet.position.y - 22}px`;
    playground.appendChild(mark);
    window.setTimeout(() => mark.remove(), 1200);
  };

  const petCenter = (pet) => ({ x: pet.position.x + 22, y: pet.position.y + 23 });
  const clearFetch = () => {
    fetchState = null;
    fetchBall?.remove();
    fetchBall = null;
    pets.forEach((pet) => pet.element.classList.remove("targeted", "is-carrying"));
  };
  const throwBall = (x, y) => {
    if (!isActive("pets") || performance.now() - lastThrow < 220) return;
    lastThrow = performance.now();
    clearFetch();

    const from = { x, y };
    const view = viewport();
    const directionX = x < view.width * 0.5 ? 1 : -1;
    const directionY = y < view.height * 0.48 ? 1 : -1;
    const landing = motion.clampPoint({
      x: x + directionX * Math.min(280, view.width * 0.34),
      y: y + directionY * Math.min(145, view.height * 0.23)
    }, view, { width: 14, height: 14 }, 22);

    const petDistances = pets.map((pet) => motion.distance(petCenter(pet), landing));
    let selected = petDistances[0] <= petDistances[1] ? 0 : 1;
    if (lastFetcher === selected && Math.abs(petDistances[0] - petDistances[1]) < 65) {
      selected = 1 - selected;
    }
    lastFetcher = selected;
    fetchState = motion.createFetchState(from, landing, selected);
    fetchBall = document.createElement("span");
    fetchBall.className = "pet-ball fetch-ball";
    document.body.appendChild(fetchBall);
    pets[selected].element.classList.add("targeted");
    emote(pets[selected], "!");
    petHint?.classList.add("hidden");
  };

  document.addEventListener("pointerdown", (event) => {
    if (!finePointer || event.button !== 0 || interactive(event.target)) return;
    throwBall(event.clientX, event.clientY);
  });

  // Tap blank space to throw on touchscreens; swipes and links remain untouched.
  let fetchTap = null;
  window.addEventListener("pointerdown", (event) => {
    if (finePointer || event.pointerType !== "touch" || !isActive("pets") || interactive(event.target)) return;
    fetchTap = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() };
  }, { passive: true });
  window.addEventListener("pointerup", (event) => {
    if (!fetchTap || event.pointerId !== fetchTap.id) return;
    const duration = performance.now() - fetchTap.time;
    const moved = motion.distance(fetchTap, { x: event.clientX, y: event.clientY });
    fetchTap = null;
    if (duration <= 550 && moved < 14 && !interactive(event.target)) {
      throwBall(event.clientX, event.clientY);
    }
  }, { passive: true });
  window.addEventListener("pointercancel", () => { fetchTap = null; }, { passive: true });

  const animatePets = (now) => {
    const dt = Math.min(Math.max((now - previousPetFrame) / 1000, 0), 0.05);
    previousPetFrame = now;
    if (isActive("pets")) {
      const fetcher = fetchState ? pets[fetchState.petIndex] : null;
      const returningTo = { x: pointer.x, y: pointer.y + 22 };

      for (const pet of pets) {
        const before = pet.position;
        let target;
        if (fetchState && fetcher === pet && ["flying", "chasing", "returning"].includes(fetchState.phase)) {
          const goal = fetchState.phase === "returning" ? returningTo : fetchState.landing;
          target = motion.clampPoint({ x: goal.x - 22, y: goal.y - 23 }, viewport(), { width: 44, height: 46 });
          pet.position = motion.moveTowards(before, target, (fetchState.phase === "returning" ? 330 : 275) * dt);
        } else {
          target = motion.clampPoint({
            x: pointer.x + pet.offset.x, y: pointer.y + pet.offset.y
          }, viewport(), { width: 44, height: 46 });
          const smooth = 1 - Math.pow(1 - pet.smoothing, dt * 60);
          pet.position = motion.followPoint(before, target, smooth);
        }

        const dx = pet.position.x - before.x;
        if (Math.abs(dx) > 0.12) pet.facing = dx < 0 ? -1 : 1;
        pet.element.style.transform =
          `translate3d(${pet.position.x}px, ${pet.position.y}px, 0) scaleX(${pet.facing})`;
        pet.element.classList.toggle("targeted", fetcher === pet && fetchState?.phase !== "delivered");
        pet.element.classList.toggle("is-carrying", fetcher === pet && fetchState?.phase === "returning");
      }

      if (fetchState && fetcher) {
        const beforePhase = fetchState.phase;
        fetchState = motion.advanceFetchState(fetchState, petCenter(fetcher), returningTo, dt);
        const ballPos = motion.fetchBallPosition(fetchState, petCenter(fetcher), returningTo);
        if (fetchBall) {
          fetchBall.style.transform =
            `translate3d(${ballPos.x}px, ${ballPos.y}px, 0) translate(-50%, -50%)`;
          fetchBall.classList.toggle("is-carried", fetchState.phase === "returning");
          fetchBall.classList.toggle("is-delivered", fetchState.phase === "delivered");
        }
        if (beforePhase !== fetchState.phase) {
          if (fetchState.phase === "returning") {
            emote(fetcher, "🎾");
            sparkBurst(fetchState.landing.x, fetchState.landing.y, 6);
          } else if (fetchState.phase === "delivered") {
            fetcher.element.classList.remove("is-carrying");
            emote(fetcher, "♥");
            sparkBurst(returningTo.x, returningTo.y, 9);
          } else if (fetchState.phase === "complete") {
            clearFetch();
          }
        }
      }

      if (finePointer && !fetchState && now - lastPointerMove < 1200 &&
          motion.distance(petCenter(pets[0]), pointer) > 22 && now - lastPaw > 620) {
        lastPaw = now;
        for (const pet of pets) pawPrint(pet);
      }
    }
    requestAnimationFrame(animatePets);
  };
  requestAnimationFrame(animatePets);

  // RC car: the glowing mouse ball is the remote, NOT a destination.
  const carPlayground = document.createElement("div");
  carPlayground.className = "car-playground";
  carPlayground.setAttribute("aria-hidden", "true");
  carPlayground.innerHTML = `
    <div class="car-machine" id="cursor-car">
      <span class="car-exhaust"></span>
      <span class="car-shell"><span class="car-light"></span></span>
      <span class="car-wheel back"></span>
      <span class="car-wheel front"></span>
    </div>
    <div class="car-hint">mouse left/right: turn • up/down: speed • click: turbo</div>
  `;
  document.body.appendChild(carPlayground);
  const car = carPlayground.querySelector("#cursor-car");
  const carHint = carPlayground.querySelector(".car-hint");
  if (!finePointer) carHint.textContent = "tap left/right to turn • top/bottom for speed";

  let carState = {
    x: Math.max(18, window.innerWidth * 0.14),
    y: Math.max(16, window.innerHeight * 0.68),
    heading: 0,
    speed: 0
  };
  let lastMousePoint = null;
  let steerCommand = 0;
  let speedCommand = 0;
  let turboEnds = 0;
  let lastFrame = performance.now();

  const queueRemoteCommand = (turn, throttle) => {
    steerCommand = motion.clamp(steerCommand + turn, -0.7, 0.7);
    speedCommand = motion.clamp(speedCommand + throttle, -140, 140);
    carHint?.classList.add("hidden");
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const next = { x: event.clientX, y: event.clientY };
    if (lastMousePoint && isActive("car")) {
      // Mouse displacement is the control input, not the car's destination.
      const dx = next.x - lastMousePoint.x;
      const dy = next.y - lastMousePoint.y;
      queueRemoteCommand(dx * 0.006, -dy * 1.35);
    }
    lastMousePoint = next;
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => { lastMousePoint = null; });

  let remoteTap = null;
  window.addEventListener("pointerdown", (event) => {
    if (finePointer || event.pointerType !== "touch" || !isActive("car") || interactive(event.target)) return;
    remoteTap = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() };
  }, { passive: true });
  window.addEventListener("pointerup", (event) => {
    if (!remoteTap || event.pointerId !== remoteTap.id) return;
    const elapsed = performance.now() - remoteTap.time;
    const moved = Math.hypot(event.clientX - remoteTap.x, event.clientY - remoteTap.y);
    remoteTap = null;
    if (!isActive("car") || interactive(event.target) || elapsed > 550 || moved >= 14) return;
    const horizontal = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    const vertical = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    queueRemoteCommand(horizontal * 0.65, -vertical * 210);
  }, { passive: true });
  window.addEventListener("pointercancel", () => { remoteTap = null; }, { passive: true });

  const speedLines = () => {
    const rect = car.getBoundingClientRect();
    const forwardX = Math.cos(carState.heading) >= 0 ? 1 : -1;
    for (let i = 0; i < 5; i += 1) {
      const line = document.createElement("span");
      line.className = "car-speed-line";
      line.style.left = `${forwardX < 0 ? rect.right + i * 8 : rect.left - i * 8}px`;
      line.style.top = `${rect.top + 12 + i * 5}px`;
      document.body.appendChild(line);
      window.setTimeout(() => line.remove(), 620);
    }
  };

  document.addEventListener("pointerdown", (event) => {
    if (!finePointer || !isActive("car") || event.button !== 0 || interactive(event.target)) return;
    turboEnds = performance.now() + 720;
    carPlayground.classList.add("boosting", "driving");
    carHint?.classList.add("hidden");
    speedLines();
  });

  const animateCar = (now) => {
    const delta = Math.min(Math.max((now - lastFrame) / 1000, 0), 0.05);
    lastFrame = now;
    if (isActive("car")) {
      const boosting = now < turboEnds;
      carState = motion.driveRemoteCar(
        carState,
        { turn: steerCommand, throttle: speedCommand, boost: boosting },
        viewport(),
        pointer,
        delta
      );
      steerCommand = 0;
      speedCommand = 0;

      // Rotate the body in its actual direction of travel.
      car.style.transform =
        `translate3d(${carState.x}px, ${carState.y}px, 0) rotate(${carState.heading}rad)`;
      carPlayground.classList.toggle("boosting", boosting);
      carPlayground.classList.toggle("driving", boosting || Math.abs(carState.speed) > 7);
    }
    requestAnimationFrame(animateCar);
  };
  requestAnimationFrame(animateCar);
})();
