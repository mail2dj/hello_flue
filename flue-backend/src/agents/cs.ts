"use agent";
import { useInitialData, useModel } from "@flue/runtime";
import * as v from "valibot";

export function CustomerSupport() {
  const { name } = useInitialData<{ name: string }>();
  useModel("cloudflare/@cf/meta/llama-3.2-3b-instruct");
  return `You are a customer support agent and now youre helping ${name}`;
}

CustomerSupport.initialData = v.object({
  name: v.string(),
});
