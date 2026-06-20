import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { FindReplacePanel } from "../src/components/FindReplacePanel";

describe("FindReplacePanel", () => {
  it("replaces all matches through the panel", () => {
    const project = {
      ...createBookProject({
        title: "Panel Book",
        author: "A. Writer",
        language: "en",
      }),
      sections: [
        createSection({
          title: "Chapter",
          role: "body",
          blocks: [createTextBlock("paragraph", "old word")],
        }),
      ],
    };
    const onProjectChange = vi.fn();

    render(
      <FindReplacePanel
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Find"), {
      target: { value: "old" },
    });
    fireEvent.change(screen.getByLabelText("Replace"), {
      target: { value: "new" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Replace All" }));

    expect(onProjectChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [
          expect.objectContaining({
            blocks: [expect.objectContaining({ text: "new word" })],
          }),
        ],
      }),
    );
  });
});
