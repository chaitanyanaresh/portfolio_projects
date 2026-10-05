import assert from "node:assert/strict";
import test from "node:test";
import { SubAgentCoordinator } from "./src/coordinator.js";
import { interviewPracticeAgent } from "./src/interviewPracticeAgent.js";

test("routes a matching task to the specialist", async () => {
  const coordinator = new SubAgentCoordinator();
  coordinator.register(interviewPracticeAgent);

  const result = await coordinator.dispatch(
    {
      taskId: "task-1",
      taskType: "prepare_interview",
      userId: "user-1",
      payload: {
        role: "Backend Engineer",
        skills: ["Java"],
        mode: "both",
      },
    },
    {
      authenticatedUserId: "user-1",
    },
  );

  assert.equal(result.status, "completed");
  assert.equal(
    result.agentId,
    "interview-practice-specialist",
  );
  assert.equal(
    result.result.questions.length,
    2,
  );
});

test("rejects a cross-user task", async () => {
  const coordinator = new SubAgentCoordinator();
  coordinator.register(interviewPracticeAgent);

  const result = await coordinator.dispatch(
    {
      taskId: "task-1",
      taskType: "prepare_interview",
      userId: "user-1",
      payload: {
        role: "Backend Engineer",
        skills: ["Java"],
        mode: "theory",
      },
    },
    {
      authenticatedUserId: "other-user",
    },
  );

  assert.deepEqual(result, {
    status: "denied",
    reason: "USER_MISMATCH",
    agentId: "interview-practice-specialist",
  });
});

test("keeps risky capabilities explicitly blocked", () => {
  const blocked =
    interviewPracticeAgent.descriptor.forbiddenCapabilities;

  for (const capability of [
    "submit_application",
    "external_network",
    "read_credentials",
    "read_raw_sensitive_data",
    "activate_paid_service",
  ]) {
    assert.equal(blocked.includes(capability), true);
  }
});
