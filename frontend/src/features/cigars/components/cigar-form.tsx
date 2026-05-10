import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LookupCombobox } from "@/components/lookup/lookup-combobox";
import { LookupMultiCombobox } from "@/components/lookup/lookup-multi-combobox";
import {
  lookupKeys,
  type BrandEntry,
} from "@/lib/api/lookups";
import type { CigarFormValues } from "../schemas";

export function CigarFormFields() {
  const form = useFormContext<CigarFormValues>();
  const queryClient = useQueryClient();
  const useCustomVitola = useWatch({
    control: form.control,
    name: "use_custom_vitola",
  });
  const brandId = useWatch({ control: form.control, name: "brand_id" });
  const manufacturerId = useWatch({
    control: form.control,
    name: "manufacturer_id",
  });

  // When the user picks a brand, auto-fill the manufacturer if blank.
  useEffect(() => {
    if (!brandId) return;
    if (manufacturerId) return;
    const cached = queryClient.getQueryData<BrandEntry>(
      lookupKeys.detail("brands", brandId)
    );
    if (cached?.manufacturer_id) {
      form.setValue("manufacturer_id", cached.manufacturer_id, {
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  // When the custom-vitola toggle is turned off, clear those fields.
  useEffect(() => {
    if (!useCustomVitola) {
      form.setValue("custom_vitola_name", null);
      form.setValue("custom_length", null);
      form.setValue("custom_ring_gauge", null);
    } else {
      // Mutually exclusive with vitola_id picker
      form.setValue("vitola_id", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCustomVitola]);

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Identity
        </h3>
        <FormField
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand *</FormLabel>
              <LookupCombobox
                table="brands"
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Select brand…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 1964 Anniversary"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="use_custom_vitola"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <FormLabel className="text-sm font-medium">
                  Use custom dimensions
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Enter a one-off vitola size that isn't in the catalog.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {!useCustomVitola ? (
          <FormField
            control={form.control}
            name="vitola_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vitola</FormLabel>
                <LookupCombobox
                  table="vitolas"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Select vitola…"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <FormField
              control={form.control}
              name="custom_vitola_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom vitola name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Toro Especial"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="custom_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (in)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="6"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custom_ring_gauge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ring gauge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="52"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Composition */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Composition
        </h3>
        <FormField
          control={form.control}
          name="wrapper_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wrapper</FormLabel>
              <LookupCombobox
                table="wrappers"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select wrapper…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="binder_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Binder</FormLabel>
              <LookupCombobox
                table="binders"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select binder…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="filler_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fillers</FormLabel>
              <LookupMultiCombobox
                table="fillers"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Add filler…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* Origin & strength */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Origin &amp; strength
        </h3>
        <FormField
          control={form.control}
          name="country_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <LookupCombobox
                table="countries"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select country…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manufacturer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacturer</FormLabel>
              <LookupCombobox
                table="manufacturers"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select manufacturer…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="strength_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strength</FormLabel>
              <LookupCombobox
                table="strength-levels"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select strength…"
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* Identification */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Identification
        </h3>
        <FormField
          control={form.control}
          name="upc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UPC</FormLabel>
              <FormControl>
                <Input
                  placeholder="0123456789012"
                  className="font-mono"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* Notes */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Notes
        </h3>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  className="resize-none"
                  placeholder="Optional notes about this cigar"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>
    </div>
  );
}
