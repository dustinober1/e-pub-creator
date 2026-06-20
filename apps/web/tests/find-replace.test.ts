import { describe, expect, it } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { findMatches, replaceAllMatches } from "../src/lib/find-replace";

const project = {
  ...createBookProject({
    title: "Find Book",
    author: "A. Writer",
    language: "en",
  }),
  sections: [
    createSection({
      title: "Opening Scene",
      role: "body",
      blocks: [
        createTextBlock("paragraph", "The door opened."),
        createTextBlock("scene-break", ""),
        createTextBlock("paragraph", "Another door closed."),
      ],
    }),
  ],
};

describe("find replace", () => {
  it("finds matches in section titles and editable text blocks", () => {
    expect(findMatches(project, "door")).toEqual([
      expect.objectContaining({
        blockId: project.sections[0]?.blocks[0]?.id,
        sectionId: project.sections[0]?.id,
        text: "The door opened.",
      }),
      expect.objectContaining({
        blockId: project.sections[0]?.blocks[2]?.id,
        sectionId: project.sections[0]?.id,
        text: "Another door closed.",
      }),
    ]);

    expect(findMatches(project, "opening")).toEqual([
      expect.objectContaining({
        sectionId: project.sections[0]?.id,
        text: "Opening Scene",
      }),
    ]);
  });

  it("replaces all editable text matches case-insensitively", () => {
    const updated = replaceAllMatches(project, "door", "gate");

    expect(updated.sections[0]?.blocks[0]?.text).toBe("The gate opened.");
    expect(updated.sections[0]?.blocks[2]?.text).toBe("Another gate closed.");
    expect(updated.sections[0]?.title).toBe("Opening Scene");

    const retitled = replaceAllMatches(project, "opening", "Closing");
    expect(retitled.sections[0]?.title).toBe("Closing Scene");

    expect(replaceAllMatches(project, "door", "door")).toBe(project);
  });

  it("treats replacement text literally", () => {
    const updated = replaceAllMatches(project, "door", "$& $1 $$");

    expect(updated.sections[0]?.blocks[0]?.text).toBe("The $& $1 $$ opened.");
    expect(updated.sections[0]?.blocks[2]?.text).toBe("Another $& $1 $$ closed.");
  });
});
