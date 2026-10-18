import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../companions.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../companions.js", import.meta.url), "utf8");
const motionJs = readFileSync(new URL("../companion-motion.js", import.meta.url), "utf8");
const context = {};
vm.runInNewContext(motionJs, context, { filename: "companion-motion.js" });
const motion = context.CompanionMotion;
const view = { width: 1280, height: 800 };
const away = { x: 1150, y: 740 };

test("both browser scripts parse and load in the correct order", () => {
  assert.doesNotThrow(() => new vm.Script(js));
  assert.doesNotThrow(() => new vm.Script(motionJs));
  const base = html.indexOf('src="script.js?v=20261017-1"');
  const helpers = html.indexOf('src="companion-motion.js?v=20261018-1"');
  const experience = html.indexOf('src="companions.js?v=20261018-1"');
  assert.ok(base >= 0 && helpers > base && experience > helpers);
  assert.ok(html.includes('href="companions.css?v=20261018-1"'));
});

test("shared pet movement handles both dimensions and screen bounds", () => {
  const next = motion.followPoint({ x: 20, y: 30 }, { x: 120, y: 230 }, 0.2);
  assert.deepEqual([next.x, next.y], [40, 70]);
  assert.equal(motion.distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.deepEqual(
    Object.values(motion.clampPoint({ x: 5000, y: -100 }, { width: 800, height: 600 }, { width: 92, height: 44 })),
    [696, 12]
  );
  const reached = motion.moveTowards({ x: 0, y: 0 }, { x: 30, y: 40 }, 50);
  assert.deepEqual([reached.x, reached.y], [30, 40]);
});

test("RC analog controller has center neutral and predictable directions", () => {
  const center = motion.pointerRemoteAxes({ x: 640, y: 400 }, view);
  assert.equal(center.steer, 0);
  assert.equal(center.throttle, 0);
  const left = motion.pointerRemoteAxes({ x: 60, y: 400 }, view);
  const right = motion.pointerRemoteAxes({ x: 1230, y: 400 }, view);
  assert.ok(left.steer < 0);
  assert.ok(right.steer > 0);
  assert.equal(left.throttle, 0);
  const front = motion.pointerRemoteAxes({ x: 640, y: 50 }, view);
  const reverse = motion.pointerRemoteAxes({ x: 640, y: 745 }, view);
  assert.ok(front.throttle > 0);
  assert.ok(reverse.throttle < 0);
});

test("car doesn't chase its controller, and brakes naturally in neutral", () => {
  const start = { x: 260, y: 250, heading: 0, speed: 0 };
  const command = { steer: 0, throttle: 1 };
  const a = motion.driveRemoteCar(start, command, view, { x: 1020, y: 680 }, 1 / 60);
  const b = motion.driveRemoteCar(start, command, view, { x: 1180, y: 740 }, 1 / 60);
  assert.equal(a.x, b.x);
  assert.equal(a.y, b.y);
  assert.ok(a.speed > 0);
  const braking = motion.driveRemoteCar(
    { ...start, speed: 190 },
    { steer: 0, throttle: 0 }, view, away, 1 / 60
  );
  assert.ok(braking.speed < 190);
  assert.ok(braking.speed > 0);
});

test("sustained steering is smooth, reverse works, and turbo changes speed", () => {
  const start = { x: 300, y: 240, heading: 0, speed: 115 };
  const left = motion.driveRemoteCar(start, { steer: -1, throttle: 0.5 }, view, away);
  const right = motion.driveRemoteCar(start, { steer: 1, throttle: 0.5 }, view, away);
  assert.ok(left.heading < 0 && right.heading > 0);
  assert.ok(left.y < start.y && right.y > start.y);
  const reverse = motion.driveRemoteCar({ ...start, speed: 0 }, { throttle: -1 }, view, away);
  assert.ok(reverse.speed < 0);
  assert.ok(reverse.x < start.x);
  const normal = motion.driveRemoteCar({ ...start, speed: 0 }, { throttle: 0.8 }, view, away);
  const turbo = motion.driveRemoteCar({ ...start, speed: 0 }, { throttle: 0.8, boost: true }, view, away);
  assert.ok(turbo.speed > normal.speed);
});

test("mouse crossing the car cannot teleport it; edges reflect direction", () => {
  const start = { x: 280, y: 260, heading: 0, speed: 100 };
  const next = motion.driveRemoteCar(start, { throttle: 0 }, view, { x: 326, y: 282 }, 1 / 60);
  assert.ok(motion.distance(start, next) < 5, "Avoidance must be a gradual push, not a snap");
  const collision = motion.driveRemoteCar(
    { x: 1175, y: 220, heading: 0, speed: 180 },
    { throttle: 0 }, view, { x: 100, y: 650 }
  );
  assert.ok(collision.x <= 1176);
  assert.ok(Math.cos(collision.heading) < 0);
});

test("fetch phases enforce flight, chasing, carrying and delivery in order", () => {
  const from = { x: 120, y: 150 };
  const landing = { x: 520, y: 350 };
  const petFar = { x: 200, y: 180 };
  const receiver = { x: 120, y: 170 };
  let fetch = motion.createFetchState(from, landing, 1);
  assert.equal(fetch.phase, "flying");
  assert.equal(fetch.petIndex, 1);
  const mid = motion.advanceFetchState(fetch, petFar, receiver, 0.31);
  assert.equal(mid.phase, "flying");
  const arc = motion.fetchBallPosition(mid, petFar, receiver);
  assert.ok(arc.y < 250, "Ball must travel in an arc");
  for (let i = 0; i < 15 && fetch.phase === "flying"; i++) {
    fetch = motion.advanceFetchState(fetch, petFar, receiver, 0.05);
  }
  assert.equal(fetch.phase, "chasing", "No picking up until landing");
  fetch = motion.advanceFetchState(fetch, petFar, receiver, 0.05);
  assert.equal(fetch.phase, "chasing", "Faraway pet must still chase");
  fetch = motion.advanceFetchState(fetch, landing, receiver, 0.05);
  assert.equal(fetch.phase, "returning");
  assert.equal(fetch.delivered, false);
  assert.deepEqual(
    Object.values(motion.fetchBallPosition(fetch, landing, receiver)),
    [landing.x + 12, landing.y + 8],
    "Carried ball must stay at pet's mouth"
  );
  fetch = motion.advanceFetchState(fetch, receiver, receiver, 0.05);
  assert.equal(fetch.phase, "delivered");
  assert.equal(fetch.delivered, true);
  const dropped = motion.fetchBallPosition(fetch, receiver, receiver);
  assert.equal(dropped.x, receiver.x);
  for (let i = 0; i < 20 && fetch.phase !== "complete"; i++) {
    fetch = motion.advanceFetchState(fetch, receiver, receiver, 0.05);
  }
  assert.equal(fetch.phase, "complete");
});

test("pet fetch remains visible, supports re-throws and avoids accidental link/touch actions", () => {
  assert.match(js, /clearFetch\(\)/);
  assert.match(js, /motion\.createFetchState/);
  assert.match(js, /motion\.advanceFetchState/);
  assert.match(js, /motion\.fetchBallPosition/);
  assert.match(js, /fetchBall\.classList\.toggle\("is-carried"/);
  assert.match(js, /event\.pointerType !== "touch"/);
  assert.match(js, /interactive\(event\.target\)/);
  assert.match(css, /\.pet-ball\.fetch-ball/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /\.pet\.is-carrying/);
});

test("RC controls work with mouse, keyboard and touch without blocking the page", () => {
  assert.match(js, /motion\.pointerRemoteAxes/);
  assert.match(js, /carInputs\(\)/);
  assert.match(js, /className = "rc-touch-pad"/);
  assert.match(js, /interactive\(event\.target\)/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("ball throws reach the far side on desktop and mobile without leaving the viewport", () => {
  for (const screen of [view, { width: 390, height: 844 }]) {
    const starts = [
      { x: 18, y: 18 },
      { x: screen.width - 18, y: screen.height - 18 },
      { x: screen.width / 2, y: screen.height / 2 },
      { x: screen.width / 3, y: screen.height / 4 }
    ];
    for (const start of starts) {
      const landing = motion.longThrowLanding(start, screen);
      assert.ok(landing.x >= 26 && landing.x <= screen.width - 40);
      assert.ok(landing.y >= 26 && landing.y <= screen.height - 40);
      assert.ok(
        motion.distance(start, landing) > Math.min(screen.width, screen.height) * 0.46,
        "Throw should cross a substantial portion of the viewport"
      );
    }
  }
  const center = { x: 640, y: 400 };
  assert.ok(motion.distance(center, motion.longThrowLanding(center, view)) > 550);
});

test("long throws use slower, scaled flight arcs and cannot be fetched while airborne", () => {
  const from = { x: 90, y: 100 };
  const landing = motion.longThrowLanding(from, view);
  const fetch = motion.createFetchState(from, landing, 0);
  assert.ok(fetch.flightDuration > 1, "Long throw must take visibly longer than a short toss");
  assert.equal(motion.advanceFetchState(fetch, landing, from, 0.08).phase, "flying");
  const midFlight = { ...fetch, elapsed: fetch.flightDuration / 2 };
  const ball = motion.fetchBallPosition(midFlight, landing, from);
  assert.ok(ball.x > from.x && ball.x < landing.x);
  assert.ok(ball.y < (from.y + landing.y) / 2, "A flying ball has a visible arc");
  let state = fetch;
  for (let i = 0; i < 35 && state.phase === "flying"; i++) {
    state = motion.advanceFetchState(state, landing, from, 0.08);
  }
  assert.equal(state.phase, "chasing");
  assert.equal(motion.advanceFetchState(state, landing, from, 0.05).phase, "returning");
});

test("pet chooser renders one animal and never lets the hidden pet chase a ball", () => {
  assert.match(js, /petSelector\.setAttribute\("role", "group"\)/);
  assert.match(js, /pet\.element\.hidden = petIndex !== selected/);
  assert.match(js, /if \(petIndex !== activePetIndex\) continue/);
  assert.match(js, /motion\.createFetchState\(from, landing, activePetIndex\)/);
  assert.match(js, /fetchState\.phase === "flying"/);
  assert.match(js, /sessionStorage\.setItem\("cnaSelectedPet"/);
  assert.match(css, /\.pet\[hidden\] \{ display: none !important; \}/);
  assert.match(css, /\.pet-selector button:focus-visible/);
  assert.match(html, /Choose a dog or cat, one at a time/);
});
