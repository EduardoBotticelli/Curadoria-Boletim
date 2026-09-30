import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StatusRevisao } from "@/lib/types"

const STATUS_CONFIG: Record<StatusRevisao, { label: string; className: string }> = {
  aprovado: {
    label: "No e-mail",
    className: "border-success/40 bg-success/10 text-success",
  },
  ajustado: {
    label: "Radar alterado",
    className: "border-info/40 bg-info/10 text-info",
  },
  rejeitado: {
    label: "Retirada",
    className: "border-border bg-muted text-muted-foreground",
  },
  sem_radar: {
    label: "Sem Radar",
    className: "border-warning/40 bg-warning/10 text-warning",
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
