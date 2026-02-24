from __future__ import annotations

import shutil
from os.path import join

import numpy as np
import pandas as pd

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.utils import Agrupador


# Replace your existing run_restar_directorios function with this version

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

    # Helper function to find files by pattern (not exact name)
    def find_file(directory, patterns):
        """Find a file in directory that matches any of the patterns"""
        for pattern in patterns:
            files = auxiliar_ficheros.buscar_archivosEntrada(directory, [pattern])
            if files:
                return files[0]
        return None

    directorios_resta = [
        (Constantes.OCUPACION, ["Ocupacion_Original"]),
        (Constantes.OCUPACION_RELATIVA, ["Ocupacion_Relativa"]),
        (Constantes.PETICIONES_RESUELTAS_COGER_BICI, ["Peticiones_Resueltas_Coger"]),
        (Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI, ["Peticiones_Resueltas_Dejar"]),
        (Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI, ["Peticiones_Resueltas_Ficticias_Coger"]),
        (Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI, ["Peticiones_Resueltas_Ficticias_Dejar"]),
        (Constantes.PETICIONES_NORESUELTAS_COGER_BICI, ["Peticiones_NoResueltas_Coger"]),
        (Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI, ["Peticiones_NoResueltas_Dejar"]),
        (Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI, ["Peticiones_NoResueltas_Ficticia_Coger"]),
        (Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI, ["Peticiones_NoResueltas_Ficticia_Dejar"]),
        (Constantes.KMS_COGER_BICI, ["Kilometros_Coger"]),
        (Constantes.KMS_DEJAR_BICI, ["Kilometros_Dejar"]),
        (Constantes.KMS_FICTICIOS_COGER, ["Kilometros_Ficticios_Coger"]),
        (Constantes.KMS_FICTICIOS_DEJAR, ["Kilometros_Ficticios_Dejar"]),
    ]

    # Handle desplazamientos and coordenadas
    desplazamientos = find_file(ruta_directorio1, ["Desplazamientos"])
    if desplazamientos:
        shutil.copy(desplazamientos, join(ruta_directorio_salida, "Desplazamientos.csv"))

    coordenadas = find_file(ruta_directorio1, ["coordenadas"])
    if coordenadas:
        shutil.copy(coordenadas, join(ruta_directorio_salida, "coordenadas.csv"))

    # Handle summary files
    resumen1 = find_file(ruta_directorio1, ["ResumenEjecucion"])
    resumen2 = find_file(ruta_directorio2, ["ResumenEjecucion"])

    if resumen1 and resumen2:
        with open(resumen1, "r") as archivo:
            contenido1 = archivo.read()
        contenido_archivoResumen1 = contenido1.split(",")

        with open(resumen2, "r") as archivo:
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

    # Handle capacities files
    capacidades1 = find_file(ruta_directorio1, ["capacidades"])
    capacidades2 = find_file(ruta_directorio2, ["capacidades"])

    if capacidades1 and capacidades2:
        nombre = auxiliar_ficheros.formatoArchivo("DIFERENCIA_CAPACIDADES", "csv")
        try:
            df1 = pd.read_csv(capacidades1)
            df2 = pd.read_csv(capacidades2)
            (df1 - df2).transpose().to_csv(
                join(ruta_directorio_salida, nombre), index=False
            )
        except Exception as e:
            print(f"Error processing capacities: {e}")

    # Process each matrix file
    for archivo, patterns in directorios_resta:
        try:
            fichero1 = find_file(ruta_directorio1, patterns)
            fichero2 = find_file(ruta_directorio2, patterns)

            if not fichero1 or not fichero2:
                print(f"Could not find files for {archivo} in one of the directories")
                continue

            matriz1 = pd.read_csv(fichero1)
            matriz2 = pd.read_csv(fichero2)

            archivoResultante = Agrupador.sustraerMatrices(matriz1, matriz2)

            nombre = auxiliar_ficheros.formatoArchivo(archivo+"_Resultado", "csv")
            archivoResultante.to_csv(join(ruta_directorio_salida, nombre), index=False)

        except Exception as e:
            print(f"Error processing {archivo}: {e}")
            continue
