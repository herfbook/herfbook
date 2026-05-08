import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useArchiveHumidor } from "../queries";

interface ArchiveConfirmDialogProps {
  humidorId: string;
  humidorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived: () => void;
}

export function ArchiveConfirmDialog({
  humidorId,
  humidorName,
  open,
  onOpenChange,
  onArchived,
}: ArchiveConfirmDialogProps) {
  const mutation = useArchiveHumidor();

  function handleConfirm() {
    mutation.mutate(humidorId, {
      onSuccess: () => {
        onOpenChange(false);
        onArchived();
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {humidorName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will hide the humidor from your active list. Its contents and
            history are preserved. You can show archived humidors again from the
            list page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Archive
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
