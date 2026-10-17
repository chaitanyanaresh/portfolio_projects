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

test("both new browser scripts parse", () => {
  assert.doesNotThrow(() => new vm.Script(js));
  assert.doesNotThrow(() => new vm.Script(motionJs));
});

test("cursor companions load after the base script and their stylesheet", () => {
  const base = html.indexOf('src="script.js?v=20261017-1"');
  const helper = html.indexOf('src="companion-motion.js?v=20261017-2"');
  const companion = html.indexOf('src="companions.js?v=20261017-2"');
  assert.ok(base >= 0 && helper > base && companion > helper);
  assert.ok(html.includes('href="companions.css?v=20261017-1"'));
});

test("movement interpolates in both X and Y, not only along the bottom", () => {
  const next = motion.followPoint({ x: 20, y: 30 }, { x: 120, y: 230 }, 0.2);
  assert.equal(next.x, 40);
  assert.equal(next.y, 70);
  assert.equal(motion.distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test("car and pets remain inside tiny and normal viewports", () => {
  const normal = motion.clampPoint({ x: 5000, y: -100 }, { width: 800, height: 600 }, { width: 92, height: 44 });
  assert.equal(normal.x, 696);
  assert.equal(normal.y, 12);
  const tiny = motion.clampPoint({ x: 1000, y: 1000 }, { width: 48, height: 48 }, { width: 92, height: 44 });
  assert.equal(tiny.x, 12);
  assert.equal(tiny.y, 12);
});

test("both companions track pointer movement through the full viewport", () => {
  assert.match(js, /addEventListener\("pointermove"/);
  assert.match(js, /motion\.clampPoint/g);
  assert.match(js, /motion\.followPoint/g);
  assert.match(js, /translate3d\(\$\{pet\.position\.x\}px, \$\{pet\.position\.y\}px/);
  assert.match(js, /translate3d\(\$\{carState\.x\}px, \$\{carState\.y\}px/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /pointer:\s*coarse/);
});


test("mouse acts as remote control, not as the car destination", () => {
  const start = { x: 240, y: 200, heading: 0, speed: 0 };
  const view = { width: 1400, height: 900 };
  const command = { turn: 0, throttle: 100, boost: false };
  const a = motion.driveRemoteCar(start, command, view, { x: 1000, y: 700 }, 1 / 60);
  const b = motion.driveRemoteCar(start, command, view, { x: 1220, y: 760 }, 1 / 60);
  assert.equal(a.x, b.x, "Car must not follow remote's X coordinate");
  assert.equal(a.y, b.y, "Car must not follow remote's Y coordinate");
  assert.ok(a.x > start.x, "Throttle should move the car forward");
  assert.equal(a.y, start.y);
});

test("left/right steering rotates direction and up/down changes speed", () => {
  const start = { x: 250, y: 200, heading: 0, speed: 0 };
  const bounds = { width: 1400, height: 900 };
  const controller = { x: 900, y: 650 };
  const left = motion.driveRemoteCar(start, { turn: -0.35, throttle: 100 }, bounds, controller);
  const right = motion.driveRemoteCar(start, { turn: 0.35, throttle: 100 }, bounds, controller);
  assert.ok(left.heading < 0);
  assert.ok(right.heading > 0);
  assert.ok(left.y < start.y);
  assert.ok(right.y > start.y);
  const reverse = motion.driveRemoteCar(start, { turn: 0, throttle: -60 }, bounds, controller);
  assert.ok(reverse.speed < 0);
  assert.ok(reverse.x < start.x);
});

test("turbo accelerates beyond normal speed", () => {
  const start = { x: 300, y: 350, heading: 0, speed: 0 };
  const view = { width: 1400, height: 900 };
  const controller = { x: 1000, y: 700 };
  const normal = motion.driveRemoteCar(start, { turn: 0, throttle: 80 }, view, controller);
  const turbo = motion.driveRemoteCar(start, { turn: 0, throttle: 80, boost: true }, view, controller);
  assert.ok(turbo.speed > normal.speed);
  assert.ok(turbo.x > normal.x);
});

test("car stays away from the remote and bounces off edges", () => {
  const view = { width: 1200, height: 800 };
  const pointer = { x: 300, y: 240 };
  const near = motion.driveRemoteCar(
    { x: 254, y: 218, heading: 0, speed: 0 },
    { turn: 0, throttle: 0 },
    view, pointer
  );
  assert.ok(motion.distance({ x: near.x + 46, y: near.y + 22 }, pointer) >= 170);

  const collision = motion.driveRemoteCar(
    { x: 1094, y: 220, heading: 0, speed: 200 },
    { turn: 0, throttle: 0 },
    view, { x: 100, y: 650 }
  );
  assert.ok(collision.x <= 1096);
  assert.ok(Math.cos(collision.heading) < 0, "Bounce should send car back into the screen");
});

test("pointer motion is used as RC commands, including mobile tap steering", () => {
  assert.match(js, /queueRemoteCommand\(dx \* 0\.006, -dy \* 1\.35\)/);
  assert.match(js, /driveRemoteCar\(/);
  assert.match(js, /let remoteTap = null/);
  assert.match(js, /interactive\(event\.target\)/);
  assert.doesNotMatch(js, /const aim = \{ x: pointer\.x - 64, y: pointer\.y \+ 26 \}/);
});
