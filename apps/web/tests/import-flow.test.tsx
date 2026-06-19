import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImportActions } from "../src/components/ImportActions";

describe("ImportActions", () => {
  it("shows DOCX and Markdown import actions", () => {
    render(<ImportActions />);

    expect(screen.getByRole("button", { name: "Import DOCX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Markdown" })).toBeInTheDocument();
  });
});
