"""
Chart builder for creating standardized chart JSON outputs.
This extends the existing Backend functionality.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
class ChartBuilder:
    """Builder for creating standardized chart JSON."""

    @staticmethod
    def create_timeseries_chart(
        title: str,
        x_hours: List[int],
        series_data: Dict[str, List[float]],
        stations: List[int],
        days: List[int],
        aggregation: str,
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """
        Create timeseries chart JSON.

        Args:
            title: Chart title
            x_hours: Hour values (0-23)
            series_data: Dictionary of series_id -> values
            stations: Station IDs
            days: Day indices
            aggregation: Aggregation type (mean, sum)
            matrix_type: Type of matrix used
            output_path: Path to save JSON

        Returns:
            Chart JSON dictionary
        """
        chart_id = f"timeseries_{hashlib.sha1(title.encode()).hexdigest()[:8]}"

        # Build series list
        series = []
        for series_id, values in series_data.items():
            series.append({
                "id": series_id,
                "label": series_id.replace("_", " ").title(),
                "values": values,
                "metadata": {
                    "derived": False,
                    "aggregation": aggregation
                }
            })

        chart_json = {
            "id": chart_id,
            "kind": "timeseries",
            "format": "json",
            "visualization": {
                "recommended": "bar",
                "supported": ["bar", "line", "area"]
            },
            "data": {
                "x": {
                    "values": x_hours,
                    "label": "Hour of Day",
                    "type": "temporal",
                    "unit": "hour",
                    "domain": [0, 23]
                },
                "series": series
            },
            "context": {
                "title": title,
                "stations": stations,
                "days": days,
                "aggregation": aggregation,
                "matrix_type": matrix_type  # Add field
            }
        }

        # Save to file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json

    @staticmethod
    def create_accumulation_chart(
        title: str,
        x_hours: List[int],
        series_data: Dict[str, List[float]],
        stations: List[int],
        days: List[int],
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """Create cumulative/accumulation chart JSON."""
        chart_id = f"accumulation_{hashlib.sha1(title.encode()).hexdigest()[:8]}"

        series = []
        for series_id, values in series_data.items():
            series.append({
                "id": series_id,
                "label": series_id.replace("_", " ").title(),
                "values": values,
                "metadata": {
                    "derived": True,
                    "aggregation": "cumsum"
                }
            })

        chart_json = {
            "id": chart_id,
            "kind": "accumulation",
            "format": "json",
            "visualization": {
                "recommended": "line",
                "supported": ["line", "area"]
            },
            "data": {
                "x": {
                    "values": x_hours,
                    "label": "Hour of Day",
                    "type": "temporal",
                    "unit": "hour",
                    "domain": [0, 23]
                },
                "series": series
            },
            "context": {
                "title": title,
                "stations": stations,
                "days": days,
                "aggregation": "cumulative",
                "matrix_type": matrix_type  # Add field
            }
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json

    @staticmethod
    def create_distribution_chart(
        title: str,
        bin_centers: List[float],
        frequencies: List[int],
        days: List[int],
        value_type: str,
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """Create distribution/histogram chart JSON."""
        chart_id = f"distribution_{hashlib.sha1(title.encode()).hexdigest()[:8]}"

        chart_json = {
            "id": chart_id,
            "kind": "distribution",
            "format": "json",
            "visualization": {
                "recommended": "bar",
                "supported": ["bar", "histogram"]
            },
            "data": {
                "x": {
                    "values": bin_centers,
                    "label": "Value",
                    "type": "quantitative",
                    "unit": "value"
                },
                "series": [{
                    "id": "frequency",
                    "label": "Frequency",
                    "values": frequencies,
                    "metadata": {
                        "derived": True,
                        "aggregation": "count"
                    }
                }]
            },
            "context": {
                "title": title,
                "days": days,
                "value_type": value_type,
                "matrix_type": matrix_type  # Add field
            }
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json

    @staticmethod
    def create_station_series_chart(
        title: str,
        station_indices: List[int],
        values: List[float],
        days: List[int],
        value_type: str,
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """Create station series chart JSON."""
        chart_id = f"station_series_{hashlib.sha1(title.encode()).hexdigest()[:8]}"

        chart_json = {
            "id": chart_id,
            "kind": "station_series",
            "format": "json",
            "visualization": {
                "recommended": "line",
                "supported": ["line", "bar"]
            },
            "data": {
                "x": {
                    "values": station_indices,
                    "label": "Station Index",
                    "type": "categorical",
                    "unit": "station_id"
                },
                "series": [{
                    "id": "value",
                    "label": value_type.title(),
                    "values": values,
                    "metadata": {
                        "derived": False,
                        "value_type": value_type
                    }
                }]
            },
            "context": {
                "title": title,
                "days": days,
                "value_type": value_type,
                "matrix_type": matrix_type  # Add field
            }
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json

    @staticmethod
    def create_comparison_chart(
        title: str,
        x_hours: List[int],
        series_specs: List[Dict],
        global_context: Dict,
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """Create comparison chart JSON."""
        chart_id = f"comparison_{hashlib.sha1(title.encode()).hexdigest()[:8]}"

        series = []
        for spec in series_specs:
            station_id = spec["station_id"]
            days = spec["days"]

            # Format days for label
            if days == "all":
                days_label = "all"
            elif isinstance(days, list):
                days_label = f"days {','.join(map(str, days[:3]))}" if len(days) <= 3 else f"{len(days)} days"
            else:
                days_label = str(days)

            series.append({
                "id": f"station_{station_id}",
                "label": f"Station {station_id} ({days_label})",
                "values": spec["values"],
                "metadata": {
                    "station_id": station_id,
                    "days": days,
                    "aggregation": spec.get("aggregation", "mean"),
                    "derived": False
                }
            })

        # Add matrix_type to global_context
        global_context_with_matrix = {
            **global_context,
            "matrix_type": matrix_type
        }

        chart_json = {
            "id": chart_id,
            "kind": "comparison",
            "format": "json",
            "visualization": {
                "recommended": "line",
                "supported": ["line", "area", "bar"]
            },
            "data": {
                "x": {
                    "values": x_hours,
                    "label": "Hour of Day",
                    "type": "temporal",
                    "unit": "hour",
                    "domain": [0, 23]
                },
                "series": series
            },
            "context": {
                "title": title,
                **global_context_with_matrix
            }
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json

    @staticmethod
    def create_matrix_comparison_chart(
        title: str,
        x_hours: List[int],
        current_values: List[float],
        custom_values: List[float],
        delta: int,
        is_mean: bool,
        stations1: List[int],
        stations2: List[int],
        matrix_type: str,  # Add parameter
        output_path: str
    ) -> dict:
        """Create matrix comparison chart JSON."""
        chart_id = f"matrix_comparison_{delta}"

        chart_json = {
            "id": chart_id,
            "kind": "comparison",
            "format": "json",
            "visualization": {
                "recommended": "line",
                "supported": ["line", "area", "bar"]
            },
            "data": {
                "x": {
                    "values": x_hours,
                    "label": "Hour of Day",
                    "type": "temporal",
                    "unit": "hour",
                    "domain": [0, 23]
                },
                "series": [
                    {
                        "id": "current",
                        "label": "Current Matrix",
                        "values": current_values,
                        "metadata": {
                            "derived": False,
                            "aggregation": "mean" if is_mean else "sum",
                            "matrix_type": "current"
                        }
                    },
                    {
                        "id": "custom",
                        "label": "Custom Matrix",
                        "values": custom_values,
                        "metadata": {
                            "derived": False,
                            "aggregation": "mean" if is_mean else "sum",
                            "matrix_type": "custom"
                        }
                    }
                ]
            },
            "context": {
                "title": title,
                "delta": delta,
                "is_mean": is_mean,
                "stations1": stations1,
                "stations2": stations2,
                "matrix_type": matrix_type  # Add field
            }
        }

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)

        return chart_json