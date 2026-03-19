# BikeSim: Plataforma de Simulación y Análisis de Sistemas de Bicicletas Compartidas
# BikeSim: Simulation and Analysis Platform for Bike-Sharing Systems

Este proyecto constituye el **Trabajo Fin de Grado (TFG)** para el Grado en Ingeniería Informática de la **Universidad de Huelva**.

This project constitutes the **Final Degree Project (TFG)** for the Degree in Computer Science at the **University of Huelva**.

---

## 🇪🇸 Descripción General (Spanish)

**BikeSim** es una plataforma integral diseñada para la simulación, análisis y visualización de sistemas de bicicletas compartidas. Permite a los investigadores y planificadores urbanos modelar el comportamiento de los usuarios, evaluar la capacidad de las estaciones y analizar la eficiencia de la red mediante simulaciones avanzadas y procesamiento de datos geoespaciales.

El sistema ha sido diseñado con un enfoque modular, separando el motor de simulación (backend en Python) de la interfaz de usuario moderna (frontend en Next.js), permitiendo una escalabilidad y mantenibilidad óptimas.

### Características Principales
*   **Simulador Estocástico**: Motor basado en eventos para modelar desplazamientos de usuarios con parámetros personalizables.
*   **Análisis de Datos Avanzado**: Procesamiento de matrices de origen-destino, cálculo de entropía y estadísticas de ocupación.
*   **Visualizaciones Geoespaciales**: Generación de mapas interactivos de Voronoi, mapas de calor de densidad y visualización de capacidades.
*   **Arquitectura de Microservicios**: Backend robusto con FastAPI y Frontend reactivo con Next.js 15.
*   **Gestión de Resultados**: Sistema de historial persistente para comparar diferentes escenarios de simulación.

---

## 🇺🇸 Overview (English)

**BikeSim** is a comprehensive platform designed for the simulation, analysis, and visualization of bike-sharing systems. It allows researchers and urban planners to model user behavior, evaluate station capacity, and analyze network efficiency through advanced simulations and geospatial data processing.

The system has been designed with a modular approach, separating the simulation engine (Python backend) from the modern user interface (Next.js frontend), ensuring optimal scalability and maintainability.

### Key Features
*   **Stochastic Simulator**: Event-based engine for modeling user displacements with customizable parameters.
*   **Advanced Data Analysis**: Processing of origin-destination matrices, entropy calculation, and occupancy statistics.
*   **Geospatial Visualizations**: Generation of interactive Voronoi maps, density heatmaps, and capacity visualizations.
*   **Microservices Architecture**: Robust FastAPI backend and reactive Next.js 15 frontend.
*   **Results Management**: Persistent history system for comparing different simulation scenarios.

---

## 🔍 Detalles del Proyecto / Project Details

### 🇪🇸 Continuidad y Evolución
Este sistema es una evolución directa del proyecto de investigación detallado en el documento "Bicis TFG Guti". Mientras que la versión original sentó las bases del modelado estocástico, esta versión moderniza completamente la infraestructura técnica, separando la lógica de cálculo de la presentación y mejorando la robustez del motor de simulación.

### 🇺🇸 Continuity and Evolution
This system is a direct evolution of the research project detailed in the "Bicis TFG Guti" document. While the original version laid the foundation for stochastic modeling, this version completely modernizes the technical infrastructure, decoupling calculation logic from presentation and enhancing the robustness of the simulation engine.

---

### 🎨 Frontend: Experiencia de Usuario (UX)
El frontend ha sido rediseñado utilizando **React** y **Next.js 15** con un enfoque en la accesibilidad y facilidad de uso para el usuario promedio (gestores urbanos, investigadores).
*   **Interfaz Intuitiva**: Uso de componentes de Shadcn/UI para una navegación fluida.
*   **Visualización Interactiva**: Integración profunda con Leaflet para mapas en tiempo real que permiten explorar la red de estaciones de forma visual.
*   **Feedback Inmediato**: Paneles de filtrado que muestran resultados de análisis complejos de forma simplificada.
*   **Sin Comandos**: Todas las operaciones de simulación y análisis se realizan a través de la interfaz web, eliminando la barrera de entrada técnica de las versiones anteriores basadas en terminal.

