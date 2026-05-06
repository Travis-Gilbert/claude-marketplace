export class TheoremContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthError extends TheoremContextError {}

export class CompileError extends TheoremContextError {}

export class HarnessError extends TheoremContextError {}

export class RequestTimeoutError extends TheoremContextError {}

export class ServerUnavailableError extends TheoremContextError {}

export class UnsupportedSurfaceError extends TheoremContextError {
  readonly surface: string;

  constructor(surface: string, message?: string) {
    super(message ?? `${surface} is not implemented by the backend yet.`);
    this.surface = surface;
  }
}

export class StubSurfaceError extends TheoremContextError {
  readonly surface: string;

  constructor(surface: string, message?: string) {
    super(message ?? `${surface} is currently a stub surface.`);
    this.surface = surface;
  }
}
