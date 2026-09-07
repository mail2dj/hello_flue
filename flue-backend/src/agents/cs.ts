"use agent";
import {
  useAgentFinish,
  useAgentStart,
  useDataWriter,
  useDelivery,
  useInitialData,
  useModel,
  usePersistentState,
  useResponseFinish,
  useResponseStart,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";

export function CustomerSupport() {
  const { name } = useInitialData<{ name: string }>();
  // const message = useDelivery();
  const [mode, setMode] = usePersistentState<"fast" | "slow">("mode", "slow");
  const writeProgress = useDataWriter("progress", {
    schema: v.object({
      stage: v.string(),
    }),
  });
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
  useTool({
    name: "durable_tool",
    description: "This is to add a and b",
    durable: true,
    async run({ step }) {
      console.log("starting tool");

      console.log(Date.now());

      const expensiveValue = await step.do("expensive_calc", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return 1;
      });

      console.log(Date.now());

      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log(expensiveValue);
    },
  });

  useAgentStart(({ log }) => {
    log.info("Delivery started");
  });

  useResponseStart(() => ({
    startedAt: new Date().toISOString(),
  }));

  useResponseFinish(({ response }) => ({
    usage: response.usage,
  }));

  useAgentFinish(({ response, log }) => {
    log.info("Agent finished", {
      toolCalls: response.toolCalls.length,
    });
  });

  return `You are a customer support agent and now youre helping ${name}`;
}

CustomerSupport.initialData = v.object({
  name: v.string(),
});
