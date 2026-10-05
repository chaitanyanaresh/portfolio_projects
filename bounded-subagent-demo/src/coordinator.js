export class SubAgentCoordinator {
  #agents = new Map();

  register(agent) {
    const { taskType } = agent.descriptor;

    if (this.#agents.has(taskType)) {
      throw new Error("TASK_TYPE_ALREADY_REGISTERED");
    }

    this.#agents.set(taskType, agent);
  }

  async dispatch(task, context) {
    const agent = this.#agents.get(task.taskType);

    if (!agent) {
      return {
        status: "denied",
        reason: "SUB_AGENT_NOT_REGISTERED",
      };
    }

    if (task.userId !== context.authenticatedUserId) {
      return {
        status: "denied",
        reason: "USER_MISMATCH",
        agentId: agent.descriptor.agentId,
      };
    }

    return {
      status: "completed",
      agentId: agent.descriptor.agentId,
      result: await agent.execute(task, context),
    };
  }

  describe() {
    return Array.from(this.#agents.values(), (agent) => ({
      ...agent.descriptor,
      allowedCapabilities: [
        ...agent.descriptor.allowedCapabilities,
      ],
      forbiddenCapabilities: [
        ...agent.descriptor.forbiddenCapabilities,
      ],
    }));
  }
}
