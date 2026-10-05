import { SubAgentCoordinator } from "./src/coordinator.js";
import { interviewPracticeAgent } from "./src/interviewPracticeAgent.js";

const coordinator = new SubAgentCoordinator();
coordinator.register(interviewPracticeAgent);

const task = {
  taskId: "demo-task-1",
  taskType: "prepare_interview",
  userId: "demo-user",
  payload: {
    role: "Full Stack Engineer",
    skills: ["Java", "Kafka", "React"],
    mode: "both",
  },
};

const result = await coordinator.dispatch(task, {
  authenticatedUserId: "demo-user",
});

console.log("Registered sub-agents:");
console.table(coordinator.describe());

console.log("\nResult:");
console.dir(result, {
  depth: null,
});
