export class Location {
  constructor(
    public readonly ip: string,
    public readonly city: string,
    public readonly region: string,
    public readonly country: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly timezone: string
  ) {}

  static fromApiResponse(data: any): Location {
    return new Location(
      data.ip,
      data.city,
      data.region,
      data.country,
      data.latitude,
      data.longitude,
      data.timezone
    );
  }
}
