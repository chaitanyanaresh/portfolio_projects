(function installCompanionMotion(root) {
  "use strict";
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }
  function clampPoint(point, viewport, size, padding = 12) {
    return {
      x: clamp(point.x, padding, Math.max(padding, viewport.width - size.width - padding)),
      y: clamp(point.y, padding, Math.max(padding, viewport.height - size.height - padding))
    };
  }
  function followPoint(current, target, smoothing = 0.15) {
    return {
      x: current.x + (target.x - current.x) * smoothing,
      y: current.y + (target.y - current.y) * smoothing
    };
  }
  function distance(from, to) {
    return Math.hypot(to.x - from.x, to.y - from.y);
  }
  root.CompanionMotion = Object.freeze({ clamp, clampPoint, followPoint, distance });
})(globalThis);
