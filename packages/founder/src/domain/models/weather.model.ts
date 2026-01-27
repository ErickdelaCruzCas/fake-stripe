export class Weather {
  constructor(
    public readonly description: string,
    public readonly temperature: number,
    public readonly feelsLike: number,
    public readonly humidity: number,
    public readonly windSpeed: number
  ) {}

  static fromApiResponse(data: any): Weather {
    return new Weather(
      data.weather[0]?.description || 'Unknown',
      data.main.temp,
      data.main.feels_like,
      data.main.humidity,
      data.wind.speed
    );
  }
}
