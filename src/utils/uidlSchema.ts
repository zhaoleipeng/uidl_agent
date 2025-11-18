import { z } from "zod";
import {
  UIDLComponentType,
  UIDLDataSourceType,
  UIDLDocument,
  UIDLEventType,
  UIDLExpression,
  UIDLNode,
  UIDLResourceStrategy,
  UIDLResourceType,
} from "../types/uidl";

const literalExpressionSchema = z
  .object({
    kind: z.literal("literal"),
    value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.unknown()), z.record(z.unknown())]),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const expressionSchema: z.ZodType<UIDLExpression> = z.lazy(() =>
  z
    .union([
      literalExpressionSchema,
      z
        .object({
          kind: z.literal("binding"),
          path: z.string(),
          fallback: z
            .union([literalExpressionSchema, z.string(), z.number(), z.boolean(), z.null(), expressionSchema])
            .optional(),
          meta: z.record(z.unknown()).optional(),
        })
        .passthrough(),
      z
        .object({
          kind: z.literal("computed"),
          source: z.string(),
          args: z.array(z.lazy(() => expressionSchema)).optional(),
          meta: z.record(z.unknown()).optional(),
        })
        .passthrough(),
    ])
    .or(z.string().transform((value) => ({ kind: "literal", value })))
    .or(z.number().transform((value) => ({ kind: "literal", value })))
    .or(z.boolean().transform((value) => ({ kind: "literal", value })))
    .or(z.null().transform((value) => ({ kind: "literal", value }))),
);

const eventActionSchema = z
  .object({
    name: z.string(),
    args: z.record(expressionSchema).optional(),
    code: z.string().optional(),
    targetDataSourceId: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const eventOptionsSchema = z
  .object({
    debounceMs: z.number().optional(),
    throttleMs: z.number().optional(),
    once: z.boolean().optional(),
    stopPropagation: z.boolean().optional(),
    preventDefault: z.boolean().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const eventSchema = z
  .object({
    type: z.union([z.nativeEnum(UIDLEventType), z.string()]),
    actions: z.array(eventActionSchema),
    options: eventOptionsSchema.optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const nodeSchema: z.ZodType<UIDLNode> = z.lazy(() =>
  z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      key: z.string().optional(),
      type: z.union([z.nativeEnum(UIDLComponentType), z.string()]),
      props: z.record(expressionSchema).optional(),
      bindings: z.record(expressionSchema).optional(),
      children: z.array(z.lazy(() => nodeSchema)).optional(),
      events: z.array(eventSchema).optional(),
      dataSourceId: z.string().optional(),
      condition: expressionSchema.optional(),
      textContent: expressionSchema.optional(),
      meta: z.record(z.unknown()).optional(),
    })
    .passthrough(),
);

const dataSourceSchema = z
  .object({
    id: z.string(),
    type: z.union([z.nativeEnum(UIDLDataSourceType), z.string()]),
    url: z.string().optional(),
    method: z.string().optional(),
    headers: z.record(expressionSchema).optional(),
    params: z.record(expressionSchema).optional(),
    body: expressionSchema.optional(),
    pollingIntervalMs: z.number().optional(),
    initialValue: z.unknown().optional(),
    mapping: expressionSchema.optional(),
    description: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const observerDataSourceSchema = dataSourceSchema
  .extend({
    type: z.union([z.literal(UIDLDataSourceType.Observer), z.string()]),
    triggers: z.array(z.union([z.nativeEnum(UIDLEventType), z.string()])).optional(),
    watch: z.array(z.string()).optional(),
  })
  .passthrough();

const resourceSchema = z
  .object({
    id: z.string().optional(),
    type: z.union([z.nativeEnum(UIDLResourceType), z.string()]),
    path: z.string(),
    strategy: z.union([z.nativeEnum(UIDLResourceStrategy), z.string()]).optional(),
    integrity: z.string().optional(),
    crossorigin: z.enum(["anonymous", "use-credentials"]).optional(),
    async: z.boolean().optional(),
    defer: z.boolean().optional(),
    media: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

const flowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    entryNodeId: z.string(),
    description: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const uidlDocumentSchema = z
  .object({
    version: z.string(),
    name: z.string().optional(),
    importMaps: z.record(z.string()).optional(),
    nodeUIDL: nodeSchema,
    resources: z.array(resourceSchema).optional(),
    dataSources: z.array(dataSourceSchema).optional(),
    observerDataSources: z.array(observerDataSourceSchema).optional(),
    flows: z.array(flowSchema).optional(),
    containers: z.array(nodeSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

export function validateUIDLDocument(data: unknown): UIDLDocument {
  return uidlDocumentSchema.parse(data);
}

export function safeValidateUIDLDocument(data: unknown) {
  return uidlDocumentSchema.safeParse(data);
}

export function ensureNode(input: unknown): UIDLNode {
  return nodeSchema.parse(input);
}

export function ensureExpression(input: unknown): UIDLExpression {
  return expressionSchema.parse(input);
}
