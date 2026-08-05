export interface SerializedNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly visible: boolean;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly children?: readonly SerializedNode[];
}

export interface JsonExportOptions {
  /** Caps recursion into deeply nested trees. Unbounded by default. */
  readonly maxDepth?: number;
}

function hasPosition(node: SceneNode): node is SceneNode & { x: number; y: number } {
  return 'x' in node && 'y' in node;
}

function hasSize(node: SceneNode): node is SceneNode & { width: number; height: number } {
  return 'width' in node && 'height' in node;
}

function hasChildren(node: SceneNode): node is SceneNode & { children: readonly SceneNode[] } {
  return 'children' in node;
}

function serialize(node: SceneNode, depth: number, maxDepth: number): SerializedNode {
  const serialized: {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: SerializedNode[];
  } = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
  };

  if (hasPosition(node)) {
    serialized.x = node.x;
    serialized.y = node.y;
  }
  if (hasSize(node)) {
    serialized.width = node.width;
    serialized.height = node.height;
  }
  if (hasChildren(node) && depth < maxDepth) {
    serialized.children = node.children.map((child) => serialize(child, depth + 1, maxDepth));
  }

  return serialized;
}

export function serializeNodeToJson(node: SceneNode, options: JsonExportOptions = {}): SerializedNode {
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
  return serialize(node, 0, maxDepth);
}
