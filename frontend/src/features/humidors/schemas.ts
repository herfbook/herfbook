import { z } from "zod";

function coerceOptionalNumber(schema: z.ZodNumber): z.ZodType<number | null | undefined> {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }, schema.nullable().optional()) as z.ZodType<number | null | undefined>;
}

export const humidorFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  capacity: coerceOptionalNumber(
    z.number().int().positive("Must be a positive number").max(10000)
  ),
  target_humidity: coerceOptionalNumber(
    z.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less")
  ),
  target_temp_f: coerceOptionalNumber(
    z.number().min(40, "Must be 40°F or more").max(100, "Must be 100°F or less")
  ),
});

export type HumidorFormValues = z.infer<typeof humidorFormSchema>;

export const readingFormSchema = z
  .object({
    humidity: coerceOptionalNumber(
      z.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less")
    ),
    temperature_f: coerceOptionalNumber(
      z
        .number()
        .min(40, "Must be 40°F or more")
        .max(100, "Must be 100°F or less")
    ),
    recorded_at: z.string().optional(),
  })
  .refine((data) => data.humidity != null || data.temperature_f != null, {
    message: "At least one of humidity or temperature is required",
    path: ["_form"],
  });

export type ReadingFormValues = z.infer<typeof readingFormSchema>;
