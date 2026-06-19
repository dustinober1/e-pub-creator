import { stat } from "node:fs/promises";
import { join } from "node:path";
import { readProjectFolder } from "@epub-creator/core";
import { describe, expect, it } from "vitest";
import { validateAccessibility } from "../src/accessibility";

const fixturePath = join(
  process.cwd(),
  "fixtures",
  "projects",
  "formatting-stress",
);

describe("formatting stress project fixture", () => {
  it("matches the project folder contract and passes accessibility validation", async () => {
    const project = await readProjectFolder(fixturePath);
    const report = validateAccessibility(project);
    const blockKinds = new Set(
      project.sections.flatMap((section) =>
        section.blocks.map((block) => block.kind),
      ),
    );
    const samplePlate = project.assets.find(
      (asset) => asset.id === "asset_sample_plate",
    );

    expect(project.id).toBe("book_formatting_stress");
    expect(project.sections.map((section) => section.role)).toEqual([
      "front",
      "body",
      "back",
    ]);
    expect(report.issues).toEqual([]);
    expect([...blockKinds]).toEqual(
      expect.arrayContaining([
        "paragraph",
        "scene-break",
        "epigraph",
        "blockquote",
        "letter",
        "email",
        "message",
        "image",
      ]),
    );
    expect(samplePlate?.projectPath).toBe("assets/images/sample-plate.png");
    await expect(
      stat(join(fixturePath, samplePlate?.projectPath ?? "")).then((entry) =>
        entry.isFile(),
      ),
    ).resolves.toBe(true);
  });
});
