import { Activity, Droplets, Thermometer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HumidorReadingResponse } from "../types";

interface ReadingPillProps {
  reading: HumidorReadingResponse | null;
}

export function ReadingPill({ reading }: ReadingPillProps) {
  if (!reading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Activity className="h-3 w-3" />
        No readings yet
      </span>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(reading.recorded_at), {
    addSuffix: true,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-2 cursor-default">
          {reading.humidity != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
              <Droplets className="h-3 w-3" />
              {reading.humidity}%
            </span>
          )}
          {reading.temperature_f != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 text-xs font-medium">
              <Thermometer className="h-3 w-3" />
              {reading.temperature_f}°F
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>Recorded {timeAgo}</TooltipContent>
    </Tooltip>
  );
}
