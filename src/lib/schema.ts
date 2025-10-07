import type { z, ZodObject, ZodOptional, ZodRawShape } from "zod";

type OptionalKeys<T extends ZodRawShape> = {
  [K in keyof T]: T[K] extends ZodOptional<any> ? K : never;
}[keyof T];

export function omitOptional<T extends ZodObject<any>>(
  schema: T,
): ZodObject<Omit<T["shape"], OptionalKeys<T["shape"]>>> {
  const optionalKeys = Object.keys(schema.shape).filter(key =>
    schema.shape[key].isOptional(),
  );

  const omitObject = optionalKeys.reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, true>,
  );

  return schema.omit(omitObject) as z.ZodObject<
    Omit<T["shape"], OptionalKeys<T["shape"]>>
  >;
}
