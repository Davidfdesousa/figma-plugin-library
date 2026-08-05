import { describe, expect, it } from 'vitest';

import { serializeNodeToJson } from './json';

function makeNode(overrides: Record<string, unknown>): SceneNode {
  return { id: '1', name: 'Node', type: 'FRAME', visible: true, ...overrides } as unknown as SceneNode;
}

describe('serializeNodeToJson', () => {
  it('captures id/name/type/visible on every node', () => {
    const node = makeNode({ id: 'abc', name: 'My Frame', type: 'FRAME', visible: false });
    expect(serializeNodeToJson(node)).toMatchObject({
      id: 'abc',
      name: 'My Frame',
      type: 'FRAME',
      visible: false,
    });
  });

  it('includes position and size when present', () => {
    const node = makeNode({ x: 10, y: 20, width: 100, height: 50 });
    expect(serializeNodeToJson(node)).toMatchObject({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('recurses into children by default', () => {
    const child = makeNode({ id: 'child', type: 'TEXT' });
    const parent = makeNode({ id: 'parent', type: 'FRAME', children: [child] });
    const result = serializeNodeToJson(parent);
    expect(result.children).toHaveLength(1);
    expect(result.children?.[0].id).toBe('child');
  });

  it('respects maxDepth', () => {
    const grandchild = makeNode({ id: 'grandchild', type: 'TEXT' });
    const child = makeNode({ id: 'child', type: 'FRAME', children: [grandchild] });
    const parent = makeNode({ id: 'parent', type: 'FRAME', children: [child] });

    const result = serializeNodeToJson(parent, { maxDepth: 1 });
    expect(result.children?.[0].id).toBe('child');
    expect(result.children?.[0].children).toBeUndefined();
  });
});
