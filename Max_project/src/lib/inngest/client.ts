import { Inngest } from "inngest";
import { serverEnv } from "@/lib/env";

export const inngest = new Inngest({
  id: "lifemax-os",
  eventKey: serverEnv.inngestEventKey
});
