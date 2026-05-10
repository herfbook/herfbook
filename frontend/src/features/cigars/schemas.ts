import { z } from "zod";

// Cast preprocess results back to ZodType<Output> so input and output
// types line up. Without this, useForm sees drift between TFieldValues
// (input) and the resolver's output type.
const optionalUuid: z.ZodType<string | null | undefined> = z
  .string()
  .nullable()
  .optional() as z.ZodType<string | null | undefined>;

const optionalText: z.ZodType<string | null | undefined> = z.preprocess(
  (val) => (val === "" || val == null ? null : val),
  z.string().nullable().optional()
) as z.ZodType<string | null | undefined>;

const optionalNumber: z.ZodType<number | null | undefined> = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  },
  z.number().nullable().optional()
) as z.ZodType<number | null | undefined>;

export const cigarFormSchema = z
  .object({
    brand_id: z
      .string()
      .uuid("Brand is required")
      .min(1, "Brand is required"),
    line: optionalText,
    use_custom_vitola: z.boolean(),
    vitola_id: optionalUuid,
    custom_vitola_name: optionalText,
    custom_length: optionalNumber,
    custom_ring_gauge: optionalNumber,
    wrapper_id: optionalUuid,
    binder_id: optionalUuid,
    filler_ids: z.array(z.string().uuid()),
    country_id: optionalUuid,
    manufacturer_id: optionalUuid,
    strength_id: optionalUuid,
    upc: optionalText,
    description: optionalText,
  })
  .superRefine((val, ctx) => {
    if (val.use_custom_vitola) {
      if (!val.custom_vitola_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["custom_vitola_name"],
          message: "Required when using custom dimensions",
        });
      }
    }
  });

export type CigarFormValues = z.infer<typeof cigarFormSchema>;
