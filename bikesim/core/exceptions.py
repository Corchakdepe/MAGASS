"""Custom exceptions for the bikesim application."""

class BikesimException(Exception):
    """Base exception for all bikesim errors."""
    pass


class SimulationNotFoundError(BikesimException):
    """Raised when a simulation folder cannot be found."""
    def __init__(self, simulation_id: str):
        self.simulation_id = simulation_id
        super().__init__(f"Simulation not found: {simulation_id}")


class InvalidFilterSpecError(BikesimException):
    """Raised when a filter specification is invalid."""
    def __init__(self, spec: str, reason: str):
        self.spec = spec
        self.reason = reason
        super().__init__(f"Invalid filter spec '{spec}': {reason}")


class MatrixTransformationError(BikesimException):
    """Raised when a matrix transformation fails."""
    pass


class InvalidDeltaTransformationError(MatrixTransformationError):
    """Raised when delta transformation is not possible."""
    def __init__(self, current: int, target: int, reason: str):
        self.current = current
        self.target = target
        super().__init__(
            f"Cannot transform delta from {current} to {target}: {reason}"
        )


class DataLoadError(BikesimException):
    """Raised when data cannot be loaded."""
    pass


class ChartGenerationError(BikesimException):
    """Raised when chart generation fails."""
    pass


class MapGenerationError(BikesimException):
    """Raised when map generation fails."""
    pass


class FileOperationError(BikesimException):
    """Raised when file operations fail."""
    pass
