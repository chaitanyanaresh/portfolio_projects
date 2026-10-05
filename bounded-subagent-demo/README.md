# Bounded Sub-Agent Demo

A small, zero-dependency JavaScript project showing how a **coordinator can route one task to a narrowly scoped specialist sub-agent**.

This repository example is intentionally generic. It does not contain private product code, proprietary prompts, production credentials, private datasets, or employer-application automation.

## Why build sub-agents?

A single all-powerful agent is difficult to reason about. A bounded sub-agent has one job and a small capability surface.

In this demo:

```text
User task
   |
   v
Sub-Agent Coordinator
   |
   +--> Interview Practice Specialist
           |
           +-- allowed: sanitized context
           +-- allowed: practice questions
           +-- allowed: local practice plan
           |
           +-- blocked: employer submission
           +-- blocked: external network
           +-- blocked: credentials
           +-- blocked: raw sensitive data
           +-- blocked: paid-service activation
```

The coordinator performs routing and user binding. The specialist does not automatically inherit every capability in the system.

## What is a sub-agent?

A sub-agent is a focused software component that receives a specific task from a coordinator.

It is useful when you want to separate responsibilities such as:

- interview practice
- resume analysis
- learning recommendations
- job analysis
- document review

Instead of giving every specialist unrestricted access, each sub-agent can have an explicit capability contract.

## Run it

Requires Node.js 18 or newer.

```bash
cd bounded-subagent-demo
npm test
npm run demo
```

No package installation is required because the demo uses only built-in Node.js functionality.

## Example task

```js
const task = {
  taskType: "prepare_interview",
  userId: "demo-user",
  payload: {
    role: "Full Stack Engineer",
    skills: ["Java", "Kafka", "React"],
    mode: "both",
  },
};
```

The coordinator finds the registered specialist for `prepare_interview`, confirms the authenticated user matches the task owner, and then delegates only that task.

## Design principles

1. **Least privilege**  
   Give a sub-agent only the capabilities needed for its job.

2. **Explicit boundaries**  
   Keep allowed and forbidden capabilities visible in code.

3. **User isolation**  
   Reject a task when its user does not match the authenticated user.

4. **No implicit external access**  
   This demo performs no network calls.

5. **Human-controlled high-impact actions**  
   The example specialist cannot submit an application or perform another high-impact external action.

6. **Simple before autonomous**  
   A coordinator plus deterministic specialist is often easier to test than a collection of unrestricted autonomous agents.

## What this demo intentionally does not do

This is an architecture example, not an autonomous job-application system. It does not:

- log into websites
- bypass CAPTCHA
- submit job applications
- access email
- store credentials
- call an LLM
- use paid APIs or cloud services

## Suggested extension

A production system could register additional specialists behind the same coordinator, each with its own bounded contract:

```text
Coordinator
  |-- Interview Practice Agent
  |-- Resume Review Agent
  |-- Learning Agent
  |-- Job Analysis Agent
  `-- Application Review Agent
```

The important idea is not the number of agents. It is that each agent receives the smallest useful scope.

## License

This demo is provided as a portfolio learning example. Review and adapt it for your own security and compliance requirements before production use.
