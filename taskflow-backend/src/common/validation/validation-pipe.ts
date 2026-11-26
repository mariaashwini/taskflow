import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';
import { ERROR_CODES, type ErrorResponse } from '@taskflow/shared';

type FieldError = NonNullable<ErrorResponse['error']['fields']>[number];

/** Overall message of a validation error; the details are in `fields`. */
const SUMMARY_MESSAGE = 'Some fields are not valid.';

/** Same text for every field that isn't allowed, so it never repeats what was sent. */
const UNKNOWN_FIELD_MESSAGE = 'This field is not allowed.';

/** class-validator's name for the "field is not allowed" rule (forbidNonWhitelisted). */
const UNKNOWN_FIELD_CONSTRAINT = 'whitelistValidation';

/**
 * The global validation pipe (architecture, "Global setup").
 * Every request body, query and parameter that has a DTO class passes through it.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    // Drop properties the DTO doesn't declare...
    whitelist: true,
    // ...and reject the request instead of silently dropping them (e.g. `userId`).
    forbidNonWhitelisted: true,
    // Hand controllers real DTO instances, not plain objects.
    transform: true,
    // class-validator never attaches the DTO object or the submitted value to its errors.
    validationError: { target: false, value: false },
    // Turn class-validator's results into our VALIDATION_FAILED shape; the global
    // filter passes our code, message and fields through unchanged.
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: SUMMARY_MESSAGE,
        fields: toFieldErrors(errors),
      }),
  });
}

/**
 * One entry per invalid field, with one message each (what the frontend shows
 * under the input). Nested fields get a dotted path, e.g. `address.city`.
 */
export function toFieldErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  const result: FieldError[] = [];

  for (const error of errors) {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const constraints = error.constraints ?? {};

    if (UNKNOWN_FIELD_CONSTRAINT in constraints) {
      result.push({ field, message: UNKNOWN_FIELD_MESSAGE });
    } else {
      const [firstMessage] = Object.values(constraints);
      if (firstMessage !== undefined) {
        result.push({ field, message: firstMessage });
      }
    }

    if (error.children && error.children.length > 0) {
      result.push(...toFieldErrors(error.children, field));
    }
  }

  return result;
}
