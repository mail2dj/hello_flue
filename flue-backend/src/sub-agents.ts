import { defineSubagent } from "@flue/runtime";

function Optimist() {
  return `
    Evaluate the idea from an optimistic perspective.

    Find:
    - The strongest opportunity
    - Who would want it
    - Why it could succeed
    - One way to make it stronger

    Return a concise analysis.
  `;
}

export const optimisticSubAgent = defineSubagent({
  name: "optimistic_subagent",
  description: "Evaluates ideas from an optimistic perspective.",
  agent: Optimist,
});

function Skeptic() {
  return `
    Evaluate the idea from a skeptical perspective.

    Find:
    - The weakest assumption
    - The largest practical risk
    - Why users might reject it
    - One question that must be answered

    Be critical but fair.
  `;
}

export const skepticSubAgent = defineSubagent({
  name: "skeptic_subagent",
  description: "Evaluates ideas from an skeptic perspective.",
  agent: Skeptic,
});
