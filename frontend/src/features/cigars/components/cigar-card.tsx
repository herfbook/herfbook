import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cigarette, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CigarListItem } from "../types";
import { useCigar } from "../queries";
import { CigarFormDialog } from "./cigar-form-dialog";
import { DeleteCigarDialog } from "./delete-cigar-dialog";

interface CigarCardProps {
  cigar: CigarListItem;
  /** Per-cigar inventory counts (sum across humidors). Optional. */
  inStock?: number;
}

export function CigarCard({ cigar, inStock }: CigarCardProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Lazy-load detail only when the edit dialog opens.
  const detail = useCigar(editOpen ? cigar.id : "");

  const subtitleParts = [cigar.line, cigar.vitola_name].filter(Boolean);
  const subtitle = subtitleParts.join(" · ");
  const sizeText = cigar.vitola_size;

  return (
    <>
      <Card
        onClick={() => navigate(`/cigars/${cigar.id}`)}
        className={cn(
          "cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
        )}
      >
        <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
          {cigar.primary_image_url ? (
            <img
              src={cigar.primary_image_url}
              alt={`${cigar.brand_name}${cigar.line ? " " + cigar.line : ""}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Cigarette className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-base font-semibold leading-tight truncate">
                {cigar.brand_name}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                  {sizeText && ` (${sizeText})`}
                </p>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    Edit
                  </DropdownMenuItem>
                  {(inStock ?? 0) === 0 && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleteOpen(true)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {cigar.wrapper_name && (
              <Badge variant="secondary" className="font-normal">
                {cigar.wrapper_name}
              </Badge>
            )}
            {cigar.country_name && (
              <Badge variant="outline" className="font-normal">
                {cigar.country_name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            {inStock != null && inStock > 0 ? (
              <span className="text-foreground font-medium">
                {inStock} in stock
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
            {cigar.strength_name && (
              <span className="text-muted-foreground">
                {cigar.strength_name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {detail.data && (
        <CigarFormDialog
          cigar={detail.data}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <DeleteCigarDialog
        cigarId={cigar.id}
        cigarLabel={`${cigar.brand_name}${cigar.line ? " " + cigar.line : ""}`}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
