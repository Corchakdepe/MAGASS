from __future__ import annotations

import re
import shutil
from os.path import join

import numpy as np
import pandas as pd
import os
from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.utils import Agrupador


# Replace your existing run_restar_directorios function with this version

def run_restar_directoriosBack(
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

    # Get all files from both directories - returns full paths
    files_dir1 = set(auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio1, [".*"]))
    files_dir2 = set(auxiliar_ficheros.buscar_archivosEntrada(ruta_directorio2, [".*"]))

    # Convert to filenames only for pattern matching
    filenames1 = [os.path.basename(f) for f in files_dir1]
    filenames2 = [os.path.basename(f) for f in files_dir2]

    print(f"Files in dir1: {len(filenames1)}")
    print(f"Files in dir2: {len(filenames2)}")

    # Function to extract matrix name pattern (removes timestamp and parameters)
    def get_matrix_pattern(filename):
        # Remove timestamp (first 15 chars: YYYYMMDD_HHMMSS_)
        # And remove parameters suffix (D{delta}S{stress}C{walk_cost}.csv)
        import re
        # Pattern: timestamp_matrixName_parameters.extension
        # Example: 20260226_105427_Kilometros_Coger_ResultadoD15S50.0C50.0.csv
        match = re.match(r'\d{8}_\d{6}_(.+?)(D\d+S[\d.]+C[\d.]+\..*)$', filename)
        if match:
            matrix_name = match.group(1)
            # Remove trailing underscore if present
            if matrix_name.endswith('_'):
                matrix_name = matrix_name[:-1]
            return matrix_name
        return filename  # Fallback for files that don't match the pattern

    # Create dictionaries mapping patterns to filenames
    pattern_to_file1 = {}
    pattern_to_fullpath1 = {}
    for fullpath in files_dir1:
        filename = os.path.basename(fullpath)
        pattern = get_matrix_pattern(filename)
        pattern_to_file1[pattern] = filename
        pattern_to_fullpath1[pattern] = fullpath

    pattern_to_file2 = {}
    pattern_to_fullpath2 = {}
    for fullpath in files_dir2:
        filename = os.path.basename(fullpath)
        pattern = get_matrix_pattern(filename)
        pattern_to_file2[pattern] = filename
        pattern_to_fullpath2[pattern] = fullpath

    # Find common patterns
    common_patterns = set(pattern_to_file1.keys()) & set(pattern_to_file2.keys())

    print(f"Found {len(common_patterns)} common matrix patterns to process")
    if common_patterns:
        print("Common patterns:", list(common_patterns)[:5])  # Show first 5

    # Special files that should be copied (not subtracted)
    special_files = ["coordenadas.csv", "capacidades.csv", "indices_bicicleta.csv"]

    # Process each common pattern
    for pattern in common_patterns:
        filename1 = pattern_to_file1[pattern]
        filename2 = pattern_to_file2[pattern]
        fullpath1 = pattern_to_fullpath1[pattern]
        fullpath2 = pattern_to_fullpath2[pattern]

        # Skip special files (handle them separately)
        if any(special in filename1.lower() for special in ["coordenadas", "capacidades", "indices"]):
            continue

        try:
            print(f"Processing: {pattern}")
            print(f"  File1: {filename1}")
            print(f"  File2: {filename2}")

            # Check if it's a CSV file
            if filename1.endswith('.csv'):
                matriz1 = pd.read_csv(fullpath1)
                matriz2 = pd.read_csv(fullpath2)

                # Ensure same shape
                if matriz1.shape != matriz2.shape:
                    print(f"  Warning: Different shapes: {matriz1.shape} vs {matriz2.shape}")

                archivoResultante = Agrupador.sustraerMatrices(matriz1, matriz2)

                # Create output filename - use the pattern from first file but with DIFERENCIA_ prefix
                # Extract the parameter suffix from one of the files
                param_suffix = re.search(r'(D\d+S[\d.]+C[\d.]+\..*)$', filename1)
                if param_suffix:
                    # Get current timestamp for the output file
                    from datetime import datetime
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    output_filename = f"{timestamp}_DIFERENCIA_{pattern}{param_suffix.group(1)}"
                else:
                    output_filename = f"DIFERENCIA_{filename1}"

                output_path = join(ruta_directorio_salida, output_filename)
                archivoResultante.to_csv(output_path, index=False)
                print(f"  Created: {output_filename}")

            elif filename1.endswith('.txt'):
                # Handle text files (like ResumenEjecucion)
                with open(fullpath1, "r") as archivo:
                    contenido1 = archivo.read()
                with open(fullpath2, "r") as archivo:
                    contenido2 = archivo.read()

                # Parse and subtract if numeric
                try:
                    valores1 = list(map(float, contenido1.split(',')))
                    valores2 = list(map(float, contenido2.split(',')))

                    if len(valores1) == len(valores2):
                        diferencia = [valores1[i] - valores2[i] for i in range(len(valores1))]
                        resultado = ','.join(map(str, diferencia))

                        output_filename = f"DIFERENCIA_{filename1}"
                        output_path = join(ruta_directorio_salida, output_filename)
                        with open(output_path, "w") as archivo:
                            archivo.write(resultado)
                        print(f"  Created text diff: {output_filename}")
                    else:
                        print(f"  Text files have different lengths, copying instead")
                        shutil.copy2(fullpath1, join(ruta_directorio_salida, f"COPIED_{filename1}"))
                except ValueError:
                    # If not numeric, just copy
                    print(f"  Text file not numeric, copying instead")
                    shutil.copy2(fullpath1, join(ruta_directorio_salida, f"COPIED_{filename1}"))

        except Exception as e:
            print(f"Error processing pattern {pattern}: {e}")
            continue

    # Handle special files (copy them from directory1)
    for special_file in special_files:
        found = False
        for fullpath in files_dir1:
            filename = os.path.basename(fullpath)
            if special_file in filename.lower():
                dest_path = join(ruta_directorio_salida, filename)
                shutil.copy2(fullpath, dest_path)
                print(f"Copied special file: {filename}")
                found = True
                break
        if not found:
            print(f"Warning: {special_file} not found in directory1")

    # Handle Desplazamientos specially (copy instead of subtract)
    desplazamientos_patterns = [p for p in common_patterns if "Desplazamientos" in p]
    for pattern in desplazamientos_patterns:
        filename1 = pattern_to_file1[pattern]
        fullpath1 = pattern_to_fullpath1[pattern]
        dest_path = join(ruta_directorio_salida, f"COPIED_{filename1}")
        shutil.copy2(fullpath1, dest_path)
        print(f"Copied Desplazamientos: {filename1}")

    # Handle ResumenEjecucion specially
    resumen_patterns = [p for p in common_patterns if "ResumenEjecucion" in p]
    if resumen_patterns:
        pattern = resumen_patterns[0]
        fullpath1 = pattern_to_fullpath1[pattern]
        fullpath2 = pattern_to_fullpath2[pattern]

        try:
            with open(fullpath1, "r") as archivo:
                contenido1 = archivo.read()
            with open(fullpath2, "r") as archivo:
                contenido2 = archivo.read()

            valores1 = list(map(float, contenido1.split(',')))
            valores2 = list(map(float, contenido2.split(',')))

            # Keep first two values (likely metadata) and subtract the rest
            if len(valores1) >= 2 and len(valores2) >= 2:
                diferencia = valores1[:2] + [valores1[i] - valores2[i] for i in
                                             range(2, min(len(valores1), len(valores2)))]
                resultado = ','.join(map(str, diferencia))

                output_filename = f"DIFERENCIA_ResumenEjecucion.txt"
                output_path = join(ruta_directorio_salida, output_filename)
                with open(output_path, "w") as archivo:
                    archivo.write(resultado)
                print(f"Created ResumenEjecucion diff")
            else:
                print("ResumenEjecucion files have insufficient data")
        except Exception as e:
            print(f"Error processing ResumenEjecucion: {e}")