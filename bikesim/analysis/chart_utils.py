"""Utility functions for chart generation (backward compatibility)."""

import csv
from typing import Dict, List, Any
from pathlib import Path


def write_series_csv(
        file_path: str,
        x: List,
        ys: Dict[str, List],
        meta: Dict[str, Any]
):
    """
    Write chart data to CSV format (for backward compatibility).

    Args:
        file_path: Output file path
        x: X-axis values
        ys: Dictionary of series_id -> y values
        meta: Metadata dictionary
    """
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Write metadata as comments
        writer.writerow(['# Chart Metadata'])
        for key, value in meta.items():
            writer.writerow([f'# {key}: {value}'])
        writer.writerow([])

        # Write header
        header = ['x'] + list(ys.keys())
        writer.writerow(header)

        # Write data rows
        for i, x_val in enumerate(x):
            row = [x_val]
            for series_id in ys.keys():
                row.append(ys[series_id][i] if i < len(ys[series_id]) else '')
            writer.writerow(row)
