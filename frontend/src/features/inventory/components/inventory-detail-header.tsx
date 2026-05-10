import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, MoreHorizontal, Pencil, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { InventoryDetail } from "../types";
import { InventoryFormDialog } from "./inventory-form-dialog";
import { TransferDialog } from "./transfer-dialog";
import { SmokeConfirmDialog } from "./smoke-confirm-dialog";
import { DeleteInventoryDialog } from "./delete-inventory-dialog";

interface Props {
  inventory: InventoryDetail;
}

export function InventoryDetailHeader({ inventory }: Props) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [smokeOpen, setSmokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const subtitleParts = [inventory.humidor_name].filter(Boolean);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-serif text-2xl font-semibold leading-tight md:text-3xl">
              {inventory.cigar_display_name}
            </h1>
            {inventory.is_gift && (
              <Badge variant="secondary" className="font-normal">
                Gift
              </Badge>
            )}
          </div>
          {subtitleParts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              In {subtitleParts.join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {inventory.quantity > 0 && (
            <Button variant="outline" onClick={() => setSmokeOpen(true)}>
              <Flame className="mr-2 h-4 w-4" />
              Smoke 1
            </Button>
          )}
          {inventory.quantity > 0 && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          )}
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <InventoryFormDialog
        inventory={inventory}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <TransferDialog
        inventoryId={inventory.id}
        currentHumidorId={inventory.humidor_id}
        currentQuantity={inventory.quantity}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <SmokeConfirmDialog
        inventoryId={inventory.id}
        cigarLabel={inventory.cigar_display_name}
        currentQuantity={inventory.quantity}
        open={smokeOpen}
        onOpenChange={setSmokeOpen}
      />
      <DeleteInventoryDialog
        inventoryId={inventory.id}
        cigarLabel={inventory.cigar_display_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/inventory")}
      />
    </>
  );
}
