export type ValidationResult<T> = {
  success: boolean;
  value?: T;
  errors?: ValidationError[];
};

export type ValidationError = {
  path: string[];
  message: string;
};

export type ValidationOptions = {
  messages?: {
    required?: string;
    type?: string;
    nullable?: string;
    custom?: string;
    email?: string;
    url?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
  };
};

export type Schema<T> = {
  validate: (value: T, options?: ValidationOptions) => ValidationResult<T>;
  required: (message?: string) => Schema<T>;
  nullable: (message?: string) => Schema<T | null>;
  custom?: (validator: (value: T) => boolean | Promise<boolean>) => Schema<T>;
};

export type ObjectSchema<T> = Schema<T> & {
  shape: Record<string, Schema<T>>;
};

export type DateRange = {
  start: Date;
  end: Date;
};

export type Nested<T> = {
  value: T;
};

// Primitive types validation
export type StringSchema = Schema<string>;
export type NumberSchema = Schema<number>;
export type BooleanSchema = Schema<boolean>;
export type DateSchema = Schema<Date>;
export type EmailSchema = Schema<string>;
export type UrlSchema = Schema<string>;

// Utility types
export type MinLengthSchema<T> = Schema<T> & {
  minLength: (length: number, message?: string) => Schema<T>;
};

export type MaxLengthSchema<T> = Schema<T> & {
  maxLength: (length: number, message?: string) => Schema<T>;
};

export type PatternSchema<T> = Schema<T> & {
  pattern: (regex: RegExp, message?: string) => Schema<T>;
};
