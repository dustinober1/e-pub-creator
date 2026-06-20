import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { App } from "../src/App";

const saveProjectMock = vi.hoisted(() => vi.fn());
const exportProjectMock = vi.hoisted(() => vi.fn());
const listProjectSnapshotsMock = vi.hoisted(() => vi.fn());
const restoreProjectSnapshotMock = vi.hoisted(() => vi.fn());

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    void promiseReject;
  });

  return {
    promise,
    resolve,
  };
}

afterEach(() => {
  cleanup();
  saveProjectMock.mockReset();
  exportProjectMock.mockReset();
  listProjectSnapshotsMock.mockReset();
  restoreProjectSnapshotMock.mockReset();
});

vi.mock("../src/components/ImportActions", () => ({
  ImportActions: ({
    onImported,
  }: {
    onImported?: (result: unknown) => void;
  }) => (
    <section aria-label="Import actions">
      <button
        type="button"
        onClick={() =>
          onImported?.({
            kind: "docx",
            response: {
              project: "/tmp/Imported.epubproj",
              source: "Imported.docx",
              status: "imported",
              title: "Imported Through App State",
              sectionCount: 2,
              warningCount: 1,
              bookProject: {
                ...createBookProject({
                  title: "Imported Through App State",
                  author: "Imported Author",
                  language: "fr",
                }),
                sections: [
                  createSection({
                    title: "Imported Opening",
                    role: "body",
                    blocks: [
                      createTextBlock(
                        "paragraph",
                        "Fresh imported preview content.",
                      ),
                    ],
                  }),
                  createSection({
                    title: "Imported Finale",
                    role: "back",
                    blocks: [createTextBlock("paragraph", "Closing notes.")],
                  }),
                ],
              },
              report: {
                sourcePath: "Imported.docx",
                warnings: [
                  {
                    code: "missing-alt",
                    message: "One image is missing alt text.",
                  },
                ],
                importedAssets: [
                  { sourcePath: "cover.png", altText: "Cover art" },
                ],
              },
            },
          })
        }
      >
        Trigger DOCX Import
      </button>
      <button
        type="button"
        onClick={() =>
          onImported?.({
            kind: "markdown",
            response: {
              project: "/tmp/MarkdownImport.epubproj",
              source: "/tmp/book.md",
              status: "imported",
              title: "Markdown Import Summary",
              bookProject: {
                ...createBookProject({
                  title: "Markdown Import Summary",
                  author: "Markdown Author",
                  language: "en",
                }),
                sections: [
                  createSection({
                    title: "Markdown Chapter",
                    role: "body",
                    blocks: [
                      createTextBlock(
                        "paragraph",
                        "Markdown import body text.",
                      ),
                    ],
                  }),
                ],
              },
            },
          })
        }
      >
        Trigger Markdown Import
      </button>
    </section>
  ),
}));

vi.mock("../src/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../src/api/client")>(
      "../src/api/client",
    );

  return {
    ...actual,
    saveProject: saveProjectMock,
    exportProject: exportProjectMock,
    listProjectSnapshots: listProjectSnapshotsMock,
    restoreProjectSnapshot: restoreProjectSnapshotMock
  };
});

