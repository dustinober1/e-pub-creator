export interface ProjectHistory<T> {
  past: T[];
  present: T;
  future: T[];
}

function normalizeState(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeState);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, normalizeState((value as Record<string, unknown>)[key])]),
    );
  }

  return value;
}

function isSameState<T>(left: T, right: T): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (
    left !== null &&
    right !== null &&
    typeof left === "object" &&
    typeof right === "object"
  ) {
    return JSON.stringify(normalizeState(left)) === JSON.stringify(
      normalizeState(right),
    );
  }

  return false;
}

export function createHistory<T>(present: T): ProjectHistory<T> {
  return {
    past: [],
    present,
    future: [],
  };
}

export function pushHistory<T>(
  history: ProjectHistory<T>,
  present: T,
): ProjectHistory<T> {
  if (isSameState(history.present, present)) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present,
    future: [],
  };
}

export function undoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const previous = history.past.at(-1);

  if (previous === undefined) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const next = history.future[0];

  if (next === undefined) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
