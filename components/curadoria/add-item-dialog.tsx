"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BOLETIM_IDS, BOLETINS } from "@/lib/boletins"
import { idItemManual } from "@/lib/revisao"
import type { BoletimId, Noticia } from "@/lib/types"

interface AddItemDialogProps {
  onAdicionar: (noticia: Noticia) => void
  desabilitado?: boolean
}

function dataHojeISO(): string {
  return new Date().toISOString().split("T")[0]
}

export function AddItemDialog({ onAdicionar, desabilitado }: AddItemDialogProps) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [resumo, setResumo] = useState("")
  const [fonte, setFonte] = useState("")
  const [url, setUrl] = useState("")
  const [dataPublicacao, setDataPublicacao] = useState<string>("")
  const [boletinsSelecionados, setBoletinsSelecionados] = useState<BoletimId[]>([])

  // Ao montar no cliente, seta a data padrao como hoje.
  useEffect(() => {
    setDataPublicacao(dataHojeISO())
  }, [])

  // Sempre que o dialog abrir, garante que a data padrao esta preenchida.
  useEffect(() => {
    if (aberto && !dataPublicacao) {
      setDataPublicacao(dataHojeISO())
    }
  }, [aberto, dataPublicacao])

  function resetar() {
    setTitulo("")
    setResumo("")
    setFonte("")
    setUrl("")
    setDataPublicacao(dataHojeISO())
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
      toast.error("O titulo eh obrigatorio")
      return
    }
    if (!resumo.trim()) {
      toast.error("O resumo eh obrigatorio")
      return
    }
    if (!fonte.trim()) {
      toast.error("A fonte eh obrigatoria")
      return
    }
    if (boletinsSelecionados.length === 0) {
      toast.error("Selecione ao menos um boletim de destino")
      return
    }

    const fonteLimpa = fonte.trim()
    const tituloLimpo = titulo.trim()
    const urlLimpa = url.trim()

    const novaNoticia: Noticia = {
      // Id derivado do conteudo (nao do relogio), para sobreviver a recargas
      // da pagina e evitar duplicatas do mesmo item.
      id: idItemManual(urlLimpa, fonteLimpa, tituloLimpo),
      fonte: fonteLimpa,
      categoria: "Adicionado manualmente",
      titulo: tituloLimpo,
      data_publicacao: dataPublicacao || dataHojeISO(),
      resumo: resumo.trim(),
      motivo_filtragem: "Item adicionado manualmente pela curadoria.",
      palavras_chave_detectadas: [],
      boletins_confirmados_ia: boletinsSelecionados,
      boletins_rejeitados: [],
      url: urlLimpa,
      origem: "manual",
    }

    onAdicionar(novaNoticia)
    toast.success("Item adicionado ao boletim")
    resetar()
    setAberto(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {/*
        Base UI usa a prop "render", nao "asChild". Com asChild o trigger
        renderizava um <button> em volta do <Button>, gerando botoes aninhados
        (HTML invalido). O mesmo padrao "render" ja e usado em
        components/ui/dialog.tsx e em news-card.tsx.
      */}
      <DialogTrigger
        render={<Button variant="outline" size="sm" disabled={desabilitado} />}
      >
        <PlusIcon />
        Adicionar item
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar item manualmente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Titulo *</Label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ex: STJ decide sobre..."
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="resumo">Resumo *</Label>
            <textarea
              id="resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descricao breve do conteudo..."
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fonte">Fonte *</Label>
              <input
                id="fonte"
                type="text"
                value={fonte}
                onChange={(e) => setFonte(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Ex: Valor, IRIB, Editorial"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Data de publicacao</Label>
              <input
                id="data"
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="url">Link (opcional)</Label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Boletins de destino *</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {BOLETIM_IDS.map((id) => {
                const checkboxId = `add-${id}`
                return (
                  <label
                    key={id}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={boletinsSelecionados.includes(id)}
                      onCheckedChange={() => toggleBoletim(id)}
                    />
                    <span className="text-sm">{BOLETINS[id]}</span>
                  </label>
                )
              })}
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
