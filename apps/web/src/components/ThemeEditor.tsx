import {
  SUPPORTED_THEME_COMPONENT_VARIANTS,
  type ThemeComponentKey,
  type ThemeComponentVariant
} from "@epub-creator/themes";

const componentFields = [
  componentField({ label: "Chapter opener", componentKey: "chapterTitle", defaultValue: "classic" }),
  componentField({ label: "Scene break", componentKey: "sceneBreak", defaultValue: "asterism" }),
  componentField({ label: "Quote style", componentKey: "quote", defaultValue: "indented" })
];

export function ThemeEditor() {
  return (
    <section className="panel theme-editor" aria-label="Theme editor">
      <h2>Theme Editor</h2>
      <div className="theme-editor-controls">
        {componentFields.map((field) => (
          <label className="theme-editor-field" key={field.componentKey}>
            {field.label}
            <select defaultValue={field.defaultValue}>
              {SUPPORTED_THEME_COMPONENT_VARIANTS[field.componentKey].map((variant) => (
                <option key={variant} value={variant}>
                  {formatVariantLabel(variant)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="theme-editor-field">
          Body spacing
          <input type="range" min="1.2" max="1.9" step="0.05" defaultValue="1.55" />
        </label>
      </div>
    </section>
  );
}

function componentField<Key extends ThemeComponentKey>(field: {
  label: string;
  componentKey: Key;
  defaultValue: ThemeComponentVariant<Key>;
}) {
  return field;
}

function formatVariantLabel(variant: string): string {
  return variant
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
