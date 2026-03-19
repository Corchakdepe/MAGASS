import datetime
import os
import re
from os.path import join
from pathlib import Path
from typing import List, Union

import pandas as pd

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.dataStructure.data_matrix import Data_matrix, Desplazamientos_matrix


def formatoArchivo(nombreArchivo, extension):
    now = datetime.datetime.now()
    return (
        now.strftime("%Y%m%d_%H%M%S")
        + "_"
        + nombreArchivo
        + "D"
        + str(Constantes.DELTA_TIME)
        + "S"
        + str(Constantes.PORCENTAJE_ESTRES)
        + "C"
        + str(Constantes.COSTE_ANDAR)
        + "."
        + extension
    )


def buscar_archivosEntrada(ruta, nombresBuscar: list):
    ficheros = []
    archivos = os.listdir(ruta)

    for i in range(len(nombresBuscar)):
        for archivo in archivos:
            ruta_fichero = join(ruta, archivo)
            if re.search(r"" + nombresBuscar[i], archivo):
                ficheros.append(ruta_fichero)

    return ficheros


def guardarMatricesEnFicheros(matrices: dict[str, Data_matrix], resumen: str, dirSalida):
    ruta = dirSalida
    for key in Constantes.LISTA_MATRICES:
        nombreArchivo = formatoArchivo(key + "_Resultado", "csv")
        pd_matriz = matrices[key].matrix
        pd_matriz.to_csv(join(ruta, nombreArchivo), index=False)

    nombreResumen = formatoArchivo("ResumenEjecucion", "txt")

    with open(join(ruta, nombreResumen), "w") as archivo:
        archivo.write(resumen)


def hacerResumenMatricesSalida(matrices: dict):
    Kms_coger = matrices[Constantes.KMS_COGER_BICI].matrix.iloc[:, 1:].sum().sum()
    Kms_dejar = matrices[Constantes.KMS_DEJAR_BICI].matrix.iloc[:, 1:].sum().sum()

    Kms_ficticios_coger = matrices[Constantes.KMS_FICTICIOS_COGER].matrix.iloc[:, 1:].sum().sum()
    Kms_ficticios_dejar = matrices[Constantes.KMS_FICTICIOS_DEJAR].matrix.iloc[:, 1:].sum().sum()

    N_Peticiones_Resueltas_coger = matrices[Constantes.PETICIONES_RESUELTAS_COGER_BICI].matrix.iloc[:, 1:].sum().sum()
    N_Peticiones_Resueltas_dejar = matrices[Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI].matrix.iloc[:, 1:].sum().sum()

    N_Peticiones_noResueltas_coger = matrices[Constantes.PETICIONES_NORESUELTAS_COGER_BICI].matrix.iloc[:, 1:].sum().sum()
    N_Peticiones_noResueltas_dejar = matrices[Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI].matrix.iloc[:, 1:].sum().sum()

    N_Peticiones_Resueltas_Ficticia_coger = matrices[
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI
    ].matrix.iloc[:, 1:].sum().sum()
    N_Peticiones_Resueltas_Ficticia_dejar = matrices[
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI
    ].matrix.iloc[:, 1:].sum().sum()

    N_Peticiones_Ficticias_noResueltas_coger = matrices[
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI
    ].matrix.iloc[:, 1:].sum().sum()
    N_Peticiones_Ficticias_noResueltas_dejar = matrices[
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI
    ].matrix.iloc[:, 1:].sum().sum()

    soluciones = {
        Constantes.KMS_COGER_BICI: Kms_coger,
        Constantes.KMS_DEJAR_BICI: Kms_dejar,
        Constantes.KMS_FICTICIOS_COGER: Kms_ficticios_coger,
        Constantes.KMS_FICTICIOS_DEJAR: Kms_ficticios_dejar,
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI: N_Peticiones_noResueltas_coger,
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI: N_Peticiones_noResueltas_dejar,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI: N_Peticiones_Ficticias_noResueltas_coger,
        Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI: N_Peticiones_Ficticias_noResueltas_dejar,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI: N_Peticiones_Resueltas_Ficticia_coger,
        Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI: N_Peticiones_Resueltas_Ficticia_dejar,
        Constantes.PETICIONES_RESUELTAS_COGER_BICI: N_Peticiones_Resueltas_coger,
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI: N_Peticiones_Resueltas_dejar,
    }

    cadena = (
        str(Constantes.DELTA_TIME)
        + ","
        + str(Constantes.PORCENTAJE_ESTRES)
        + ","
        + str(soluciones[Constantes.KMS_COGER_BICI])
        + ","
        + str(soluciones[Constantes.KMS_DEJAR_BICI])
        + ","
        + str(soluciones[Constantes.KMS_FICTICIOS_COGER])
        + ","
        + str(soluciones[Constantes.KMS_FICTICIOS_DEJAR])
        + ","
        + str(soluciones[Constantes.PETICIONES_RESUELTAS_COGER_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_NORESUELTAS_COGER_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_RESUELTAS_FICTICIAS_COGER_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_RESUELTAS_FICTICIAS_DEJAR_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_NORESUELTAS_FICTICIAS_COGER_BICI])
        + ","
        + str(soluciones[Constantes.PETICIONES_NORESUELTAS_FICTICIAS_DEJAR_BICI])
    )

    return cadena


def guardarFicheroFiltrado(texto, tipo_filtrado, parametrosConsulta):
    nombreResumen = formatoArchivo("Filtrado_" + tipo_filtrado + "_" + parametrosConsulta, "txt")

    with open(join(Constantes.RUTA_SALIDA, nombreResumen), "w") as archivo:
        archivo.write(texto)


def _find_df_by_token(by_name: dict[str, pd.DataFrame], token: str) -> pd.DataFrame:
    matches = [(name, df) for name, df in by_name.items() if token in name]
    if not matches:
        raise ValueError(f"No se encontró CSV para patrón: {token}")
    if len(matches) > 1:
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
        Constantes.PETICIONES_NORESUELTAS_COGER_BICI: Data_matrix(pet_nores_coger_df.shape[1] - 1, pet_nores_coger_df),
        Constantes.PETICIONES_RESUELTAS_COGER_BICI: Data_matrix(pet_res_coger_df.shape[1] - 1, pet_res_coger_df),
        Constantes.PETICIONES_NORESUELTAS_SOLTAR_BICI: Data_matrix(pet_nores_dejar_df.shape[1] - 1, pet_nores_dejar_df),
        Constantes.PETICIONES_RESUELTAS_SOLTAR_BICI: Data_matrix(pet_res_dejar_df.shape[1] - 1, pet_res_dejar_df),
        Constantes.OCUPACION: Data_matrix(ocupacion_df.shape[1] - 1, ocupacion_df),
        Constantes.DESPLAZAMIENTOS: Desplazamientos_matrix(despl_df),
        Constantes.OCUPACION_RELATIVA: Data_matrix(ocupacion_rel_df.shape[1] - 1, ocupacion_rel_df),
        Constantes.KMS_FICTICIOS_COGER: Data_matrix(kms_ficticios_coger_df.shape[1] - 1, kms_ficticios_coger_df),
        Constantes.KMS_FICTICIOS_DEJAR: Data_matrix(kms_ficticios_dejar_df.shape[1] - 1, kms_ficticios_dejar_df),
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
    base = Path(pathEntrada)

    print(">>> NUEVO cargarSimulacionesParaAnalisis ACTIVO")
    print(">>> MATRICES FILTRADAS:", [Path(r).name for r in pathEntrada])

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
