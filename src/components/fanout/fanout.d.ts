export interface FanoutController {
  get(): number;
  set(value: number): void;
  on(type: string, fn: (value: number) => void): () => void;
  destroy(): void;
}
export declare function create(el: Element): FanoutController;
