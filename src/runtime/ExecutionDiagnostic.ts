/**
 * Severity levels for diagnostic entries.
 */
export enum DiagnosticSeverity {
  OK = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

/**
 * A single diagnostic entry.
 */
export interface DiagnosticEntry {
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
}

/**
 * Collects errors and warnings during transformation execution.
 * Eclipse equivalent: org.eclipse.m2m.qvt.oml.ExecutionDiagnostic
 */
export class ExecutionDiagnostic {
  private readonly entries: DiagnosticEntry[] = [];

  /** Add an error. */
  error(message: string, source?: string): void {
    this.entries.push({ severity: DiagnosticSeverity.ERROR, message, source });
  }

  /** Add a warning. */
  warn(message: string, source?: string): void {
    this.entries.push({ severity: DiagnosticSeverity.WARNING, message, source });
  }

  /** Add an info. */
  info(message: string, source?: string): void {
    this.entries.push({ severity: DiagnosticSeverity.INFO, message, source });
  }

  /** Get all entries. */
  getEntries(): readonly DiagnosticEntry[] {
    return this.entries;
  }

  /** Overall severity (worst). */
  getSeverity(): DiagnosticSeverity {
    let max = DiagnosticSeverity.OK;
    for (const e of this.entries) {
      if (e.severity > max) max = e.severity;
    }
    return max;
  }

  /** Whether there are errors. */
  hasErrors(): boolean {
    return this.entries.some(e => e.severity === DiagnosticSeverity.ERROR);
  }

  /** Whether the execution succeeded (no errors). */
  isOk(): boolean {
    return !this.hasErrors();
  }
}