### 🎨 Frontend: User Experience (UX)
The frontend has been redesigned using **React** and **Next.js 15** with a focus on accessibility and ease of use for the average user (urban managers, researchers).
*   **Intuitive Interface**: Use of Shadcn/UI components for seamless navigation.
*   **Interactive Visualization**: Deep integration with Leaflet for real-time maps that allow visual exploration of the station network.
*   **Immediate Feedback**: Filtering panels that display complex analysis results in a simplified manner.
*   **No Commands Required**: All simulation and analysis operations are performed through the web interface, removing the technical barrier of entry from previous terminal-based versions.

---

### ⚙️ Backend: Refactorización y Modularidad (Bikesim)
El núcleo de Python ha sido completamente reescrito dentro del paquete `bikesim`, pasando de un script monolítico a una arquitectura orientada a objetos y servicios.
*   **Análisis Modular**: La lógica se divide en managers especializados (`MatrixManager`, `ChartManager`, `MapManager`, `FilterManager`) coordinados por un `Orchestrator`.
*   **Validación con Pydantic**: Uso de modelos de datos rigurosos para garantizar que los parámetros de simulación y los resultados sean consistentes.
*   **Rendimiento**: Optimización del procesamiento de matrices origen-destino mediante NumPy y Pandas.
*   **API Robusta**: Implementación de endpoints REST con FastAPI que permiten la integración con cualquier cliente moderno.

### ⚙️ Backend: Refactoring and Modularity (Bikesim)
The Python core has been completely rewritten within the `bikesim` package, moving from a monolithic script to an object-oriented and service-based architecture.
*   **Modular Analysis**: Logic is divided into specialized managers (`MatrixManager`, `ChartManager`, `MapManager`, `FilterManager`) coordinated by an `Orchestrator`.
*   **Pydantic Validation**: Use of rigorous data models to ensure simulation parameters and results remain consistent.
*   **Performance**: Optimization of origin-destination matrix processing using NumPy and Pandas.
*   **Robust API**: Implementation of REST endpoints with FastAPI, enabling integration with any modern client.

---

## 🛠 Stack Tecnológico / Tech Stack

### Backend
*   **Lenguaje**: Python 3.11
*   **Framework**: FastAPI
*   **Procesamiento**: Pandas, NumPy, SQLAlchemy
*   **Geospatial**: Folium, Geovoronoi, Shapely, OpenRouteService
*   **Automatización**: Selenium & Chromium (para renderizado de mapas)

### Frontend
*   **Framework**: Next.js 15 (App Router)
*   **Lenguaje**: TypeScript
*   **Estilos**: Tailwind CSS, Radix UI, Lucide Icons
*   **Visualización**: Leaflet, React Leaflet, Recharts, Chart.js
*   **Internacionalización**: i18next (Soporte para Español e Inglés)

---

## 📋 Requisitos / Requirements

*   **Docker** y **Docker Compose** (Recomendado / Recommended)
*   **Node.js 20+** (Para ejecución local del frontend / For local frontend execution)
*   **Python 3.11+** (Para ejecución local del backend / For local backend execution)
*   **Chromium/Chrome** (Necesario para la generación de mapas estáticos / Required for static map generation)

---

## 🚀 Instalación y Configuración / Installation & Setup

### Usando Docker (Método Preferido / Preferred Method)

1.  Clonar el repositorio / Clone the repository:
    ```bash
    git clone <repository-url>
    cd bike-sim-project
    ```

2.  Levantar los servicios / Start the services:
    ```bash
    docker-compose up --build
    ```

