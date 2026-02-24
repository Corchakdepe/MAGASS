from os.path import join

import numpy as np
import pandas as pd
import folium
from branca.colormap import LinearColormap

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_tiempo, auxiliar_ficheros
import seaborn as sns
from branca.element import MacroElement
from jinja2 import Template

import branca


class _PostMessageOnClick(MacroElement):
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


class MapaCirculos:

    def __init__(self, matriz: pd.DataFrame, coordenadas: np.array, valorMax=None, mostrarPopup=False):
        self.matriz = matriz
        self.coordenadas = coordenadas
        mitad = len(coordenadas) // 2
        self.mapa = folium.Map([coordenadas[mitad][1], coordenadas[mitad][2]], zoom_start=13)
        self.valorMax = valorMax  # Necesito esto para las escalas cuando filtro las estaciones.
        self.mostrarPopup = mostrarPopup

    # Función que representa un mapa con círculos que representan las estaciones.
    def representarInstante(self, instante):
        fila = auxiliar_tiempo.devolverInstante(self.matriz, instante)

        if not fila.empty:
            fila = fila.iloc[0, 1:]
            if self.valorMax is None:
                valorMax = self.matriz.iloc[:, 1:].max().max()
            else:
                valorMax = self.valorMax
            valorMin = self.matriz.min().min()

            if valorMax != valorMin:
                color_list = ['blue', 'red']
                color_scale = LinearColormap(color_list, vmin=0, vmax=valorMax)

                colormap = color_scale.scale(0, valorMax)
                colormap = colormap.to_step(n=4)
                colormap.caption = 'Data represented'
                colormap.add_to(self.mapa)

            if valorMin < 0:
                nValoresNeg = len(np.unique(self.matriz[(self.matriz < 0)]))
                green_values = np.linspace(1, 0.1, nValoresNeg)
                gv = green_values.copy()

                gv = np.flip(gv)

                paleta_negativos = sns.color_palette([(0, r, 0) for r in gv]).as_hex()

                neg_palete = sns.color_palette([(0, r, 0) for r in green_values], as_cmap=True)

                # neg_palete.reverse()
                neg_cmap = branca.colormap.LinearColormap(
                    colors=[neg_palete[x] for x in range(nValoresNeg)],
                    vmin=valorMin, vmax=0
                )
                colormap = neg_cmap.scale(valorMin, 0)
                colormap = colormap.to_step(n=4)
                colormap.caption = 'Negative data represented'
                colormap.add_to(self.mapa)

        for i in range(len(self.coordenadas)):
            if not fila.empty:
                label = "Station " + str(round(self.coordenadas[i, 0])) + "<br> Data: " + str(round(fila[i], 2))
                if fila[i] < 0:
                    color = paleta_negativos[round(abs(fila[i]) * (len(paleta_negativos) - 1) / abs(valorMin))]
                    self.__dibujarCirculo(self.coordenadas[i], 150, fila[i], valorMax, label, color=color)
                else:
                    self.__dibujarCirculo(self.coordenadas[i], 150, fila[i], valorMax, label)

            else:
                label = "Estacion " + str(round(self.coordenadas[i, 0]))
                self.__dibujarCirculo(self.coordenadas[i], 150, 0, 0, label)

        if Constantes.RUTA_SALIDA != "":
            nombre = auxiliar_ficheros.formatoArchivo("MapaCirculos_instante" + str(instante), "html")
            self.mapa.save(join(Constantes.RUTA_SALIDA, nombre))
            self.mapa.save("MapaCirculos.html")
        else:
            self.mapa.save("MapaCirculos.html")

    def __dibujarCirculo(self, coordenada: list[float], radio, valorPunto, valorMax, label="error", color=None):
        if color is None:
            color_list = ['blue', 'red']
            color_scale = LinearColormap(color_list, vmin=0, vmax=valorMax)
            color = color_scale(valorPunto)

        # 1) Create the circle FIRST and keep a reference
        circle = folium.Circle(
            radius=radio,
            location=[coordenada[1], coordenada[2]],
            color=color,
            fill=True,
            fill_opacity=0.4,
        )

        # 2) Keep your popup behavior (choose show=True or default)
        if self.mostrarPopup:
            circle.add_child(folium.Popup(label, max_width=200, show=True))
        else:
            circle.add_child(folium.Popup(label))

        # 3) Attach JS click → postMessage to parent
        station_id = int(round(coordenada[0]))
        circle.add_child(_PostMessageOnClick(station_id=station_id, map_name="mapa_circulo"))

        # 4) Finally add to map
        circle.add_to(self.mapa)
