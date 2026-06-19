import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeEditor } from "../src/components/ThemeEditor";
import { ThemeGallery } from "../src/components/ThemeGallery";

describe("ThemeEditor", () => {
  it("renders controls for key Vellum-style components", () => {
    render(<ThemeEditor />);

    expect(screen.getByLabelText("Chapter opener")).toBeInTheDocument();
    expect(screen.getByLabelText("Scene break")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote style")).toBeInTheDocument();
    expect(screen.getByLabelText("Body spacing")).toBeInTheDocument();
  });
});

describe("ThemeGallery", () => {
  it("renders marketplace import and export affordances", () => {
    render(<ThemeGallery />);

    expect(screen.getByRole("button", { name: "Import Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Theme" })).toBeInTheDocument();
  });
});
