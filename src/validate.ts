import {
  Schema,
  ObjectSchema,
  ValidationOptions,
  ValidationError,
} from './types';
import { BaseSchema, ObjectValidator, UnionValidator } from './validators';

const defaultMessages = {
  string: 'Value must be a string',
  number: 'Value must be a number',
  date: 'Value must be a date or date string',
  invalidDate: 'Invalid date',
  array: 'Value must be an array',
  object: 'Value must be an object',
  required: 'Value is required',
  nullable: 'Value cannot be null',
  union: 'Value does not match any schema in the union',
};

export const validate = {
  string(typeMessage?: string): Schema<string> {
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

  number(typeMessage?: string): Schema<number> {
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

  date(typeMessage?: string, invalidMessage?: string): Schema<Date> {
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
