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
  };
};

export type Schema<T> = {
  validate: (value: unknown, options?: ValidationOptions) => ValidationResult<T>;
  required: (message?: string) => Schema<T>;
  nullable: (message?: string) => Schema<T | null>;
};

export type ObjectSchema<T> = Schema<T> & {
  shape: Record<string, Schema<any>>;
};

export type DateRange = {
  start: Date;
  end: Date;
};