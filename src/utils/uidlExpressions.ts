import {
  UIDLBindingExpression,
  UIDLEventAction,
  UIDLEventDefinition,
  UIDLEventType,
  UIDLExpression,
  UIDLLiteralExpression,
} from "../types/uidl";

const bindingPattern = /^\s*\{\{\s*(.+?)\s*\}\}\s*$/;

export function parseExpression(input: unknown): UIDLExpression {
  if (isUIDLExpression(input)) {
    return input;
  }

  if (typeof input === "string") {
    const bindingMatch = input.match(bindingPattern);
    if (bindingMatch) {
      const [, path] = bindingMatch;
      return { kind: "binding", path: path.trim() } satisfies UIDLBindingExpression;
    }
    return { kind: "literal", value: input } satisfies UIDLLiteralExpression;
  }

  if (typeof input === "number" || typeof input === "boolean" || input === null) {
    return { kind: "literal", value: input } satisfies UIDLLiteralExpression;
  }

  return { kind: "literal", value: input as Record<string, unknown> } satisfies UIDLLiteralExpression;
}

export function serializeExpression(expression: UIDLExpression): unknown {
  if (expression.kind === "literal") {
    return expression.value;
  }

  if (expression.kind === "binding") {
    return `{{ ${expression.path} }}`;
  }

  return {
    kind: "computed",
    source: expression.source,
    args: expression.args?.map((arg) => serializeExpression(arg)),
    meta: expression.meta,
  };
}

export function normalizeEventDefinition(raw: UIDLEventDefinition | Record<string, unknown>): UIDLEventDefinition {
  const candidate = raw as UIDLEventDefinition & { handler?: unknown };
  const type = candidate.type ?? UIDLEventType.Custom;
  const actions: UIDLEventAction[] = Array.isArray(candidate.actions)
    ? candidate.actions
    : candidate.handler
      ? [{ name: "handler", code: String(candidate.handler) }]
      : [];

  const normalizedActions = actions.map((action) => ({
    ...action,
    args: action.args ? mapExpressionRecord(action.args) : undefined,
  }));

  return {
    ...candidate,
    type,
    actions: normalizedActions,
  };
}

export function serializeEventDefinition(event: UIDLEventDefinition): Record<string, unknown> {
  return {
    ...event,
    actions: event.actions?.map((action) => ({
      ...action,
      args: action.args ? mapSerializedExpressionRecord(action.args) : undefined,
    })),
  };
}

function isUIDLExpression(value: unknown): value is UIDLExpression {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as UIDLExpression).kind !== undefined
  );
}

function mapExpressionRecord(record: Record<string, unknown>): Record<string, UIDLExpression> {
  return Object.entries(record).reduce<Record<string, UIDLExpression>>((acc, [key, value]) => {
    acc[key] = parseExpression(value);
    return acc;
  }, {});
}

function mapSerializedExpressionRecord(record: Record<string, UIDLExpression>): Record<string, unknown> {
  return Object.entries(record).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = serializeExpression(value);
    return acc;
  }, {});
}
