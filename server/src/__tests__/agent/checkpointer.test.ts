import { MemorySaver } from "@langchain/langgraph";
import {
  getCheckpointer,
  resetCheckpointerCache,
} from "../../services/agent/checkpointer.js";

describe("getCheckpointer", () => {
  const previous = process.env.AGENT_CHECKPOINT_URL;

  beforeEach(() => {
    resetCheckpointerCache();
    delete process.env.AGENT_CHECKPOINT_URL;
  });

  afterEach(() => {
    resetCheckpointerCache();
    if (previous === undefined) {
      delete process.env.AGENT_CHECKPOINT_URL;
    } else {
      process.env.AGENT_CHECKPOINT_URL = previous;
    }
  });

  it("returns a MemorySaver when no URL is configured", async () => {
    await expect(getCheckpointer()).resolves.toBeInstanceOf(MemorySaver);
  });

  it("caches the saver across calls", async () => {
    const first = await getCheckpointer();
    const second = await getCheckpointer();
    expect(second).toBe(first);
  });

  it("rejects when Postgres is unreachable", async () => {
    process.env.AGENT_CHECKPOINT_URL = "postgres://127.0.0.1:1/agent_checkpoints";
    await expect(getCheckpointer()).rejects.toThrow();
  }, 15000);
});
