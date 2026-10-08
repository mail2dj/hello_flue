import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { CustomerSupport } from "./agents/cs.ts";
import * as fs from "node:fs";
import * as path from "node:path";

// .dev.vars 및 .env 환경 변수 로드 보장
for (const envFile of [".dev.vars", ".env"]) {
  try {
    const fullPath = path.resolve(envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const [k, ...v] = line.trim().split("=");
        if (k && v.length && !process.env[k]) {
          process.env[k] = v.join("=");
        }
      }
    }
  } catch {}
}

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("/agents/*", async (context, next) => {
  if (context.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  const auth = context.req.header("Authorization");

  if (!auth?.includes("TRUSTME")) {
    return context.json({ error: "Not Allowed" }, 401);
  }

  await next();
});

const agentRouter = createAgentRouter(CustomerSupport);

app.route("/agents", agentRouter);
app.route("/agents/cs", agentRouter);

// /agents/cs 단독 호출 시 /agents/cs/default 로 포워딩 (404 방지)
app.all("/agents/cs", (c) => {
  const url = new URL(c.req.url);
  url.pathname = "/agents/cs/default";
  return app.fetch(new Request(url.toString(), c.req.raw));
});

export default app;
