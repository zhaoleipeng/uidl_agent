import { describe, expect, it } from "vitest";
import { createAgent } from "../src/agent";
import { sampleUIDL } from "./fixtures/sampleUIDL";

const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };

describe("agent pipeline", () => {
  it("builds understanding, todos, knowledge plan and edit plan", async () => {
    const requirements = "添加任务搜索能力\n保持列表可点击";
    const agent = createAgent(silentLogger);

    const result = await agent.run({ requirements, uidl: sampleUIDL });

    expect(result.updatedUIDL?.agentNotes?.understanding).toContain("原始需求: 添加任务搜索能力\n保持列表可点击");
    expect(result.updatedUIDL?.agentNotes?.todos?.length).toBeGreaterThan(1);
    expect(result.updatedUIDL?.agentNotes?.retrievalPlan?.targets).toContain("nodeUIDL");
    expect(result.updatedUIDL?.agentNotes?.editPlan?.length).toBeGreaterThan(0);
    expect(result.suggestions?.some((item) => item.includes("编辑计划"))).toBe(true);
  });

  it("returns guidance when no explicit todo is found", async () => {
    const agent = createAgent(silentLogger);
    const result = await agent.run({ requirements: "   \n   ", uidl: sampleUIDL });

    expect(result.updatedUIDL?.agentNotes?.todos?.[1]).toContain("未找到明确Todo");
    expect(result.suggestions?.length).toBeGreaterThan(0);
  });
});
