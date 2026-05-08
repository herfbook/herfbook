import { useState } from "react";
import { MapPin, Droplets, Thermometer, Package, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HumidorDetail } from "../types";
import { CapacityBar } from "./capacity-bar";
import { HumidorFormDialog } from "./humidor-form-dialog";
import { ReadingFormDialog } from "./reading-form-dialog";
import { ArchiveConfirmDialog } from "./archive-confirm-dialog";

interface HumidorDetailHeaderProps {
  humidor: HumidorDetail;
  onArchived: () => void;
}

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  muted?: boolean;
}

function StatTile({ label, value, icon, muted }: StatTileProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        className={`text-2xl font-bold tabular-nums ${muted ? "text-muted-foreground text-lg font-medium" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function HumidorDetailHeader({
  humidor,
  onArchived,
}: HumidorDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const reading = humidor.latest_reading;

  const daysSinceReading =
    reading != null
      ? formatDistanceToNow(new Date(reading.recorded_at), { addSuffix: true })
      : null;

  const hasTargets =
    humidor.target_humidity != null || humidor.target_temp_f != null;

  return (
    <>
      <div className="space-y-4">
        {/* Name row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl font-semibold leading-tight">
                {humidor.name}
              </h1>
              {!humidor.is_active && (
                <Badge variant="secondary">Archived</Badge>
              )}
            </div>
            {humidor.description && (
              <p className="text-muted-foreground">{humidor.description}</p>
            )}
            {humidor.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {humidor.location}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setReadingOpen(true)}>Add reading</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {humidor.is_active && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setArchiveOpen(true)}
              >
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="max-w-md">
          <CapacityBar
            count={humidor.cigar_count}
            capacity={humidor.capacity}
            percentage={humidor.total_capacity_used}
          />
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2 border-t">
          <StatTile
            label="Total cigars"
            value={humidor.cigar_count}
            icon={<Package className="h-3 w-3" />}
          />
          {reading?.humidity != null ? (
            <StatTile
              label="Humidity"
              value={`${reading.humidity}%`}
              icon={<Droplets className="h-3 w-3" />}
            />
          ) : (
            <StatTile
              label="Humidity"
              value="—"
              icon={<Droplets className="h-3 w-3" />}
              muted
            />
          )}
          {reading?.temperature_f != null ? (
            <StatTile
              label="Temperature"
              value={`${reading.temperature_f}°F`}
              icon={<Thermometer className="h-3 w-3" />}
            />
          ) : (
            <StatTile
              label="Temperature"
              value="—"
              icon={<Thermometer className="h-3 w-3" />}
              muted
            />
          )}
          <StatTile
            label="Last reading"
            value={daysSinceReading ?? "Never"}
            icon={<Clock className="h-3 w-3" />}
            muted={daysSinceReading == null}
          />
        </div>

        {/* Targets compact row */}
        {hasTargets && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Targets —</span>{" "}
            {humidor.target_humidity != null && (
              <span>RH: {humidor.target_humidity}%</span>
            )}
            {humidor.target_humidity != null &&
              humidor.target_temp_f != null && <span> · </span>}
            {humidor.target_temp_f != null && (
              <span>Temp: {humidor.target_temp_f}°F</span>
            )}
          </p>
        )}
      </div>

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
        onArchived={onArchived}
      />
    </>
  );
}
