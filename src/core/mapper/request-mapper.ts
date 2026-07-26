/**
 * Contract for a mapper that turns an application input into an outbound
 * request DTO. It is total — a pure shape transform that never fails — so it
 * returns the DTO directly rather than a `Result`. Like {@link Mapper}, this is
 * only a named function type; request mappers stay plain functions.
 */
export type RequestMapper<TInput, TDto> = (input: TInput) => TDto;
