export function mergeCss(themeCss: string, projectOverrides: Record<string, string>): string {
  const entries = Object.entries(projectOverrides);

  if (entries.length === 0) {
    return themeCss;
  }

  const customProperties = entries.map(([name, value]) => `  ${name}: ${value};`).join("\n");

  return `${themeCss}\n\n:root {\n${customProperties}\n}`;
}
