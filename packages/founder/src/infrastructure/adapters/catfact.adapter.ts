import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { CatFactPort } from '../../domain/ports/cat-fact.port';
import { CatFact } from '../../domain/models/cat-fact.model';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class CatFactAdapter implements CatFactPort {
  private readonly baseUrl = 'https://catfact.ninja';

  constructor(private readonly httpService: HttpService) {}

  async getRandomFact(correlationId: string): Promise<CatFact> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.baseUrl}/fact`, {
            headers: {
              [CORRELATION_ID_HEADER]: correlationId, // Propagar correlation ID
            },
          })
          .pipe(
          catchError((error: AxiosError) => {
            if (error.code === 'ECONNABORTED') {
              throw new HttpException(
                'Cat fact service timeout',
                HttpStatus.REQUEST_TIMEOUT
              );
            }
            throw new HttpException(
              `Cat fact service error: ${error.message}`,
              HttpStatus.BAD_GATEWAY
            );
          })
        )
      );

      return CatFact.fromApiResponse(response.data);
    } catch (error) {
      throw error;
    }
  }
}
