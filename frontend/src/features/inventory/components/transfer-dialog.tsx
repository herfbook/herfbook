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
import { Textarea } from "@/components/ui/textarea";
import { transferFormSchema, type TransferFormValues } from "../schemas";
import { useTransferInventory } from "../queries";
import { HumidorPicker } from "./humidor-picker";

interface Props {
  inventoryId: string;
  currentHumidorId: string | null;
  currentQuantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferDialog({
  inventoryId,
  currentHumidorId,
  currentQuantity,
  open,
  onOpenChange,
}: Props) {
  const transfer = useTransferInventory(inventoryId);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      to_humidor_id: null,
      quantity: currentQuantity as unknown as TransferFormValues["quantity"],
      notes: null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        to_humidor_id: null,
        quantity: currentQuantity as unknown as TransferFormValues["quantity"],
        notes: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentQuantity]);

  function onSubmit(values: TransferFormValues) {
    if (values.quantity > currentQuantity) {
      form.setError("quantity", {
        message: `Max ${currentQuantity} available`,
      });
      return;
    }
    transfer.mutate(
      {
        to_humidor_id: values.to_humidor_id ?? null,
        quantity: values.quantity,
        notes: values.notes ?? null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Transfer cigars</DialogTitle>
          <DialogDescription>
            Move some or all of these cigars to another humidor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to_humidor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To humidor</FormLabel>
                  <HumidorPicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    excludeId={currentHumidorId ?? undefined}
                    allowUnassigned
                    unassignedLabel="(Unassign)"
                    placeholder="Select destination…"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max={currentQuantity}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {currentQuantity} available
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      className="resize-none"
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
                onClick={() => onOpenChange(false)}
                disabled={transfer.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transfer.isPending}>
                {transfer.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Transfer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
