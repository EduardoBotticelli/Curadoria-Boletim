"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface StatsBarProps {
  total: number
  aprovados: number
  rejeitados: number
  ajustados: number
  pendentes: number
}

export function StatsBar({ total, aprovados, rejeitados, ajustados, pendentes }: StatsBarProps) {
  const revisados = total - pendentes
  const progresso = total === 0 ? 0 : Math.round((revisados / total) * 100)

  const cards = [
    { label: "Total de itens", valor: total, className: "text-foreground" },
    { label: "Aprovados", valor: aprovados, className: "text-success" },
    { label: "Rejeitados", valor: rejeitados, className: "text-muted-foreground" },
    { label: "Ajustados", valor: ajustados, className: "text-info" },
    { label: "Pendentes", valor: pendentes, className: "text-warning" },
  ]

  return (
    <section
      aria-label="Estatísticas da revisão"
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-0.5 rounded-lg border bg-card px-3 py-2"
            >
              <span className={cn("text-lg leading-none font-semibold tabular-nums", card.className)}>
                {card.valor}
              </span>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progresso} aria-label="Progresso da revisão" className="h-1.5" />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {revisados} de {total} revisados
          </span>
        </div>
      </div>
    </section>
  )
}
