import os
from os.path import join
from pathlib import Path

import pandas as pd
from typing import List, Union

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.dataStructure.data_matrix import Data_matrix, Desplazamientos_matrix


def _find_df_by_token(by_name: dict[str, pd.DataFrame], token: str) -> pd.DataFrame:
    matches = [(name, df) for name, df in by_name.items() if token in name]
    if not matches:
        raise ValueError(f"No se encontró CSV para patrón: {token}")
    matches.sort(key=lambda x: x[0])
    return matches[0][1]


def cargarAntiguaEjecucion(directorio: Union[List[str], str] = "", coordendas: str = ""):
    """
    Carga las matrices de una ejecución antigua.

    - Si directorio == "" se usa ./Soluciones y Constantes.LISTA_MATRICES.
    - Si directorio es lista de rutas, se leen esos CSV y se construye el diccionario.
    """
    path = join(os.getcwd(), "Soluciones")
    terminacion = "_Resultado.csv"

    by_name: dict[str, pd.DataFrame] = {}

    if directorio == "":
        for nombre in Constantes.LISTA_MATRICES:
            direccionAbrir = join(path, nombre + terminacion)
            print(">>> LEYENDO MATRIZ (Soluciones):", direccionAbrir)
            df = pd.read_csv(direccionAbrir)
            by_name[os.path.basename(direccionAbrir)] = df

        ruta_coord = join(path, "COORDENADAS" + terminacion)
        Constantes.COORDENADAS = pd.read_csv(ruta_coord).to_numpy()

    else:
        directorio_csv = [d for d in directorio if d.lower().endswith(".csv")]
        directorio_csv.sort()

        print(">>> directorio_csv filtrado:", [os.path.basename(x) for x in directorio_csv])

        for direccion in directorio_csv:
            base = os.path.basename(direccion)
            print(">>> LEYENDO MATRIZ:", base)
            df = pd.read_csv(direccion)
            by_name[base] = df

        Constantes.COORDENADAS = pd.read_csv(coordendas).to_numpy()

    ocupacion_df = _find_df_by_token(by_name, "Ocupacion_Original_Resultado")
    ocupacion_rel_df = _find_df_by_token(by_name, "Ocupacion_Relativa_Resultado")
    kms_coger_df = _find_df_by_token(by_name, "Kilometros_Coger_Resultado")
    kms_dejar_df = _find_df_by_token(by_name, "Kilometros_Dejar_Resultado")
    kms_ficticios_coger_df = _find_df_by_token(by_name, "Kilometros_Ficticios_Coger_Resultado")
    kms_ficticios_dejar_df = _find_df_by_token(by_name, "Kilometros_Ficticios_Dejar_Resultado")

    pet_res_coger_df = _find_df_by_token(by_name, "Peticiones_Resueltas_Coger_Resultado")
    pet_res_dejar_df = _find_df_by_token(by_name, "Peticiones_Resueltas_Dejar_Resultado")
    pet_res_fic_coger_df = _find_df_by_token(by_name, "Peticiones_Resueltas_Ficticias_Coger_Resultado")
    pet_res_fic_dejar_df = _find_df_by_token(by_name, "Peticiones_Resueltas_Ficticias_Dejar_Resultado")

    pet_nores_coger_df = _find_df_by_token(by_name, "Peticiones_NoResueltas_Coger_Resultado")
    pet_nores_dejar_df = _find_df_by_token(by_name, "Peticiones_NoResueltas_Dejar_Resultado")
    pet_nores_fic_coger_df = _find_df_by_token(by_name, "Peticiones_NoResueltas_Ficticia_Coger_Resultado")
    pet_nores_fic_dejar_df = _find_df_by_token(by_name, "Peticiones_NoResueltas_Ficticia_Dejar_Resultado")

    despl_df = _find_df_by_token(by_name, "Desplazamientos_Resultado")

    matrices = {
        Constantes.KMS_DEJAR_BICI: Data_matrix(kms_dejar_df.shape[1] - 1, kms_dejar_df),
        Constantes.KMS_COGER_BICI: Data_matrix(kms_coger_df.shape[1] - 1, kms_coger_df),
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI: Data_matrix(
            pet_nores_coger_df.shape[1] - 1, pet_nores_coger_df
        ),
        Constantes.PETICIONES_RESUELTAS_COGER_BICI: Data_matrix(
            pet_res_coger_df.shape[1] - 1, pet_res_coger_df
        ),
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI: Data_matrix(
            pet_nores_dejar_df.shape[1] - 1, pet_nores_dejar_df
        ),
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI: Data_matrix(
            pet_res_dejar_df.shape[1] - 1, pet_res_dejar_df
        ),
        Constantes.OCUPACION: Data_matrix(ocupacion_df.shape[1] - 1, ocupacion_df),
        Constantes.DESPLAZAMIENTOS: Desplazamientos_matrix(despl_df),
        Constantes.OCUPACION_RELATIVA: Data_matrix(
            ocupacion_rel_df.shape[1] - 1, ocupacion_rel_df
        ),
        Constantes.KMS_FICTICIOS_COGER: Data_matrix(
            kms_ficticios_coger_df.shape[1] - 1, kms_ficticios_coger_df
        ),
        Constantes.KMS_FICTICIOS_DEJAR: Data_matrix(
            kms_ficticios_dejar_df.shape[1] - 1, kms_ficticios_dejar_df
        ),
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI: Data_matrix(
            pet_res_fic_coger_df.shape[1] - 1, pet_res_fic_coger_df
        ),
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI: Data_matrix(
            pet_res_fic_dejar_df.shape[1] - 1, pet_res_fic_dejar_df
        ),
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI: Data_matrix(
            pet_nores_fic_coger_df.shape[1] - 1, pet_nores_fic_coger_df
        ),
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI: Data_matrix(
            pet_nores_fic_dejar_df.shape[1] - 1, pet_nores_fic_dejar_df
        ),
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
    print(">>> NUEVO cargarSimulacionesParaAnalisis ACTIVO:", __file__)

    base = Path(pathEntrada)

    rutas_matrices_analizar = sorted(
        str(p)
        for p in base.glob("*.csv")
        if "Resultado" in p.name
        and "Mapa" not in p.name
        and "Grafica" not in p.name
        and "Filtrado_" not in p.name
        and "Custom" not in p.name
        and "coordenadas" not in p.name.lower()
        and "capacidades" not in p.name.lower()
        and "DIFERENCIA_" not in p.name
    )

    print(">>> MATRICES FILTRADAS:", [Path(r).name for r in rutas_matrices_analizar])

    ruta_resumen_ejecucion = sorted(
        str(p) for p in base.glob("*.txt") if "Resumen" in p.name
    )
    ruta_fichero_coordenadas = sorted(
        str(p) for p in base.glob("*.csv") if "coordenadas" in p.name.lower()
    )
    ruta_fichero_matrizCustom = sorted(
        str(p) for p in base.glob("*.csv") if "Custom" in p.name
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
        contenido = archivo.read().split(",")

    Constantes.MATRIZ_CUSTOM = None
    if ruta_fichero_matrizCustom:
        Constantes.MATRIZ_CUSTOM = cargarMatrizCustom(ruta_fichero_matrizCustom[0])

    matrices = cargarAntiguaEjecucion(
        directorio=rutas_matrices_analizar,
        coordendas=ruta_fichero_coordenadas[0],
    )
    return matrices, contenido
