import { describe, expect, it } from "vitest";
import { createThemeRegistry, findTheme } from "../src/theme-registry";
import { validateThemePackage } from "../src/theme-package";

const validThemePackage = {
  id: "classic-literary",
  version: "0.1.0",
  name: "Classic Literary",
  description: "Traditional chapter openers and restrained typography.",
  license: "CC-BY-4.0",
  cssPath: "theme.css",
  preview: {
    thumbnailPath: "preview.png",
    sampleText: "Chapter One"
  },
  tokens: {
    bodyFont: "serif",
    headingFont: "serif",
    accentColor: "#7b4f2c",
    chapterNumberStyle: "roman"
  },
  fonts: [
    {
      family: "Libre Baskerville",
      file: "fonts/LibreBaskerville-Regular.ttf",
      license: {
        name: "OFL-1.1",
        spdxId: "OFL-1.1",
        url: "https://openfontlicense.org"
      }
    }
  ],
  components: {
    chapterTitle: ["classic", "ornamented"],
    sceneBreak: ["asterism", "ornament"],
    quote: ["indented", "boxed-light"]
  }
};

describe("theme packages", () => {
  it("accepts constrained declarative themes with license metadata", () => {
    const theme = validateThemePackage(validThemePackage);

    expect(theme.id).toBe("classic-literary");
    expect(theme.fonts[0]?.license.spdxId).toBe("OFL-1.1");
  });

  it("rejects preview metadata that is not non-empty strings", () => {
    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        preview: {
          thumbnailPath: "   ",
          sampleText: "Chapter One"
        }
      })
    ).toThrow("Theme preview metadata is required.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        preview: {
          thumbnailPath: "preview.png",
          sampleText: 123
        }
      })
    ).toThrow("Theme preview metadata is required.");
  });

  it("rejects embedded fonts without complete license metadata", () => {
    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: [
          {
            family: "Libre Baskerville",
            file: "fonts/LibreBaskerville-Regular.ttf",
            license: {
              name: "OFL-1.1",
              url: "https://openfontlicense.org"
            }
          }
        ]
      })
    ).toThrow("Complete font license metadata is required for Libre Baskerville.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: [
          {
            family: "Libre Baskerville",
            file: "fonts/LibreBaskerville-Regular.ttf",
            license: {
              name: "OFL-1.1",
              spdxId: "OFL-1.1",
              url: ""
            }
          }
        ]
      })
    ).toThrow("Complete font license metadata is required for Libre Baskerville.");
  });

  it("rejects token maps with missing or invalid string values", () => {
    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        tokens: {
          ...validThemePackage.tokens,
          accentColor: " "
        }
      })
    ).toThrow("Theme tokens must be non-empty string values.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        tokens: {
          ...validThemePackage.tokens,
          chapterNumberStyle: 12
        }
      })
    ).toThrow("Theme tokens must be non-empty string values.");
  });

  it("rejects fonts that are not valid font objects", () => {
    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: {
          family: "Libre Baskerville",
          file: "fonts/LibreBaskerville-Regular.ttf"
        }
      })
    ).toThrow("Theme fonts must be an array.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: [
          {
            family: " ",
            file: "fonts/LibreBaskerville-Regular.ttf",
            license: {
              name: "OFL-1.1",
              spdxId: "OFL-1.1",
              url: "https://openfontlicense.org"
            }
          }
        ]
      })
    ).toThrow("Theme font family is required.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: [
          {
            family: "Libre Baskerville",
            file: "",
            license: {
              name: "OFL-1.1",
              spdxId: "OFL-1.1",
              url: "https://openfontlicense.org"
            }
          }
        ]
      })
    ).toThrow("Theme font file is required for Libre Baskerville.");
  });

  it("rejects component maps without arrays of non-empty strings", () => {
    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        components: {
          ...validThemePackage.components,
          quote: "boxed-light"
        }
      })
    ).toThrow("Theme components must be arrays of non-empty strings.");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        components: {
          ...validThemePackage.components,
          quote: ["indented", ""]
        }
      })
    ).toThrow("Theme components must be arrays of non-empty strings.");
  });

  it("rejects theme asset paths that are not bundle-local relative paths", () => {
    for (const cssPath of ["/tmp/theme.css", "../theme.css", "https://example.com/theme.css", "themes//theme.css"]) {
      expect(() =>
        validateThemePackage({
          ...validThemePackage,
          cssPath
        })
      ).toThrow("Theme asset path must be bundle-local: cssPath");
    }

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        preview: {
          ...validThemePackage.preview,
          thumbnailPath: "/tmp/preview.png"
        }
      })
    ).toThrow("Theme asset path must be bundle-local: preview.thumbnailPath");

    expect(() =>
      validateThemePackage({
        ...validThemePackage,
        fonts: [
          {
            family: "Libre Baskerville",
            file: "fonts/../evil.ttf",
            license: {
              name: "OFL-1.1",
              spdxId: "OFL-1.1",
              url: "https://openfontlicense.org"
            }
          }
        ]
      })
    ).toThrow("Theme asset path must be bundle-local: fonts[0].file");
  });
});

describe("theme registry", () => {
  it("validates input packages when creating a registry", () => {
    expect(() =>
      createThemeRegistry([
        {
          ...validThemePackage,
          tokens: {
            ...validThemePackage.tokens,
            bodyFont: ""
          }
        }
      ])
    ).toThrow("Theme tokens must be non-empty string values.");
  });

  it("finds registered themes by id", () => {
    const registry = createThemeRegistry([validThemePackage]);

    expect(findTheme(registry, "classic-literary").name).toBe("Classic Literary");
  });

  it("throws the expected error for missing theme ids", () => {
    const registry = createThemeRegistry([validThemePackage]);

    expect(() => findTheme(registry, "missing-id")).toThrow(new Error("Theme not found: missing-id"));
  });
});
