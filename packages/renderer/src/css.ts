export function mergeCss(themeCss: string, projectOverrides: Record<string, string>): string {
  const entries = Object.entries(projectOverrides);

  if (entries.length === 0) {
    return themeCss;
  }

  const customProperties = entries.map(([name, value]) => `  ${toCustomPropertyName(name)}: ${value};`).join("\n");

  return `${themeCss}\n\n:root {\n${customProperties}\n}`;
}

function toCustomPropertyName(name: string): string {
  if (/[\s\u0000-\u001F\u007F]/.test(name)) {
    throw new Error(`Invalid CSS override token name: ${name}`);
  }

  if (name.startsWith("--")) {
    return name;
  }

  return `--${name.replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
