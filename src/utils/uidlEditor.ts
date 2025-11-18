import { UIDLNode } from "../types/uidl";

export type NodePredicate = (node: UIDLNode) => boolean;

export interface FindNodeResult {
  node: UIDLNode;
  parent?: UIDLNode;
  path: number[];
}

export interface DeleteResult {
  updatedRoot?: UIDLNode;
  removedNode?: UIDLNode;
}

export interface InsertOptions {
  position?: number;
}

export function findNode(root: UIDLNode, predicate: NodePredicate): FindNodeResult | undefined {
  return findNodeInternal(root, predicate, undefined, []);
}

export function insertNode(
  root: UIDLNode,
  parentPredicate: NodePredicate,
  newNode: UIDLNode,
  options: InsertOptions = {},
): { updatedRoot: UIDLNode; inserted: boolean } {
  const { position = (root.children ?? []).length } = options;
  const result = insertNodeInternal(root, parentPredicate, newNode, position);
  return { updatedRoot: result.node, inserted: result.changed };
}

export function updateNode(
  root: UIDLNode,
  predicate: NodePredicate,
  update: Partial<UIDLNode> | ((current: UIDLNode) => UIDLNode),
): { updatedRoot: UIDLNode; updated: boolean } {
  const result = updateNodeInternal(root, predicate, update);
  return { updatedRoot: result.node, updated: result.changed };
}

export function deleteNode(root: UIDLNode, predicate: NodePredicate): DeleteResult {
  const result = deleteNodeInternal(root, predicate);
  return { updatedRoot: result.node, removedNode: result.removedNode };
}

function findNodeInternal(
  node: UIDLNode,
  predicate: NodePredicate,
  parent: UIDLNode | undefined,
  path: number[],
): FindNodeResult | undefined {
  if (predicate(node)) {
    return { node, parent, path };
  }

  if (!node.children) return undefined;

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];
    const result = findNodeInternal(child, predicate, node, [...path, index]);
    if (result) {
      return result;
    }
  }

  return undefined;
}

function insertNodeInternal(
  node: UIDLNode,
  predicate: NodePredicate,
  newNode: UIDLNode,
  position: number,
): { node: UIDLNode; changed: boolean } {
  if (predicate(node)) {
    const children = [...(node.children ?? [])];
    const index = Math.min(Math.max(position, 0), children.length);
    children.splice(index, 0, normalizeNode(newNode));
    return { node: { ...node, children }, changed: true };
  }

  if (!node.children) {
    return { node, changed: false };
  }

  let changed = false;
  const children = node.children.map((child) => {
    const result = insertNodeInternal(child, predicate, newNode, position);
    if (result.changed) {
      changed = true;
    }
    return result.node;
  });

  return changed ? { node: { ...node, children }, changed: true } : { node, changed: false };
}

function updateNodeInternal(
  node: UIDLNode,
  predicate: NodePredicate,
  update: Partial<UIDLNode> | ((current: UIDLNode) => UIDLNode),
): { node: UIDLNode; changed: boolean } {
  if (predicate(node)) {
    const nextValue = typeof update === "function" ? update(node) : update;
    return { node: mergeNodes(node, nextValue), changed: true };
  }

  if (!node.children) {
    return { node, changed: false };
  }

  let changed = false;
  const children = node.children.map((child) => {
    const result = updateNodeInternal(child, predicate, update);
    if (result.changed) {
      changed = true;
    }
    return result.node;
  });

  return changed ? { node: { ...node, children }, changed: true } : { node, changed: false };
}

function deleteNodeInternal(
  node: UIDLNode,
  predicate: NodePredicate,
): { node?: UIDLNode; changed: boolean; removedNode?: UIDLNode } {
  if (predicate(node)) {
    return { changed: true, removedNode: node };
  }

  if (!node.children) {
    return { node, changed: false };
  }

  let removedNode: UIDLNode | undefined;
  let changed = false;
  const children = node.children
    .map((child) => {
      const result = deleteNodeInternal(child, predicate);
      if (result.changed && !changed) {
        changed = true;
      }
      if (result.removedNode && !removedNode) {
        removedNode = result.removedNode;
      }
      return result.node;
    })
    .filter((child): child is UIDLNode => Boolean(child));

  if (changed) {
    return { node: { ...node, children }, changed: true, removedNode };
  }

  return { node, changed: false };
}

function mergeNodes(target: UIDLNode, patch: UIDLNode | Partial<UIDLNode>): UIDLNode {
  const nextChildren = patch.children ? patch.children.map((child) => normalizeNode(child)) : target.children;
  const mergedProps = patch.props ? { ...(target.props ?? {}), ...patch.props } : target.props;
  const mergedBindings = patch.bindings ? { ...(target.bindings ?? {}), ...patch.bindings } : target.bindings;
  const mergedEvents = patch.events ?? target.events;
  const mergedMeta = patch.meta ? { ...(target.meta ?? {}), ...patch.meta } : target.meta;

  return {
    ...target,
    ...patch,
    props: mergedProps,
    bindings: mergedBindings,
    events: mergedEvents,
    meta: mergedMeta,
    children: nextChildren,
  };
}

function normalizeNode(node: UIDLNode): UIDLNode {
  return {
    ...node,
    children: node.children?.map((child) => normalizeNode(child)),
  };
}
