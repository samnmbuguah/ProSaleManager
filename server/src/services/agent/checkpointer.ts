import { MemorySaver } from "@langchain/langgraph";
import type { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

export type AgentCheckpointer = MemorySaver | PostgresSaver;

let cached: Promise<AgentCheckpointer> | null = null;

async function initCheckpointer(): Promise<AgentCheckpointer> {
  const url = process.env.AGENT_CHECKPOINT_URL;
  if (!url) {
    return new MemorySaver();
  }
  // Imported lazily so test/dev environments without Postgres never load pg.
  const { PostgresSaver } = await import("@langchain/langgraph-checkpoint-postgres");
  const saver = PostgresSaver.fromConnString(url);
  await saver.setup();
  return saver;
}

/**
 * Returns the shared checkpointer. Postgres (via AGENT_CHECKPOINT_URL) when
 * configured, otherwise an in-process MemorySaver. Threads only survive a
 * restart with Postgres configured.
 */
export function getCheckpointer(): Promise<AgentCheckpointer> {
  if (!cached) {
    cached = initCheckpointer();
  }
  return cached;
}

/** Test helper: drops the cached saver so env changes take effect. */
export function resetCheckpointerCache(): void {
  cached = null;
}
