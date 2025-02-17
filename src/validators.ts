import {
  Schema,
  ValidationResult,
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

const defaultMessages = {
  required: 'Value is required',
  nullable: 'Value cannot be null',
  object: 'Value must be an object',
  union: 'Value does not match any schema in the union',
};

class BaseSchema<T> implements Schema<T> {
  private isRequired: boolean = false;
  private isNullable: boolean = false;
  private requiredMessage?: string;
  private nullableMessage?: string;

  constructor(
    private validator: (
      value: T,
      options?: ValidationOptions,
    ) => ValidationResult<T>,
  ) {}

  validate(value: T, options?: ValidationOptions): ValidationResult<T> {
    if (value === null) {
      if (this.isNullable) {
        return { success: true, value: null as T };
      }
      return {
        success: false,
        errors: [
          {
            path: [],
            message:
              options?.messages?.nullable ||
              this.nullableMessage ||
              defaultMessages.nullable,
          },
        ],
      };
    }

    if (value === undefined && this.isRequired) {
      return {
        success: false,
        errors: [
          {
            path: [],
            message:
              options?.messages?.required ||
              this.requiredMessage ||
              defaultMessages.required,
          },
        ],
      };
    }

    return this.validator(value, options);
  }

  required(message?: string): Schema<T> {
    this.isRequired = true;
    this.requiredMessage = message;
    return this;
  }

  nullable(message?: string): Schema<T | null> {
    this.isNullable = true;
    this.nullableMessage = message;
    return this;
  }

  custom(
    validationFn: (value: T) => boolean | Promise<boolean>,
    message?: string,
  ): Schema<T> {
    return new BaseSchema((value: T, options?: ValidationOptions) => {
      const result = validationFn(value);
      if (result instanceof Promise) {
        return result.then(isValid => {
          if (isValid) {
            return { success: true, value };
          }
          return {
            success: false,
            errors: [
              {
                path: [],
                message:
                  message || options?.messages?.custom || 'Invalid value',
              },
            ],
          };
        });
      }
      if (result) {
        return { success: true, value: value as T };
      }
      return {
        success: false,
        errors: [
          {
            path: [],
            message: message || options?.messages?.custom || 'Invalid value',
          },
        ],
      };
    });
  }
}

class ObjectValidator<T> extends BaseSchema<T> implements ObjectSchema<T> {
  constructor(
    public shape: Record<string, Schema<any>>,
    private typeMessage?: string,
  ) {
    super((value: unknown, options?: ValidationOptions) => {
      if (typeof value !== 'object' || value === null) {
        return {
          success: false,
          errors: [
            {
              path: [],
              message:
                options?.messages?.type ||
                this.typeMessage ||
                defaultMessages.object,
            },
          ],
        };
      }

      const errors: ValidationError[] = [];
      const result: any = {};

      for (const [key, schema] of Object.entries(this.shape)) {
        const fieldValue = (value as any)[key];
        const fieldResult = schema.validate(fieldValue, options);

        if (!fieldResult.success) {
          errors.push(
            ...(fieldResult.errors?.map(error => ({
              ...error,
              path: [key, ...error.path],
            })) ?? []),
          );
        } else {
          result[key] = fieldResult.value;
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, value: result as T };
    });
  }
}

class UnionValidator<T> extends BaseSchema<T> {
  constructor(private schemas: Schema<any>[], private unionMessage?: string) {
    super((value: unknown, options?: ValidationOptions) => {
      const errors: ValidationError[] = [];

      for (const schema of schemas) {
        const result = schema.validate(value, options);
        if (result.success) {
          return result as ValidationResult<T>;
        }
        errors.push(...(result.errors ?? []));
      }

      return {
        success: false,
        errors: [
          {
            path: [],
            message: this.unionMessage || defaultMessages.union,
          },
          ...errors,
        ],
      };
    });
  }
}

export { BaseSchema, ObjectValidator, UnionValidator };
