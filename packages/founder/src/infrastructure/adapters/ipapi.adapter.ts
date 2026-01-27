import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { LocationPort } from '../../domain/ports/location.port';
import { Location } from '../../domain/models/location.model';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class IpApiAdapter implements LocationPort {
  private readonly baseUrl = 'https://ipapi.co';

  constructor(private readonly httpService: HttpService) {}

  async getCurrentLocation(correlationId: string): Promise<Location> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/json`, {
            headers: {
              'User-Agent': 'Fake-Stripe-Founder/1.0',
              [CORRELATION_ID_HEADER]: correlationId, // Propagar correlation ID
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.code === 'ECONNABORTED') {
                throw new HttpException(
                  'Location service timeout',
                  HttpStatus.REQUEST_TIMEOUT
                );
              }
              throw new HttpException(
                `Location service error: ${error.message}`,
                HttpStatus.BAD_GATEWAY
              );
            })
          )
      );

      return Location.fromApiResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}
