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
  const helper = html.indexOf('src="companion-motion.js?v=20261017-1"');
  const companion = html.indexOf('src="companions.js?v=20261017-1"');
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
  assert.match(js, /translate3d\(\$\{carPosition\.x\}px, \$\{carPosition\.y\}px/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /pointer:\s*coarse/);
});
