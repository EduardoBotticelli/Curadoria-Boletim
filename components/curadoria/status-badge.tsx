import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StatusRevisao } from "@/lib/types"

const STATUS_CONFIG: Record<StatusRevisao, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  aprovado: {
    label: "Aprovado",
    className: "border-success/40 bg-success/10 text-success",
  },
  rejeitado: {
    label: "Rejeitado",
    className: "border-border bg-muted text-muted-foreground",
  },
  ajustado: {
    label: "Ajustado",
    className: "border-info/40 bg-info/10 text-info",
  },
}

export function StatusBadge({ status }: { status: StatusRevisao }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn("shrink-0", config.className)}>
      {config.label}
    </Badge>
  )
}
