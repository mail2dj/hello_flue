"use agent";
import { useDelivery, useInitialData, useModel } from "@flue/runtime";
import * as v from "valibot";

export function CustomerSupport() {
  const { name } = useInitialData<{ name: string }>();
  const message = useDelivery();
  useModel(
    message.body.includes("/fast")
      ? "cloudflare/@cf/zai-org/glm-5.3-flash"
      : "cloudflare/@cf/zai-org/glm-5.3",
  );
  return `You are a customer support agent and now youre helping ${name}`;
}

CustomerSupport.initialData = v.object({
  name: v.string(),
});
