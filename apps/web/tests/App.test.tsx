import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("renders project workspace surfaces", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Formatting Stress Book" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Book Outline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Themes" })).toBeInTheDocument();
    expect(screen.getByTitle("EPUB XHTML preview")).toBeInTheDocument();
  });
});
