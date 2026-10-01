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
  /** Marca de uma vez todos os Radares vazios para sair sem publicacoes. */
  onConfirmarTodos: () => void
}

/**
 * Oferece, para cada Radar que sairia sem nenhuma noticia, as noticias desta
 * edicao que nao estao nele.
 *
 * Nada e incluido automaticamente: a lista e uma oferta. Para liberar o
 * envio, quem revisa inclui alguma noticia no Radar ou confirma que ele sai
 * sem publicacoes; o botao do alto confirma todos de uma vez.
 */
export function RadaresVaziosDialog({
  aberto,
  onAbertoChange,
  radaresVazios,
  itens,
  confirmados,
  onIncluir,
  onAlternarConfirmacao,
  onConfirmarTodos,
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
          <DialogTitle>Radares sem not&iacute;cias</DialogTitle>
          <DialogDescription>
            Cada Radar abaixo pode sair assim, com o aviso de que n&atilde;o
            houve publica&ccedil;&otilde;es no per&iacute;odo, ou receber alguma
            not&iacute;cia de hoje.
          </DialogDescription>
        </DialogHeader>

        {radaresVazios.some((radar) => !jaConfirmados.has(radar)) && (
          <Button className="self-start" onClick={onConfirmarTodos}>
            Enviar todos sem publica&ccedil;&otilde;es
          </Button>
        )}

        {radaresVazios.length === 0 ? (
          <Alert className="border-success/40 bg-success/10 text-foreground">
            <CheckCircle2Icon className="text-success" />
            <AlertDescription className="text-foreground/80">
              Todos os Radares t&ecirc;m pelo menos uma not&iacute;cia.
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
                      className={
                        confirmado
                          ? "border-border bg-muted text-muted-foreground"
                          : "border-warning/40 bg-warning/10 text-warning"
                      }
                    >
                      {confirmado ? "sai sem publica\u00e7\u00f5es" : "sem not\u00edcias"}
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
                        Ele sai com o aviso de que n&atilde;o houve
                        publica&ccedil;&otilde;es no per&iacute;odo.
                      </span>
                    </label>
                  </div>

                  {candidatos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todas as not&iacute;cias de hoje j&aacute; est&atilde;o
                      neste Radar.
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
                        : `Ver as outras ${candidatos.length - PREVIA_DE_CANDIDATOS} not\u00edcias`}
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
              O envio fica liberado quando cada Radar acima tiver uma
              not&iacute;cia ou estiver marcado para sair sem publica&ccedil;&otilde;es.
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
