import { describe, expect, it } from "vitest";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../src/lib/project-history";

describe("project history", () => {
  it("tracks undo and redo states", () => {
    const first = createHistory("first");
    const second = pushHistory(first, "second");
    const third = pushHistory(second, "third");

    expect(third.present).toBe("third");
    expect(third.past).toEqual(["first", "second"]);
    expect(third.future).toEqual([]);

    const undone = undoHistory(third);
    expect(undone.present).toBe("second");
    expect(undone.past).toEqual(["first"]);
    expect(undone.future).toEqual(["third"]);

    const redone = redoHistory(undone);
    expect(redone.present).toBe("third");
    expect(redone.past).toEqual(["first", "second"]);
    expect(redone.future).toEqual([]);
  });

  it("ignores undo and redo when there is no matching history", () => {
    const history = createHistory("only");

    expect(undoHistory(history)).toEqual(history);
    expect(redoHistory(history)).toEqual(history);
  });

  it("does not create a new entry when the state is unchanged", () => {
    const history = createHistory("same");

    expect(pushHistory(history, "same")).toBe(history);
  });

  it("treats equal object states as unchanged", () => {
    const history = createHistory({
      title: "Book",
      metadata: {
        author: "Author",
        language: "en",
      },
    });

    expect(
      pushHistory(history, {
        title: "Book",
        metadata: {
          author: "Author",
          language: "en",
        },
      }),
    ).toBe(history);
  });

  it("treats equal object states with different key order as unchanged", () => {
    const history = createHistory({
      title: "Book",
      metadata: {
        author: "Author",
        language: "en",
      },
    });

    expect(
      pushHistory(history, {
        metadata: {
          language: "en",
          author: "Author",
        },
        title: "Book",
      }),
    ).toBe(history);
  });
});
