import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSmokeInventory } from "../queries";

interface Props {
  inventoryId: string;
  cigarLabel: string;
  currentQuantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmokeConfirmDialog({
  inventoryId,
  cigarLabel,
  currentQuantity,
  open,
  onOpenChange,
}: Props) {
  const smoke = useSmokeInventory(inventoryId);

  function handleConfirm() {
    smoke.mutate(
      { quantity: 1 },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Smoke 1 of this cigar?</AlertDialogTitle>
          <AlertDialogDescription>
            {cigarLabel}. Quantity will decrease to{" "}
            {Math.max(0, currentQuantity - 1)}. You can log a full tasting
            session in the Journal afterward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={smoke.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={smoke.isPending}
          >
            Smoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
