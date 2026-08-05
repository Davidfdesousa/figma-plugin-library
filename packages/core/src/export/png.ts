export interface PngExportOptions {
  /** Export scale, 1-4. Figma clamps outside that range. */
  readonly scale?: number;
}

export async function exportNodeAsPng(
  node: SceneNode,
  options: PngExportOptions = {},
): Promise<Uint8Array> {
  const scale = options.scale ?? 2;
  return node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
}
