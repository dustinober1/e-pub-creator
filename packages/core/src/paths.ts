export function assertBundleLocalPath(value: string, fieldName: string): void {
  if (!isBundleLocalPath(value)) {
    throw new Error(`${fieldName} must be bundle-local: ${value}`);
  }
}

export function isBundleLocalPath(value: string): boolean {
  if (
    value.trim() === "" ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return false;
  }

  return value.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}
