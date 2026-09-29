"use agent";
// import { getSandbox, type Sandbox as SandboxDO } from "@cloudflare/sandbox";
// import { env } from "cloudflare:workers";
// import { type AgentProps, useModel, useSandbox } from "@flue/runtime";
// import { cloudflareSandbox } from "@flue/runtime/cloudflare";

// interface Env {
//   Sandbox: DurableObjectNamespace<SandboxDO>;
// }

// export function CustomerSupport({ id }: AgentProps) {
//   useModel("cloudflare/@cf/zai-org/glm-5.3");
//   const { Sandbox } = env as unknown as Env;
//   useSandbox(cloudflareSandbox(getSandbox(Sandbox, id)));

//   return `You are a helper agent that helps the user with files and accounting`;
// }

import { useModel } from "@flue/runtime";
import { env } from "cloudflare:workers";

interface Env {
  AI?: unknown;
  AI_PROVIDER?: string;
  OPENAI_API_KEY?: string;
}

export function Hello() {
  const workerEnv = env as unknown as Env;

  // 1. Cloudflare 무료 AI(Workers AI) 우선 사용
  // 2. Cloudflare AI가 없거나 비활성화(AI_PROVIDER="openai")된 경우 OpenAI로 fallback
  const hasCloudflareAI = Boolean(workerEnv?.AI) && workerEnv?.AI_PROVIDER !== "openai";

  const selectedModel = hasCloudflareAI
    ? "cloudflare/@cf/zai-org/glm-4.7-flash"
    : (workerEnv?.OPENAI_API_KEY?.startsWith("sk-or-")
        ? "openrouter/openai/gpt-4o-mini"
        : "openai/gpt-4o-mini");

  useModel(selectedModel);

  return "You are a helpful assistant. Answer the user directly in plain text.";
}
