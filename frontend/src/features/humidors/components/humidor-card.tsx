import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HumidorListItem } from "../types";
import { CapacityBar } from "./capacity-bar";
import { ReadingPill } from "./reading-pill";
import { HumidorFormDialog } from "./humidor-form-dialog";
import { ReadingFormDialog } from "./reading-form-dialog";
import { ArchiveConfirmDialog } from "./archive-confirm-dialog";

interface HumidorCardProps {
  humidor: HumidorListItem;
}

export function HumidorCard({ humidor }: HumidorCardProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  function handleCardClick() {
    navigate(`/humidors/${humidor.id}`);
  }

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md",
          !humidor.is_active && "opacity-60"
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg font-semibold leading-tight">
                  {humidor.name}
                </h3>
                {!humidor.is_active && (
                  <Badge variant="secondary" className="shrink-0">
                    Archived
                  </Badge>
                )}
              </div>
              {humidor.location && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {humidor.location}
                </p>
              )}
            </div>
            {/* Stop propagation so menu clicks don't navigate to detail */}
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setReadingOpen(true)}>
                    Add reading
                  </DropdownMenuItem>
                  {humidor.is_active && (
                    <DropdownMenuItem
                      onSelect={() => setArchiveOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          <CapacityBar
            count={humidor.cigar_count}
            capacity={humidor.capacity}
            percentage={humidor.total_capacity_used}
          />
          <ReadingPill reading={humidor.latest_reading} />
        </CardContent>

        <CardFooter className="pt-0 text-xs text-muted-foreground">
          Created{" "}
          {formatDistanceToNow(new Date(humidor.created_at), {
            addSuffix: true,
          })}
        </CardFooter>
      </Card>

      <HumidorFormDialog
        humidorId={humidor.id}
        defaultValues={{
          name: humidor.name,
          description: humidor.description ?? null,
          location: humidor.location ?? null,
          capacity: humidor.capacity ?? null,
          target_humidity: humidor.target_humidity ?? null,
          target_temp_f: humidor.target_temp_f ?? null,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ReadingFormDialog
        humidorId={humidor.id}
        open={readingOpen}
        onOpenChange={setReadingOpen}
      />

      <ArchiveConfirmDialog
        humidorId={humidor.id}
        humidorName={humidor.name}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={() => setArchiveOpen(false)}
      />
    </>
  );
}
