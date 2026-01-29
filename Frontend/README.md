# Analysis Runner Refactoring

## Overview

This refactoring breaks down the monolithic `analysis_runner.py` file (1200+ lines) into clean, modular components while preserving all existing logic and API compatibility.

## Structure

```
analysis_runner.py          # Main orchestrator (200 lines)
analysis/
  ├── __init__.py           # Package exports
  ├── matrix_processor.py   # Matrix operations (100 lines)
  ├── delta_converter.py    # Time delta conversion (30 lines)
  ├── chart_generator.py    # Chart generation (300 lines)
  ├── map_generator.py      # Map generation (350 lines)
  └── filter_processor.py   # Filter operations (150 lines)
```

## Benefits

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility:
- `MatrixProcessor`: Matrix selection and aggregation
- `DeltaConverter`: Time unit conversions
- `ChartGenerator`: All chart creation
- `MapGenerator`: All map creation
- `FilterProcessor`: All filtering operations

### 2. **Improved Maintainability**
- Each file is ~100-350 lines (vs 1200+ original)
- Easy to locate and fix bugs in specific functionality
- Clear boundaries between different operations

### 3. **Better Testability**
- Each module can be tested independently
- Mock dependencies easily
- Isolated unit tests for each component

### 4. **Enhanced Readability**
- Self-documenting module names
- Clear class and method names
- Comprehensive docstrings

### 5. **Scalability**
- Easy to add new chart/map types
- Simple to extend filtering capabilities
- Clear patterns for future enhancements

## API Compatibility

The refactoring maintains **100% backward compatibility** with the existing API:

```python
# These functions remain unchanged
run_filter_only(...)      # Same signature
run_full_analysis(...)    # Same signature
run_analysis(args)        # Same signature
```

## Module Details

### `analysis_runner.py` (Main Orchestrator)
The entry point that:
1. Sets up configuration
2. Loads simulation data
3. Delegates to specialized modules
4. Returns results in the same format

### `matrix_processor.py`
Handles matrix operations:
- Selection of matrices by ID
- Aggregation (addition/subtraction)
- Row padding to match dimensions

```python
processor = MatrixProcessor(matrices)
matriz = processor.process_selection("0;1;2")
```

### `delta_converter.py`
Converts UI delta values to minutes:
- 0 → 0 (instantaneous)
- 1 → 5 minutes
- 2 → 15 minutes
- 3 → 30 minutes
- 4 → 60 minutes

```python
converter = DeltaConverter()
delta_mins = converter.convert_delta(delta_ui)
```

### `chart_generator.py`
Generates all chart types:
- Station average bar charts
- Station accumulated bar charts
- Day-level bar charts
- Station comparison line charts
- Matrix comparison line charts

```python
chart_gen = ChartGenerator(matriz, matrices, output_path)
charts = chart_gen.generate_all_charts(args, delta_media, delta_acum)
```

### `map_generator.py`
Generates all map types:
- Density heatmaps
- Density videos
- Voronoi diagrams
- Circle/bubble maps
- Displacement/flow maps

```python
map_gen = MapGenerator(matriz, matrices, output_path)
maps = map_gen.generate_all_maps(args, delta_media, delta_acum)
```

### `filter_processor.py`
Processes all filter types:
- Station value filters (single day)
- Station value filters (multiple days)
- Hours filters
- Percentage filters

```python
filter_proc = FilterProcessor(filtrador, output_path, num_days)
filter_proc.process_all_filters(args)
```

## Migration Guide

### Before (Original Code)
```python
# 1200+ lines in a single file
# Hard to find specific functionality
# Difficult to test individual components
```

### After (Refactored Code)
```python
# Clean separation
from analysis import (
    MatrixProcessor,
    ChartGenerator,
    MapGenerator,
    FilterProcessor
)

# Easy to use and test
processor = MatrixProcessor(matrices)
matriz = processor.process_selection(selection_str)
```

## Key Design Principles

1. **Single Responsibility**: Each class has one job
2. **Dependency Injection**: Components receive dependencies
3. **Error Handling**: Try-catch blocks with meaningful warnings
4. **Documentation**: Comprehensive docstrings
5. **Type Hints**: Clear parameter and return types

## Error Handling

All modules use consistent error handling:
```python
try:
    # Operation
except Exception as e:
    print(f"[WARN] Error in operation: {e}")
    # Continue processing other items
```

This ensures one failure doesn't stop the entire analysis.

## Future Enhancements

The modular structure makes it easy to:
1. Add new chart types (extend `ChartGenerator`)
2. Add new map types (extend `MapGenerator`)
3. Add new filter types (extend `FilterProcessor`)
4. Swap implementations (e.g., different charting libraries)
5. Add caching, logging, or monitoring

## Testing Strategy

Each module can be tested independently:

```python
# Test matrix processor
def test_matrix_selection():
    matrices = load_test_matrices()
    processor = MatrixProcessor(matrices)
    result = processor.process_selection("0;1")
    assert result.shape == expected_shape

# Test chart generator
def test_chart_generation():
    matriz = create_test_matrix()
    gen = ChartGenerator(matriz, {}, "/tmp")
    charts = gen._generate_station_average_charts("0;1", 5)
    assert len(charts) == 2
```

## Performance

The refactoring maintains the same performance characteristics:
- No additional computational overhead
- Same memory usage
- Lazy evaluation where possible
- Efficient data structures

## Conclusion

This refactoring transforms a monolithic 1200-line file into a clean, modular architecture that is:
- **Easier to understand** (200 lines per file vs 1200)
- **Easier to maintain** (clear separation of concerns)
- **Easier to test** (isolated components)
- **Easier to extend** (clear patterns)

All while maintaining 100% backward compatibility with the existing API.
