import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { WeatherPort } from '../../domain/ports/weather.port';
import { Weather } from '../../domain/models/weather.model';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class OpenWeatherMapAdapter implements WeatherPort {
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    // Read from environment variable with fallback
    this.apiKey =
      this.configService.get<string>('OPENWEATHER_API_KEY') ||
      '904c250dea7da952f578aad2312c65e5'; // Fallback API key
  }

  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    correlationId: string
  ): Promise<Weather> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/weather`, {
            params: {
              lat: latitude,
              lon: longitude,
              appid: this.apiKey,
              units: 'metric',
            },
            headers: {
              [CORRELATION_ID_HEADER]: correlationId, // Propagar correlation ID
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.code === 'ECONNABORTED') {
                throw new HttpException(
                  'Weather service timeout',
                  HttpStatus.REQUEST_TIMEOUT
                );
              }
              throw new HttpException(
                `Weather service error: ${error.message}`,
                HttpStatus.BAD_GATEWAY
              );
            })
          )
      );

      return Weather.fromApiResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}
