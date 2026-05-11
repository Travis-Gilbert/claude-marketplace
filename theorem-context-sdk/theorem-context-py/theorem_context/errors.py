class TheoremContextError(Exception):
    """Base exception for Context Theorem SDK failures."""


class AuthError(TheoremContextError):
    """Raised when the server rejects the request for auth reasons."""


class CompileError(TheoremContextError):
    """Raised when context compilation fails."""


class HarnessError(TheoremContextError):
    """Raised when a harness or THG request fails."""


class RequestTimeoutError(TheoremContextError):
    """Raised when the server times out."""


class ServerUnavailableError(TheoremContextError):
    """Raised when the upstream service is unavailable."""


class UnsupportedSurfaceError(TheoremContextError):
    """Raised when the SDK exposes a surface the backend does not implement."""

    def __init__(self, surface: str, message: str | None = None) -> None:
        self.surface = surface
        super().__init__(message or f'{surface} is not implemented by the backend yet.')


class StubSurfaceError(TheoremContextError):
    """Raised when the caller explicitly requests a known stub surface."""

    def __init__(self, surface: str, message: str | None = None) -> None:
        self.surface = surface
        super().__init__(message or f'{surface} is currently a stub surface.')
