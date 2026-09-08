"use agent";
import { bash, useModel, useSandbox } from "@flue/runtime";
import { Bash, InMemoryFs } from "just-bash";

const files = {
  "/potatos/brief.md": `
# Monthly sales report

Analyze the sales data.
Calculate total revenue and revenue by product.
Write the results to report.md.
  `.trim(),
  "/potatos/sales.csv": `
product,revenue
Keyboard,1200
Monitor,2400
Keyboard,800
Mouse,600
Monitor,1600
  `.trim(),
};

export function CustomerSupport() {
  useModel("cloudflare/@cf/zai-org/glm-5.3");
  useSandbox(
    bash(
      () =>
        new Bash({
          fs: new InMemoryFs(files),
        }),
    ),
    {
      cwd: "/potatos",
    },
  );
  return `You are a helper agent that helps the user with files and accounting`;
}
