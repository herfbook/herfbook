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
import { Form } from "@/components/ui/form";
import { humidorFormSchema, type HumidorFormValues } from "../schemas";
import { useCreateHumidor, useUpdateHumidor } from "../queries";
import { HumidorFormFields } from "./humidor-form";

interface CreateDialogProps {
  humidorId?: undefined;
  defaultValues?: undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditDialogProps {
  humidorId: string;
  defaultValues: HumidorFormValues;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HumidorFormDialogProps = CreateDialogProps | EditDialogProps;

const emptyDefaults: HumidorFormValues = {
  name: "",
  description: null,
  location: null,
  capacity: null,
  target_humidity: null,
  target_temp_f: null,
};

export function HumidorFormDialog({
  humidorId,
  defaultValues,
  open,
  onOpenChange,
}: HumidorFormDialogProps) {
  const isEdit = humidorId != null;
  const createMutation = useCreateHumidor();
  const updateMutation = useUpdateHumidor();

  const form = useForm<HumidorFormValues>({
    resolver: zodResolver(humidorFormSchema),
    defaultValues: defaultValues ?? emptyDefaults,
  });

  // Reset form when dialog opens (picks up latest defaultValues for edit)
  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? emptyDefaults);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: HumidorFormValues) {
    if (isEdit) {
      // Send only dirty fields to avoid clobbering unchanged data
      const dirty = form.formState.dirtyFields;
      const payload = Object.fromEntries(
        Object.keys(dirty).map((k) => [k, values[k as keyof HumidorFormValues]])
      );
      updateMutation.mutate(
        { id: humidorId, payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(emptyDefaults);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit humidor" : "New humidor"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your humidor's settings."
              : "Add a new humidor to your collection."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <HumidorFormFields />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Save changes" : "Create humidor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
