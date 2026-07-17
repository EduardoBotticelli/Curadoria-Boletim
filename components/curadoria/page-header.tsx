"use client"

import { HelpCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  dataExtenso: string
  janelaTemporal: string
  onAbrirAjuda: () => void
}

export function PageHeader({ dataExtenso, janelaTemporal, onAbrirAjuda }: PageHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[#0d3320] via-[#1a4d2e] to-[#2d8659] text-white">
      <div className="mx-auto flex max-w-4xl items-start justify-between gap-4 px-4 py-6 md:py-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">
            Lobo de Rizzo Advogados
          </p>
          <h1 className="text-2xl font-semibold text-balance md:text-3xl">Curadoria do Boletim</h1>
          <p className="text-sm text-white/80">
            {dataExtenso} &middot; {janelaTemporal}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15 hover:text-white"
          onClick={onAbrirAjuda}
          aria-label="Atalhos de teclado"
        >
          <HelpCircleIcon />
        </Button>
      </div>
    </header>
  )
}
