import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/parse-args";

describe("parseArgs", () => {
  it("parses command and flags", () => {
    expect(parseArgs(["import", "--source", "book.md", "--project", "Book.epubproj"])).toEqual({
      command: "import",
      flags: {
        source: "book.md",
        project: "Book.epubproj"
      }
    });
  });
});
