"use agent";
import { useModel, useSubagent } from "@flue/runtime";
import { optimisticSubAgent, skepticSubAgent } from "../sub-agents";

export function CustomerSupport() {
  useModel("cloudflare/@cf/zai-org/glm-5.3-flash");
  useSubagent(optimisticSubAgent);
  useSubagent({
    ...skepticSubAgent,
    model: "cloudflare/@cf/deepseek-ai/deepseek-v4-pro-0813",
    thinkingLevel: "high",
  });
  return `You are a advisor  agent. and you help users with ideas, and you analyze them with your team of advisors.`;
}
