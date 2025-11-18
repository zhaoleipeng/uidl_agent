import { describe, expect, it } from "vitest";
import { sampleUIDL } from "./fixtures/sampleUIDL";
import { ensureNode, safeValidateUIDLDocument, validateUIDLDocument } from "../src/utils/uidlSchema";

describe("uidlSchema", () => {
  it("validates full UIDL document with complex sections", () => {
    const parsed = validateUIDLDocument(sampleUIDL);
    expect(parsed.nodeUIDL.children?.length).toBeGreaterThan(0);
    expect(parsed.observerDataSources?.[0].triggers).toContain("load");
  });

  it("returns safe parse errors for invalid payloads", () => {
    const result = safeValidateUIDLDocument({});
    expect(result.success).toBe(false);
  });

  it("ensures nested nodes are normalized", () => {
    const node = ensureNode({ type: "text", children: [{ type: "button" }] });
    expect(node.children?.[0].type).toBe("button");
  });
});
