from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from Frontend import EjecutadorCMD
from Backend import Constantes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production (e.g., ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _N() -> str:
    # App-wide "null" marker for unused args
    return getattr(Constantes, "CARACTER_NULO_CMD", "_")

# ---------------------------
# Simulation endpoint (CMD: simular)
# ---------------------------
@app.get("/exe/simular")
async def exe_simular(
    rutaEntrada: str = Query("./uploads/"),
    rutaSalida: str = Query("./results/"),
    comando_stress: str = Query("0"),      # e.g., "0" or "0.2+1;5;17"
    tipoStress: float = Query(0.0),        # numeric code as float-compatible
    coste_andar: float = Query(1.0),
    delta: int = Query(15),
    dias: Optional[str] = Query(None),     # "0;1;2" or None
):
    # Build exact vector expected by simularCMD
    # [0]=exe, [1]="simular", [2]=rutaEntrada, [3]=rutaSalida,
    # [4]=comando_stress, [5]=tipoStress, [6]=coste_andar, [7]=delta, [8]=dias|N
    comando = [
        "",
        "simular",
        str(rutaEntrada),
        str(rutaSalida),
        str(comando_stress),
        str(tipoStress),
        str(coste_andar),
        str(delta),
        dias if dias is not None else _N(),
    ]
    EjecutadorCMD.simularCMD(comando)
    return {"ok": True, "comando": comando}

# ---------------------------
# Analysis endpoint (CMD: analizar)
# ---------------------------
@app.get("/exe/analizar")
async def exe_analizar(
    # Required directories (pos 2,3)
    entradaFicheros: str = Query(...),
    salidaFicheros: str = Query(...),

    # Selección/agregación (pos 4)
    seleccion_agregacion: str = Query("-1"),   # e.g., "0;3;5" or "(-)0;3", "-1" to use MATRIZ_CUSTOM if present

    # Transformaciones de deltas (pos 5,6)
    deltaMedia: Optional[str] = Query(None),       # "60" or None
    deltaAcumulada: Optional[str] = Query(None),   # "60" or None

    # Gráficos (pos 7..13)
    graf_barras_est_med: Optional[str] = Query(None),     # "<est>-<dias|all>"
    graf_barras_est_acum: Optional[str] = Query(None),    # "<est>-<dias|all>"
    graf_barras_dia: Optional[str] = Query(None),         # "<d1;d2|all>-M|A[-Frec]"
    graf_linea_comp_est: Optional[str] = Query(None),     # "<e1;e2>-<dias#dias>"
    graf_linea_comp_mats: Optional[str] = Query(None),    # "<delta>-<e..>-<e..>-M|A"
    mapa_densidad: Optional[str] = Query(None),           # "t1;t2[+e1;e2]"
    video_densidad: Optional[str] = Query(None),          # "tIni:tFin[+e1;e2]" or "...:end"

    # Mapas extra (pos 14..16)
    mapa_voronoi: Optional[str] = Query(None),            # "t1;t2"
    mapa_circulo: Optional[str] = Query(None),            # "t1;t2[+e1;e2][-L]"
    mapa_desplazamientos: Optional[str] = Query(None),    # "t;deltaOri;deltaDst;mov;tipo"

    # Filtrados (pos 17..20)
    filtrado_EstValor: Optional[str] = Query(None),           # ">=X;veces;dia"
    filtrado_EstValorDias: Optional[str] = Query(None),       # ">=X;veces;d1#d2|all;diasPerdon"
    filtrado_Horas: Optional[str] = Query(None),              # ">=X;porcentaje"
    filtrado_PorcentajeEstaciones: Optional[str] = Query(None),  # ">=X-est1;est2"
):
    N = _N()

    comando = [
        "",                          # 0 placeholder for argv[0]
        "analizar",                  # 1 action
        entradaFicheros,             # 2
        salidaFicheros,              # 3
        seleccion_agregacion,        # 4
        deltaMedia if deltaMedia else N,                         # 5
        deltaAcumulada if deltaAcumulada else N,                 # 6
        graf_barras_est_med if graf_barras_est_med else N,       # 7
        graf_barras_est_acum if graf_barras_est_acum else N,     # 8
        graf_barras_dia if graf_barras_dia else N,               # 9
        graf_linea_comp_est if graf_linea_comp_est else N,       # 10
        graf_linea_comp_mats if graf_linea_comp_mats else N,     # 11
        mapa_densidad if mapa_densidad else N,                   # 12
        video_densidad if video_densidad else N,                 # 13
        mapa_voronoi if mapa_voronoi else N,                     # 14
        mapa_circulo if mapa_circulo else N,                     # 15
        mapa_desplazamientos if mapa_desplazamientos else N,     # 16
        filtrado_EstValor if filtrado_EstValor else N,           # 17
        filtrado_EstValorDias if filtrado_EstValorDias else N,   # 18
        filtrado_Horas if filtrado_Horas else N,                 # 19
        filtrado_PorcentajeEstaciones if filtrado_PorcentajeEstaciones else N,  # 20
    ]

    # Defensive validation to avoid IndexError in EjecutadorCMD
    if len(comando) != 21:
        return {"ok": False, "error": f"Se esperaban 21 argumentos; recibido {len(comando)}", "comando": comando}

    EjecutadorCMD.analizarCMD(comando)
    return {"ok": True, "comando": comando}

# ---------------------------
# Example dashboard data (unchanged)
# ---------------------------
@app.get("/zones")
async def zones():
    from random import randint
    return {
        "totalZones": randint(1, 100),
        "activeBikes": randint(1, 100),
        "avgTripDuration": randint(1, 100),
        "issuesDetected": randint(1, 100),
    }
