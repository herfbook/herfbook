import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  LookupEntry,
  UserCreatableLookupTable,
} from "@/lib/api/lookups";
import { ManufacturerCreateForm } from "./lookup-form-fields/manufacturer-fields";
import { BrandCreateForm } from "./lookup-form-fields/brand-fields";
import { VitolaCreateForm } from "./lookup-form-fields/vitola-fields";
import { WrapperCreateForm } from "./lookup-form-fields/wrapper-fields";
import { BinderCreateForm } from "./lookup-form-fields/binder-fields";
import { FillerCreateForm } from "./lookup-form-fields/filler-fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: UserCreatableLookupTable;
  initialName?: string;
  /** Called with the newly created entry, or with a synthetic
   * `{ id }` object when the backend dedup'd to an existing entry. */
  onCreated: (entry: LookupEntry | { id: string }) => void;
}

const TITLES: Record<UserCreatableLookupTable, string> = {
  manufacturers: "New manufacturer",
  brands: "New brand",
  vitolas: "New vitola",
  wrappers: "New wrapper",
  binders: "New binder",
  fillers: "New filler",
};

const DESCRIPTIONS: Record<UserCreatableLookupTable, string> = {
  manufacturers: "Add a manufacturer not already in the catalog.",
  brands: "Add a brand not already in the catalog.",
  vitolas: "Add a vitola size not already in the catalog.",
  wrappers: "Add a wrapper leaf not already in the catalog.",
  binders: "Add a binder leaf not already in the catalog.",
  fillers: "Add a filler leaf not already in the catalog.",
};

export function LookupCreateDialog({
  open,
  onOpenChange,
  table,
  initialName = "",
  onCreated,
}: Props) {
  function handleCreated(entry: LookupEntry) {
    onCreated(entry);
  }

  function handleDuplicate(existingId: string) {
    onCreated({ id: existingId });
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{TITLES[table]}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[table]}</DialogDescription>
        </DialogHeader>

        {table === "manufacturers" && (
          <ManufacturerCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        {table === "brands" && (
          <BrandCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        {table === "vitolas" && (
          <VitolaCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        {table === "wrappers" && (
          <WrapperCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        {table === "binders" && (
          <BinderCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
        {table === "fillers" && (
          <FillerCreateForm
            key={`${open}-${initialName}`}
            initialName={initialName}
            onCreated={handleCreated}
            onDuplicate={handleDuplicate}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
