import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("backend skills advertise Java and Spring Boot without removing existing tools", () => {
  const card = html.match(/<h3>Backend and APIs<\/h3>\s*<p>([^<]+)<\/p>/)?.[1];
  assert.ok(card, "Backend and APIs skills card should exist");
  for (const skill of ["Java", "Spring Boot", "Spring Security", "Node.js", "Express", "Python", "REST", "GraphQL"]) {
    assert.ok(card.includes(skill), "Missing backend skill: " + skill);
  }
});

test("backend welcome option includes Java and Spring Boot", () => {
  const backendOption = html.match(/<button class="mission-card"[^>]*data-label="BACKEND"[^>]*>([\s\S]*?)<\/button>/)?.[1];
  assert.ok(backendOption, "Backend mission option should exist");
  assert.match(backendOption, /Java, Spring Boot, Node\.js, Python/);
});

test("homepage introduction lists Java as a backend technology", () => {
  const hero = html.match(/<p class="hero-text">([\s\S]*?)<\/p>/)?.[1];
  assert.ok(hero);
  assert.match(hero, /Java and Spring Boot/);
  assert.match(hero, /Node\.js and Python/);
});
