import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { CustomerSupport } from "./agents/cs";
import { getWorkspaceDir, setWorkspaceDir } from "./workspace";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("/*", async (context, next) => {
  if (context.req.method === "OPTIONS") {
    return context.text("", 204);
  }
  const auth = context.req.header("Authorization");

  if (!auth?.includes("TRUSTME")) {
    return context.json({ error: "Not Allowed" }, 401);
  }

  await next();
});

// 현재 활성화된 작업 디렉토리 조회 API
app.get("/api/sandbox/dir", (c) => {
  return c.json({ ok: true, dir: getWorkspaceDir() });
});

// 작업 디렉토리 동적 변경 API
app.post("/api/sandbox/dir", async (c) => {
  try {
    const body = await c.req.json();
    const newDir = body.dir;
    if (!newDir || typeof newDir !== "string") {
      return c.json({ ok: false, error: "Invalid directory path" }, 400);
    }
    const resolved = setWorkspaceDir(newDir);
    await fs.mkdir(resolved, { recursive: true });
    return c.json({ ok: true, dir: resolved });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// 재귀적으로 작업 디렉토리 내 모든 파일과 폴더 탐색
async function getFilesRecursively(
  dir: string,
  baseDir: string = dir
): Promise<Array<{ name: string; path: string; isDir: boolean; size: number }>> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let results: Array<{ name: string; path: string; isDir: boolean; size: number }> = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        results.push({ name: entry.name, path: relPath, isDir: true, size: 0 });
        const subFiles = await getFilesRecursively(fullPath, baseDir);
        results = results.concat(subFiles);
      } else {
        const stat = await fs.stat(fullPath);
        results.push({ name: entry.name, path: relPath, isDir: false, size: stat.size });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// 1. 물리적 파일 목록 조회 API
app.get("/api/sandbox/files", async (c) => {
  const currentDir = getWorkspaceDir();
  await fs.mkdir(currentDir, { recursive: true });
  const files = await getFilesRecursively(currentDir);
  return c.json({ ok: true, files, sandboxDir: currentDir });
});

// 2. 선택한 파일/디렉토리 물리적 저장 API
app.post("/api/sandbox/upload", async (c) => {
  try {
    const currentDir = getWorkspaceDir();
    const body = await c.req.json();
    const files = body.files as Array<{ path: string; content: string }>;

    if (!Array.isArray(files) || files.length === 0) {
      return c.json({ ok: false, error: "No files provided" }, 400);
    }

    const uploaded: string[] = [];

    for (const file of files) {
      const targetPath = path.join(currentDir, file.path);
      // 보안: 현재 작업 디렉토리 밖으로 벗어나는 상위 경로 탈출 방지
      if (!path.resolve(targetPath).startsWith(path.resolve(currentDir))) {
        continue;
      }
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, file.content, "utf8");
      uploaded.push(file.path);
    }

    return c.json({ ok: true, uploaded, sandboxDir: currentDir });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// 3. 파일/폴더 삭제 API
app.delete("/api/sandbox/file", async (c) => {
  const currentDir = getWorkspaceDir();
  const filePath = c.req.query("path");
  if (!filePath) return c.json({ ok: false, error: "Path missing" }, 400);

  const targetPath = path.join(currentDir, filePath);
  if (!path.resolve(targetPath).startsWith(path.resolve(currentDir))) {
    return c.json({ ok: false, error: "Invalid path" }, 403);
  }

  try {
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ ok: false, error: e.message }, 500);
  }
});

const agentRouter = createAgentRouter(CustomerSupport);

app.route("/agents/cs", agentRouter);
app.route("/agents", agentRouter);
app.route("/", agentRouter);

export default app;
