import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { BookOutline } from "../src/components/BookOutline";

describe("BookOutline", () => {
  it("shows section headings beneath their section", () => {
    const section = createSection({
      title: "Chapter One",
      role: "body",
      blocks: [
        createTextBlock("heading", "A familiar subheading", { level: 2 }),
        createTextBlock("paragraph", "Body copy."),
      ],
    });

    render(
      <BookOutline
        sections={[section]}
        selectedSectionId={section.id}
        onSelectSection={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Chapter One" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "A familiar subheading" }),
    ).toBeInTheDocument();
  });

  it("calls move callbacks from accessible reorder controls", () => {
    const first = createSection({
      title: "First",
      role: "body",
      blocks: [],
    });
    const second = createSection({
      title: "Second",
      role: "body",
      blocks: [],
    });
    const onMoveSection = vi.fn();

    render(
      <BookOutline
        sections={[first, second]}
        selectedSectionId={first.id}
        onMoveSection={onMoveSection}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Second up" }));
    expect(onMoveSection).toHaveBeenCalledWith(second.id, -1);
  });

  it("hides move controls when no move callback is provided", () => {
    const section = createSection({
      title: "Solo",
      role: "body",
      blocks: [],
    });

    render(
      <BookOutline
        sections={[section]}
        selectedSectionId={section.id}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Move Solo up" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Move Solo down" }),
    ).not.toBeInTheDocument();
  });
});
