"use agent";
import { useModel } from "@flue/runtime";

// Every exported capitalized function in a 'use agent' module is an agent,
// and the function's name is its durable identity. The return value is the
// agent's system prompt.
export function Hello() {
  // Cloudflare Workers AI model via the env.AI binding — no API key needed
  // on the Cloudflare target. The `cloudflare` provider accepts any @cf/ ID.
  useModel("cloudflare/@cf/zai-org/glm-5.3-flash");
  return "You are a helpful assistant. Keep replies short.";
}
