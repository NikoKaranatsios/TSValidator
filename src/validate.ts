import {
  Schema,
  ObjectSchema,
  ValidationOptions,
  ValidationError,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  DateSchema,
  EmailSchema,
  UrlSchema,
  MinLengthSchema,
  MaxLengthSchema,
  PatternSchema,
} from './types';
import { BaseSchema, ObjectValidator, UnionValidator } from './validators';

const defaultMessages = {
  string: 'Value must be a string',
  number: 'Value must be a number',
  boolean: 'Value must be a boolean',
  date: 'Value must be a date or date string',
  invalidDate: 'Invalid date',
  array: 'Value must be an array',
  object: 'Value must be an object',
  required: 'Value is required',
  nullable: 'Value cannot be null',
  email: 'Value must be a valid email address',
  url: 'Value must be a valid URL',
  minLength: 'Value must have at least {min} characters',
  maxLength: 'Value must have at most {max} characters',
  pattern: 'Value does not match the required pattern',
  union: 'Value does not match any schema in the union',
};

export const validate = {
  string(typeMessage?: string): StringSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'string') {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type ||
                typeMessage ||
                defaultMessages.string,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  number(typeMessage?: string): NumberSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'number') {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type ||
                typeMessage ||
                defaultMessages.number,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  boolean(typeMessage?: string): BooleanSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'boolean') {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type ||
                typeMessage ||
                defaultMessages.boolean,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  date(typeMessage?: string, invalidMessage?: string): DateSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (!(value instanceof Date) && typeof value !== 'string') {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type || typeMessage || defaultMessages.date,
            },
          ],
        };
      }
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message: invalidMessage || defaultMessages.invalidDate,
            },
          ],
        };
      }
      return { success: true, value: date };
    });
  },

  email(typeMessage?: string): EmailSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (
        typeof value !== 'string' ||
        !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value)
      ) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.email ||
                typeMessage ||
                defaultMessages.email,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  url(typeMessage?: string): UrlSchema {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (
        typeof value !== 'string' ||
        !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(value)
      ) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.url || typeMessage || defaultMessages.url,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  minLength<T>(length: number, message?: string): MinLengthSchema<T> {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'string' || value.length < length) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                message ||
                options?.messages?.minLength ||
                defaultMessages.minLength.replace('{min}', String(length)),
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  maxLength<T>(length: number, message?: string): MaxLengthSchema<T> {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'string' || value.length > length) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                message ||
                options?.messages?.maxLength ||
                defaultMessages.maxLength.replace('{max}', String(length)),
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  pattern<T>(regex: RegExp, message?: string): PatternSchema<T> {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'string' || !regex.test(value)) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                message ||
                options?.messages?.pattern ||
                defaultMessages.pattern,
            },
          ],
        };
      }
      return { success: true, value };
    });
  },

  array<T>(schema: Schema<T>, typeMessage?: string): Schema<T[]> {
    return new BaseSchema((value: unknown, options?: ValidationOptions) => {
      if (!Array.isArray(value)) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type || typeMessage || defaultMessages.array,
            },
          ],
        };
      }

      const errors: ValidationError[] = [];
      const result: T[] = [];

      value.forEach((item, index) => {
        const itemResult = schema.validate(item, options);
        if (!itemResult.success) {
          errors.push(
            ...(itemResult.errors?.map(error => ({
              ...error,
              path: [index.toString(), ...error.path],
            })) ?? []),
          );
        } else {
          result.push(itemResult.value!);
        }
      });

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, value: result };
    });
  },

  object<T extends Record<string, any>>(
    shape: {
      [K in keyof T]: Schema<T[K]>;
    },
    typeMessage?: string,
  ): ObjectSchema<T> {
    return new ObjectValidator(shape, typeMessage);
  },

  union<T extends any[]>(
    schemas: [...{ [K in keyof T]: Schema<T[K]> }],
    message?: string,
  ): Schema<T[number]> {
    return new UnionValidator(schemas, message);
  },
};
