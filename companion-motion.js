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
  function moveTowards(from, to, distanceLimit) {
    const gap = distance(from, to);
    if (gap < 0.0001 || gap <= distanceLimit) return { x: to.x, y: to.y };
    const scale = Math.max(0, distanceLimit) / gap;
    return { x: from.x + (to.x - from.x) * scale, y: from.y + (to.y - from.y) * scale };
  }

  // Pick the farthest opposite corner in the usable viewport, so every click
  // produces a substantial throw even when the cursor is near an edge.
  function longThrowLanding(from, viewport, padding = 26) {
    const minX = padding;
    const minY = padding;
    const maxX = Math.max(minX, viewport.width - 14 - padding);
    const maxY = Math.max(minY, viewport.height - 14 - padding);
    return {
      x: from.x <= (minX + maxX) / 2 ? maxX : minX,
      y: from.y <= (minY + maxY) / 2 ? maxY : minY
    };
  }

  function applyDeadzone(input, deadzone = 0.13) {
    const magnitude = Math.abs(clamp(input, -1, 1));
    if (magnitude <= deadzone) return 0;
    return Math.sign(input) * (magnitude - deadzone) / (1 - deadzone);
  }
  function pointerRemoteAxes(pointer, viewport) {
    return {
      steer: applyDeadzone((pointer.x / Math.max(viewport.width, 1) - 0.5) * 2, 0.15),
      throttle: applyDeadzone((0.5 - pointer.y / Math.max(viewport.height, 1)) * 2, 0.19)
    };
  }

  // Velocity and direction are held by the car, never copied from mouse coordinates.
  // Numeric throttle/steer axes are continuous, so the speed does not depend on mouse event frequency.
  function driveRemoteCar(state, command, viewport, controller, deltaSeconds = 1 / 60) {
    const dt = clamp(deltaSeconds, 0, 0.05);
    const boost = Boolean(command.boost);
    const throttle = clamp(command.throttle || 0, -1, 1);
    const steer = clamp(command.steer || 0, -1, 1);
    const targetSpeed = throttle >= 0 ? throttle * (boost ? 370 : 215) : throttle * 115;
    const response = 1 - Math.exp(-dt * (Math.abs(throttle) > 0.02 ? 4.8 : 6.8));
    let speed = state.speed + (targetSpeed - state.speed) * response;
    if (boost && throttle >= 0.02) speed = Math.max(speed, Math.min(260, speed + 160 * dt));
    if (Math.abs(speed) < 0.35) speed = 0;

    // RC steering is progressive and frame-rate independent, without instant spins at rest.
    let heading = state.heading + steer * (Math.abs(speed) > 3 ? 1 : 0.2) * 2.7 * dt * (speed < 0 ? -1 : 1);
    let x = state.x + Math.cos(heading) * speed * dt;
    let y = state.y + Math.sin(heading) * speed * dt;
    const minX = 12, minY = 12;
    const maxX = Math.max(minX, viewport.width - 92 - 12);
    const maxY = Math.max(minY, viewport.height - 44 - 12);
    if (x < minX || x > maxX) {
      x = clamp(x, minX, maxX);
      heading = Math.PI - heading;
      speed *= 0.38;
    }
    if (y < minY || y > maxY) {
      y = clamp(y, minY, maxY);
      heading = -heading;
      speed *= 0.38;
    }

    // Soft avoidance, not a snap: moving the cursor over the car never teleports it.
    if (controller && Number.isFinite(controller.x) && Number.isFinite(controller.y)) {
      const minGap = Math.min(145, Math.max(58, Math.min(viewport.width, viewport.height) * 0.19));
      const dx = x + 46 - controller.x;
      const dy = y + 22 - controller.y;
      const gap = Math.hypot(dx, dy);
      if (gap < minGap) {
        const push = Math.min(140 * dt, minGap - gap);
        const unitX = gap > 0.001 ? dx / gap : Math.cos(heading);
        const unitY = gap > 0.001 ? dy / gap : Math.sin(heading);
        x = clamp(x + unitX * push, minX, maxX);
        y = clamp(y + unitY * push, minY, maxY);
      }
    }
    return { x, y, heading, speed };
  }

  // Ball fetch phases: flying -> chasing -> returning -> delivered.
  // The state cannot skip chasing to return before the ball has landed.
  function createFetchState(from, landing, petIndex) {
    return {
      phase: "flying",
      elapsed: 0,
      from: { x: from.x, y: from.y },
      landing: { x: landing.x, y: landing.y },
      petIndex,
      flightDuration: clamp(distance(from, landing) / 600, 0.65, 1.8),
      delivered: false
    };
  }
  function advanceFetchState(state, petCenter, returnTarget, deltaSeconds) {
    if (!state) return null;
    const dt = clamp(deltaSeconds, 0, 0.08);
    const next = { ...state, elapsed: state.elapsed + dt };
    if (next.phase === "flying" && next.elapsed >= (next.flightDuration || 0.62)) {
      next.phase = "chasing";
      next.elapsed = 0;
    } else if (next.phase === "chasing" && distance(petCenter, next.landing) <= 25) {
      next.phase = "returning";
      next.elapsed = 0;
    } else if (next.phase === "returning" && distance(petCenter, returnTarget) <= 35) {
      next.phase = "delivered";
      next.delivered = true;
      next.elapsed = 0;
    } else if (next.phase === "delivered" && next.elapsed >= 0.85) {
      next.phase = "complete";
    }
    return next;
  }
  function fetchBallPosition(fetch, petCenter, returnTarget) {
    if (fetch.phase === "flying") {
      const t = clamp(fetch.elapsed / (fetch.flightDuration || 0.62), 0, 1);
      const height = clamp(distance(fetch.from, fetch.landing) * 0.18, 70, 145);
      return {
        x: fetch.from.x + (fetch.landing.x - fetch.from.x) * t,
        y: fetch.from.y + (fetch.landing.y - fetch.from.y) * t - Math.sin(t * Math.PI) * height
      };
    }
    if (fetch.phase === "returning") return { x: petCenter.x + 12, y: petCenter.y + 8 };
    if (fetch.phase === "delivered") return { x: returnTarget.x, y: returnTarget.y + 14 };
    return { ...fetch.landing };
  }

  root.CompanionMotion = Object.freeze({
    clamp, clampPoint, followPoint, distance, moveTowards, longThrowLanding,
    applyDeadzone, pointerRemoteAxes, driveRemoteCar,
    createFetchState, advanceFetchState, fetchBallPosition
  });
})(globalThis);
