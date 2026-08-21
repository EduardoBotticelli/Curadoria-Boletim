"use client"

import { HelpCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DESCRICAO_RADARES } from "@/lib/boletins"

interface PageHeaderProps {
  dataExtenso: string
  janelaTemporal: string
  onAbrirAjuda: () => void
}

export function PageHeader({
  dataExtenso,
  janelaTemporal,
  onAbrirAjuda,
}: PageHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[#0d3320] via-[#1a4d2e] to-[#2d8659] text-white">
      <div className="mx-auto flex max-w-4xl items-start justify-between gap-4 px-4 py-6 md:py-8">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
            Lobo de Rizzo Advogados
          </p>

          <h1 className="text-2xl font-semibold text-balance md:text-3xl">
            Curadoria dos Radares
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-white/85">
            {DESCRICAO_RADARES}
          </p>

          <p className="text-xs text-white/70 md:text-sm">
            {dataExtenso} &middot; {janelaTemporal}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/15 hover:text-white"
          onClick={onAbrirAjuda}
          aria-label="Atalhos de teclado"
        >
          <HelpCircleIcon />
        </Button>
      </div>
    </header>
  )
}
