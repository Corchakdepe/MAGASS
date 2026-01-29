"""Application constants."""

# Character constants
CARACTER_NULO_CMD = "_"

# File patterns
PATTERN_SIM_FOLDER = "*_sim_*"
PATTERN_FILTER_STATIONS = "*Filtrado_Estaciones*.csv"
PATTERN_FILTER_HOURS = "*Filtrado_Horas*.csv"
PATTERN_DISPLACEMENT = "*Desplazamientos_Resultado*.csv"
PATTERN_SUMMARY = "*ResumenEjecucion*.txt"

# Map kinds mapping
MAP_KINDS = [
    ("MapaDensidad", "Densidad", "html"),
    ("MapaCirculos", "Circles", "html"),
    ("MapaDesplazamientos", "Desplazamientos", "html"),
    ("MapaVoronoi", "Voronoi", "html"),
    ("MapaEspera", "Espera", "html"),
    ("MapaDensidad", "Densidad", "png"),
    ("MapaCirculos", "Circles", "png"),
    ("MapaDesplazamientos", "Desplazamientos", "png"),
    ("MapaVoronoi", "Voronoi", "png"),
    ("MapaEspera", "Espera", "png"),
]

# CSV suffix for uploads
UPLOAD_CSV_SUFFIX = "_15min_deltas.csv"

# Time constants
HOURS_PER_DAY = 24
