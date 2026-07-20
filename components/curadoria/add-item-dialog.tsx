"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { BOLETIM_IDS, BOLETIM_LABELS } from "@/lib/boletins"
import type { BoletimId, Noticia } from "@/lib/types"

interface AddItemDialogProps {
  onAdicionar: (noticia: Noticia) => void
  desabilitado?: boolean
}

export function AddItemDialog({ onAdicionar, desabilitado }: AddItemDialogProps) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [resumo, setResumo] = useState("")
  const [fonte, setFonte] = useState("")
  const [url, setUrl] = useState("")
  const [dataPublicacao, setDataPublicacao] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [boletinsSelecionados, setBoletinsSelecionados] = useState<BoletimId[]>([])

  function resetar() {
    setTitulo("")
    setResumo("")
    setFonte("")
    setUrl("")
    setDataPublicacao(new Date().toISOString().split("T")[0])
    setBoletinsSelecionados([])
  }

  function toggleBoletim(id: BoletimId) {
    setBoletinsSelecionados((atual) =>
      atual.includes(id) ? atual.filter((b) => b !== id) : [...atual, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!titulo.trim()) {
      toast.error("O título é obrigatório")
      return
    }
    if (!resumo.trim()) {
      toast.error("O resumo é obrigatório")
      return
    }
    if (!fonte.trim()) {
      toast.error("A fonte é obrigatória")
      return
    }
    if (boletinsSelecionados.length === 0) {
      toast.error("Selecione ao menos um boletim de destino")
      return
    }

    const novaNoticia: Noticia = {
      id: `manual-${Date.now()}`,
      fonte: fonte.trim(),
      categoria: "Adicionado manualmente",
      titulo: titulo.trim(),
      data_publicacao: dataPublicacao,
      resumo: resumo.trim(),
      motivo_filtragem: "Item adicionado manualmente pela curadoria.",
      palavras_chave_detectadas: [],
      boletins_confirmados_ia: boletinsSelecionados,
      boletins_rejeitados: [],
      url: url.trim() || "",
      origem: "manual",
    }

    onAdicionar(novaNoticia)
    toast.success("Item adicionado ao boletim")
    resetar()
    setAberto(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={desabilitado}>
          <PlusIcon />
          Adicionar item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar item manualmente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="titulo">Título *</FieldLabel>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ex: STJ decide sobre..."
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="resumo">Resumo *</FieldLabel>
            <textarea
              id="resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descrição breve do conteúdo..."
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fonte">Fonte *</FieldLabel>
              <input
                id="fonte"
                type="text"
                value={fonte}
                onChange={(e) => setFonte(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ex: Valor Econômico, IRIB, Editorial próprio"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="data">Data de publicação</FieldLabel>
              <input
                id="data"
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="url">Link (opcional)</FieldLabel>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="https://..."
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Label>Boletins de destino *</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {BOLETIM_IDS.map((id) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 hover:bg-accent"
                >
                  <Checkbox
                    checked={boletinsSelecionados.includes(id)}
                    onCheckedChange={() => toggleBoletim(id)}
                  />
                  <span className="text-sm">{BOLETIM_LABELS[id]}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <PlusIcon />
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}