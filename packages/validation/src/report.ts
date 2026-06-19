export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}

export function createValidationReport(issues: ValidationIssue[] = []): ValidationReport {
  return { issues };
}
