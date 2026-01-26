"""
Improved chart JSON generation utilities for harmonized frontend consumption
"""

from typing import List, Dict, Any, Literal, Optional, Union
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import json
import hashlib


class ChartBuilder:
    """Builder for creating standardized chart JSON structures"""

    @staticmethod
    def _generate_chart_id(kind: str, **kwargs) -> str:
        """Generate unique chart ID from parameters"""
        parts = [kind]
        for k, v in sorted(kwargs.items()):
            if isinstance(v, (list, tuple)):
                parts.append(f"{k}_{'_'.join(map(str, v))}")
            else:
                parts.append(f"{k}_{v}")
        return "_".join(parts)

    @staticmethod
    def _generate_filename(base_name: str) -> tuple[str, str]:
        """Generate unique filename for JSON output"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        content_hash = hashlib.sha1(base_name.encode('utf-8')).hexdigest()[:8]
        json_filename = f"{timestamp}_{base_name}_{content_hash}.json"
        return json_filename

    @staticmethod
    def create_timeseries_chart(
        title: str,
        x_hours: List[int],
        series_data: Dict[str, List[float]],
        stations: List[int],
        days: List[int],
        aggregation: Literal["mean", "sum"] = "mean",
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a standardized timeseries chart (hourly data)

        Args:
            title: Human-readable title
            x_hours: List of hours [0-23]
            series_data: {"est_87": [values], "est_212": [values]}
            stations: List of station IDs
            days: Days included in aggregation
            aggregation: Type of aggregation performed
            output_path: Optional path to save JSON file

        Returns:
            Standardized chart JSON structure
        """
        chart_id = ChartBuilder._generate_chart_id(
            "timeseries",
            stations=stations,
            days=tuple(days[:3]) if len(days) > 3 else tuple(days)
        )

        series = []
        for station_id in stations:
            key = f"est_{station_id}"
            if key in series_data:
                series.append({
                    "id": key,
                    "label": f"Station {station_id}",
                    "values": series_data[key],
                    "metadata": {
                        "station_id": station_id,
                        "derived": False,
                        "aggregation": aggregation,
                        "value_type": "occupancy"
                    }
                })

        chart_json = {
            "id": chart_id,
            "kind": "timeseries",
            "format": "json",
            "visualization": {
                "recommended": "line" if len(series) > 1 else "bar",
                "supported": ["line", "bar", "area"]
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
                "time_range": {"start": 0, "end": 23, "unit": "hour"},
                "days": days,
                "stations": stations,
                "aggregation": aggregation
            }
        }

        if output_path:
            ChartBuilder._save_json(chart_json, output_path)

        return chart_json

    @staticmethod
    def create_distribution_chart(
        title: str,
        bin_centers: List[float],
        frequencies: List[int],
        days: List[int],
        value_type: Literal["mean", "sum"] = "mean",
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a distribution/histogram chart

        Args:
            title: Human-readable title
            bin_centers: Center points of histogram bins
            frequencies: Count in each bin
            days: Days included in calculation
            value_type: What the values represent
            output_path: Optional path to save JSON file

        Returns:
            Standardized chart JSON structure
        """
        chart_id = ChartBuilder._generate_chart_id(
            "distribution",
            days=tuple(days[:3]) if len(days) > 3 else tuple(days),
            value_type=value_type
        )

        chart_json = {
            "id": chart_id,
            "kind": "distribution",
            "format": "json",
            "visualization": {
                "recommended": "bar",
                "supported": ["bar", "area"]
            },
            "data": {
                "x": {
                    "values": [round(v, 2) for v in bin_centers],
                    "label": f"{value_type.capitalize()} Value",
                    "type": "quantitative",
                    "unit": "value_bin"
                },
                "series": [{
                    "id": "frequency",
                    "label": "Frequency",
                    "values": frequencies,
                    "metadata": {
                        "derived": False,
                        "value_type": "count"
                    }
                }]
            },
            "context": {
                "title": title,
                "days": days,
                "value_type": value_type,
                "bin_count": len(bin_centers)
            }
        }

        if output_path:
            ChartBuilder._save_json(chart_json, output_path)

        return chart_json

    @staticmethod
    def create_comparison_chart(
        title: str,
        x_hours: List[int],
        series_specs: List[Dict[str, Any]],
        global_context: Optional[Dict[str, Any]] = None,
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a multi-station/multi-condition comparison chart

        Args:
            title: Human-readable title
            x_hours: List of hours [0-23]
            series_specs: List of dicts with {station_id, days, values, aggregation}
            global_context: Additional context info
            output_path: Optional path to save JSON file

        Returns:
            Standardized chart JSON structure
        """
        all_stations = []
        series = []

        for spec in series_specs:
            station_id = spec["station_id"]
            days = spec.get("days", "all")
            all_stations.append(station_id)

            # Create readable label
            if days == "all":
                days_label = "all days"
            elif isinstance(days, list):
                if len(days) > 3:
                    days_label = f"{len(days)} days"
                else:
                    days_label = f"days {','.join(map(str, days))}"
            else:
                days_label = str(days)

            series.append({
                "id": f"est_{station_id}",
                "label": f"Station {station_id} ({days_label})",
                "values": spec["values"],
                "metadata": {
                    "station_id": station_id,
                    "days": days,
                    "derived": False,
                    "aggregation": spec.get("aggregation", "mean")
                }
            })

        chart_id = ChartBuilder._generate_chart_id(
            "comparison",
            stations=tuple(all_stations[:5])
        )

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
                "stations": all_stations,
                **(global_context or {})
            }
        }

        if output_path:
            ChartBuilder._save_json(chart_json, output_path)

        return chart_json

    @staticmethod
    def create_accumulation_chart(
        title: str,
        x_hours: List[int],
        series_data: Dict[str, List[float]],
        stations: List[int],
        days: List[int],
        output_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a cumulative/accumulation chart

        Args:
            title: Human-readable title
            x_hours: List of hours [0-23]
            series_data: {"est_87": [cumulative_values], ...}
            stations: List of station IDs
            days: Days included
            output_path: Optional path to save JSON file

        Returns:
            Standardized chart JSON structure
        """
        chart_id = ChartBuilder._generate_chart_id(
            "accumulation",
            stations=stations[:5],
            days=tuple(days[:3]) if len(days) > 3 else tuple(days)
        )

        series = []
        for station_id in stations:
            key = f"est_{station_id}"
            if key in series_data:
                series.append({
                    "id": key,
                    "label": f"Station {station_id} (cumulative)",
                    "values": series_data[key],
                    "metadata": {
                        "station_id": station_id,
                        "derived": True,
                        "aggregation": "cumulative",
                        "value_type": "accumulation"
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
                "time_range": {"start": 0, "end": 23, "unit": "hour"},
                "days": days,
                "stations": stations
            }
        }

        if output_path:
            ChartBuilder._save_json(chart_json, output_path)

        return chart_json

    @staticmethod
    def _save_json(chart_json: Dict[str, Any], output_path: str):
        """Save chart JSON to file with proper formatting"""
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(chart_json, f, ensure_ascii=False, indent=2)


# Convenience function for backward compatibility
def create_chart_json(
    kind: Literal["timeseries", "distribution", "comparison", "accumulation"],
    **kwargs
) -> Dict[str, Any]:
    """
    Factory function to create any chart type

    Usage:
        chart = create_chart_json(
            kind="timeseries",
            title="Mean Occupancy",
            x_hours=list(range(24)),
            series_data={"est_87": [...]},
            stations=[87],
            days=[0,1,2],
            aggregation="mean"
        )
    """
    builder_map = {
        "timeseries": ChartBuilder.create_timeseries_chart,
        "distribution": ChartBuilder.create_distribution_chart,
        "comparison": ChartBuilder.create_comparison_chart,
        "accumulation": ChartBuilder.create_accumulation_chart
    }

    if kind not in builder_map:
        raise ValueError(f"Unknown chart kind: {kind}")

    return builder_map[kind](**kwargs)
