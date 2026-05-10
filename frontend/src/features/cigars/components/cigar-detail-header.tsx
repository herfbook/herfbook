import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { CigarDetail } from "../types";
import { CigarFormDialog } from "./cigar-form-dialog";
import { DeleteCigarDialog } from "./delete-cigar-dialog";

interface Props {
  cigar: CigarDetail;
  inventoryTotal: number;
}

export function CigarDetailHeader({ cigar, inventoryTotal }: Props) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const subtitleParts = [cigar.vitola_name ?? cigar.custom_vitola_name, cigar.wrapper_name].filter(
    Boolean
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="font-serif text-2xl font-semibold leading-tight md:text-3xl">
              {cigar.brand_name}
              {cigar.line && (
                <span className="text-muted-foreground"> — {cigar.line}</span>
              )}
            </h1>
            {cigar.is_user_created && (
              <Badge variant="outline" className="font-normal">
                User
              </Badge>
            )}
          </div>
          {subtitleParts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {subtitleParts.join(" · ")}
              {cigar.vitola_size && ` · ${cigar.vitola_size}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
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
                disabled={inventoryTotal > 0}
                onSelect={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CigarFormDialog
        cigar={cigar}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCigarDialog
        cigarId={cigar.id}
        cigarLabel={`${cigar.brand_name}${cigar.line ? " " + cigar.line : ""}`}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/cigars")}
      />
    </>
  );
}
