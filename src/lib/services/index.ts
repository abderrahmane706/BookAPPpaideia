/**
 * Unified service-layer error. Services throw this so consumers can render
 * consistent, user-facing error states without leaking internals.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "unauthorized" | "invalid" | "storage" | "unknown",
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

// Barrel for service boundaries.
export * from "./ai";
export * from "./books";
export * from "./insights";
export * from "./library";
export * from "./notes";
export * from "./quotes";
export * from "./reading-sessions";
export * from "./summaries";
export * from "./mindmap";
