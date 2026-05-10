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
import { useDeleteInventory } from "../queries";

interface Props {
  inventoryId: string;
  cigarLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteInventoryDialog({
  inventoryId,
  cigarLabel,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const del = useDeleteInventory();

  function handleConfirm() {
    del.mutate(inventoryId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete inventory entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {cigarLabel} will be removed from your inventory. Logged sessions
            for this entry are preserved but will lose their inventory link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={del.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
