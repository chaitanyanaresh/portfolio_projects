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
  let chaseTarget = null;
  let chaseEnds = 0;

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

  document.addEventListener("pointerdown", (event) => {
    if (!finePointer || !isActive("pets") || event.button !== 0 || interactive(event.target)) return;
    chaseTarget = { x: event.clientX, y: event.clientY };
    chaseEnds = performance.now() + 1050;
    petHint?.classList.add("hidden");

    const ball = document.createElement("span");
    ball.className = "pet-ball";
    const startX = event.clientX - 40;
    const startY = event.clientY - 60;
    ball.style.setProperty("--ball-start-x", `${startX}px`);
    ball.style.setProperty("--ball-start-y", `${startY}px`);
    ball.style.setProperty("--ball-mid-x", `${event.clientX - 12}px`);
    ball.style.setProperty("--ball-mid-y", `${event.clientY - 45}px`);
    ball.style.setProperty("--ball-end-x", `${event.clientX}px`);
    ball.style.setProperty("--ball-end-y", `${event.clientY}px`);
    document.body.appendChild(ball);
    window.setTimeout(() => ball.remove(), 1250);

    dog.classList.add("excited");
    cat.classList.add("pounce");
    emote(pets[0], "!");
    emote(pets[1], "✦");
    window.setTimeout(() => {
      dog.classList.remove("excited");
      cat.classList.remove("pounce");
    }, 950);
    window.setTimeout(() => sparkBurst(event.clientX, event.clientY), 760);
  });

  const animatePets = () => {
    if (isActive("pets")) {
      const now = performance.now();
      const chasing = chaseTarget && now < chaseEnds;
      if (now - lastPointerMove < 1000) petHint?.classList.add("hidden");
      for (const [index, pet] of pets.entries()) {
        const aim = chasing
          ? { x: chaseTarget.x - 18 + (index ? 25 : -25), y: chaseTarget.y - 10 + index * 15 }
          : { x: pointer.x + pet.offset.x, y: pointer.y + pet.offset.y };
        const target = motion.clampPoint(aim, viewport(), { width: 44, height: 46 });
        const before = pet.position;
        pet.position = motion.followPoint(before, target, chasing ? 0.19 : pet.smoothing);
        const dx = pet.position.x - before.x;
        if (Math.abs(dx) > 0.35) pet.facing = dx < 0 ? -1 : 1;
        pet.element.style.transform =
          `translate3d(${pet.position.x}px, ${pet.position.y}px, 0) scaleX(${pet.facing})`;
        pet.element.classList.toggle("targeted", !!chasing);
      }
      if (finePointer && (chasing || now - lastPointerMove < 1200) && motion.distance(pets[0].position, pointer) > 18 && now - lastPaw > 520) {
        lastPaw = now;
        for (const pet of pets) pawPrint(pet);
      }
      if (chaseTarget && now >= chaseEnds) chaseTarget = null;
    }
    requestAnimationFrame(animatePets);
  };
  animatePets();


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

  window.addEventListener("pointerup", (event) => {
    if (finePointer || event.pointerType !== "touch" || !isActive("car") ||
        interactive(event.target) || !tapStart) return;
    const elapsed = performance.now() - tapStart.time;
    if (elapsed > 550 || Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) >= 14) return;
    const horizontal = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    const vertical = event.clientY / Math.max(1, window.innerHeight) - 0.5;
    queueRemoteCommand(horizontal * 0.65, -vertical * 210);
  }, { passive: true });

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
