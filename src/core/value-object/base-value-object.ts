/**
 * Base class for domain value objects.
 *
 * @remarks
 * - **Equality is by value, not identity** — the difference that defines a
 *   value object against an entity (Evans 2003 p.97). Two `Email`s holding the
 *   same address are the same email; two `RecipeEntity`s with the same name are
 *   two different recipes. `BaseEntity.equals` compares `id`; this compares the
 *   wrapped value, so subclasses cannot accidentally get identity semantics.
 * - **Immutable by construction** — `value` is `readonly` and there is no
 *   setter. A value object that can change is a small entity in disguise.
 * - **Validation stays in the subclass**, behind a private constructor and a
 *   static `create(): Result`. This base deliberately takes no opinion on what
 *   makes a value valid; it only guarantees that whatever gets in compares
 *   sensibly afterwards.
 */
export abstract class BaseValueObject<T> {
  protected constructor(protected readonly _value: T) {}

  get value(): T {
    return this._value;
  }

  equals(other: BaseValueObject<T>): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }
}
