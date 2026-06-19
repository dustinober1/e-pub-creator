export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface ValidationReport {
  readonly issues: readonly Readonly<ValidationIssue>[];
}

export function createValidationReport(issues: readonly ValidationIssue[] = []): ValidationReport {
  const issueCopies = issues.map((issue) => Object.freeze({ ...issue }));

  return Object.freeze({ issues: Object.freeze(issueCopies) });
}
