import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { Hello } from "./agents/hello.ts";

const app = new Hono();

app.use("/agents/*", async (context, next) => {
  const auth = context.req.header("Authorization");

  if (!auth?.includes("TRUSTME")) {
    return context.json({ error: "Not Allowed" }, 401);
  }

  await next();
});

app.route("/agents", createAgentRouter(Hello));

export default app;
