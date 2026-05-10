import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadCigarImage } from "../queries";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface Props {
  cigarId: string;
  /** Hide the uploader once we hit the 3-image cap. */
  remainingSlots: number;
}

export function CigarImageUploader({ cigarId, remainingSlots }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadCigarImage(cigarId);

  if (remainingSlots <= 0) return null;

  function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Unsupported file type. Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setProgress(0);
    upload.mutate(
      {
        file,
        imageType: "full",
        onProgress: (pct) => setProgress(pct),
      },
      {
        onSettled: () => setProgress(null),
      }
    );
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center transition-colors",
        isDragging && "border-primary bg-primary/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onChange}
        className="hidden"
      />
      {upload.isPending ? (
        <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <Progress value={progress ?? 0} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            Uploading… {progress ?? 0}%
          </p>
        </div>
      ) : (
        <>
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Drop image to upload</p>
            <p className="text-xs text-muted-foreground">
              or{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => inputRef.current?.click()}
              >
                choose a file
              </Button>
            </p>
            <p className="text-xs text-muted-foreground">
              {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left •
              JPEG/PNG/WebP • max 10 MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