3.  Acceder a las aplicaciones / Access the applications:
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API**: [http://localhost:8000](http://localhost:8000)
    *   **Documentación API**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Configuración Local / Local Setup

#### Backend
```bash
# Crear e iniciar entorno virtual / Create and start virtual env
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias / Install dependencies
pip install -r requirements.txt

# Iniciar servidor / Start server
uvicorn mainapi:app --reload --port 8000
```

#### Frontend
```bash
# Instalar dependencias / Install dependencies
npm install

# Iniciar en modo desarrollo / Start in development mode
npm run dev
```

---

## 📂 Estructura del Proyecto / Project Structure

```text
.
├── bikesim/                # Lógica de negocio y motor de simulación
│   ├── analysis/           # Procesamiento modular (Matrix, Chart, Map, Filter Managers)
│   ├── api/                # Definición de rutas y endpoints FastAPI
│   ├── core/               # Modelos Pydantic y lógica central
│   ├── generators/         # Generadores de datos y escenarios
│   └── config/             # Configuración y variables de entorno (AppConfig)
├── src/                    # Frontend moderno en Next.js
│   ├── app/                # Rutas y páginas de la aplicación
│   ├── components/         # Componentes React (UI, Paneles, Mapas)
│   └── contexts/           # Proveedores de estado (Simulación, Idioma)
├── Datos/                  # Archivos CSV y datos base para simulaciones
├── results/                # Almacenamiento persistente de resultados
├── uploads/                # Carpeta para la subida de nuevos datasets
├── Dockerfile.backend      # Configuración de imagen para el Backend
├── Dockerfile.frontend     # Configuración de imagen para el Frontend
├── docker-compose.yml      # Orquestación de contenedores
├── mainapi.py              # Punto de entrada de la API
└── bike_simulator5.py      # Script principal del motor de simulación
```

---

## 📜 Scripts y Comandos / Scripts & Commands

### Frontend (`package.json`)
*   `npm run dev`: Servidor de desarrollo con Turbopack.
*   `npm run build`: Construcción optimizada para producción.
*   `npm run start`: Ejecución de la versión de producción.
*   `npm run lint`: Análisis estático de código.
*   `npm run typecheck`: Validación de tipos TypeScript.

### Backend & Herramientas
*   `uvicorn mainapi:app`: Inicia el servidor de producción.
*   `python bike_simulator5.py`: Ejecuta el simulador desde línea de comandos.
*   `python Script_Entropia.py`: Ejecuta el análisis de entropía del sistema.

---

## 🧪 Pruebas / Testing

*   **API**: Los endpoints pueden ser probados mediante el cliente HTTP integrado (`test_main.http`) o vía Swagger UI.
*   **TODO**: Incrementar la cobertura de tests unitarios en el motor `bike_simulator5.py`.

---

## ⚙️ Variables de Entorno / Environment Variables

Configurables en un archivo `.env` o en `docker-compose.yml`:

*   `ALLOWED_ORIGINS`: Lista de dominios permitidos para CORS (ej: `http://localhost:3000`).
*   `RESULTS_FOLDER`: Directorio para guardar archivos de salida (Default: `./results`).
*   `UPLOADS_FOLDER`: Directorio para datos de entrada (Default: `./uploads`).
*   `CHROME_BIN`: Ruta al ejecutable de Chromium para Selenium.

---

## 🎓 Créditos y TFG / Credits & TFG

Este proyecto ha sido desarrollado como parte del **Trabajo Fin de Grado** en la **Universidad de Huelva**.

*   **Autor**: [TODO: Introducir Nombre del Autor / Enter Author Name]
*   **Tutor**: [TODO: Introducir Nombre del Tutor / Enter Tutor Name]
*   **Institución**: Escuela Técnica Superior de Ingeniería (ETSI) - Universidad de Huelva.
*   **Fecha**: Marzo 2026

---

## 📄 Licencia / License

Este proyecto es propiedad intelectual del autor para fines académicos. 
[TODO: Añadir Licencia Específica, ej: MIT o Creative Commons si aplica].

This project is the intellectual property of the author for academic purposes.
[TODO: Add Specific License, e.g., MIT or Creative Commons if applicable].
