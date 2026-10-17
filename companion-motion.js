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
  // RC car physics: steering and throttle are commands, never a destination.
  // Pointer position is used only to keep the vehicle away from its controller.
  function driveRemoteCar(state, command, viewport, controller, deltaSeconds = 1 / 60) {
    const size = { width: 92, height: 44 };
    const dt = clamp(deltaSeconds, 0, 0.05);
    let heading = state.heading + clamp(command.turn || 0, -0.7, 0.7);
    let speed = clamp(
      state.speed + clamp(command.throttle || 0, -140, 140),
      -120,
      command.boost ? 440 : 270
    );
    if (command.boost) speed = Math.max(speed, 360);
    speed *= Math.pow(0.993, dt * 60);

    let x = state.x + Math.cos(heading) * speed * dt;
    let y = state.y + Math.sin(heading) * speed * dt;
    const maxX = Math.max(12, viewport.width - size.width - 12);
    const maxY = Math.max(12, viewport.height - size.height - 12);
    // Bounce safely off screen edges, like a physical miniature car.
    if (x < 12 || x > maxX) {
      x = clamp(x, 12, maxX);
      heading = Math.PI - heading;
      speed *= 0.65;
    }
    if (y < 12 || y > maxY) {
      y = clamp(y, 12, maxY);
      heading = -heading;
      speed *= 0.65;
    }

    if (controller && Number.isFinite(controller.x) && Number.isFinite(controller.y)) {
      const minimumGap = Math.min(175, Math.max(90, Math.min(viewport.width, viewport.height) * 0.26));
      const dx = x + size.width / 2 - controller.x;
      const dy = y + size.height / 2 - controller.y;
      const gap = Math.hypot(dx, dy);
      if (gap < minimumGap) {
        // The remote stays separate: do not drive toward or snap onto the cursor.
        const ux = gap > 0.001 ? dx / gap : Math.cos(heading);
        const uy = gap > 0.001 ? dy / gap : Math.sin(heading);
        const safe = clampPoint({
          x: controller.x + ux * minimumGap - size.width / 2,
          y: controller.y + uy * minimumGap - size.height / 2
        }, viewport, size);
        x = safe.x;
        y = safe.y;
      }
    }
    return { x, y, heading, speed };
  }
  root.CompanionMotion = Object.freeze({ clamp, clampPoint, followPoint, distance, driveRemoteCar });
})(globalThis);
