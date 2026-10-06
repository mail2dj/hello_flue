"use agent";
import {
  useDataWriter,
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
  
  // 👉 여기에 "progress" 이름 전달!
  const writeProgress = useDataWriter("progress");

  const [mode, setMode] = usePersistentState<"fast" | "slow">("mode", "slow");
  useModel(
    mode === "fast"
      ? "openrouter/deepseek/deepseek-chat"
      : "openrouter/deepseek/deepseek-r1",
    {
      compaction: {
        model: "openrouter/deepseek/deepseek-chat",
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
      writeProgress({
        stage: "Starting...",
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      writeProgress({
        stage: "Finishing...",
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      writeProgress({
        stage: "Done.",
      });

      return {
        output: {
          result: a + b,
        },
      };
    },
  });

  return `You are a customer support agent helping ${name}. 
  IMPORTANT: You must speak ONLY pure Korean. Never speak Chinese or output your thoughts.`;
}

CustomerSupport.initialData = v.object({
  name: v.string(),
});