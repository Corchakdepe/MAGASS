import math

import numpy
import numpy as np
import pandas as pd

from bikesim import Constantes


def realizarMediaPesos(lista: list):
    np_lista = np.array(lista)
    sumaTotal = np_lista.sum()

    return (np_lista / sumaTotal).tolist()


def rellenarCon0(matriz: numpy.ndarray):
    dias = matriz.shape[0] / (24 * (60 / Constantes.DELTA_TIME))

    if not dias.is_integer():
        print(
            "IT HAS BEEN DETECTED THAT THE DELTAS PRESENTED ARE MISSING SOME DELTA LINES, FILLING AT THE END OF THE FILE WITH 0...")
        peticionesNecesarias = (math.trunc(dias) + 1) * 24 * (60 / Constantes.DELTA_TIME)

        for i in range(int(abs(matriz.shape[0] - peticionesNecesarias))):
            # Obtener la forma actual del array
            filas, columnas = matriz.shape

            # Crear una fila de ceros
            fila_ceros = np.zeros((1, columnas))

            # Apilar la fila de ceros al final del array
            matriz = np.vstack((matriz, fila_ceros))
        dias = matriz.shape[0] / (24 * (60 / Constantes.DELTA_TIME))
        if not dias.is_integer():
            raise Exception("ERROR WHEN INSERTING NEW DELTAS.")
    return matriz


# Función a llamar antes de realizar la compresion en deltas - FIXED VERSION
def rellenarFilasMatrizDeseada(matriz: pd.DataFrame, deltasMax):
    """
    Rellena las filas de la matriz deseada con los datos proporcionados.
    Maneja correctamente índices duplicados.
    """
    try:
        # Check if matriz is empty
        if matriz.empty:
            # Create an empty DataFrame with the right structure
            return pd.DataFrame(columns=matriz.columns)

        # Get the first column name (the time/index column)
        first_col = matriz.columns[0]

        # Create a copy to avoid modifying the original
        matriz_copy = matriz.copy()

        # Check for duplicates in the first column BEFORE setting as index
        if matriz_copy[first_col].duplicated().any():
            print(f"Warning: Duplicate values found in column '{first_col}'. Aggregating by sum...")
            # Aggregate duplicates by summing (or you could use .mean() depending on your needs)
            matriz_copy = matriz_copy.groupby(first_col, as_index=False).sum()

        # Now set as index (should be unique after aggregation)
        nuevaMatriz = matriz_copy.set_index(first_col)

        # Reindex with the desired range
        nuevaMatriz = nuevaMatriz.reindex(range(deltasMax + 1), fill_value=0)

        # Reset index to get the time column back
        nuevaMatriz = nuevaMatriz.reset_index()

        # Rename the index column back to its original name
        nuevaMatriz = nuevaMatriz.rename(columns={'index': first_col})

        return nuevaMatriz

    except Exception as e:
        print(f"Error in rellenarFilasMatrizDeseada: {e}")
        # Fallback method if the above fails
        try:
            # Alternative approach: manual reindexing without setting index first
            first_col = matriz.columns[0]

            # Create a complete index
            complete_index = pd.DataFrame({first_col: range(deltasMax + 1)})

            # Merge with original data
            result = pd.merge(complete_index, matriz, on=first_col, how='left')

            # Fill NaN with 0
            result = result.fillna(0)

            return result

        except Exception as e2:
            print(f"Fallback also failed: {e2}")
            # Ultimate fallback: return original matrix
            return matriz


# Alternative version if you want to keep the original behavior but handle duplicates:
def rellenarFilasMatrizDeseada_alternative(matriz: pd.DataFrame, deltasMax):
    """
    Alternative implementation that handles duplicates without grouping.
    This might be better if you need to preserve all data rows.
    """
    first_col = matriz.columns[0]

    # Create a MultiIndex if there are duplicates
    if matriz[first_col].duplicated().any():
        # Add a counter to make each row unique
        matriz_copy = matriz.copy()
        matriz_copy['_dup_counter'] = matriz_copy.groupby(first_col).cumcount()
        temp_index_col = f'{first_col}_{matriz_copy["_dup_counter"]}'
        matriz_copy[temp_index_col] = matriz_copy[first_col].astype(str) + '_' + matriz_copy['_dup_counter'].astype(str)

        # Set the unique column as index
        nuevaMatriz = matriz_copy.set_index(temp_index_col)

        # But this approach might not be what you want for reindexing
        # Better to aggregate as in the main solution
        return rellenarFilasMatrizDeseada(matriz, deltasMax)
    else:
        # No duplicates - use original method
        nuevaMatriz = matriz.set_index(first_col)
        nuevaMatriz = nuevaMatriz.reindex(range(deltasMax + 1), fill_value=0)
        nuevaMatriz = nuevaMatriz.reset_index()
        nuevaMatriz = nuevaMatriz.rename(columns={'index': first_col})
        return nuevaMatriz