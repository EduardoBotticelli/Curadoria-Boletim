"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import { BOLETIM_IDS, BOLETINS } from "@/lib/boletins"
import type { BoletimId, ItemRevisao } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NewsCardProps {
  item: ItemRevisao
  focado: boolean
  ajusteAberto: boolean
  desabilitado?: boolean
  onFocar: () => void
  onAprovar: () => void
  onRejeitar: () => void
  onAbrirAjuste: (aberto: boolean) => void
  onSalvarAjustes: (boletins: BoletimId[]) => void
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR")
}

export function NewsCard({
  item,
  focado,
  ajusteAberto,
  desabilitado = false,
  onFocar,
  onAprovar,
  onRejeitar,
  onAbrirAjuste,
  onSalvarAjustes,
}: NewsCardProps) {
  const { noticia, status, boletinsFinais } = item
  const cardRef = useRef<HTMLElement>(null)
  const [corpoAberto, setCorpoAberto] = useState(true)
  const [rejeicoesAbertas, setRejeicoesAbertas] = useState(false)
  const [rascunho, setRascunho] = useState<BoletimId[]>(boletinsFinais)

  useEffect(() => {
    if (ajusteAberto) {
      setRascunho(boletinsFinais)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajusteAberto])

  useEffect(() => {
    if (focado && cardRef.current) {
      cardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [focado])

  function alternarBoletim(id: BoletimId, marcado: boolean) {
    setRascunho((atual) => (marcado ? [...atual, id] : atual.filter((b) => b !== id)))
  }

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      onFocus={onFocar}
      onClick={onFocar}
      aria-label={noticia.titulo}
      className={cn(
        "rounded-xl border bg-card text-card-foreground transition-shadow duration-150 outline-none",
        focado ? "border-ring ring-2 ring-ring/40" : "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        status === "rejeitado" && "opacity-60"
      )}
    >
      {/* Header do card */}
      <div className="flex items-start justify-between gap-3 p-4 pb-0">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">
            {noticia.fonte}
          </span>
          <h2 className="text-base leading-snug font-semibold text-pretty md:text-lg">
            {noticia.titulo}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {noticia.origem === "manual" && (
              <Badge className="border border-amber-400/40 bg-amber-100 text-xs text-amber-800 hover:bg-amber-100">
                Adicionado manualmente
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {formatarData(noticia.data_publicacao)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {noticia.categoria}
            </Badge>
            {noticia.url && (
              {noticia.url}className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                <ExternalLinkIcon className="size-3" aria-hidden="true" />
                Fonte
              </a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={status} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setCorpoAberto((a) => !a)
            }}
            aria-expanded={corpoAberto}
            aria-label={corpoAberto ? "Recolher detalhes" : "Expandir detalhes"}
          >
            <ChevronDownIcon
              className={cn("transition-transform duration-150", corpoAberto && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* Corpo colapsável */}
      <Collapsible open={corpoAberto} onOpenChange={setCorpoAberto}>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 p-4 pt-3">
            <p className="text-sm leading-relaxed text-foreground/90">{noticia.resumo}</p>
            <p className="text-xs text-muted-foreground italic">
              Motivo da IA: {noticia.motivo_filtragem}
            </p>

            {noticia.palavras_chave_detectadas.length > 0 && (
              <div className="flex flex-wrap gap-1" aria-label="Palavras-chave detectadas">
                {noticia.palavras_chave_detectadas.map((palavra) => (
                  <Badge
                    key={palavra}
                    variant="outline"
                    className="border-info/30 bg-info/10 text-xs text-info"
                  >
                    {palavra}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {status === "ajustado" ? "Incluído em:" : "IA sugeriu incluir em:"}
              </span>
              {boletinsFinais.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {boletinsFinais.map((id) => (
                    <Badge
                      key={id}
                      variant="outline"
                      className="border-success/40 bg-success/10 text-xs text-success"
                    >
                      {BOLETINS[id]}
                    </Badge>
