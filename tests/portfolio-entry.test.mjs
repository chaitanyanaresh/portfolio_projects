import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../script.js", import.meta.url), "utf8");

test("portfolio JavaScript is valid and parseable", () => {
  assert.doesNotThrow(() => new vm.Script(js, { filename: "script.js" }));
});

test("intro and companion choices are present with accessible buttons", () => {
  for (const id of ["play-intro", "skip-intro", "companion-skip", "mission-skip"]) {
    assert.match(html, new RegExp('<button[^>]*id="' + id + '"[^>]*type="button"'));
    assert.ok(js.includes('getElementById("' + id + '")'));
  }
  for (const mode of ["car", "pets"]) {
    assert.match(html, new RegExp('class="companion-card[^"]*"[^>]*data-mode="' + mode + '"'));
  }
  assert.match(js, /companionCards\.forEach/);
  assert.match(js, /applyCompanionMode\(card\.dataset\.mode/);
});

test("mission choices point to real portfolio sections", () => {
  const targets = [...html.matchAll(/class="mission-card"[^>]*data-target="([^"]+)"/g)];
  assert.equal(targets.length, 4);
  for (const [, target] of targets) {
    assert.ok(html.includes('id="' + target + '"'), "Missing destination for " + target);
  }
  assert.match(js, /missionCards\.forEach/);
  assert.match(js, /unlockPortfolio\(/);
});

test("script uses a refreshed URL after repair", () => {
  assert.match(html, /<script src="script\.js\?v=20261016-1"><\/script>/);
});
