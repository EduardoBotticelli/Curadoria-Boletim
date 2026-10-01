"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

const ATALHOS: { teclas: string[]; descricao: string }[] = [
  { teclas: ["R"], descricao: "Retirar a not\u00edcia selecionada (ou desfazer)" },
  { teclas: ["E"], descricao: "Mudar o Radar da not\u00edcia selecionada" },
  { teclas: ["\u2191", "\u2193"], descricao: "Passar de uma not\u00edcia para outra" },
  { teclas: ["Ctrl", "Enter"], descricao: "Confirmar e enviar" },
  { teclas: ["?"], descricao: "Abrir esta ajuda" },
]

interface ShortcutsDialogProps {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
}

export function ShortcutsDialog({ aberto, onAbertoChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>Para revisar mais r&aacute;pido pelo teclado.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2.5">
          {ATALHOS.map((atalho) => (
            <li key={atalho.descricao} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground/90">{atalho.descricao}</span>
              <KbdGroup>
                {atalho.teclas.map((tecla) => (
                  <Kbd key={tecla}>{tecla}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
