from __future__ import annotations

import shutil
from os.path import join

import numpy as np
import pandas as pd

from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros
from Backend.Manipuladores import Agrupador


def run_restar_directorios(
    ruta_directorio1: str,
    ruta_directorio2: str,
    ruta_directorio_salida: str,
) -> None:
    print(
        "Restando las matrices del directorio "
        + str(ruta_directorio1)
        + " menos las matrices del directorio "
        + str(ruta_directorio2)
    )

    directorios_resta = [
        Constantes.OCUPACION,
        Constantes.OCUPACION_RELATIVA,
        Constantes.PETICIONES_RESUELTAS_COGER_BICI,
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI,
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI,
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI,
        Constantes.KMS_COGER_BICI,
        Constantes.KMS_DEJAR_BICI,
        Constantes.KMS_FICTICIOS_COGER,
        Constantes.KMS_FICTICIOS_DEJAR,
    ]

    restoFicheros = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio1, ["Desplazamientos", "coordenadas"]
    )

    resumen1 = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio1, ["ResumenEjecucion"]
    )
    resumen2 = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio2, ["ResumenEjecucion"]
    )

    shutil.copy(restoFicheros[0], join(ruta_directorio_salida, "Desplazamientos.csv"))
    shutil.copy(restoFicheros[1], join(ruta_directorio_salida, "coordenadas.csv"))

    with open(resumen1[0], "r") as archivo:
        contenido1 = archivo.read()
    contenido_archivoResumen1 = contenido1.split(",")

    with open(resumen2[0], "r") as archivo:
        contenido2 = archivo.read()
    contenido_archivoResumen2 = contenido2.split(",")

    diferenciaResumenes = (
        np.array(list(map(float, contenido_archivoResumen1)))[2:]
        - np.array(list(map(float, contenido_archivoResumen2)))[2:]
    ).tolist()

    resumenDiferencia = str(
        (list(map(float, contenido_archivoResumen1)))[:2] + diferenciaResumenes
    )[1:-1]

    with open(
        join(ruta_directorio_salida, "DIFERENCIA_ResumenEjecucion.txt"), "w"
    ) as archivo:
        archivo.write(resumenDiferencia)

    capacidades1 = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio1, ["capacidades"]
    )
    capacidades2 = auxiliar_ficheros.buscar_archivosEntrada(
        ruta_directorio2, ["capacidades"]
    )

    if capacidades1 != [] and capacidades2 != []:
        nombre = auxiliar_ficheros.formatoArchivo("DIFERENCIA_CAPACIDADES", "csv")
        (
            pd.read_csv(capacidades1[0]) - pd.read_csv(capacidades2[0])
        ).transpose().to_csv(join(ruta_directorio_salida, nombre), index=False)

    for archivo in directorios_resta:
        fichero1 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio1, [archivo])
        fichero2 = auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio2, [archivo])

        matriz1 = pd.read_csv(fichero1[0])
        matriz2 = pd.read_csv(fichero2[0])

        archivoResultante = Agrupador.sustraerMatrices(matriz1, matriz2)

        nombre = auxiliar_ficheros.formatoArchivo("DIFERENCIA " + archivo, "csv")
        archivoResultante.to_csv(join(ruta_directorio_salida, nombre), index=False)
