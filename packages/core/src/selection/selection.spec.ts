import { describe, expect, it } from 'vitest';

import { filterSelectionByType, walkSelection } from './index';

function makeNode(id: string, type: string, children?: unknown[]): SceneNode {
  return (children === undefined ? { id, type } : { id, type, children }) as unknown as SceneNode;
}

describe('walkSelection', () => {
  it('yields every node in a nested tree depth-first', () => {
    const tree = [
      makeNode('1', 'FRAME', [makeNode('1.1', 'TEXT'), makeNode('1.2', 'TEXT')]),
      makeNode('2', 'RECTANGLE'),
    ];

    const ids = [...walkSelection(tree)].map((node) => node.id);
    expect(ids).toEqual(['1', '1.1', '1.2', '2']);
  });

  it('stops once maxNodes is reached, even mid-tree', () => {
    const tree = [makeNode('1', 'FRAME', [makeNode('1.1', 'TEXT'), makeNode('1.2', 'TEXT')])];

    const ids = [...walkSelection(tree, { maxNodes: 2 })].map((node) => node.id);
    expect(ids).toEqual(['1', '1.1']);
  });

  it('treats nodes without a children property as leaves', () => {
    const tree = [makeNode('1', 'TEXT')];
    const ids = [...walkSelection(tree)].map((node) => node.id);
    expect(ids).toEqual(['1']);
  });
});

describe('filterSelectionByType', () => {
  it('returns only nodes matching the given type', () => {
    const selection = [makeNode('1', 'TEXT'), makeNode('2', 'FRAME'), makeNode('3', 'TEXT')];
    const result = filterSelectionByType('TEXT', selection);
    expect(result.map((n) => n.id)).toEqual(['1', '3']);
  });
});
