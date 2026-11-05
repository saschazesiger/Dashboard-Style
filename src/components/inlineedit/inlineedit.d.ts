/**
 * Types of DS.inlineedit (src/components/inlineedit/inlineedit.js).
 * Hand-written; the build test keeps the declared exports and their
 * parameters equal to the module's.
 */

export interface InlineEditSaveDetail {
  value: string;
  previous: string;
  /** Hands the save's promise to the component: busy until it settles, the error if it rejects. */
  wait(promise: PromiseLike<unknown>): void;
}

export interface InlineEditController {
  get(): { value: string; editing: boolean; busy: boolean };
  /** Sets the shown value (and the field's, while editing). */
  set(value: string): void;
  /** Opens the field. */
  edit(): void;
  /** Saves what the field holds. */
  save(): Promise<void>;
  /** Leaves the field without saving. */
  cancel(): void;
  /** A save listener may return the save's promise instead of calling wait(). */
  on(type: 'save', fn: (detail: InlineEditSaveDetail) => unknown): () => void;
  on(type: 'cancel' | 'edit', fn: (detail: { value: string }) => void): () => void;
  destroy(): void;
}

/** What a save does: 'close' when nothing changed, 'save' with the value to save. */
export declare function decide(value: string | null | undefined, previous: string | null | undefined, options?: { trim?: boolean }): { action: 'close' | 'save'; value: string };
/** An inline edit driven from the page. */
export declare function create(el: Element): InlineEditController;
