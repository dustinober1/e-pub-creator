import { cleanup, render, screen } from "@testing-library/react";
import { SUPPORTED_THEME_COMPONENT_VARIANTS } from "@epub-creator/themes";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeEditor } from "../src/components/ThemeEditor";
import { ThemeGallery } from "../src/components/ThemeGallery";

afterEach(cleanup);

describe("ThemeEditor", () => {
  it("renders controls for key Vellum-style components", () => {
    render(<ThemeEditor />);

    expect(screen.getByLabelText("Chapter opener")).toBeInTheDocument();
    expect(screen.getByLabelText("Scene break")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote style")).toBeInTheDocument();
    expect(screen.getByLabelText("Body spacing")).toBeInTheDocument();
  });

  it("uses supported component variants for editable defaults and options", () => {
    render(<ThemeEditor />);

    expect(selectValues("Chapter opener")).toEqual(SUPPORTED_THEME_COMPONENT_VARIANTS.chapterTitle);
    expect(screen.getByLabelText<HTMLSelectElement>("Chapter opener")).toHaveValue("classic");

    expect(selectValues("Scene break")).toEqual(SUPPORTED_THEME_COMPONENT_VARIANTS.sceneBreak);
    expect(screen.getByLabelText<HTMLSelectElement>("Scene break")).toHaveValue("asterism");

    expect(selectValues("Quote style")).toEqual(SUPPORTED_THEME_COMPONENT_VARIANTS.quote);
    expect(screen.getByLabelText<HTMLSelectElement>("Quote style")).toHaveValue("indented");
  });
});

describe("ThemeGallery", () => {
  it("renders marketplace import and export affordances", () => {
    render(<ThemeGallery />);

    expect(screen.getByRole("button", { name: "Import Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Theme" })).toBeInTheDocument();
  });
});

function selectValues(label: string): string[] {
  return Array.from(screen.getByLabelText<HTMLSelectElement>(label).options, (option) => option.value);
}
