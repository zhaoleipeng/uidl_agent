export enum UIDLComponentType {
  Page = "page",
  Container = "container",
  Section = "section",
  Text = "text",
  Image = "image",
  Button = "button",
  Input = "input",
  List = "list",
  Form = "form",
  Custom = "custom",
}

export enum UIDLEventType {
  Click = "click",
  Change = "change",
  Submit = "submit",
  Load = "load",
  Focus = "focus",
  Blur = "blur",
  Hover = "hover",
  Select = "select",
  KeyDown = "keydown",
  KeyUp = "keyup",
  Custom = "custom",
}

export enum UIDLDataSourceType {
  Static = "static",
  REST = "rest",
  GraphQL = "graphql",
  WebSocket = "websocket",
  Function = "function",
  Observer = "observer",
}

export enum UIDLResourceType {
  Script = "script",
  Style = "style",
  Font = "font",
  Image = "image",
  Data = "data",
}

export enum UIDLResourceStrategy {
  Eager = "eager",
  Lazy = "lazy",
  Prefetch = "prefetch",
  Preload = "preload",
}

export type UIDLPrimitive = string | number | boolean | null;

export interface UIDLLiteralExpression {
  kind: "literal";
  value: UIDLPrimitive | UIDLPrimitive[] | Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface UIDLBindingExpression {
  kind: "binding";
  path: string;
  fallback?: UIDLPrimitive | UIDLExpression;
  meta?: Record<string, unknown>;
}

export interface UIDLComputedExpression {
  kind: "computed";
  source: string;
  args?: UIDLExpression[];
  meta?: Record<string, unknown>;
}

export type UIDLExpression = UIDLLiteralExpression | UIDLBindingExpression | UIDLComputedExpression;

export interface UIDLEventAction {
  name: string;
  args?: Record<string, UIDLExpression>;
  code?: string;
  targetDataSourceId?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLEventOptions {
  debounceMs?: number;
  throttleMs?: number;
  once?: boolean;
  stopPropagation?: boolean;
  preventDefault?: boolean;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLEventDefinition {
  type: UIDLEventType | string;
  actions: UIDLEventAction[];
  options?: UIDLEventOptions;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLDataSource {
  id: string;
  type: UIDLDataSourceType | string;
  url?: string;
  method?: string;
  headers?: Record<string, UIDLExpression>;
  params?: Record<string, UIDLExpression>;
  body?: UIDLExpression;
  pollingIntervalMs?: number;
  initialValue?: unknown;
  mapping?: UIDLExpression;
  description?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLObserverDataSource extends UIDLDataSource {
  type: UIDLDataSourceType.Observer | string;
  triggers?: (UIDLEventType | string)[];
  watch?: string[];
}

export interface UIDLResource {
  id?: string;
  type: UIDLResourceType | string;
  path: string;
  strategy?: UIDLResourceStrategy;
  integrity?: string;
  crossorigin?: "anonymous" | "use-credentials";
  async?: boolean;
  defer?: boolean;
  media?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLNode {
  id?: string;
  name?: string;
  key?: string;
  type: UIDLComponentType | string;
  props?: Record<string, UIDLExpression>;
  bindings?: Record<string, UIDLExpression>;
  children?: UIDLNode[];
  events?: UIDLEventDefinition[];
  dataSourceId?: string;
  condition?: UIDLExpression;
  textContent?: UIDLExpression;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLFlow {
  id: string;
  name: string;
  entryNodeId: string;
  description?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UIDLDocument {
  version: string;
  name?: string;
  importMaps?: Record<string, string>;
  nodeUIDL: UIDLNode;
  resources?: UIDLResource[];
  dataSources?: UIDLDataSource[];
  observerDataSources?: UIDLObserverDataSource[];
  flows?: UIDLFlow[];
  containers?: UIDLNode[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
