import { useFormContext } from "react-hook-form";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { LookupCombobox } from "@/components/lookup/lookup-combobox";
import { CigarPickerCombobox } from "./cigar-picker-combobox";
import { HumidorPicker } from "./humidor-picker";
import type { InventoryFormValues } from "../schemas";

interface Props {
  /** When true, lock the cigar picker (e.g. on edit). */
  lockCigar?: boolean;
}

export function InventoryFormFields({ lockCigar }: Props) {
  const form = useFormContext<InventoryFormValues>();
  const isGift = form.watch("is_gift");

  return (
    <div className="space-y-6">
      {/* Cigar */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cigar
        </h3>
        <FormField
          control={form.control}
          name="cigar_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cigar *</FormLabel>
              <CigarPickerCombobox
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                disabled={lockCigar}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <Separator />

      {/* Quantity & humidor */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Quantity &amp; humidor
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="5"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : e.target.value
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
            name="humidor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Humidor</FormLabel>
                <HumidorPicker
                  value={field.value ?? null}
                  onChange={field.onChange}
                  allowUnassigned
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      {/* Purchase details */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Purchase details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="purchase_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase type</FormLabel>
                <LookupCombobox
                  table="purchase-types"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Select type…"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase price (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
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
            name="price_per_stick"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price / stick (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="auto"
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cigar Aficionado"
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
            name="vendor_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      {/* Aging & box */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Aging &amp; box
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_added_humidor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date added to humidor</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
            name="box_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Box code</FormLabel>
                <FormControl>
                  <Input
                    className="font-mono"
                    placeholder="ABC123"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <Separator />

      {/* Gift details */}
      <Collapsible defaultOpen={isGift}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Gift details
            </h3>
            <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <FormField
            control={form.control}
            name="is_gift"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <FormLabel className="text-sm font-medium">
                  This is a gift
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gift_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Received from</FormLabel>
                <FormControl>
                  <Input
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
            name="gift_occasion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occasion</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Birthday"
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
            name="gift_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Given to</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Notes */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Notes
        </h3>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  className="resize-none"
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
