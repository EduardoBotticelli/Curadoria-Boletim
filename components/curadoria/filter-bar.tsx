"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BOLETIM_IDS, BOLETINS } from "@/lib/boletins"
import type { BoletimId } from "@/lib/types"
import { cn } from "@/lib/utils"

export type StatusFiltro = "todos" | "pendente" | "aprovado" | "rejeitado"

interface FilterBarProps {
  statusFiltro: StatusFiltro
  onStatusChange: (status: StatusFiltro) => void
  boletimFiltro: BoletimId | "todos"
  onBoletimChange: (boletim: BoletimId | "todos") => void
  contagemBoletins: Record<BoletimId, number>
  desabilitado?: boolean
}

export function FilterBar({
  statusFiltro,
  onStatusChange,
  boletimFiltro,
  onBoletimChange,
  contagemBoletins,
}: FilterBarProps) {
  return (
    <section aria-label="Filtros" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={statusFiltro}
          onValueChange={(value) => onStatusChange(value as StatusFiltro)}
        >
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
            <TabsTrigger value="rejeitado">Rejeitados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chips de boletim (desktop/tablet) */}
      <div className="hidden flex-wrap gap-1.5 md:flex" role="group" aria-label="Filtrar por boletim">
        <Button
          variant={boletimFiltro === "todos" ? "secondary" : "ghost"}
          size="xs"
          className={cn(boletimFiltro === "todos" && "border-border")}
          onClick={() => onBoletimChange("todos")}
        >
          Todos os boletins
        </Button>
        {BOLETIM_IDS.map((id) => (
          <Button
            key={id}
            variant={boletimFiltro === id ? "secondary" : "ghost"}
            size="xs"
            className={cn("text-muted-foreground", boletimFiltro === id && "border-border text-secondary-foreground")}
            onClick={() => onBoletimChange(boletimFiltro === id ? "todos" : id)}
            aria-pressed={boletimFiltro === id}
          >
            {BOLETINS[id]} ({contagemBoletins[id]})
          </Button>
        ))}
      </div>

      {/* Dropdown de boletim (mobile) */}
      <div className="md:hidden">
        <Select
          value={boletimFiltro}
          onValueChange={(value) => onBoletimChange(value as BoletimId | "todos")}
        >
          <SelectTrigger className="w-full" aria-label="Filtrar por boletim">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todos">Todos os boletins</SelectItem>
              {BOLETIM_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {BOLETINS[id]} ({contagemBoletins[id]})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
