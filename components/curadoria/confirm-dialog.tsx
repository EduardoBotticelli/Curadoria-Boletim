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
  incluidos: number
  rejeitados: number
  ajustados: number
  /** Itens que ficaram sem decisao e serao descartados na geracao final. */
  pendentes: number
  boletinsGerados: { boletim: BoletimId; quantidade: number }[]
  enviando: boolean
  onConfirmar: () => void
}

export function ConfirmDialog({
  aberto,
  onAbertoChange,
  incluidos,
  rejeitados,
  ajustados,
  pendentes,
  boletinsGerados,
  enviando,
  onConfirmar,
}: ConfirmDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar revis&atilde;o do boletim?</DialogTitle>
          <DialogDescription>Resumo da curadoria de hoje:</DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            <strong>{incluidos}</strong> {incluidos === 1 ? "item ser\u00e1 inclu\u00eddo" : "itens ser\u00e3o inclu\u00eddos"} nos boletins finais
          </li>
          <li>
            <strong>{rejeitados}</strong> {rejeitados === 1 ? "item foi rejeitado" : "itens foram rejeitados"} por voc&ecirc;
          </li>
          <li>
            <strong>{ajustados}</strong> {ajustados === 1 ? "item teve os boletins ajustados" : "itens tiveram os boletins ajustados"} manualmente
          </li>
          {pendentes > 0 && (
            <li className="text-warning">
              <strong>{pendentes}</strong>{" "}
              {pendentes === 1
                ? "item continua pendente e ser\u00e1 descartado"
                : "itens continuam pendentes e ser\u00e3o descartados"}
            </li>
          )}
        </ul>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Boletins gerados:</span>
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
            <span className="text-sm text-muted-foreground">Nenhum boletim ser&aacute; gerado.</span>
          )}
        </div>

        <Alert className="border-warning/40 bg-warning/10 text-foreground">
          <TriangleAlertIcon className="text-warning" />
          <AlertDescription className="text-foreground/80">
            Ap&oacute;s confirmar, os boletins ser&atilde;o gerados e enviados aos advogados. Esta
            a&ccedil;&atilde;o &eacute; irrevers&iacute;vel.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" disabled={enviando} onClick={() => onAbertoChange(false)}>
            Cancelar
          </Button>
          <Button disabled={enviando} onClick={onConfirmar}>
            {enviando && <Spinner data-icon="inline-start" />}
            Confirmar e gerar boletins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
