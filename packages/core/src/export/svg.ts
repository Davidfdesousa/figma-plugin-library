export interface SvgExportOptions {
  readonly svgOutlineText?: boolean;
  readonly svgIdAttribute?: boolean;
  readonly svgSimplifyStroke?: boolean;
}

export async function exportNodeAsSvg(
  node: SceneNode,
  options: SvgExportOptions = {},
): Promise<string> {
  const bytes = await node.exportAsync({
    format: 'SVG',
    svgOutlineText: options.svgOutlineText ?? true,
    svgIdAttribute: options.svgIdAttribute ?? false,
    svgSimplifyStroke: options.svgSimplifyStroke ?? true,
  });
  return new TextDecoder().decode(bytes);
}
