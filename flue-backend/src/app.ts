import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { Hello } from "./agents/hello.ts";

const app = new Hono();

app.route("/hello/world", createAgentRouter(Hello));
app.route("/agents", createAgentRouter(Hello));

export default app;
