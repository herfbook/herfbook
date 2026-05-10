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
import { cigarFormSchema, type CigarFormValues } from "../schemas";
import { useCreateCigar, useUpdateCigar } from "../queries";
import type { CigarDetail } from "../types";
import { CigarFormFields } from "./cigar-form";

interface CommonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Defaults applied when no `cigar` is provided (create mode). */
  initialValues?: Partial<CigarFormValues>;
  /** Called after a successful create with the new cigar. */
  onCreated?: (cigar: CigarDetail) => void;
}

interface CreateProps extends CommonProps {
  cigar?: undefined;
}

interface EditProps extends CommonProps {
  cigar: CigarDetail;
}

type Props = CreateProps | EditProps;

const emptyDefaults: CigarFormValues = {
  brand_id: "",
  line: null,
  use_custom_vitola: false,
  vitola_id: null,
  custom_vitola_name: null,
  custom_length: null,
  custom_ring_gauge: null,
  wrapper_id: null,
  binder_id: null,
  filler_ids: [],
  country_id: null,
  manufacturer_id: null,
  strength_id: null,
  upc: null,
  description: null,
};

function detailToFormValues(c: CigarDetail): CigarFormValues {
  const useCustom =
    c.custom_vitola_name != null ||
    c.custom_length != null ||
    c.custom_ring_gauge != null;
  return {
    brand_id: c.brand_id,
    line: c.line,
    use_custom_vitola: useCustom,
    vitola_id: useCustom ? null : c.vitola_id,
    custom_vitola_name: c.custom_vitola_name,
    custom_length: c.custom_length,
    custom_ring_gauge: c.custom_ring_gauge,
    wrapper_id: c.wrapper_id,
    binder_id: c.binder_id,
    filler_ids: c.fillers.map((f) => f.id),
    country_id: c.country_id,
    manufacturer_id: c.manufacturer_id,
    strength_id: c.strength_id,
    upc: c.upc,
    description: c.description,
  };
}

export function CigarFormDialog(props: Props) {
  const { open, onOpenChange, cigar, initialValues, onCreated } = props;
  const isEdit = cigar != null;
  const createMutation = useCreateCigar();
  const updateMutation = useUpdateCigar();

  const defaults: CigarFormValues = isEdit
    ? detailToFormValues(cigar)
    : { ...emptyDefaults, ...initialValues };

  const form = useForm<CigarFormValues>({
    resolver: zodResolver(cigarFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit ? detailToFormValues(cigar) : { ...emptyDefaults, ...initialValues }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cigar?.id]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function valuesToPayload(values: CigarFormValues) {
    return {
      brand_id: values.brand_id,
      line: values.line ?? null,
      vitola_id: values.use_custom_vitola ? null : values.vitola_id ?? null,
      custom_vitola_name: values.use_custom_vitola
        ? values.custom_vitola_name ?? null
        : null,
      custom_length: values.use_custom_vitola
        ? values.custom_length ?? null
        : null,
      custom_ring_gauge: values.use_custom_vitola
        ? values.custom_ring_gauge ?? null
        : null,
      wrapper_id: values.wrapper_id ?? null,
      binder_id: values.binder_id ?? null,
      filler_ids: values.filler_ids ?? [],
      country_id: values.country_id ?? null,
      manufacturer_id: values.manufacturer_id ?? null,
      strength_id: values.strength_id ?? null,
      upc: values.upc ?? null,
      description: values.description ?? null,
    };
  }

  function onSubmit(values: CigarFormValues) {
    if (isEdit) {
      updateMutation.mutate(
        { id: cigar.id, payload: valuesToPayload(values) },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(valuesToPayload(values), {
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
          <DialogTitle>{isEdit ? "Edit cigar" : "New cigar"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this cigar's metadata."
              : "Add a cigar to your catalog."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <CigarFormFields />
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
                {isEdit ? "Save changes" : "Create cigar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
