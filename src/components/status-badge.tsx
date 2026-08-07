import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database.generated";

const labels: Record<Enums<"project_status">, string> = {
  analyzing: "Analyzing",
  completed: "Exported",
  exporting: "Exporting",
  failed: "Needs attention",
  ready: "Ready",
  uploaded: "Uploaded",
  uploading: "Uploading",
};

export function StatusBadge({ status }: { status: Enums<"project_status"> }) {
  const active = ["analyzing", "exporting", "uploading"].includes(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-normal",
        status === "failed" && "border-destructive/25 bg-destructive/10 text-red-300",
        ["ready", "completed"].includes(status) && "border-primary/20 bg-primary/10 text-primary",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full bg-muted-foreground",
          active && "animate-pulse bg-amber-300",
          ["ready", "completed"].includes(status) && "bg-primary",
          status === "failed" && "bg-red-400",
        )}
      />
      {labels[status]}
    </Badge>
  );
}
