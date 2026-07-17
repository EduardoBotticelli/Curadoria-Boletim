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
  { teclas: ["A"], descricao: "Aprovar o card em foco" },
  { teclas: ["R"], descricao: "Rejeitar o card em foco" },
  { teclas: ["E"], descricao: "Expandir \u201cajustar boletins\u201d do card em foco" },
  { teclas: ["\u2191", "\u2193"], descricao: "Navegar entre os cards" },
  { teclas: ["Ctrl", "Enter"], descricao: "Abrir confirma\u00e7\u00e3o final" },
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
          <DialogDescription>Acelere a curadoria di&aacute;ria com o teclado.</DialogDescription>
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
