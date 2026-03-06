import pandas as pd

from bikesim import Constantes
from bikesim.auxiliares import auxiliar_ficheros
from bikesim.utils.SimuladorDeltasEstadistico import SimuladorDeltasEstadistico
from os.path import join

def simuladorEstadistico(comando: [str]):
    rutaDeltas = comando[2]
    rutaSalida = comando[3]
    deltaActual = comando[4]
    diasAsimular = comando[5]
    ruleta = comando[6]

    Constantes.RUTA_SALIDA = str(rutaSalida)
    Constantes.DELTA_TIME = int(deltaActual)
    rutaDeltas = auxiliar_ficheros.buscar_archivosEntrada(rutaDeltas, ['deltas'])

    matrizDeltas = pd.read_csv(rutaDeltas[0])
    simuladorDE = SimuladorDeltasEstadistico(matrizDeltas, int(deltaActual))
    #nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_PeriodoTotal(int(diasAsimular))


    if int(ruleta) == 1:
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_PeriodoTotal(int(diasAsimular))
    else:
        dias = list(range(0,int(diasAsimular)))
        nuevoFicheroDeltas = simuladorDE.simularDatosEstadisticos_Horas(dias)
    nombre = auxiliar_ficheros.formatoArchivo("deltasGeneradosEstadistica", "csv")

    nuevoFicheroDeltas.to_csv(join(rutaSalida,nombre), index=False)



