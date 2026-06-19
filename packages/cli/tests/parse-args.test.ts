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

  it("parses equals-style flags", () => {
    expect(parseArgs(["validate", "--project=Book.epubproj"])).toEqual({
      command: "validate",
      flags: {
        project: "Book.epubproj"
      }
    });
  });

  it("parses boolean flags", () => {
    expect(parseArgs(["export", "--dry-run"])).toEqual({
      command: "export",
      flags: {
        "dry-run": true
      }
    });
  });

  it("ignores stray positional args", () => {
    expect(parseArgs(["themes", "extra", "--json"])).toEqual({
      command: "themes",
      flags: {
        json: true
      }
    });
  });
});
