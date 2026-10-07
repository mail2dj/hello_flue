import * as path from "node:path";

let currentWorkspaceDir = "C:/Users/mail2/Documents/sandBox";

export function getWorkspaceDir(): string {
  return currentWorkspaceDir;
}

export function setWorkspaceDir(dir: string): string {
  const normalized = dir.trim().replace(/\\/g, "/");
  currentWorkspaceDir = path.resolve(normalized);
  return currentWorkspaceDir;
}
