import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { readingFormSchema, type ReadingFormValues } from "../schemas";
import { useCreateReading } from "../queries";

interface ReadingFormDialogProps {
  humidorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function nowLocalString(): string {
  const now = new Date();
  // datetime-local format: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function ReadingFormDialog({
  humidorId,
  open,
  onOpenChange,
}: ReadingFormDialogProps) {
  const mutation = useCreateReading(humidorId);

  const form = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      humidity: null,
      temperature_f: null,
      recorded_at: nowLocalString(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        humidity: null,
        temperature_f: null,
        recorded_at: nowLocalString(),
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: ReadingFormValues) {
    const recorded_at = values.recorded_at
      ? new Date(values.recorded_at).toISOString()
      : null;

    mutation.mutate(
      {
        humidity: values.humidity ?? null,
        temperature_f: values.temperature_f ?? null,
        source: "manual",
        recorded_at,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  // Root-level form error from the Zod refine on _form path
  const formError = (form.formState.errors as Record<string, { message?: string }>)["_form"]?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Log reading</DialogTitle>
          <DialogDescription>
            Record humidity and/or temperature for this humidor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="humidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Humidity (%)</FormLabel>
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
                name="temperature_f"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temp (°F)</FormLabel>
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

            <FormField
              control={form.control}
              name="recorded_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recorded at</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && (
              <p className="text-sm font-medium text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log reading
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
