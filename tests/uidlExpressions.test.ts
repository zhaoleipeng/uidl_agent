import { describe, expect, it } from "vitest";
import {
  normalizeEventDefinition,
  parseExpression,
  serializeEventDefinition,
  serializeExpression,
} from "../src/utils/uidlExpressions";
import { UIDLEventType } from "../src/types/uidl";

describe("uidlExpressions", () => {
  it("parses binding and literal expressions", () => {
    expect(parseExpression("{{ user.name }}")).toEqual({ kind: "binding", path: "user.name" });
    expect(parseExpression("text")).toEqual({ kind: "literal", value: "text" });
    expect(parseExpression(true)).toEqual({ kind: "literal", value: true });
  });

  it("serializes expressions back to original format", () => {
    expect(serializeExpression({ kind: "binding", path: "task.id" })).toBe("{{ task.id }}");
    expect(serializeExpression({ kind: "literal", value: 3 })).toBe(3);
  });

  it("normalizes event definitions with fallback handler", () => {
    const normalized = normalizeEventDefinition({
      type: UIDLEventType.Click,
      handler: "console.log('clicked')",
    });

    expect(normalized.actions).toEqual([
      {
        name: "handler",
        code: "console.log('clicked')",
        args: undefined,
      },
    ]);
  });

  it("serializes event definitions with expression arguments", () => {
    const normalized = normalizeEventDefinition({
      type: UIDLEventType.Change,
      actions: [
        {
          name: "update",
          args: { value: "{{ input.value }}" },
        },
      ],
    });

    const serialized = serializeEventDefinition(normalized);
    expect(serialized.actions?.[0].args).toEqual({ value: "{{ input.value }}" });
  });
});
