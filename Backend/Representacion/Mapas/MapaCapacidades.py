"""Map visualization for station capacities using Folium circles."""

from os.path import join
import numpy as np
import pandas as pd
import folium
from branca.colormap import LinearColormap
from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros
from branca.element import MacroElement
from jinja2 import Template


class _PostMessageOnClick(MacroElement):
    """Custom Folium element to send postMessage on circle click."""

    def __init__(self, station_id: int, map_name: str):
        super().__init__()
        self._name = "PostMessageOnClick"
        self.station_id = int(station_id)
        self.map_name = str(map_name)

        self._template = Template(u"""
        {% macro script(this, kwargs) %}
          (function(){
            var layer = {{ this._parent.get_name() }};
            if (!layer) return;
            layer.on('click', function(){
              try {
                window.parent.postMessage(
                  { type: "MAPSTATIONCLICK", station: {{ this.station_id }}, mapName: "{{ this.map_name }}" },
                  "*"
                );
              } catch (e) {}
            });
          })();
        {% endmacro %}
        """)


class MapaCapacidades:
    """
    Creates a Folium map showing station capacities as colored circles.

    Station capacities are displayed as circles with colors ranging from blue (low capacity)
    to red (high capacity).
    """

    def __init__(self, capacidades: pd.DataFrame, coordenadas: np.array, mostrarPopup=False):
        """
        Initialize the capacity map.

        Args:
            capacidades: DataFrame with station capacities (one column with capacity values)
            coordenadas: Array with station coordinates [station_id, lat, lon]
            mostrarPopup: If True, show popup labels by default
        """
        self.capacidades = capacidades
        self.coordenadas = coordenadas

        # Center map at middle station
        mitad = len(coordenadas) // 2
        self.mapa = folium.Map(
            [coordenadas[mitad][1], coordenadas[mitad][2]],
            zoom_start=13
        )
        self.mostrarPopup = mostrarPopup

    def representar(self):
        """
        Generate and save the capacity map.

        Creates circles for each station with size and color based on capacity.
        """
        # Get capacity values (skip header row if present)
        if self.capacidades.iloc[0, 0] == 'header':
            capacidades_valores = self.capacidades.iloc[1:, 0].astype(float).values
        else:
            capacidades_valores = self.capacidades.iloc[:, 0].astype(float).values

        # Determine min/max for color scale
        valorMax = capacidades_valores.max()
        valorMin = capacidades_valores.min()

        # Create color scale
        if valorMax != valorMin:
            color_list = ['blue', 'yellow', 'red']
            color_scale = LinearColormap(
                color_list,
                vmin=valorMin,
                vmax=valorMax
            )

            colormap = color_scale.scale(valorMin, valorMax)
            colormap = colormap.to_step(n=5)
            colormap.caption = 'Station Capacity'
            colormap.add_to(self.mapa)

        # Draw circles for each station
        for i in range(len(self.coordenadas)):
            if i < len(capacidades_valores):
                capacidad = capacidades_valores[i]
                label = (
                    f"Station {int(self.coordenadas[i, 0])}<br>"
                    f"Capacity: {int(capacidad)} bikes"
                )


                radio = 120  # Fixed radius in meters

                self.__dibujarCirculo(
                    self.coordenadas[i],
                    radio,
                    capacidad,
                    valorMax,
                    valorMin,
                    label
                )

        # Save map
        if Constantes.RUTA_SALIDA != "":
            nombre = "MapaCapacidades.html"
            self.mapa.save(join(Constantes.RUTA_SALIDA, nombre))

        # Always save a copy in current directory for API access
        self.mapa.save("MapaCapacidades.html")

    def __dibujarCirculo(
            self,
            coordenada: list,
            radio: float,
            valorPunto: float,
            valorMax: float,
            valorMin: float,
            label: str = "error"
    ):
        """
        Draw a circle on the map for a station.

        Args:
            coordenada: [station_id, lat, lon]
            radio: Circle radius in meters
            valorPunto: Capacity value for this station
            valorMax: Maximum capacity (for color scale)
            valorMin: Minimum capacity (for color scale)
            label: Popup text
        """
        # Calculate color based on capacity
        color_list = ['blue', 'yellow', 'red']
        color_scale = LinearColormap(
            color_list,
            vmin=valorMin,
            vmax=valorMax
        )
        color = color_scale(valorPunto)

        # Create circle
        circle = folium.Circle(
            radius=radio,
            location=[coordenada[1], coordenada[2]],
            color=color,
            fill=True,
            fill_opacity=0.6,
            weight=2
        )

        # Add popup
        if self.mostrarPopup:
            circle.add_child(folium.Popup(label, max_width=200, show=True))
        else:
            circle.add_child(folium.Popup(label))

        # Add click handler for interactivity
        station_id = int(round(coordenada[0]))
        circle.add_child(
            _PostMessageOnClick(
                station_id=station_id,
                map_name="mapa_capacidades"
            )
        )

        # Add to map
        circle.add_to(self.mapa)