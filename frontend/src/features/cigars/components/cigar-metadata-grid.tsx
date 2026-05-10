import { Badge } from "@/components/ui/badge";
import type { CigarDetail } from "../types";

interface Props {
  cigar: CigarDetail;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function CigarMetadataGrid({ cigar }: Props) {
  const sizeText = cigar.vitola_size;

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <MetaRow label="Manufacturer" value={cigar.manufacturer_name} />
      <MetaRow label="Country" value={cigar.country_name} />
      <MetaRow label="Strength" value={cigar.strength_name} />
      <MetaRow label="Size" value={sizeText} />
      <MetaRow label="Wrapper" value={cigar.wrapper_name} />
      <MetaRow label="Binder" value={cigar.binder_name} />
      {cigar.fillers.length > 0 && (
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Fillers
          </dt>
          <dd className="flex flex-wrap gap-1.5">
            {cigar.fillers.map((f) => (
              <Badge key={f.id} variant="secondary" className="font-normal">
                {f.name}
              </Badge>
            ))}
          </dd>
        </div>
      )}
      <MetaRow
        label="UPC"
        value={cigar.upc ? <span className="font-mono">{cigar.upc}</span> : null}
      />
      {cigar.description && (
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Description
          </dt>
          <dd className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {cigar.description}
          </dd>
        </div>
      )}
    </dl>
  );
}
