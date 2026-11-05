/**
 * Types of DS.levelmeter (src/components/levelmeter/levelmeter.js).
 * Hand-written; the build test keeps the declared exports and their
 * parameters equal to the module's.
 */

export interface LevelOptions {
  /** The dBFS of the empty track (default -60). */
  floor?: number;
}

export interface LevelmeterOptions extends LevelOptions {
  /** Read every frame (getFloatTimeDomainData). */
  analyser?: AnalyserNode | null;
}

export interface LevelmeterState {
  /** The last level given (0 ... 1). */
  level: number;
  /** The peak mark (0 ... 1). */
  peak: number;
  /** At -1 dBFS or above, until it has stayed below for --ds-hold-status. */
  loud: boolean;
}

export interface LevelmeterController {
  get(): LevelmeterState;
  /** The page's own level, 0 ... 1. */
  set(value: number): void;
  /** Reads `analyser` every frame; the function returned lets go of it. */
  listen(analyser: AnalyserNode | null): () => void;
  on(type: 'change', fn: (detail: { loud: boolean }) => void): () => void;
  destroy(): void;
}

/** The level of a block of samples: RMS in dBFS, from `floor` (0) to 0 dB (1). */
export declare function level(samples: ArrayLike<number>, options?: LevelOptions): number;
/** The dBFS of a level, rounded; -Infinity at 0. */
export declare function decibels(value: number, options?: LevelOptions): number;
/** A meter driven from the page. */
export declare function create(el: Element, options?: LevelmeterOptions): LevelmeterController;
