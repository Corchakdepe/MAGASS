import os
from os.path import join

import pandas as pd
from typing import List, Union

from Backend import Constantes
from Backend.Auxiliares import auxiliar_ficheros
from Backend.EstructurasDatos.data_matrix import Data_matrix, Desplazamientos_matrix


def cargarAntiguaEjecucion(directorio: Union[List[str], str] = "", coordendas: str = ""):
    """
    Carga las matrices de una ejecución antigua.

    - Si directorio == "" se usa ./Soluciones y Constantes.LISTA_MATRICES.
    - Si directorio es lista de rutas, se leen esos CSV y se construye el diccionario.
    """
    path = join(os.getcwd(), "Soluciones")
    terminacion = "_Resultado.csv"

    listaDataFrame: List[pd.DataFrame] = []
    shapes: List[int] = []
    by_name: dict[str, pd.DataFrame] = {}

    # Modo "Soluciones" (CLI original)
    if directorio == "":
        for nombre in Constantes.LISTA_MATRICES:
            direccionAbrir = join(path, nombre + terminacion)
            print(">>> LEYENDO MATRIZ (Soluciones):", direccionAbrir)
            df = pd.read_csv(direccionAbrir)
            listaDataFrame.append(df)
            shapes.append(df.shape[1] - 1)
            by_name[os.path.basename(direccionAbrir)] = df

        ruta_coord = join(path, "COORDENADAS" + terminacion)
        Constantes.COORDENADAS = pd.read_csv(ruta_coord).to_numpy()

    # Modo "directorio de resultados"
    else:
        # directorio es una lista de rutas; filtra solo CSV
        directorio_csv = [d for d in directorio if d.lower().endswith(".csv")]
        directorio_csv.sort()

        for direccion in directorio_csv:
            base = os.path.basename(direccion)
            print(">>> LEYENDO MATRIZ:", base)
            df = pd.read_csv(direccion)
            listaDataFrame.append(df)
            shapes.append(df.shape[1] - 1)
            by_name[base] = df

        Constantes.COORDENADAS = pd.read_csv(coordendas).to_numpy()

    # localizar la matriz de desplazamientos por nombre
    despl_df = None
    for name, df in by_name.items():
        if "Desplazamientos_Resultado" in name:
            despl_df = df
            break
    if despl_df is None:
        raise ValueError(
            "No se encontró CSV de desplazamientos (*Desplazamientos_Resultado*.csv) "
            "en las rutas proporcionadas."
        )

    # comprobación mínima
    if len(listaDataFrame) < 15:
        print(
            f"[WARN] Se esperaban al menos 15 matrices, se obtuvieron {len(listaDataFrame)}."
        )

    matrices = {
        Constantes.KMS_DEJAR_BICI: Data_matrix(shapes[3], listaDataFrame[3]),
        Constantes.KMS_COGER_BICI: Data_matrix(shapes[2], listaDataFrame[2]),
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI: Data_matrix(shapes[6], listaDataFrame[6]),
        Constantes.PETICIONES_RESUELTAS_COGER_BICI: Data_matrix(shapes[4], listaDataFrame[4]),
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI: Data_matrix(shapes[7], listaDataFrame[7]),
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI: Data_matrix(shapes[5], listaDataFrame[5]),
        Constantes.OCUPACION: Data_matrix(shapes[0], listaDataFrame[0]),
        # aquí usamos SIEMPRE el CSV correcto de desplazamientos (N×6)
        Constantes.DESPLAZAMIENTOS: Desplazamientos_matrix(despl_df),
        Constantes.OCUPACION_RELATIVA: Data_matrix(shapes[1], listaDataFrame[1]),
        Constantes.KMS_FICTICIOS_COGER: Data_matrix(shapes[8], listaDataFrame[8]),
        Constantes.KMS_FICTICIOS_DEJAR: Data_matrix(shapes[9], listaDataFrame[9]),
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI: Data_matrix(shapes[10], listaDataFrame[10]),
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI: Data_matrix(shapes[11], listaDataFrame[11]),
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI: Data_matrix(shapes[12], listaDataFrame[12]),
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI: Data_matrix(shapes[13], listaDataFrame[13]),
    }
    return matrices


def cargarMatrizCustom(direccion: str) -> Data_matrix:
    df = pd.read_csv(direccion)
    return Data_matrix(df.shape[1] - 1, df)


def cargarDatosParaSimular(rutaEntrada: str):
    ficheros_distancia = auxiliar_ficheros.buscar_archivosEntrada(
        rutaEntrada,
        ["indices_andar", "kms_andar", "indices_bicicleta", "kms_bicicleta"],
    )

    if not ficheros_distancia:
        ficheros = auxiliar_ficheros.buscar_archivosEntrada(
            rutaEntrada,
            ["deltas", "capacidad", "indices", "kms", "coordenadas", "tendencia"],
        )
    else:
        ficheros = [None] * 8
        ficheros[0] = auxiliar_ficheros.buscar_archivosEntrada(rutaEntrada, ["deltas"])[0]
        ficheros[1] = auxiliar_ficheros.buscar_archivosEntrada(rutaEntrada, ["capacidad"])[0]
        ficheros[4] = auxiliar_ficheros.buscar_archivosEntrada(rutaEntrada, ["coordenadas"])[0]
        ficheros[5] = auxiliar_ficheros.buscar_archivosEntrada(rutaEntrada, ["tendencia"])[0]

    return ficheros, ficheros_distancia


def cargarSimulacionesParaAnalisis(pathEntrada: str):
    rutas_matrices_analizar = auxiliar_ficheros.buscar_archivosEntrada(
        pathEntrada,
        Constantes.LISTA_MATRICES,
    )
    rutas_matrices_analizar = [
        r for r in rutas_matrices_analizar if r.lower().endswith(".csv")
    ]

    ruta_resumen_ejecucion = auxiliar_ficheros.buscar_archivosEntrada(
        pathEntrada,
        ["Resumen"],
    )
    ruta_fichero_coordenadas = auxiliar_ficheros.buscar_archivosEntrada(
        pathEntrada,
        ["coordenadas"],
    )
    ruta_fichero_matrizCustom = auxiliar_ficheros.buscar_archivosEntrada(
        pathEntrada,
        ["Custom"],
    )

    if not ruta_resumen_ejecucion:
        raise FileNotFoundError(
            f"No se encontró fichero de resumen en {pathEntrada} (patrón 'Resumen')."
        )
    if not ruta_fichero_coordenadas:
        raise FileNotFoundError(
            f"No se encontró fichero de coordenadas en {pathEntrada} (patrón 'coordenadas')."
        )

    with open(ruta_resumen_ejecucion[0], "r") as archivo:
        contenido = archivo.read()
    contenido = contenido.split(",")

    if ruta_fichero_matrizCustom:
        Constantes.MATRIZ_CUSTOM = cargarMatrizCustom(ruta_fichero_matrizCustom[0])

    matrices = cargarAntiguaEjecucion(
        directorio=rutas_matrices_analizar,
        coordendas=ruta_fichero_coordenadas[0],
    )
    return matrices, contenido
