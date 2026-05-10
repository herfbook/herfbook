import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHumidors } from "@/features/humidors/queries";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Optional id to exclude (e.g. for transfer "to" picker). */
  excludeId?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Show an "Unassigned" option. */
  allowUnassigned?: boolean;
  unassignedLabel?: string;
}

const UNASSIGNED = "__unassigned__";

export function HumidorPicker({
  value,
  onChange,
  excludeId,
  placeholder = "Select humidor…",
  disabled,
  allowUnassigned,
  unassignedLabel = "Unassigned",
}: Props) {
  const { data, isLoading } = useHumidors(false);
  const humidors = (data ?? []).filter((h) => h.id !== excludeId);

  return (
    <Select
      value={value ?? (allowUnassigned ? UNASSIGNED : "")}
      onValueChange={(v) => onChange(v === UNASSIGNED ? null : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowUnassigned && (
          <SelectItem value={UNASSIGNED}>{unassignedLabel}</SelectItem>
        )}
        {humidors.map((h) => (
          <SelectItem key={h.id} value={h.id}>
            {h.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
