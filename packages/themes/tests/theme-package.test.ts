import { describe, expect, it } from "vitest";
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
});
