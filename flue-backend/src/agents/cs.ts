"use agent";
import {
  useDelivery,
  useInitialData,
  useModel,
  usePersistentState,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";

export function CustomerSupport() {
  const { name } = useInitialData<{ name: string }>();
  // const message = useDelivery();
  const [mode, setMode] = usePersistentState<"fast" | "slow">("mode", "slow");
  useModel(
    mode === "fast"
      ? "cloudflare/@cf/zai-org/glm-5.3-flash"
      : "cloudflare/@cf/zai-org/glm-5.3",
    {
      compaction: {
        model: "cloudflare/@cf/zai-org/glm-5.3-flash",
      },
    },
  );
  useTool({
    name: "set_mode",
    description: "Use when the user wants to set the mode of the agent.",
    input: v.object({
      mode: v.picklist(["fast", "slow"]),
    }),
    async run({ data: { mode } }) {
      console.log("New mode is", mode);
      setMode(mode);
      return {
        output: `New mode set to ${mode}`,
      };
    },
  });
  useTool({
    name: "add",
    description: "This is to add a and b",
    input: v.object({
      a: v.number(),
      b: v.number(),
    }),
    output: v.object({
      result: v.number(),
    }),
    async run({ data: { a, b } }) {
      return {
        output: {
          result: a + b,
        },
      };
    },
  });
  return `You are a customer support agent and now youre helping ${name}`;
}

CustomerSupport.initialData = v.object({
  name: v.string(),
});
