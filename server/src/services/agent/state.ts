import { Annotation, addMessages } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Shared agent state. `storeId`/`role`/`userId` are always set from the
 * authenticated request — never from model output — so every tool call stays
 * tenant-scoped and role-aware.
 */
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: addMessages,
    default: () => [],
  }),
  intent: Annotation<string>({
    reducer: (_prev, next) => next ?? "",
    default: () => "",
  }),
  storeId: Annotation<number | null>({
    reducer: (_prev, next) => next ?? null,
    default: () => null,
  }),
  role: Annotation<string>({
    reducer: (_prev, next) => next ?? "client",
    default: () => "client",
  }),
  userId: Annotation<number | null>({
    reducer: (_prev, next) => next ?? null,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
