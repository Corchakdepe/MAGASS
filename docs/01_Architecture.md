# 🏗️ Arquitectura del Sistema / System Architecture

Este documento detalla la estructura técnica y de diseño de la plataforma **BikeSim**, optimizada para un Trabajo Fin de Grado (TFG) en la Universidad de Huelva.

This document details the technical and design structure of the **BikeSim** platform, optimized for a Final Degree Project (TFG) at the University of Huelva.

---

## 🇪🇸 Descripción de la Arquitectura (Spanish)

El sistema BikeSim se ha diseñado bajo una arquitectura de **microservicios desacoplados**, permitiendo que el motor de simulación y la interfaz de usuario operen de forma independiente pero coordinada.

### 1. Componentes Principales
*   **Frontend (Next.js 15)**: Actúa como el centro de control del usuario. Gestiona el estado de las simulaciones, visualiza mapas interactivos y presenta gráficos de análisis.
*   **Backend (FastAPI)**: Proporciona una interfaz RESTful robusta para ejecutar simulaciones, procesar datos pesados y servir archivos de resultados.
*   **Motor de Simulación (Python/Bikesim)**: El núcleo lógico que implementa el modelo estocástico de movimiento de usuarios.

### 2. Comunicación y Flujo de Datos
La comunicación se realiza mediante peticiones HTTP asíncronas. El Frontend envía parámetros de simulación al Backend, el cual orquesta la ejecución del motor `bikesim`. Una vez completada, los resultados se almacenan de forma persistente y se sirven mediante endpoints especializados para su visualización.

### 3. Contenerización (Docker)
Todo el ecosistema está orquestado mediante **Docker Compose**, lo que garantiza que el entorno de ejecución sea idéntico tanto en desarrollo como en producción, eliminando el problema de "en mi máquina funciona".

---

## 🇺🇸 Architectural Overview (English)

The BikeSim system has been designed using a **decoupled microservices architecture**, allowing the simulation engine and the user interface to operate independently yet in a coordinated manner.

### 1. Core Components
*   **Frontend (Next.js 15)**: Serves as the user's command center. It manages simulation states, renders interactive maps, and displays analysis charts.
*   **Backend (FastAPI)**: Provides a robust RESTful interface to trigger simulations, process heavy data, and serve result files.
*   **Simulation Engine (Python/Bikesim)**: The logical core implementing the stochastic model of user displacement.

### 2. Communication and Data Flow
Communication occurs via asynchronous HTTP requests. The Frontend sends simulation parameters to the Backend, which orchestrates the execution of the `bikesim` engine. Once complete, results are stored persistently and served via specialized endpoints for visualization.

### 3. Containerization (Docker)
The entire ecosystem is orchestrated using **Docker Compose**, ensuring an identical execution environment in both development and production, effectively eliminating "it works on my machine" issues.

---

## 📁 Diagrama de Estructura / Structure Diagram

```text
[ Usuario / User ]
      │
      ▼
[ Frontend: Next.js + React ] <──────┐
      │                              │
      │ (API REST / JSON)            │ (Mapas/Gráficos / Maps/Charts)
      ▼                              │
[ Backend: FastAPI ] ────────────────┘
      │
      ▼
[ Motor: Bikesim Core ] ───> [ Almacenamiento: Results/ ]
```
