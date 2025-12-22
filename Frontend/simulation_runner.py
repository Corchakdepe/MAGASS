from __future__ import annotations

from os.path import join
from typing import Optional, List

import pandas as pd

from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros, Extractor
from Backend.GuardarCargarDatos import GuardarCargarMatrices
from Backend.OperacionesDeltas.SimuladorDeltasEstadistico import SimuladorDeltasEstadistico
from bike_simulator5 import bike_simulator5


def run_simulation(
    ruta_entrada: str,
    ruta_salida: str,
    stress_type: int,
    stress: float,
    walk_cost: float,
    delta: int,
    dias: Optional[List[int]] = None,
) -> None:
    """
    High-level simulation used by API.
    """
    Constantes.DELTA_TIME = delta
    Constantes.COSTE_ANDAR = walk_cost
    Constantes.PORCENTAJE_ESTRES = stress
    Constantes.RUTA_SALIDA = ruta_salida

    ficheros, ficheros_distancia = GuardarCargarMatrices.cargarDatosParaSimular(ruta_entrada)

    archivoCapacidad = auxiliar_ficheros.buscar_archivosEntrada(ruta_entrada, ["capacidades"])[0]
    pd.read_csv(archivoCapacidad).to_csv("capacidades.csv", index=False)

    if dias is not None and len(dias) > 0:
        path_fichero = join(
            ruta_salida,
            auxiliar_ficheros.formatoArchivo(f"Extraccion_{dias}", "csv"),
        )

        Extractor.extraerDias(
            ficheros[0],
            delta,
            dias,
            path_fichero,
            mantenerPrimeraFila=True,
        )

        ficheros[0] = path_fichero

    if stress > 0:
        ficheroDelta_salidaStress = join(
            ruta_salida, auxiliar_ficheros.formatoArchivo("Dstress", "csv")
        )

        Extractor.extraerStressAplicado(
            ficheros[0],
            ficheroDelta_salidaStress,
            stress,
            tipoStress=stress_type,
            listaEstaciones="All",
        )

        ficheroTendencias_salidaStress = join(
            ruta_salida, auxiliar_ficheros.formatoArchivo("Tendencias_stress", "csv")
        )

        Extractor.extraerStressAplicado(
            ficheros[5],
            ficheroTendencias_salidaStress,
            stress,
            tipoStress=stress_type,
            listaEstaciones="All",
        )

        ficheros[0] = ficheroDelta_salidaStress
        ficheros[5] = ficheroTendencias_salidaStress

    bs = bike_simulator5()
    (
        nearest_stations_idx,
        nearest_stations_distance,
        initial_movements,
        real_movements,
        capacidadInicial,
        coordenadas,
    ) = bs.load_data(
        directorios=ficheros,
        directorios_DiastanciasAndarBicicleta=ficheros_distancia,
    )

    coste, matricesSalida = bs.evaluate_solution(
        capacidadInicial,
        initial_movements,
        real_movements,
        nearest_stations_idx,
        nearest_stations_distance,
    )

    resumen = auxiliar_ficheros.hacerResumenMatricesSalida(matricesSalida)
    auxiliar_ficheros.guardarMatricesEnFicheros(
        matricesSalida, resumen, Constantes.RUTA_SALIDA
    )

    pd.DataFrame(Constantes.COORDENADAS).to_csv(
        join(Constantes.RUTA_SALIDA, "coordenadas.csv"), index=False
    )

    pd.read_csv(archivoCapacidad).to_csv(join(ruta_salida, "capacidades.csv"), index=False)


def run_simulador_estadistico(
    ruta_deltas: str,
    ruta_salida: str,
    delta_actual: int,
    dias_a_simular: int,
    ruleta: int,
) -> None:
    Constantes.RUTA_SALIDA = ruta_salida
    Constantes.DELTA_TIME = delta_actual

    rutaDeltas = auxiliar_ficheros.buscar_archivosEntrada(ruta_deltas, ["deltas"])
    matrizDeltas = pd.read_csv(rutaDeltas[0])

    simuladorDE = SimuladorDeltasEstadistico(matrizDeltas, int(delta_actual))

    if int(ruleta) == 1:
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_PeriodoTotal(
            int(dias_a_simular)
        )
    else:
        dias = list(range(0, int(dias_a_simular)))
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_Horas(dias)

    nombre = auxiliar_ficheros.formatoArchivo("deltasGeneradosEstadistica", "csv")
    nuevoFicheroDeltas.to_csv(join(ruta_salida, nombre), index=False)
