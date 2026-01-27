import { Location } from './location.model';
import { Weather } from './weather.model';
import { CatFact } from './cat-fact.model';

export class UserContext {
  constructor(
    public readonly location: Location | null,
    public readonly weather: Weather | null,
    public readonly entertainment: CatFact | null,
    public readonly aggregatedAt: Date,
    public readonly strategyUsed: string,
    public readonly errors: string[]
  ) {}
}
