"use client"

import { cn } from "@/lib/utils"

interface StatsBarProps {
  noEmail: number
  alteradas: number
  retiradas: number
  semRadar: number
}

/**
 * Contagem da revisao. Nao ha barra de progresso: a noticia com Radar ja
 * chega incluida, e quem revisa so age no que quer retirar ou mudar.
 */
export function StatsBar({ noEmail, alteradas, retiradas, semRadar }: StatsBarProps) {
  const cards = [
    { label: "Vão para os Radares", valor: noEmail, className: "text-success" },
    { label: "Com Radar alterado", valor: alteradas, className: "text-info" },
    { label: "Retiradas por você", valor: retiradas, className: "text-muted-foreground" },
    { label: "Sem Radar definido", valor: semRadar, className: "text-warning" },
  ]

  return (
    <section
      aria-label="Resumo da revisão"
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85"
    >
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 px-4 py-3 md:grid-cols-4">
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
    </section>
  )
}
