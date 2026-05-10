import { useState } from "react";
import { MoreVertical, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CigarImage } from "../types";
import {
  useDeleteCigarImage,
  useSetPrimaryCigarImage,
} from "../queries";
import { CigarImageUploader } from "./cigar-image-uploader";

interface Props {
  cigarId: string;
  images: CigarImage[];
}

export function CigarImageGallery({ cigarId, images }: Props) {
  const [lightbox, setLightbox] = useState<CigarImage | null>(null);
  const setPrimary = useSetPrimaryCigarImage(cigarId);
  const del = useDeleteCigarImage(cigarId);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const remaining = Math.max(0, 3 - sorted.length);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {sorted.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-md border bg-muted/50"
          >
            <button
              type="button"
              onClick={() => setLightbox(img)}
              className="absolute inset-0"
            >
              <img
                src={img.image_url}
                alt={img.image_type}
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            </button>
            {img.is_primary && (
              <Badge className="absolute left-2 top-2 gap-1 px-1.5 py-0">
                <Star className="h-3 w-3" />
                Primary
              </Badge>
            )}
            <Badge
              variant="outline"
              className="absolute right-2 top-2 bg-background/80 capitalize"
            >
              {img.image_type}
            </Badge>
            <div className="absolute right-1 bottom-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Image menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!img.is_primary && (
                    <DropdownMenuItem
                      onSelect={() => setPrimary.mutate(img.id)}
                      disabled={setPrimary.isPending}
                    >
                      Set as primary
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => del.mutate(img.id)}
                    disabled={del.isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <div className={cn("aspect-square")}>
            <CigarImageUploader cigarId={cigarId} remainingSlots={remaining} />
          </div>
        )}
      </div>

      <Dialog
        open={lightbox != null}
        onOpenChange={(o) => !o && setLightbox(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Cigar image</DialogTitle>
          {lightbox && (
            <img
              src={lightbox.image_url}
              alt={lightbox.image_type}
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
