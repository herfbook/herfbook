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
import { useCreateLookup, type FillerEntry } from "@/lib/api/lookups";
import { getErrorMessage } from "@/lib/api/errors";

const PRIMINGS = ["ligero", "seco", "viso", "volado"] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  country: z.string().nullable().optional(),
  priming: z.string().nullable().optional(),
});

type Values = z.infer<typeof schema>;

interface Props {
  initialName: string;
  onCreated: (entry: FillerEntry) => void;
  onDuplicate: (existingId: string) => void;
  onCancel: () => void;
}

export function FillerCreateForm({
  initialName,
  onCreated,
  onDuplicate,
  onCancel,
}: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, country: null, priming: null },
  });

  useEffect(() => {
    form.reset({ name: initialName, country: null, priming: null });
  }, [initialName]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCreateLookup<FillerEntry>("fillers");

  function onSubmit(values: Values) {
    create.mutate(
      {
        name: values.name,
        country: values.country || null,
        priming: values.priming || null,
      },
      {
        onSuccess: (data) => {
          if ("duplicate" in data) {
            toast.success("Selected existing filler");
            onDuplicate(data.existing_id);
          } else {
            toast.success("Filler created");
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
          name="priming"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priming</FormLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v === "" ? null : v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIMINGS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
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
            Create filler
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
