import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  useCreateLookup,
  type BrandEntry,
} from "@/lib/api/lookups";
import { getErrorMessage } from "@/lib/api/errors";
import { LookupCombobox } from "../lookup-combobox";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  manufacturer_id: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  initialName: string;
  onCreated: (entry: BrandEntry) => void;
  onDuplicate: (existingId: string) => void;
  onCancel: () => void;
}

export function BrandCreateForm({
  initialName,
  onCreated,
  onDuplicate,
  onCancel,
}: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName,
      manufacturer_id: null,
      country: null,
      website: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialName,
      manufacturer_id: null,
      country: null,
      website: null,
    });
  }, [initialName]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCreateLookup<BrandEntry>("brands");

  function onSubmit(values: Values) {
    create.mutate(
      {
        name: values.name,
        manufacturer_id: values.manufacturer_id || null,
        country: values.country || null,
        website: values.website || null,
      },
      {
        onSuccess: (data) => {
          if ("duplicate" in data) {
            toast.success("Selected existing brand");
            onDuplicate(data.existing_id);
          } else {
            toast.success("Brand created");
            onCreated(data);
          }
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Controller
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
                nested
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input
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
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create brand
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
