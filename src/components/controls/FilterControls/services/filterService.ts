// services/filterService.ts
import axios from 'axios';
import {
  EstacionesDiaPayload,
  EstacionesMesPayload,
  HorasPayload,
  PorcentajeTiempoPayload,
} from '@/components/controls/FilterControls/utils/filterHelpers';
import { FilterResponse } from "../types/filterControls";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class FilterService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async filterEstacionesDia(payload: EstacionesDiaPayload): Promise<FilterResponse> {
    const response = await axios.post(`${this.baseUrl}/filters/filter/estaciones-dia`, payload);
    return response.data;
  }

  async filterEstacionesMes(payload: EstacionesMesPayload): Promise<FilterResponse> {
    const response = await axios.post(`${this.baseUrl}/filters/filter/estaciones-mes`, payload);
    return response.data;
  }

  async filterHoras(payload: HorasPayload): Promise<FilterResponse> {
    const response = await axios.post(`${this.baseUrl}/filters/filter/horas`, payload);
    return response.data;
  }

  async filterPorcentajeTiempo(payload: PorcentajeTiempoPayload): Promise<FilterResponse> {
    const response = await axios.post(`${this.baseUrl}/filters/filter/porcentaje-tiempo`, payload);
    return response.data;
  }

  async getFilterResult(run: string, filename: string, kind: string = "stations"): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/filters/result`, {
      params: { run, filename, kind }
    });
    return response.data;
  }

  async getExampleQueries(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/filters/filter/example-queries`);
    return response.data;
  }
}

export const filterService = new FilterService();
export type { FilterResponse };