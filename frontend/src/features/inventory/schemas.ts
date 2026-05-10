import { z } from "zod";

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

const optionalDate: z.ZodType<string | null | undefined> = z.preprocess(
  (val) => (val === "" || val == null ? null : val),
  z.string().nullable().optional()
) as z.ZodType<string | null | undefined>;

// Required positive integer. The form sends strings via input; we coerce
// before validation, but cast back to ZodType<number> for resolver compat.
const requiredPositiveInt: z.ZodType<number> = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return NaN;
    const n = Number(val);
    return isNaN(n) ? NaN : Math.trunc(n);
  },
  z.number().int().positive("Quantity must be > 0")
) as z.ZodType<number>;

export const inventoryFormSchema = z.object({
  cigar_id: z.string().uuid("Cigar is required").min(1, "Cigar is required"),
  humidor_id: optionalUuid,
  quantity: requiredPositiveInt,
  purchase_date: optionalDate,
  purchase_price: optionalNumber,
  price_per_stick: optionalNumber,
  vendor: optionalText,
  vendor_url: optionalText,
  purchase_type_id: optionalUuid,
  box_code: optionalText,
  date_added_humidor: optionalDate,
  is_gift: z.boolean(),
  gift_from: optionalText,
  gift_occasion: optionalText,
  gift_to: optionalText,
  notes: optionalText,
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export const transferFormSchema = z.object({
  to_humidor_id: optionalUuid,
  quantity: requiredPositiveInt,
  notes: optionalText,
});

export type TransferFormValues = z.infer<typeof transferFormSchema>;
