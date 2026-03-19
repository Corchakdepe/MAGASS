# ⚙️ Detalles del Backend (Bikesim Core) / Backend Details (Bikesim Core)

Este documento profundiza en la refactorización y arquitectura del núcleo de simulación en Python.

This document delves into the refactoring and architecture of the Python simulation core.

---

## 🇪🇸 Refactorización Modular (Spanish)

El motor original se ha transformado en el paquete modular `bikesim`, aplicando patrones de diseño orientados a objetos.

### 1. El Patrón Orchestrator
La clase `AnalysisOrchestrator` centraliza la ejecución de las tareas de análisis. Sus responsabilidades incluyen:
*   Carga de matrices de simulación.
*   Configuración de constantes globales.
*   Delegación de tareas a los managers especializados.

### 2. Managers Especializados
*   **MatrixManager**: Gestiona la selección y agregación de matrices (ej. sumar resultados de múltiples simulaciones).
*   **ChartManager**: Genera gráficas comparativas utilizando bibliotecas como Matplotlib y Plotly.
*   **MapManager**: Crea visualizaciones geoespaciales (Voronoi, Mapas de Calor) y automatiza su renderizado con Selenium.
*   **FilterManager**: Implementa la lógica de filtrado avanzado para identificar estaciones críticas.

### 3. Validaciones con Pydantic
Se han implementado modelos de datos estrictos para asegurar que toda la información que entra y sale de la API sea válida y coherente, eliminando errores por tipos de datos incorrectos.

---

## 🇺🇸 Modular Refactoring (English)

The original engine has been transformed into the `bikesim` modular package, applying object-oriented design patterns.

### 1. The Orchestrator Pattern
The `AnalysisOrchestrator` class centralizes the execution of analysis tasks. Its responsibilities include:
*   Loading simulation matrices.
*   Configuring global constants.
*   Delegating tasks to specialized managers.

### 2. Specialized Managers
*   **MatrixManager**: Handles matrix selection and aggregation (e.g., summing results from multiple simulations).
*   **ChartManager**: Generates comparative graphs using libraries like Matplotlib and Plotly.
*   **MapManager**: Creates geospatial visualizations (Voronoi, Heatmaps) and automates their rendering via Selenium.
*   **FilterManager**: Implements advanced filtering logic to identify critical stations.

### 3. Pydantic Validations
Strict data models have been implemented to ensure all information entering and leaving the API is valid and consistent, eliminating data type errors.

---

## 🏗️ Estructura del Paquete / Package Structure

```text
bikesim/
├── analysis/           # Gestión de Análisis (Orchestrator, Managers)
├── api/                # Endpoints FastAPI y Modelos de Respuesta
├── core/               # Lógica Central, Excepciones y Modelos Pydantic
├── generators/         # Generación de Escenarios y Datos
└── config/             # Configuración Centralizada (AppConfig)
```
