import { describe, expect, it } from "vitest";
import { sampleUIDL } from "./fixtures/sampleUIDL";
import { deleteNode, findNode, insertNode, updateNode } from "../src/utils/uidlEditor";
import { UIDLComponentType } from "../src/types/uidl";

describe("uidlEditor", () => {
  const baseTree = sampleUIDL.nodeUIDL;

  it("finds nodes by predicate and returns parent info", () => {
    const result = findNode(baseTree, (node) => node.id === "action");
    expect(result?.parent?.id).toBe("header");
    expect(result?.path).toEqual([0, 1]);
  });

  it("inserts nodes at requested position", () => {
    const { updatedRoot, inserted } = insertNode(
      baseTree,
      (node) => node.id === "content",
      {
        id: "new-card",
        type: UIDLComponentType.Container,
        children: [{ type: UIDLComponentType.Text, textContent: { kind: "literal", value: "card" } }],
      },
      { position: 1 },
    );

    expect(inserted).toBe(true);
    const content = updatedRoot.children?.find((child) => child.id === "content");
    expect(content?.children?.[1]?.id).toBe("new-card");
  });

  it("updates nodes deeply and merges props", () => {
    const { updatedRoot, updated } = updateNode(baseTree, (node) => node.id === "input", {
      props: { placeholder: { kind: "literal", value: "更新提示" } },
      meta: { touched: true },
    });

    expect(updated).toBe(true);
    const input = findNode(updatedRoot, (node) => node.id === "input")?.node;
    expect(input?.props?.placeholder).toEqual({ kind: "literal", value: "更新提示" });
    expect(input?.meta?.touched).toBe(true);
  });

  it("deletes node and returns removed reference", () => {
    const { updatedRoot, removedNode } = deleteNode(baseTree, (node) => node.id === "list");
    expect(removedNode?.id).toBe("list");
    const stillThere = findNode(updatedRoot as NonNullable<typeof updatedRoot>, (node) => node.id === "list");
    expect(stillThere).toBeUndefined();
  });
});
