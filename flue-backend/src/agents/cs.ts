"use agent";
import {
  defineMcpConnection,
  defineSkill,
  useMcpConnection,
  useModel,
  useSkill,
} from "@flue/runtime";
import cavemanSkill from "../skills/caveman/SKILL.md";

const pirateSkill = defineSkill({
  name: "pirate",
  description:
    "Speak like a pirate, use this when the user asks for a pirate explanation.",
  instructions: `
  Explain the subject using nautical metaphors and occasional
  pirate expressions.

  Keep all technical information accurate.
  Keep the response easy to understand.
  Do not turn every word into pirate slang.
  Finish with "Arrr!"
  `,
});

const cloudflareMcpConnection = defineMcpConnection({
  name: "cloudflare_docs",
  url: "https://docs.mcp.cloudflare.com/mcp",
});

export function CustomerSupport() {
  useSkill(cavemanSkill);
  useMcpConnection(cloudflareMcpConnection);
  useSkill(pirateSkill);
  useModel("cloudflare/@cf/zai-org/glm-5.3-flash");

  return `You are a customer support agent.`;
}
