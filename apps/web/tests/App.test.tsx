import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("renders the local-first workspace shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "EPUB Creator" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Book outline" })).toBeInTheDocument();
    expect(screen.getByText("EPUB XHTML preview will render here.")).toBeInTheDocument();
  });
});
