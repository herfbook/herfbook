import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  useCreateLookup,
  type VitolaEntry,
} from "@/lib/api/lookups";
import { getErrorMessage } from "@/lib/api/errors";

const optionalNumber: z.ZodType<number | null | undefined> = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  },
  z.number().nullable().optional()
) as z.ZodType<number | null | undefined>;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  length_inches: optionalNumber,
  ring_gauge: optionalNumber,
  category: z
    .enum(["parejo", "figurado"])
    .nullable()
    .optional() as z.ZodType<"parejo" | "figurado" | null | undefined>,
});

type Values = z.infer<typeof schema>;

interface Props {
  initialName: string;
  onCreated: (entry: VitolaEntry) => void;
  onDuplicate: (existingId: string) => void;
  onCancel: () => void;
}

export function VitolaCreateForm({
  initialName,
  onCreated,
  onDuplicate,
  onCancel,
}: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName,
      length_inches: null,
      ring_gauge: null,
      category: null,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialName,
      length_inches: null,
      ring_gauge: null,
      category: null,
    });
  }, [initialName]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCreateLookup<VitolaEntry>("vitolas");

  function onSubmit(values: Values) {
    create.mutate(
      {
        name: values.name,
        length_inches: values.length_inches ?? null,
        ring_gauge: values.ring_gauge ?? null,
        category: values.category ?? null,
      },
      {
        onSuccess: (data) => {
          if ("duplicate" in data) {
            toast.success("Selected existing vitola");
            onDuplicate(data.existing_id);
          } else {
            toast.success("Vitola created");
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
                <Input placeholder="Robusto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="length_inches"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (in)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="5"
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
            name="ring_gauge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ring gauge</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="50"
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
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) =>
                  field.onChange(v === "" ? null : (v as Values["category"]))
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="parejo">Parejo</SelectItem>
                  <SelectItem value="figurado">Figurado</SelectItem>
                </SelectContent>
              </Select>
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
            Create vitola
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
