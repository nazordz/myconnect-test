import { z } from 'zod';

type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaValue[]
  | { [key: string]: JsonSchemaValue };

export type JsonSchemaObject = { [key: string]: JsonSchemaValue };

export function zodToJsonSchema(schema: z.ZodType): JsonSchemaObject {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'output',
    reused: 'inline',
  });

  return stripJsonSchemaMetadata(jsonSchema as JsonSchemaObject);
}

function stripJsonSchemaMetadata(schema: JsonSchemaObject): JsonSchemaObject {
  return stripValue(schema) as JsonSchemaObject;
}

function stripValue(value: JsonSchemaValue): JsonSchemaValue {
  if (Array.isArray(value)) {
    return value.map(stripValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== '$schema' && key !== '~standard')
      .map(([key, nestedValue]) => [key, stripValue(nestedValue)]),
  );
}
