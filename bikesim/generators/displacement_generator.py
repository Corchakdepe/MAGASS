"""Displacement map generation service."""

import logging
import json
from pathlib import Path
from typing import Tuple
import pandas as pd
import numpy as np
import glob

from bikesim.core.models import MapMetadata
from bikesim.core.exceptions import MapGenerationError, DataLoadError
from bikesim.utils.parsers import parse_displacement_spec
from bikesim.utils import Agrupador
from bikesim.Representacion.ManejadorMapas.Manejar_Desplazamientos import Manejar_Desplazamientos
from bikesim.auxiliares import auxiliar_ficheros
from bikesim import Constantes

logger = logging.getLogger(__name__)


class DisplacementGenerator:
    """Generates displacement maps."""

    def __init__(self, output_folder: Path, input_folder: str):
        self.output_folder = output_folder
        self.input_folder = input_folder
        self.output_folder.mkdir(exist_ok=True, parents=True)

    def generate(self, spec: str) -> MapMetadata:
        try:
            instant, delta_origin, delta_dest, action, type_ = parse_displacement_spec(spec)

            df = self._load_displacement_matrix()
            self._validate_displacement_columns(df)

            if delta_origin != delta_dest:
                df = self._transform_delta(df, delta_origin, delta_dest)

            filtered = self._filter_displacement_data(df, instant, action, type_)

            if filtered.empty:
                raise MapGenerationError(
                    f"No displacements for instant={instant}, action={action}, type={type_}"
                )

            matrix, n_stations = self._build_od_matrix(filtered)

            out_totals = matrix.sum(axis=1).tolist()
            in_totals = matrix.sum(axis=0).tolist()
            station_ids = list(range(n_stations))

            map_path = self._generate_map_file(df, instant, action, type_)

            self._save_csv_data(
                map_path.name,
                station_ids,
                instant,
                out_totals,
                in_totals
            )

            self._save_json_metadata(
                map_path.name,
                instant,
                delta_dest,
                action,
                type_,
                station_ids,
                out_totals,
                in_totals
            )

            logger.info(f"Generated displacement map for instant {instant}")

            return MapMetadata(
                id=f"MapaDesplazamientos_{instant}",
                kind="displacement",
                format=map_path.suffix.lstrip("."),
                name=f"Displacement Map t={instant}",
                url=f"/{map_path.name}",
                instant=instant,
                file_path=str(map_path)
            )

        except Exception as e:
            logger.error(f"Failed to generate displacement map: {e}", exc_info=True)
            raise MapGenerationError(f"Displacement map generation failed: {e}") from e

    def _load_displacement_matrix(self) -> pd.DataFrame:
        pattern = str(Path(self.input_folder) / "*Desplazamientos_Resultado*.csv")
        candidates = glob.glob(pattern)

        if not candidates:
            raise DataLoadError(
                f"No Desplazamientos_Resultado*.csv file found in {self.input_folder}"
            )

        if len(candidates) > 1:
            raise DataLoadError(
                f"Multiple displacement files found: {candidates}. Keep only one in the input folder."
            )

        try:
            df = pd.read_csv(candidates[0])
            logger.info(f"Loaded displacement matrix from {candidates[0]}")
            return df
        except Exception as e:
            raise DataLoadError(f"Failed to read displacement file: {e}") from e

    def _validate_displacement_columns(self, df: pd.DataFrame) -> None:
        expected_cols = {
            "Estacion origen",
            "Estacion final",
            "tipo de peticion",
            "Utemporal",
            "Cantidad_peticiones",
            "RealFicticio",
        }

        if not expected_cols.issubset(set(df.columns)):
            missing = expected_cols - set(df.columns)
            raise DataLoadError(
                f"Displacement matrix missing required columns: {missing}"
            )

    def _transform_delta(
        self,
        df: pd.DataFrame,
        delta_origin: int,
        delta_dest: int
    ) -> pd.DataFrame:
        if delta_origin < delta_dest:
            ratio = delta_dest / delta_origin
            if ratio != int(ratio):
                raise MapGenerationError(
                    f"Cannot collapse delta {delta_origin} to {delta_dest}: ratio {ratio} is not an integer"
                )

            df = Agrupador.colapsarDesplazamientos(df, delta_origin, delta_dest)
            logger.info(f"Collapsed displacements from delta {delta_origin} to {delta_dest}")
        else:
            raise MapGenerationError(
                f"Cannot transform delta {delta_origin} to {delta_dest}: disaggregation not supported"
            )

        return df

    def _filter_displacement_data(
        self,
        df: pd.DataFrame,
        instant: int,
        action: int,
        type_: int
    ) -> pd.DataFrame:
        filtered = df[
            (df["Utemporal"] == instant) &
            (df["tipo de peticion"] == action) &
            (df["RealFicticio"] == type_) &
            (df["Estacion origen"] != df["Estacion final"])
        ]

        logger.info(
            f"Filtered displacements: {len(filtered)} rows for instant={instant}, action={action}, type={type_}"
        )

        return filtered

    def _build_od_matrix(
        self,
        filtered: pd.DataFrame
    ) -> Tuple[np.ndarray, int]:
        max_station_id = int(
            max(filtered["Estacion origen"].max(), filtered["Estacion final"].max())
        )
        n_stations = max_station_id + 1

        matrix = np.zeros((n_stations, n_stations), dtype=float)

        for _, row in filtered.iterrows():
            origin = int(row["Estacion origen"])
            dest = int(row["Estacion final"])
            count = float(row["Cantidad_peticiones"])

            if 0 <= origin < n_stations and 0 <= dest < n_stations:
                matrix[origin, dest] += count

        logger.info(f"Built OD matrix: {n_stations}x{n_stations}")
        return matrix, n_stations

    def _generate_map_file(
        self,
        df: pd.DataFrame,
        instant: int,
        action: int,
        type_: int
    ) -> Path:
        try:
            md = Manejar_Desplazamientos(
                df,
                Constantes.COORDENADAS,
                accion=action,
                tipo=type_
            )

            md.cargarMapaInstante(instant)

            output_name = auxiliar_ficheros.formatoArchivo(
                f"MapaDesplazamientos_instante{instant}",
                "png"
            )
            output_path = self.output_folder / output_name

            md.realizarFoto(str(output_path))

            if not output_path.exists():
                raise MapGenerationError(
                    f"Expected displacement map at {output_path} but it was not created"
                )

            return output_path

        except Exception as e:
            raise MapGenerationError(
                f"Failed to generate displacement map file: {e}"
            ) from e

    def _save_csv_data(
        self,
        base_name: str,
        station_ids: list,
        instant: int,
        out_totals: list,
        in_totals: list
    ) -> Path:
        csv_name = Path(base_name).with_suffix(".csv").name
        csv_path = self.output_folder / csv_name

        df = pd.DataFrame({
            "station_id": station_ids,
            "t": instant,
            "out_total": out_totals,
            "in_total": in_totals,
        })

        df.to_csv(csv_path, index=False)
        logger.info(f"Saved displacement CSV to {csv_path}")
        return csv_path

    def _save_json_metadata(
        self,
        base_name: str,
        instant: int,
        delta: int,
        action: int,
        type_: int,
        station_ids: list,
        out_totals: list,
        in_totals: list
    ) -> Path:
        json_name = Path(base_name).with_suffix(".json").name
        json_path = self.output_folder / json_name

        metadata = {
            "id": f"MapaDesplazamientos_{instant}",
            "kind": "displacement_map",
            "format": "json",
            "instant": instant,
            "delta": delta,
            "accion": action,
            "tipo": type_,
            "nodes": [
                {
                    "station_id": int(sid),
                    "out_total": out_totals[i],
                    "in_total": in_totals[i],
                }
                for i, sid in enumerate(station_ids)
            ],
        }

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved displacement JSON to {json_path}")
        return json_path
