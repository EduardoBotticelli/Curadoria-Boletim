"use client"

import { useEffect, useRef, useState } from "react"
import {
  ExternalLinkIcon,
  PlusCircleIcon,
  SlidersHorizontalIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  onRetirar: () => void
  onDesfazer: () => void
  onAbrirAjuste: (aberto: boolean) => void
  onSalvarRadares: (radares: BoletimId[]) => void
}

function formatarData(iso: string): string {
  // O pipeline grava data_publicacao vazia quando nao consegue interpretar a
  // data da publicacao, entao o formato nem sempre e AAAA-MM-DD.
  const [ano, mes, dia] = (iso || "").split("-").map(Number)
  if (!ano || !mes || !dia) return "Data não informada"

  const data = new Date(ano, mes - 1, dia)
  if (Number.isNaN(data.getTime())) return "Data não informada"

  return data.toLocaleDateString("pt-BR")
}

/**
 * Uma noticia: fonte, titulo, data, link, resumo e o Radar em que vai sair.
 *
 * A noticia com Radar ja chega incluida; quem revisa so age para retirar ou
 * mudar o Radar. A que chegou sem Radar aparece na lista "Sem Radar
 * definido" e so entra no e-mail se alguem escolher um Radar para ela.
 */
export function NewsCard({
  item,
  focado,
  ajusteAberto,
  desabilitado = false,
  onFocar,
  onRetirar,
  onDesfazer,
  onAbrirAjuste,
  onSalvarRadares,
}: NewsCardProps) {
  const { noticia, status, boletinsFinais } = item
  const cardRef = useRef<HTMLElement>(null)
  const [rascunho, setRascunho] = useState<BoletimId[]>(boletinsFinais)

  const incluida = status === "aprovado" || status === "ajustado"
  const semRadar = status === "sem_radar"
  const radaresAntes = noticia.radares_definidos

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

  function alternarRadar(id: BoletimId, marcado: boolean) {
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
        focado
          ? "border-ring ring-2 ring-ring/40"
          : "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        status === "rejeitado" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-0">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">
            {noticia.fonte}
          </span>
          <h2 className="text-base leading-snug font-semibold text-pretty md:text-lg">
            {noticia.titulo}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {formatarData(noticia.data_publicacao)}
            </Badge>
            {noticia.origem === "manual" && (
              <Badge className="border border-amber-400/40 bg-amber-100 text-xs text-amber-800 hover:bg-amber-100">
                Adicionada na revisão
              </Badge>
            )}
            {noticia.url && (
              <a
                href={noticia.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                <ExternalLinkIcon className="size-3" aria-hidden="true" />
                Abrir notícia
              </a>
            )}
          </div>
        </div>
        {(status === "ajustado" || status === "rejeitado") && <StatusBadge status={status} />}
      </div>

      <div className="flex flex-col gap-3 p-4 pt-3">
        {noticia.resumo && (
          <p className="text-sm leading-relaxed text-foreground/90">{noticia.resumo}</p>
        )}

        <div className="flex flex-col gap-1.5">
          {incluida && (
            <>
              <span className="text-xs font-medium text-muted-foreground">Vai sair em:</span>
              <div className="flex flex-wrap gap-1">
                {boletinsFinais.map((id) => (
                  <Badge
                    key={id}
                    variant="outline"
                    className="border-success/40 bg-success/10 text-xs text-success"
                  >
                    {BOLETINS[id]}
                  </Badge>
                ))}
              </div>
              {status === "ajustado" && radaresAntes.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Antes: {radaresAntes.map((id) => BOLETINS[id]).join(", ")}
                </span>
              )}
            </>
          )}
          {status === "rejeitado" && (
            <span className="text-xs text-muted-foreground">
              Retirada por você: não vai para o e-mail.
            </span>
          )}
          {semRadar && (
            <span className="text-xs text-muted-foreground">
              Só vai para o e-mail se você escolher um Radar.
            </span>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2 p-4 pt-3">
        <div className="flex flex-wrap gap-2">
          {incluida && (
            <>
              <Button
                variant="outline"
                disabled={desabilitado}
                className="border-info/40 text-info hover:bg-info/10 hover:text-info"
                aria-expanded={ajusteAberto}
                onClick={(e) => {
                  e.stopPropagation()
                  onAbrirAjuste(!ajusteAberto)
                }}
              >
                <SlidersHorizontalIcon data-icon="inline-start" />
                Mudar Radar
              </Button>
              <Button
                variant="outline"
                disabled={desabilitado}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetirar()
                }}
              >
                <XIcon data-icon="inline-start" />
                Retirar
              </Button>
            </>
          )}

          {status === "rejeitado" && (
            <Button
              variant="outline"
              disabled={desabilitado}
              onClick={(e) => {
                e.stopPropagation()
                onDesfazer()
              }}
            >
              <Undo2Icon data-icon="inline-start" />
              Desfazer
            </Button>
          )}

          {semRadar && (
            <Button
              variant="outline"
              disabled={desabilitado}
              aria-expanded={ajusteAberto}
              onClick={(e) => {
                e.stopPropagation()
                onAbrirAjuste(!ajusteAberto)
              }}
            >
              <PlusCircleIcon data-icon="inline-start" />
              Escolher Radar
            </Button>
          )}
        </div>

        {ajusteAberto && (
          <fieldset className="mt-1 flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
            <legend className="sr-only">Radares em que a notícia vai sair</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {BOLETIM_IDS.map((id) => {
                const checkboxId = `${noticia.id}-${id}`
                return (
                  <div key={id} className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={rascunho.includes(id)}
                      onCheckedChange={(marcado) => alternarRadar(id, marcado === true)}
                    />
                    <label htmlFor={checkboxId} className="cursor-pointer text-sm leading-none">
                      {BOLETINS[id]}
                    </label>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onAbrirAjuste(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => onSalvarRadares(rascunho)}>
                Salvar
              </Button>
            </div>
          </fieldset>
        )}
      </div>
    </article>
  )
}