describe("App", () => {
  it("renders project workspace surfaces", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Formatting Stress Book" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Book Outline" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Themes" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Theme Editor" }),
    ).toBeInTheDocument();

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(preview).toBeInTheDocument();
    expect(screen.queryByTitle("EPUB XHTML preview")).not.toBeInTheDocument();
    expect(
      within(preview).getByLabelText("Preview section title"),
    ).toHaveTextContent("Chapter One");
    expect(
      within(preview).getByText(
        "The first paragraph tests ordinary prose flow and margins in the preview pane.",
      ),
    ).toBeInTheDocument();
  });

  it("renders topbar document actions and opens the shortcuts dialog", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Shortcuts" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));

    expect(
      screen.getByRole("dialog", { name: "Keyboard Shortcuts" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close shortcuts dialog" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Keyboard Shortcuts" }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "/", metaKey: true });

    expect(
      screen.getByRole("dialog", { name: "Keyboard Shortcuts" }),
    ).toBeInTheDocument();
  });

  it("switches between edit, EPUB, and reader preview modes", () => {
    render(<App />);

    expect(screen.getByLabelText("Editable EPUB preview")).toBeInTheDocument();
    expect(screen.queryByTitle("EPUB preview")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Reader preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EPUB Preview" }));

    const epubPreview = screen.getByTitle("EPUB preview");
    const epubSrcDoc = epubPreview.getAttribute("srcdoc") ?? "";
    expect(epubSrcDoc).not.toEqual("");
    expect(epubPreview).toHaveAttribute("sandbox", "");
    expect(epubSrcDoc).toContain("Chapter One");
    expect(epubSrcDoc).toContain(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
    expect(epubSrcDoc).toContain("font-family: serif; line-height: 1.55; margin: 2rem;");
    expect(epubSrcDoc).not.toContain("font-size: 18px; line-height: 1.7;");
    expect(epubPreview).toBeInTheDocument();
    expect(screen.queryByLabelText("Editable EPUB preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reader Preview" }));

    const readerPreview = screen.getByTitle("Reader preview");
    const readerSrcDoc = readerPreview.getAttribute("srcdoc") ?? "";
    expect(readerSrcDoc).not.toEqual("");
    expect(readerPreview).toHaveAttribute("sandbox", "");
    expect(readerSrcDoc).toContain("Chapter One");
    expect(readerSrcDoc).toContain(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
    expect(readerSrcDoc).toContain(
      "font-size: 18px; line-height: 1.7; margin: 0 auto; max-width: 680px; padding: 2rem;",
    );
    expect(readerSrcDoc).not.toContain("font-family: serif; line-height: 1.55; margin: 2rem;");
    expect(readerPreview).toBeInTheDocument();
    expect(screen.queryByTitle("EPUB preview")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Editable EPUB preview")).toBeInTheDocument();
    expect(screen.queryByTitle("Reader preview")).not.toBeInTheDocument();
  });

  it("applies edits made directly in the preview pane", () => {
    render(<App />);

    const preview = screen.getByLabelText("Editable EPUB preview");
    const previewTitle = within(preview).getByLabelText(
      "Preview section title",
    );
    const previewParagraph = within(preview).getByLabelText(
      "Preview block 1 (paragraph)",
    );
    const sceneBreak = within(preview).getByLabelText(
      "Preview block 2 (scene-break)",
    );

    expect(previewTitle).toHaveAttribute("contenteditable", "true");
    expect(previewParagraph).toHaveAttribute("contenteditable", "true");
    expect(sceneBreak).not.toHaveAttribute("contenteditable", "true");

    previewTitle.textContent = "Edited In Preview";
    fireEvent.blur(previewTitle);
    previewParagraph.textContent = "Inline preview body edit.";
    fireEvent.blur(previewParagraph);

    expect(
      screen.getByRole("button", { name: "Edited In Preview" }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Section title")).toHaveValue(
      "Edited In Preview",
    );
    expect(screen.getByLabelText("Block 1 (paragraph)")).toHaveValue(
      "Inline preview body edit.",
    );
  });

  it("uses the find and replace panel to update the visible app state", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Find"), {
      target: { value: "first paragraph" },
    });
    fireEvent.change(screen.getByLabelText("Replace"), {
      target: { value: "opening paragraph" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Replace All" }));

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(
      within(preview).getByText(
        "The opening paragraph tests ordinary prose flow and margins in the preview pane.",
      ),
    ).toBeInTheDocument();
    expect(
      within(preview).queryByText(
        "The first paragraph tests ordinary prose flow and margins in the preview pane.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Block 1 (paragraph)")).toHaveValue(
      "The opening paragraph tests ordinary prose flow and margins in the preview pane.",
    );
  });

  it("handles keyboard shortcuts for save, find, undo, and redo", async () => {
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Imported.epubproj",
    });

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Shortcut Draft Title" },
    });

    fireEvent.keyDown(window, { key: "s", metaKey: true });

    expect(await screen.findByText(/Saved/)).toBeInTheDocument();
    expect(saveProjectMock).toHaveBeenCalledWith(
      "/tmp/Imported.epubproj",
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: "Shortcut Draft Title",
        }),
      }),
    );

    fireEvent.keyDown(window, { key: "f", metaKey: true });
    expect(screen.getByLabelText("Find")).toHaveFocus();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Undo Title" },
    });
    expect(screen.getByLabelText("Title")).toHaveValue("Undo Title");

    fireEvent.keyDown(window, { key: "z", metaKey: true });
    expect(screen.getByLabelText("Title")).toHaveValue("Shortcut Draft Title");

    fireEvent.keyDown(window, { key: "z", metaKey: true, shiftKey: true });
    expect(screen.getByLabelText("Title")).toHaveValue("Undo Title");
  });

  it("lets native undo win inside editable inputs", async () => {
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Imported.epubproj",
    });

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Editable Shortcut Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));

    expect(await screen.findByText(/Saved/)).toBeInTheDocument();

    const titleInput = screen.getByLabelText("Title");
    titleInput.focus();
    fireEvent.keyDown(titleInput, { key: "z", metaKey: true });

    expect(screen.getByLabelText("Title")).toHaveValue(
      "Editable Shortcut Title",
    );
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("keeps no-op undo and redo shortcuts from dirtying a fresh project", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "z", metaKey: true });
    fireEvent.keyDown(window, { key: "z", metaKey: true, shiftKey: true });

    expect(screen.getByText("Not saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("uses the preview toolbar to edit the focused block", () => {
    render(<App />);

    const preview = screen.getByLabelText("Editable EPUB preview");
    const previewParagraph = within(preview).getByLabelText(
      "Preview block 1 (paragraph)",
    );

    expect(
      screen.getByRole("toolbar", { name: "Preview editing tools" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Block kind")).toBeDisabled();
    expect(screen.getByLabelText("Heading level")).toBeDisabled();

    fireEvent.focus(previewParagraph);
    expect(screen.getByLabelText("Block kind")).toHaveValue("paragraph");

    fireEvent.change(screen.getByLabelText("Block kind"), {
      target: { value: "heading" },
    });
    expect(screen.getByLabelText("Block 1 (heading)")).toHaveValue(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
    expect(
      within(preview).getByLabelText("Preview block 1 (heading)").tagName,
    ).toBe("H2");
    expect(screen.getByLabelText("Heading level")).toHaveValue("2");

    fireEvent.change(screen.getByLabelText("Heading level"), {
      target: { value: "3" },
    });
    expect(
      within(preview).getByLabelText("Preview block 1 (heading)").tagName,
    ).toBe("H3");

    fireEvent.click(screen.getByRole("button", { name: "Insert scene break" }));
    expect(
      within(preview).getByLabelText("Preview block 3 (scene-break)"),
    ).not.toHaveAttribute("contenteditable", "true");
  });

  it("marks focused blocks for review and accepts them", () => {
    render(<App />);

    const preview = screen.getByLabelText("Editable EPUB preview");
    const previewParagraph = within(preview).getByLabelText(
      "Preview block 1 (paragraph)",
    );

    fireEvent.focus(previewParagraph);
    fireEvent.click(screen.getByRole("button", { name: "Mark Needs Review" }));

    expect(
      within(preview).getByText("needs review", { selector: ".review-chip" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("needs review", { selector: ".review-status-label" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Accept Block" }));

    expect(
      within(preview).getByText("accepted", { selector: ".review-chip" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("accepted", { selector: ".review-status-label" }),
    ).toBeInTheDocument();
  });

  it("replaces the sample shell with imported project state", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Imported Author / fr")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByText("Project folder: /tmp/Imported.epubproj"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Import Cleanup" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Import cleanup checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 sections")).toBeInTheDocument();
    expect(screen.getByText("1 note")).toBeInTheDocument();
    expect(screen.getByText("1 asset")).toBeInTheDocument();
    expect(screen.getByText("0 scene breaks")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Import notes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("One image is missing alt text.")).toBeInTheDocument();

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(
      within(preview).getByText("Fresh imported preview content."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Imported Finale" }));

    expect(
      screen.getByRole("button", { name: "Imported Finale" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).not.toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Imported Finale" }),
    ).toBeInTheDocument();
    expect(within(preview).getByText("Closing notes.")).toBeInTheDocument();
    expect(
      within(preview).queryByText("Fresh imported preview content."),
    ).not.toBeInTheDocument();
  });

  it("uses the imported markdown project state when markdown import provides it", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger Markdown Import" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Markdown Import Summary" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Markdown Author / en")).toBeInTheDocument();
    expect(
      screen.getByText("Project folder: /tmp/MarkdownImport.epubproj"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Markdown Chapter" }),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Section title")).toHaveValue(
      "Markdown Chapter",
    );

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(
      within(preview).getByText("Markdown import body text."),
    ).toBeInTheDocument();
    expect(
      within(preview).queryByText("Fresh imported preview content."),
    ).not.toBeInTheDocument();
  });

  it("clears version history state when the project path changes", async () => {
    listProjectSnapshotsMock.mockResolvedValue({
      snapshots: [
        {
          id: "snapshot-1",
          reason: "before-export",
          path: "/tmp/Imported.epubproj/.snapshots/snapshot-1.json",
          createdAt: "2026-06-19T00:00:00.000Z",
        },
      ],
    });

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh Versions" }));

    expect(await screen.findByText("1 versions found.")).toBeInTheDocument();
    expect(screen.getByText("before-export")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger Markdown Import" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Markdown Import Summary" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("1 versions found.")).not.toBeInTheDocument();
    expect(screen.queryByText("before-export")).not.toBeInTheDocument();
  });

  it("ignores stale version history refresh responses after the project path changes", async () => {
    const pendingRefresh = createDeferred<{
      snapshots: Array<{
        id: string;
        reason: string;
        path: string;
        createdAt: string;
      }>;
    }>();

    listProjectSnapshotsMock.mockReturnValueOnce(pendingRefresh.promise);

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh Versions" }));
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger Markdown Import" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Markdown Import Summary" }),
    ).toBeInTheDocument();

    await act(async () => {
      pendingRefresh.resolve({
        snapshots: [
          {
            id: "snapshot-1",
            reason: "before-export",
            path: "/tmp/Imported.epubproj/.snapshots/snapshot-1.json",
            createdAt: "2026-06-19T00:00:00.000Z",
          },
        ],
      });
      await Promise.resolve();
    });

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("1 versions found.")).not.toBeInTheDocument();
    expect(screen.queryByText("before-export")).not.toBeInTheDocument();
  });

  it("autosaves imported projects after edits", async () => {
    vi.useFakeTimers();
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Imported.epubproj",
    });

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));
      expect(
        screen.getByRole("heading", {
          name: "Imported Through App State",
        }),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Title"), {
        target: { value: "Autosaved Title" },
      });

      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(799);
      });
      expect(saveProjectMock).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
        await Promise.resolve();
      });

      expect(saveProjectMock).toHaveBeenCalledWith(
        "/tmp/Imported.epubproj",
        expect.objectContaining({
          metadata: expect.objectContaining({ title: "Autosaved Title" }),
        }),
      );
      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not autosave immediately after import without edits", async () => {
    vi.useFakeTimers();
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Imported.epubproj",
    });

    try {
      render(<App />);

      fireEvent.click(
        screen.getByRole("button", { name: "Trigger DOCX Import" }),
      );

      expect(
        screen.getByRole("heading", {
          name: "Imported Through App State",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Not saved")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(saveProjectMock).not.toHaveBeenCalled();
      expect(screen.getByText("Not saved")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps newer dirty edits when an older save completes", async () => {
    const pendingSave = createDeferred<{
      status: string;
      project: string;
    }>();

    saveProjectMock.mockReturnValueOnce(pendingSave.promise);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));

    expect(
      screen.getByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "First Dirty Title" },
    });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));
    expect(screen.getByText("Saving...")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Second Dirty Title" },
    });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await act(async () => {
      pendingSave.resolve({
        status: "saved",
        project: "/tmp/Imported.epubproj",
      });
      await Promise.resolve();
    });

    expect(
      screen.queryByText(/Saved/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(saveProjectMock).toHaveBeenCalledTimes(1);
  });

  it("updates visible header text when metadata is edited", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Edited Book Title" },
    });
    fireEvent.change(screen.getByLabelText("Author"), {
      target: { value: "Edited Author" },
    });
    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "es" },
    });

    expect(
      screen.getByRole("heading", { name: "Edited Book Title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Edited Author / es")).toBeInTheDocument();
  });

  it("updates preview output when editing the selected section", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Section title"), {
      target: { value: "Opening Scene" },
    });
    fireEvent.change(screen.getByLabelText("Block 1 (paragraph)"), {
      target: { value: "Updated preview body copy." },
    });

    expect(
      screen.getByRole("button", { name: "Opening Scene" }),
    ).toHaveAttribute("aria-current", "true");

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(within(preview).getByText("Opening Scene")).toBeInTheDocument();
    expect(
      within(preview).getByText("Updated preview body copy."),
    ).toBeInTheDocument();
    expect(
      within(preview).queryByText(
        "The first paragraph tests ordinary prose flow and margins in the preview pane.",
      ),
    ).not.toBeInTheDocument();
  });

  it("switches outline selection and edits the newly selected section", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Imported Finale" }));
    fireEvent.change(screen.getByLabelText("Section title"), {
      target: { value: "Afterword" },
    });
    fireEvent.change(screen.getByLabelText("Block 1 (paragraph)"), {
      target: { value: "Revised closing copy." },
    });

    expect(screen.getByRole("button", { name: "Afterword" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).not.toHaveAttribute("aria-current", "true");

    const preview = screen.getByLabelText("Editable EPUB preview");
    expect(within(preview).getByText("Afterword")).toBeInTheDocument();
    expect(
      within(preview).getByText("Revised closing copy."),
    ).toBeInTheDocument();
    expect(
      within(preview).queryByText("Closing notes."),
    ).not.toBeInTheDocument();
  });

  it("reorders sections from the outline controls", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    const outline = screen.getByRole("navigation", { name: "Book outline" });
    expect(
      within(outline)
        .getAllByRole("button", {
          name: /^(Imported Opening|Imported Finale)$/,
        })
        .map((button) => button.textContent),
    ).toEqual(["Imported Opening", "Imported Finale"]);

    fireEvent.click(screen.getByRole("button", { name: "Imported Finale" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Imported Finale up" }));

    expect(
      within(outline)
        .getAllByRole("button", {
          name: /^(Imported Opening|Imported Finale)$/,
        })
        .map((button) => button.textContent),
    ).toEqual(["Imported Finale", "Imported Opening"]);
    expect(
      screen.getByRole("button", { name: "Imported Finale" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("uses the current project state for save and export actions", async () => {
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Updated.epubproj",
    });
    exportProjectMock.mockResolvedValue({
      status: "exported",
      outputPath: "/tmp/output/Imported.epub",
      issueCount: 0,
    });

    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Saved From App" },
    });
    fireEvent.change(screen.getByLabelText("Project folder"), {
      target: { value: "/tmp/Updated.epubproj" },
    });

    expect(screen.getByLabelText("Project folder")).toHaveValue(
      "/tmp/Updated.epubproj",
    );
    expect(
      screen.getByText("Project folder: /tmp/Updated.epubproj"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));

    expect(
      await screen.findByText(/Saved /),
    ).toBeInTheDocument();
    expect(saveProjectMock).toHaveBeenCalledWith(
      "/tmp/Updated.epubproj",
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: "Saved From App",
        }),
      }),
    );

    fireEvent.change(screen.getByLabelText("EPUB output path"), {
      target: { value: "/tmp/output/Imported.epub" },
    });
    fireEvent.change(screen.getByLabelText("Export profile"), {
      target: { value: "kdp-safe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Export EPUB" }));

    expect(
      await screen.findByText(
        "Exported /tmp/output/Imported.epub with 0 issues.",
      ),
    ).toBeInTheDocument();
    expect(exportProjectMock).toHaveBeenCalledWith({
      project: "/tmp/Updated.epubproj",
      output: "/tmp/output/Imported.epub",
      profile: "kdp-safe",
      bookProject: expect.objectContaining({
        metadata: expect.objectContaining({
          title: "Saved From App",
        }),
      }),
    });
  });
});
