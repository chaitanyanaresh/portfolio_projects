export const interviewPracticeAgent = {
  descriptor: {
    agentId: "interview-practice-specialist",
    taskType: "prepare_interview",
    allowedCapabilities: [
      "read_sanitized_context",
      "generate_practice_questions",
      "create_local_practice_plan",
    ],
    forbiddenCapabilities: [
      "submit_application",
      "external_network",
      "read_credentials",
      "read_raw_sensitive_data",
      "activate_paid_service",
    ],
  },

  async execute(task) {
    const {
      role,
      skills = [],
      mode = "both",
    } = task.payload;

    const theoryQuestions = skills.map((skill) => ({
      type: "theory",
      prompt: `Explain the core concepts, tradeoffs, and failure modes of ${skill} for a ${role} interview.`,
    }));

    const codingQuestions = skills.map((skill) => ({
      type: "coding",
      prompt: `Create a small coding or pseudocode exercise involving ${skill}, including edge cases and tests.`,
    }));

    const questions =
      mode === "theory"
        ? theoryQuestions
        : mode === "coding"
          ? codingQuestions
          : [...theoryQuestions, ...codingQuestions];

    return {
      role,
      mode,
      questions,
      safety: {
        externalNetworkAllowed: false,
        paidServicesAllowed: false,
        employerSubmissionAllowed: false,
      },
    };
  },
};
