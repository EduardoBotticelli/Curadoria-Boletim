"use client"

import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BOLETINS } from "@/lib/boletins"
import type { BoletimId } from "@/lib/types"

interface ConfirmDialogProps {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  incluidas: number
  retiradas: number
  alteradas: number
  semRadar: number
  boletinsGerados: { boletim: BoletimId; quantidade: number }[]
  /** Radares que vao sair sem noticias, como quem revisa confirmou. */
  radaresVazios: BoletimId[]
  enviando: boolean
  onConfirmar: () => void
}

function plural(quantidade: number, singular: string, varias: string): string {
  return quantidade === 1 ? singular : varias
}

export function ConfirmDialog({
  aberto,
  onAbertoChange,
  incluidas,
  retiradas,
  alteradas,
  semRadar,
  boletinsGerados,
  radaresVazios,
  enviando,
  onConfirmar,
}: ConfirmDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar os Radares de hoje?</DialogTitle>
          <DialogDescription>Resumo da revisão:</DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            <strong>{incluidas}</strong>{" "}
            {plural(incluidas, "notícia vai", "notícias vão")} para os Radares
          </li>
          {alteradas > 0 && (
            <li>
              <strong>{alteradas}</strong>{" "}
              {plural(alteradas, "teve o Radar alterado", "tiveram o Radar alterado")} por você
            </li>
          )}
          {retiradas > 0 && (
            <li>
              <strong>{retiradas}</strong>{" "}
              {plural(retiradas, "foi retirada", "foram retiradas")} por você
            </li>
          )}
          {semRadar > 0 && (
            <li>
              <strong>{semRadar}</strong>{" "}
              {plural(semRadar, "notícia sem Radar fica", "notícias sem Radar ficam")} de fora
            </li>
          )}
        </ul>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Radares com notícias:</span>
          {boletinsGerados.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {boletinsGerados.map(({ boletim, quantidade }) => (
                <Badge
                  key={boletim}
                  variant="outline"
                  className="border-success/40 bg-success/10 text-success"
                >
                  {BOLETINS[boletim]} ({quantidade})
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhum.</span>
          )}
        </div>

        {radaresVazios.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Radares que saem sem publicações:</span>
            <div className="flex flex-wrap gap-1">
              {radaresVazios.map((boletim) => (
                <Badge
                  key={boletim}
                  variant="outline"
                  className="border-warning/40 bg-warning/10 text-warning"
                >
                  {BOLETINS[boletim]}
                </Badge>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Cada um sai com o aviso de que não houve publicações no período.
            </span>
          </div>
        )}

        <Alert className="border-warning/40 bg-warning/10 text-foreground">
          <TriangleAlertIcon className="text-warning" />
          <AlertDescription className="text-foreground/80">
            Depois de confirmar, os Radares são gerados e enviados aos advogados. Não dá
            para desfazer.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" disabled={enviando} onClick={() => onAbertoChange(false)}>
            Voltar
          </Button>
          <Button disabled={enviando} onClick={onConfirmar}>
            {enviando && <Spinner data-icon="inline-start" />}
            Confirmar e enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
