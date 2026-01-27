export class CatFact {
  constructor(
    public readonly catFact: string,
    public readonly source: string = 'catfact.ninja'
  ) {}

  static fromApiResponse(data: any): CatFact {
    return new CatFact(data.fact);
  }
}
