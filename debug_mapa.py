from Frontend.EjecutadorCMD import run_analysis, AnalysisArgs

args = AnalysisArgs(
    input_folder="./results/20251209_193255_sim_ST0_S0.00_WC1.00_D15",
    output_folder="./results/20251209_193255_sim_ST0_S0.00_WC1.00_D15",
    seleccion_agregacion="1",
    delta_media=None,
    delta_acumulada=None,
    graf_barras_est_med=None,
    graf_barras_est_acum=None,
    graf_barras_dia=None,
    graf_linea_comp_est=None,
    graf_linea_comp_mats=None,
    mapa_densidad=None,
    video_densidad=None,
    mapa_voronoi=None,
    mapa_circulo=None,
    mapa_desplazamientos="10;15;720;1;0",
    filtrado_EstValor=None,
    filtrado_EstValorDias=None,
    filtrado_Horas=None,
    filtrado_PorcentajeEstaciones=None,
    filtro=None,
    tipo_filtro=None,
    use_filter_for_maps=False,
    use_filter_for_graphs=False,
    filter_result_filename=None,
)

run_analysis(args)
