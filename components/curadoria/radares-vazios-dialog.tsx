"use client"

import { useState } from "react"
import { CheckCircle2Icon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import { BOLETINS } from "@/lib/boletins"
import { candidatosParaRadar } from "@/lib/revisao"
import type { BoletimId, ItemRevisao } from "@/lib/types"

/** Quantos candidatos ficam a vista antes de "ver todas". */
const PREVIA_DE_CANDIDATOS = 5

interface RadaresVaziosDialogProps {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  radaresVazios: BoletimId[]
  itens: ItemRevisao[]
  confirmados: BoletimId[]
  onIncluir: (itemId: string, radar: BoletimId) => void
  onAlternarConfirmacao: (radar: BoletimId, confirmado: boolean) => void
}

/**
 * Oferece, para cada Radar que sairia sem nenhuma publicacao, os itens que
 * foram coletados nesta edicao e nao foram classificados para ele.
 *
 * Nada e selecionado nem incluido automaticamente: a lista e uma oferta. Para
 * liberar a conclusao da revisao, quem revisa inclui alguma publicacao no
 * Radar ou marca que ele pode sair vazio mesmo assim.
 */
export function RadaresVaziosDialog({
  aberto,
  onAbertoChange,
  radaresVazios,
  itens,
  confirmados,
  onIncluir,
  onAlternarConfirmacao,
}: RadaresVaziosDialogProps) {
  const jaConfirmados = new Set(confirmados)
  const [expandidos, setExpandidos] = useState<BoletimId[]>([])

  function alternarLista(radar: BoletimId) {
    setExpandidos((atual) =>
      atual.includes(radar)
        ? atual.filter((outro) => outro !== radar)
        : [...atual, radar]
    )
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Radares sem publica&ccedil;&otilde;es</DialogTitle>
          <DialogDescription>
            Estes Radares sairiam vazios. Voc&ecirc; pode incluir alguma das
            publica&ccedil;&otilde;es coletadas hoje ou confirmar o envio vazio.
          </DialogDescription>
        </DialogHeader>

        {radaresVazios.length === 0 ? (
          <Alert className="border-success/40 bg-success/10 text-foreground">
            <CheckCircle2Icon className="text-success" />
            <AlertDescription className="text-foreground/80">
              Todos os Radares t&ecirc;m pelo menos uma publica&ccedil;&atilde;o.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex max-h-[60svh] flex-col gap-6 overflow-y-auto pr-1">
            {radaresVazios.map((radar) => {
              const candidatos = candidatosParaRadar(itens, radar)
              const confirmado = jaConfirmados.has(radar)
              const expandido = expandidos.includes(radar)
              // Com nove Radares e dezenas de itens coletados, mostrar tudo de
              // uma vez deixaria a lista impraticavel. Os primeiros ficam a
              // vista, o resto abre a pedido.
              const visiveis = expandido
                ? candidatos
                : candidatos.slice(0, PREVIA_DE_CANDIDATOS)

              return (
                <section key={radar} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{BOLETINS[radar]}</h3>
                    <Badge
                      variant="outline"
                      className="border-warning/40 bg-warning/10 text-warning"
                    >
                      sem publica&ccedil;&otilde;es
                    </Badge>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Checkbox
                      id={`vazio-${radar}`}
                      checked={confirmado}
                      onCheckedChange={(marcado) =>
                        onAlternarConfirmacao(radar, marcado === true)
                      }
                    />
                    <label
                      htmlFor={`vazio-${radar}`}
                      className="cursor-pointer leading-tight"
                    >
                      Enviar este Radar sem publica&ccedil;&otilde;es
                      <span className="block text-xs text-muted-foreground">
                        Ele sai com a mensagem padr&atilde;o de que n&atilde;o
                        houve atualiza&ccedil;&otilde;es no per&iacute;odo.
                      </span>
                    </label>
                  </div>

                  {candidatos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma publica&ccedil;&atilde;o coletada hoje est&aacute;
                      fora deste Radar.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {visiveis.map((item) => (
                        <li
                          key={item.noticia.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border p-2"
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-sm leading-tight">
                              {item.tituloEditado || item.noticia.titulo}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.fonteEditada || item.noticia.fonte}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={item.status} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onIncluir(item.noticia.id, radar)}
                            >
                              <PlusIcon data-icon="inline-start" />
                              Incluir
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {candidatos.length > PREVIA_DE_CANDIDATOS && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => alternarLista(radar)}
                    >
                      {expandido
                        ? "Mostrar menos"
                        : `Ver as outras ${candidatos.length - PREVIA_DE_CANDIDATOS} publica\u00e7\u00f5es coletadas`}
                    </Button>
                  )}

                  <Separator />
                </section>
              )
            })}
          </div>
        )}

        {radaresVazios.length > 0 && (
          <Alert className="border-warning/40 bg-warning/10 text-foreground">
            <TriangleAlertIcon className="text-warning" />
            <AlertDescription className="text-foreground/80">
              A revis&atilde;o s&oacute; pode ser conclu&iacute;da depois que cada
              Radar acima receber uma publica&ccedil;&atilde;o ou for marcado para
              sair vazio.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button onClick={() => onAbertoChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
