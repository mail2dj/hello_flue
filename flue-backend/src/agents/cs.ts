"use agent";
import { getSandbox, type Sandbox as SandboxDO } from "@cloudflare/sandbox";
import { env } from "cloudflare:workers";
import { type AgentProps, useModel, useSandbox } from "@flue/runtime";
import { cloudflareSandbox } from "@flue/runtime/cloudflare";

interface Env {
  Sandbox: DurableObjectNamespace<SandboxDO>;
}

export function CustomerSupport({ id }: AgentProps) {
  useModel("cloudflare/@cf/zai-org/glm-5.3");
  const { Sandbox } = env as unknown as Env;
  useSandbox(cloudflareSandbox(getSandbox(Sandbox, id)));

  return `You are a helper agent that helps the user with files and accounting`;
}
