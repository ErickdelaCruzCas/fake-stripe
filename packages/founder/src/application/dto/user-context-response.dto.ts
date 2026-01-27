import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: '203.0.113.42', description: 'IP address' })
  ip!: string;

  @ApiProperty({ example: 'San Francisco', description: 'City name' })
  city!: string;

  @ApiProperty({ example: 'California', description: 'Region/state name' })
  region!: string;

  @ApiProperty({ example: 'US', description: 'Country code' })
  country!: string;

  @ApiProperty({ example: 37.7749, description: 'Latitude coordinate' })
  latitude!: number;

  @ApiProperty({ example: -122.4194, description: 'Longitude coordinate' })
  longitude!: number;

  @ApiProperty({
    example: 'America/Los_Angeles',
    description: 'Timezone identifier',
  })
  timezone!: string;
}

export class WeatherDto {
  @ApiProperty({ example: 'Clear sky', description: 'Weather description' })
  description!: string;

  @ApiProperty({ example: 18.5, description: 'Temperature in Celsius' })
  temperature!: number;

  @ApiProperty({ example: 17.2, description: 'Feels like temperature in Celsius' })
  feelsLike!: number;

  @ApiProperty({ example: 65, description: 'Humidity percentage' })
  humidity!: number;

  @ApiProperty({ example: 3.5, description: 'Wind speed in m/s' })
  windSpeed!: number;
}

export class EntertainmentDto {
  @ApiProperty({
    example: 'Cats sleep 70% of their lives.',
    description: 'Random cat fact',
  })
  catFact!: string;

  @ApiProperty({ example: 'catfact.ninja', description: 'Source of the fact' })
  source!: string;
}

export class UserContextResponseDto {
  @ApiPropertyOptional({
    type: LocationDto,
    description: 'User location data (null if failed)',
  })
  location!: LocationDto | null;

  @ApiPropertyOptional({
    type: WeatherDto,
    description: 'Weather data (null if failed)',
  })
  weather!: WeatherDto | null;

  @ApiPropertyOptional({
    type: EntertainmentDto,
    description: 'Entertainment data (null if failed)',
  })
  entertainment!: EntertainmentDto | null;

  @ApiProperty({
    example: '2024-01-26T10:30:00.000Z',
    description: 'Timestamp of aggregation',
  })
  aggregatedAt!: Date;

  @ApiProperty({
    example: 450,
    description: 'Processing time in milliseconds',
  })
  processingTimeMs!: number;

  @ApiProperty({
    example: 'promise-allsettled',
    description: 'Strategy used for aggregation',
    enum: ['promise-allsettled', 'rxjs', 'async-sequential'],
  })
  strategyUsed!: string;

  @ApiPropertyOptional({
    example: ['Weather fetch failed: timeout'],
    description: 'Array of errors if any API calls failed',
    type: [String],
  })
  errors?: string[];
}
