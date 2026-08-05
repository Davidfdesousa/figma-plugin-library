export function getSelection(): readonly SceneNode[] {
  return figma.currentPage.selection;
}

export function hasSelection(): boolean {
  return figma.currentPage.selection.length > 0;
}

export function getSingleSelectedNode(): SceneNode | null {
  const selection = figma.currentPage.selection;
  return selection.length === 1 ? selection[0] : null;
}

export function filterSelectionByType<T extends SceneNode['type']>(
  type: T,
  selection: readonly SceneNode[] = figma.currentPage.selection,
): Extract<SceneNode, { type: T }>[] {
  return selection.filter((node): node is Extract<SceneNode, { type: T }> => node.type === type);
}

export interface WalkSelectionOptions {
  /** Hard cap on nodes visited, so a pathologically large tree can't hang the plugin. */
  readonly maxNodes?: number;
}

const DEFAULT_MAX_NODES = 5000;

export function* walkSelection(
  nodes: readonly SceneNode[] = figma.currentPage.selection,
  options: WalkSelectionOptions = {},
): Generator<SceneNode> {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  let visited = 0;

  function* walk(list: readonly SceneNode[]): Generator<SceneNode> {
    for (const node of list) {
      if (visited >= maxNodes) return;
      visited++;
      yield node;
      if ('children' in node && Array.isArray(node.children)) {
        yield* walk(node.children);
      }
    }
  }

  yield* walk(nodes);
}
