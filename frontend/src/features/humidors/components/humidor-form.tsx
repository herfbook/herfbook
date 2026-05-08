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
import type { HumidorFormValues } from "../schemas";

export function HumidorFormFields() {
  const form = useFormContext<HumidorFormValues>();

  return (
    <div className="space-y-4">
      {/* Row 1: Name + Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="My humidor" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="Office shelf"
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
      </div>

      {/* Row 2: Capacity + Target humidity + Target temp */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  step="1"
                  min="1"
                  max="10000"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_humidity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target RH (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="70"
                  step="0.5"
                  min="0"
                  max="100"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_temp_f"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Temp (°F)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="68"
                  step="0.5"
                  min="40"
                  max="100"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Description (full width) */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Optional notes about this humidor"
                className="resize-none"
                rows={3}
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
    </div>
  );
}
