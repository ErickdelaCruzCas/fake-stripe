/**
 * Shared types for Temporal Activities
 */

export interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WeatherData {
  description: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
}

export interface CatFactData {
  catFact: string;
  source: string;
}

export interface ChargeRequest {
  amount: number;
  currency: string;
  source: string;
  description?: string;
}

export interface ChargeResponse {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed';
  created: number;
  description?: string;
  failureCode?: string;
  failureMessage?: string;
}
