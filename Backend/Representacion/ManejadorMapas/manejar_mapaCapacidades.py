"""Manager for station capacity map generation."""

import os
from os.path import join
import numpy as np
import pandas as pd

from Backend.Auxiliares import auxiliar_estaciones
from Backend.Representacion.Interfaz_Representacion import Interfaz_Representacion
from Backend.Representacion.Mapas.MapaCapacidades import MapaCapacidades


class manejar_mapaCapacidades(Interfaz_Representacion):
    """
    Handles the generation of capacity maps.

    This manager creates a static map showing the capacity of each bike station
    using colored circles.
    """

    def __init__(
            self,
            capacidades: pd.DataFrame,
            coordenadas: np.array,
            mostrarLabels: bool = False,
            listaEstaciones: list = None
    ):
        """
        Initialize the capacity map manager.

        Args:
            capacidades: DataFrame with station capacities
            coordenadas: Array with station coordinates
            mostrarLabels: If True, show popup labels by default
            listaEstaciones: Optional list of station IDs to filter
        """
        self.capacidades = capacidades
        self.coordenadas = coordenadas
        self.mostrarLabels = mostrarLabels
        self.listaEstaciones = listaEstaciones

    def cargarMapaInstante(self, instante: int):
        """
        Required abstract method from Interfaz_Representacion.
        For capacity maps (static), just call the main cargarMapa method.
        """
        self.cargarMapa()

    def cargarMapa(self, listaEstaciones: list = None):
        """
        Generate the capacity map.

        Args:
            listaEstaciones: Optional list of station IDs to display
        """
        if listaEstaciones is not None or self.listaEstaciones is not None:
            # Filter stations if list provided
            estaciones_filtrar = listaEstaciones if listaEstaciones is not None else self.listaEstaciones

            # Filter coordinates
            coordenadas_filtradas = self.coordenadas[
                np.isin(self.coordenadas[:, 0], estaciones_filtrar)
            ]

            # Filter capacities - assuming capacidades has header in first row
            if self.capacidades.iloc[0, 0] == 'header':
                capacidades_data = self.capacidades.iloc[1:, :]
                indices_filtrados = [i for i, est_id in enumerate(self.coordenadas[:, 0])
                                     if est_id in estaciones_filtrar]
                capacidades_filtradas = capacidades_data.iloc[indices_filtrados, :]
                # Re-add header
                capacidades_filtradas = pd.concat([
                    pd.DataFrame(['header'], columns=[0]),
                    capacidades_filtradas.reset_index(drop=True)
                ], ignore_index=True)
            else:
                indices_filtrados = [i for i, est_id in enumerate(self.coordenadas[:, 0])
                                     if est_id in estaciones_filtrar]
                capacidades_filtradas = self.capacidades.iloc[indices_filtrados, :]
        else:
            coordenadas_filtradas = self.coordenadas
            capacidades_filtradas = self.capacidades

        # Create and generate map
        mc = MapaCapacidades(
            capacidades_filtradas,
            coordenadas_filtradas,
            mostrarPopup=self.mostrarLabels
        )
        mc.representar()

    def getFichero(self):
        """
        Get the path to the generated map file.

        Returns:
            str: Path to MapaCapacidades.html
        """
        return join(os.getcwd(), "MapaCapacidades.html")

    def getInstanciasMax(self):
        """
        Get maximum instances (not applicable for static capacity map).

        Returns:
            str: "1" since this is a static map
        """
        return "1"