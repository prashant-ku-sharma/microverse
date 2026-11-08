/** A product snapshot. Prices are major currency units; the owning catalog defines currency. */
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly image: string;
  readonly category: string;
  /** Average sample rating, from 0 to 5. */
  readonly rating: number;
  /** Available units, a non-negative integer. */
  readonly stock: number;
  readonly material: string;
  readonly features: readonly string[];
}
