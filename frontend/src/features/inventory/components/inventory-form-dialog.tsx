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
import {
  inventoryFormSchema,
  type InventoryFormValues,
} from "../schemas";
import { useCreateInventory, useUpdateInventory } from "../queries";
import type { InventoryDetail } from "../types";
import { InventoryFormFields } from "./inventory-form";

interface CommonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<InventoryFormValues>;
  onCreated?: (item: InventoryDetail) => void;
}

interface CreateProps extends CommonProps {
  inventory?: undefined;
}

interface EditProps extends CommonProps {
  inventory: InventoryDetail;
}

type Props = CreateProps | EditProps;

const emptyDefaults: InventoryFormValues = {
  cigar_id: "",
  humidor_id: null,
  quantity: 1 as unknown as InventoryFormValues["quantity"],
  purchase_date: null,
  purchase_price: null,
  price_per_stick: null,
  vendor: null,
  vendor_url: null,
  purchase_type_id: null,
  box_code: null,
  date_added_humidor: null,
  is_gift: false,
  gift_from: null,
  gift_occasion: null,
  gift_to: null,
  notes: null,
};

function detailToFormValues(d: InventoryDetail): InventoryFormValues {
  return {
    cigar_id: d.cigar_id,
    humidor_id: d.humidor_id,
    quantity: d.quantity,
    purchase_date: d.purchase_date,
    purchase_price: d.purchase_price,
    price_per_stick: d.price_per_stick,
    vendor: d.vendor,
    vendor_url: d.vendor_url,
    purchase_type_id: d.purchase_type_id,
    box_code: d.box_code,
    date_added_humidor: d.date_added_humidor,
    is_gift: d.is_gift,
    gift_from: d.gift_from,
    gift_occasion: d.gift_occasion,
    gift_to: d.gift_to,
    notes: d.notes,
  };
}

export function InventoryFormDialog(props: Props) {
  const { open, onOpenChange, inventory, initialValues, onCreated } = props;
  const isEdit = inventory != null;
  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();

  const defaults: InventoryFormValues = isEdit
    ? detailToFormValues(inventory)
    : { ...emptyDefaults, ...initialValues };

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? detailToFormValues(inventory)
          : { ...emptyDefaults, ...initialValues }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inventory?.id]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: InventoryFormValues) {
    if (isEdit) {
      updateMutation.mutate(
        {
          id: inventory.id,
          payload: {
            humidor_id: values.humidor_id,
            quantity: values.quantity,
            purchase_date: values.purchase_date,
            purchase_price: values.purchase_price,
            price_per_stick: values.price_per_stick,
            vendor: values.vendor,
            vendor_url: values.vendor_url,
            purchase_type_id: values.purchase_type_id,
            box_code: values.box_code,
            date_added_humidor: values.date_added_humidor,
            is_gift: values.is_gift,
            gift_from: values.gift_from,
            gift_occasion: values.gift_occasion,
            gift_to: values.gift_to,
            notes: values.notes,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: (data) => {
          onCreated?.(data);
          onOpenChange(false);
          form.reset(emptyDefaults);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit inventory" : "Add to inventory"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update purchase, humidor, and gift details."
              : "Add cigars to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <InventoryFormFields lockCigar={isEdit} />
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
                {isEdit ? "Save changes" : "Add to inventory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
