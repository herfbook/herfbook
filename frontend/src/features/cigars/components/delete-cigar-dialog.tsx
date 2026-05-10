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
import { useDeleteCigar } from "../queries";

interface Props {
  cigarId: string;
  cigarLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteCigarDialog({
  cigarId,
  cigarLabel,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const del = useDeleteCigar();

  function handleConfirm() {
    del.mutate(cigarId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
      // The hook already toasts errors. Keep the dialog open so the user
      // sees the error message via the toast and can dismiss/cancel.
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete cigar?</AlertDialogTitle>
          <AlertDialogDescription>
            {cigarLabel} will be permanently removed from your catalog. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
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
