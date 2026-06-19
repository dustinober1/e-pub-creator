import { describe, expect, it } from "vitest";
import { validateThemePackage } from "../src/theme-package";

describe("theme packages", () => {
  it("accepts constrained declarative themes with license metadata", () => {
    const theme = validateThemePackage({
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
    });

    expect(theme.id).toBe("classic-literary");
    expect(theme.fonts[0]?.license.spdxId).toBe("OFL-1.1");
  });
});
