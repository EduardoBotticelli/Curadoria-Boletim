"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, CheckCircle2Icon, InboxIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PageHeader } from "./page-header"
import { StatsBar } from "./stats-bar"
import { FilterBar, type StatusFiltro } from "./filter-bar"
import { NewsCard } from "./news-card"
import { ConfirmDialog } from "./confirm-dialog"
import { ShortcutsDialog } from "./shortcuts-dialog"
import { AddItemDialog } from "./add-item-dialog"
import { BOLETIM_IDS } from "@/lib/boletins"
import { NOTICIAS_MOCK } from "@/lib/mock-data"
import type { BoletimId, ItemRevisao, Noticia, StatusRevisao } from "@/lib/types"

interface DashboardProps {
  dataExtenso: string
  janelaTemporal: string
}

const STORAGE_KEY_MANUAIS = "noticias-manuais"

function criarItensDoMock(): ItemRevisao[] {
  return NOTICIAS_MOCK.map((noticia) => ({
    noticia,
    status: "aprovado" as StatusRevisao,
    boletinsFinais: [...noticia.boletins_confirmados_ia],
  }))
}

export function Dashboard({ dataExtenso, janelaTemporal }: DashboardProps) {
  // ESTADO INICIAL: apenas itens do mock.
  // Os itens manuais do localStorage serao carregados apos hidratacao (useEffect abaixo).
  const [itens, setItens] = useState<ItemRevisao[]>(criarItensDoMock)

  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos")
  const [boletimFiltro, setBoletimFiltro] = useState<BoletimId | "todos">("todos")
  const [focadoId, setFocadoId] = useState<string | null>(null)
  const [ajusteAbertoId, setAjusteAbertoId] = useState<string | null>(null)
  const [confirmAberto, setConfirmAberto] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  // Carrega os itens manuais do localStorage apos a hidratacao inicial.
  // Isso evita o erro "Hydration mismatch" porque o servidor nao tem acesso ao localStorage.
  useEffect(() => {
    try {
      const salvos = localStorage.getItem(STORAGE_KEY_MANUAIS)
      if (!salvos) return
      const manuais: Noticia[] = JSON.parse(salvos)
      if (!Array.isArray(manuais) || manuais.length === 0) return

      const itensManuais: ItemRevisao[] = manuais.map((noticia) => ({
        noticia,
        status: "aprovado" as StatusRevisao,
        boletinsFinais: [...noticia.boletins_confirmados_ia],
      }))

      setItens((atual) => {
        // Evita duplicar se o efeito rodar mais de uma vez.
        const idsExistentes = new Set(atual.map((item) => item.noticia.id))
        const novos = itensManuais.filter((item) => !idsExistentes.has(item.noticia.id))
        if (novos.length === 0) return atual
        return [...novos, ...atual]
      })
    } catch {
      // Se der erro na leitura, ignora e segue sem itens manuais.
    }
  }, [])

  // Estatisticas
  const stats = useMemo(() => {
    const contagem = { aprovado: 0, rejeitado: 0, ajustado: 0, pendente: 0 }
    for (const item of itens) contagem[item.status]++
    return {
      total: itens.length,
      aprovados: contagem.aprovado,
      rejeitados: contagem.rejeitado,
      ajustados: contagem.ajustado,
      pendentes: contagem.pendente,
    }
  }, [itens])

  const contagemBoletins = useMemo(() => {
    const contagem = Object.fromEntries(BOLETIM_IDS.map((id) => [id, 0])) as Record<BoletimId, number>
    for (const item of itens) {
      if (item.status === "rejeitado") continue
      for (const boletim of item.boletinsFinais) contagem[boletim]++
    }
    return contagem
  }, [itens])

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      if (statusFiltro !== "todos") {
        // "Aprovados" inclui itens ajustados (tambem entram nos boletins finais).
        const combinaStatus =
          statusFiltro === "aprovado"
            ? item.status === "aprovado" || item.status === "ajustado"
            : item.status === statusFiltro
        if (!combinaStatus) return false
      }
      if (boletimFiltro !== "todos" && !item.boletinsFinais.includes(boletimFiltro)) {
        return false
      }
      return true
    })
  }, [itens, statusFiltro, boletimFiltro])

  // Acoes
  const aprovar = useCallback((id: string) => {
    setItens((atual) =>
      atual.map((item) =>
        item.noticia.id === id
          ? { ...item, status: "aprovado", boletinsFinais: [...item.noticia.boletins_confirmados_ia] }
          : item
      )
    )
    setAjusteAbertoId((atual) => (atual === id ? null : atual))
    toast.success("Item aprovado")
  }, [])

  const rejeitar = useCallback((id: string) => {
    setItens((atual) =>
      atual.map((item) =>
        item.noticia.id === id ? { ...item, status: "rejeitado", boletinsFinais: [] } : item
      )
    )
    setAjusteAbertoId((atual) => (atual === id ? null : atual))
    toast("Item rejeitado")
  }, [])

  const salvarAjustes = useCallback((id: string, boletins: BoletimId[]) => {
    setItens((atual) =>
      atual.map((item) =>
        item.noticia.id === id ? { ...item, status: "ajustado", boletinsFinais: boletins } : item
      )
    )
    setAjusteAbertoId(null)
    toast.success("Ajustes salvos")
  }, [])

  const aprovarTodosPendentes = useCallback(() => {
    let quantidade = 0
    setItens((atual) =>
      atual.map((item) => {
        if (item.status !== "pendente") return item
        quantidade++
        return {
          ...item,
          status: "aprovado",
          boletinsFinais: [...item.noticia.boletins_confirmados_ia],
        }
      })
    )
    toast.success(quantidade === 1 ? "1 item pendente aprovado" : `${quantidade} itens pendentes aprovados`)
  }, [])

  // Adicionar item manualmente (salva no localStorage tambem)
  const adicionarItemManual = useCallback((noticia: Noticia) => {
    const novoItem: ItemRevisao = {
      noticia,
      status: "aprovado",
      boletinsFinais: [...noticia.boletins_confirmados_ia],
    }

    setItens((atual) => {
      const novaLista = [novoItem, ...atual]

      // Persistir apenas os itens manuais no localStorage
      try {
        const manuais = novaLista
          .filter((item) => item.noticia.origem === "manual")
          .map((item) => item.noticia)
        localStorage.setItem(STORAGE_KEY_MANUAIS, JSON.stringify(manuais))
      } catch {
        // Se der erro no salvamento, ignora
      }

      return novaLista
    })
  }, [])

  // Dados do modal de confirmacao
  const resumoConfirmacao = useMemo(() => {
    const incluidos = itens.filter(
      (item) => item.status !== "rejeitado" && item.boletinsFinais.length > 0
    ).length
    const boletinsGerados = BOLETIM_IDS.filter((id) => contagemBoletins[id] > 0).map((id) => ({
      boletim: id,
      quantidade: contagemBoletins[id],
    }))
    return {
      incluidos,
      rejeitados: stats.rejeitados,
      ajustados: stats.ajustados,
      boletinsGerados,
    }
  }, [itens, contagemBoletins, stats.rejeitados, stats.ajustados])

  const confirmarRevisao = useCallback(async () => {
    setEnviando(true)
    try {
      const resposta = await fetch("/api/revisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmadoEm: new Date().toISOString(),
          itens: itens.map((item) => ({
            id: item.noticia.id,
            status: item.status,
            boletins: item.boletinsFinais,
          })),
        }),
      })
      if (!resposta.ok) throw new Error("Falha ao enviar a revisao")
      setConfirmAberto(false)
      setFinalizado(true)
      toast.success("Revisao confirmada! Os boletins serao gerados e enviados.")
    } catch {
      toast.error("Nao foi possivel confirmar a revisao. Tente novamente.")
    } finally {
      setEnviando(false)
    }
  }, [itens])

  // Atalhos de teclado
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable) return

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (!finalizado) setConfirmAberto(true)
        return
      }

      if (confirmAberto || ajudaAberta) return

      if (e.key === "?") {
        e.preventDefault()
        setAjudaAberta(true)
        return
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        if (itensFiltrados.length === 0) return
        const indiceAtual = itensFiltrados.findIndex((item) => item.noticia.id === focadoId)
        const proximo =
          e.key === "ArrowDown"
            ? Math.min(indiceAtual + 1, itensFiltrados.length - 1)
            : Math.max(indiceAtual <= 0 ? 0 : indiceAtual - 1, 0)
        setFocadoId(itensFiltrados[proximo].noticia.id)
        return
      }

      if (!focadoId || finalizado) return
      const tecla = e.key.toLowerCase()
      if (tecla === "a") {
        e.preventDefault()
        aprovar(focadoId)
      } else if (tecla === "r") {
        e.preventDefault()
        rejeitar(focadoId)
      } else if (tecla === "e") {
        e.preventDefault()
        setAjusteAbertoId((atual) => (atual === focadoId ? null : focadoId))
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [focadoId, itensFiltrados, confirmAberto, ajudaAberta, finalizado, aprovar, rejeitar])

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader
        dataExtenso={dataExtenso}
        janelaTemporal={janelaTemporal}
        onAbrirAjuda={() => setAjudaAberta(true)}
      />

      <StatsBar {...stats} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-5 pb-28">
        {finalizado && (
          <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
            <CheckCircle2Icon className="size-5 shrink-0 text-success" aria-hidden="true" />
            <p className="text-sm text-foreground/90">
              Revisao confirmada. Os boletins estao sendo gerados e serao enviados aos advogados.
            </p>
          </div>
        )}

        <FilterBar
          statusFiltro={statusFiltro}
          onStatusChange={setStatusFiltro}
          boletimFiltro={boletimFiltro}
          onBoletimChange={setBoletimFiltro}
          contagemBoletins={contagemBoletins}
          pendentes={stats.pendentes}
          onAprovarTodosPendentes={aprovarTodosPendentes}
          desabilitado={finalizado}
        />

        {itensFiltrados.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>Nenhum item encontrado</EmptyTitle>
              <EmptyDescription>
                Nenhuma noticia corresponde aos filtros selecionados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {itensFiltrados.map((item) => (
              <NewsCard
                key={item.noticia.id}
                item={item}
                focado={focadoId === item.noticia.id}
                ajusteAberto={ajusteAbertoId === item.noticia.id}
                desabilitado={finalizado}
                onFocar={() => setFocadoId(item.noticia.id)}
                onAprovar={() => aprovar(item.noticia.id)}
                onRejeitar={() => rejeitar(item.noticia.id)}
                onAbrirAjuste={(aberto) => setAjusteAbertoId(aberto ? item.noticia.id : null)}
                onSalvarAjustes={(boletins) => salvarAjustes(item.noticia.id, boletins)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botao de adicionar item manual (canto inferior esquerdo) */}
      <div className="fixed left-4 bottom-4 z-40 md:left-8 md:bottom-8">
        <AddItemDialog onAdicionar={adicionarItemManual} desabilitado={finalizado} />
      </div>

      {/* Botao flutuante de finalizacao (canto inferior direito) */}
      <div className="fixed right-4 bottom-4 z-40 md:right-8 md:bottom-8">
        <Button
          size="lg"
          className="h-12 px-6 text-base shadow-lg"
          disabled={finalizado || stats.pendentes > 0}
          onClick={() => setConfirmAberto(true)}
        >
          {finalizado ? "Revisao confirmada" : "Confirmar revisao"}
          {!finalizado && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>

      <ConfirmDialog
        aberto={confirmAberto}
        onAbertoChange={setConfirmAberto}
        incluidos={resumoConfirmacao.incluidos}
        rejeitados={resumoConfirmacao.rejeitados}
        ajustados={resumoConfirmacao.ajustados}
        boletinsGerados={resumoConfirmacao.boletinsGerados}
        enviando={enviando}
        onConfirmar={confirmarRevisao}
      />

      <ShortcutsDialog aberto={ajudaAberta} onAbertoChange={setAjudaAberta} />
    </div>
  )
}
