"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, CheckCircle2Icon, InboxIcon, TriangleAlertIcon } from "lucide-react"
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
import {
  carregarManuais,
  carregarProgresso,
  limparProgresso,
  montarPayloadRevisao,
  salvarManuais,
  salvarProgresso,
} from "@/lib/revisao"
import type {
  BoletimId,
  FonteEmDefeso,
  ItemRevisao,
  Noticia,
  StatusRevisao,
} from "@/lib/types"

interface DashboardProps {
  dataExtenso: string
  janelaTemporal: string
  dataExecucao: string
  noticias: Noticia[]
  fontesEmDefeso: FonteEmDefeso[]
  erroCarregamento: string | null
}

/**
 * Cria itens de revisao a partir das noticias.
 * - Se a noticia foi classificada em algum boletim: status = "aprovado" (ja vai pro boletim final)
 * - Se a noticia eh orfã (nenhum boletim): status = "pendente" (Alice pode resgatar se quiser)
 */
function criarItensDeNoticias(noticias: Noticia[]): ItemRevisao[] {
  return noticias.map((noticia) => {
    const temBoletim = noticia.boletins_confirmados_ia.length > 0
    return {
      noticia,
      status: (temBoletim ? "aprovado" : "pendente") as StatusRevisao,
      boletinsFinais: [...noticia.boletins_confirmados_ia],
    }
  })
}

export function Dashboard({
  dataExtenso,
  janelaTemporal,
  dataExecucao,
  noticias,
  fontesEmDefeso,
  erroCarregamento,
}: DashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [itens, setItens] = useState<ItemRevisao[]>(() => criarItensDeNoticias(noticias))
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos")
  const [boletimFiltro, setBoletimFiltro] = useState<BoletimId | "todos">("todos")
  const [focadoId, setFocadoId] = useState<string | null>(null)
  const [ajusteAbertoId, setAjusteAbertoId] = useState<string | null>(null)
  const [confirmAberto, setConfirmAberto] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  // Restaura, ao montar no cliente, os itens manuais e o progresso da revisao
  // salvos para esta mesma edicao do boletim.
  useEffect(() => {
    setMounted(true)

    const manuais = carregarManuais(dataExecucao)
    const progresso = carregarProgresso(dataExecucao)

    setItens((atual) => {
      const idsExistentes = new Set(atual.map((item) => item.noticia.id))

      const itensManuais: ItemRevisao[] = manuais
        .filter((noticia) => !idsExistentes.has(noticia.id))
        .map((noticia) => ({
          noticia,
          status: "aprovado" as StatusRevisao,
          boletinsFinais: [...noticia.boletins_confirmados_ia],
        }))

      const lista = [...itensManuais, ...atual]

      return lista.map((item) => {
        const salvo = progresso[item.noticia.id]
        if (!salvo) return item

        const boletinsFinais = (salvo.boletinsFinais || []).filter((id): id is BoletimId =>
          (BOLETIM_IDS as string[]).includes(id)
        )

        return { ...item, status: salvo.status, boletinsFinais }
      })
    })
  }, [dataExecucao])

  // Persiste o progresso a cada alteracao, para que um recarregamento acidental
  // nao descarte a revisao inteira.
  useEffect(() => {
    if (!mounted || finalizado) return
    salvarProgresso(dataExecucao, itens)
  }, [mounted, finalizado, dataExecucao, itens])

  // As fontes suspensas chegam do backend como objetos { fonte, motivo,
  // reativar_em }. Antes eram strings, e o portal ainda chamava .split() nelas,
  // o que quebrava a pagina inteira na hidratacao.
  const resumoDefeso = useMemo(() => {
    const motivos = new Set(
      fontesEmDefeso.map((fonte) => fonte.motivo).filter((motivo) => motivo)
    )
    const reativacoes = new Set(
      fontesEmDefeso.map((fonte) => fonte.reativar_em).filter((data) => data)
    )

    const partes: string[] = []
    if (motivos.size > 0) partes.push(`Motivo: ${[...motivos].join("; ")}.`)
    if (reativacoes.size === 1) {
      partes.push(`Previsao de retorno: ${[...reativacoes][0]}.`)
    } else if (reativacoes.size > 1) {
      partes.push(`Previsoes de retorno: ${[...reativacoes].join(", ")}.`)
    }

    return partes.join(" ")
  }, [fontesEmDefeso])

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
      // Nao conta itens rejeitados nem pendentes
      if (item.status === "rejeitado" || item.status === "pendente") continue
      for (const boletim of item.boletinsFinais) contagem[boletim]++
    }
    return contagem
  }, [itens])

  const itensFiltrados = useMemo(() => {
    return itens.filter((item) => {
      if (statusFiltro !== "todos") {
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

  const aprovar = useCallback((id: string) => {
    setItens((atual) =>
      atual.map((item) => {
        if (item.noticia.id !== id) return item
        if (item.noticia.boletins_confirmados_ia.length === 0) {
          toast.info("Item sem sugestao da IA. Escolha manualmente em quais boletins incluir.")
          return item
        }
        return {
          ...item,
          status: "aprovado",
          boletinsFinais: [...item.noticia.boletins_confirmados_ia],
        }
      })
    )
    const item = itens.find((i) => i.noticia.id === id)
    if (item && item.noticia.boletins_confirmados_ia.length === 0) {
      setAjusteAbertoId(id)
      return
    }
    setAjusteAbertoId((atual) => (atual === id ? null : atual))
    toast.success("Item aprovado")
  }, [itens])

  const rejeitar = useCallback((id: string) => {
    setItens((atual) =>
      atual.map((item) =>
        item.noticia.id === id ? { ...item, status: "rejeitado", boletinsFinais: [] } : item
      )
    )
    setAjusteAbertoId((atual) => (atual === id ? null : atual))
    toast("Item removido do boletim")
  }, [])

  const salvarAjustes = useCallback((id: string, boletins: BoletimId[]) => {
    setItens((atual) =>
      atual.map((item) =>
        item.noticia.id === id
          ? {
              ...item,
              status: boletins.length > 0 ? "ajustado" : "rejeitado",
              boletinsFinais: boletins,
            }
          : item
      )
    )
    setAjusteAbertoId(null)
    toast.success(boletins.length > 0 ? "Ajustes salvos" : "Item removido de todos os boletins")
  }, [])

  const adicionarItemManual = useCallback(
    (noticia: Noticia) => {
      const novoItem: ItemRevisao = {
        noticia,
        status: "aprovado",
        boletinsFinais: [...noticia.boletins_confirmados_ia],
      }

      setItens((atual) => {
        // O id manual e derivado do conteudo, entao adicionar o mesmo item
        // duas vezes apenas atualiza o existente em vez de duplicar.
        if (atual.some((item) => item.noticia.id === noticia.id)) {
          toast.info("Esse item ja foi adicionado.")
          return atual
        }

        const novaLista = [novoItem, ...atual]
        const manuais = novaLista
          .filter((item) => item.noticia.origem === "manual")
          .map((item) => item.noticia)
        salvarManuais(dataExecucao, manuais)
        return novaLista
      })
    },
    [dataExecucao]
  )

  const resumoConfirmacao = useMemo(() => {
    const incluidos = itens.filter(
      (item) =>
        item.status !== "rejeitado" &&
        item.status !== "pendente" &&
        item.boletinsFinais.length > 0
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

  /**
   * A revisao so pode ser concluida quando todo item tem decisao.
   * Item pendente nao e convertido nem descartado: ele bloqueia.
   */
  const bloqueadoPorPendencias = stats.pendentes > 0

  const textoPendencias =
    stats.pendentes === 1
      ? "1 item ainda precisa ser revisado"
      : `${stats.pendentes} itens ainda precisam ser revisados`

  const confirmarRevisao = useCallback(async () => {
    if (itens.length === 0) {
      toast.error("Nao ha itens para revisar.")
      return
    }

    // Rede de seguranca: o botao ja fica desabilitado nesse caso, e o
    // montarPayloadRevisao tambem recusa. Nenhum item pendente e convertido
    // em rejeitado nem descartado em silencio.
    const pendentes = itens.filter((item) => item.status === "pendente")
    if (pendentes.length > 0) {
      toast.error(
        pendentes.length === 1
          ? "Ainda ha 1 item pendente. Revise-o antes de confirmar."
          : `Ainda ha ${pendentes.length} itens pendentes. Revise todos antes de confirmar.`
      )
      setConfirmAberto(false)
      return
    }

    setEnviando(true)
    try {
      const resposta = await fetch("/api/revisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(montarPayloadRevisao(itens, dataExecucao)),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro || "Falha ao enviar a revisao")
      }

      // A revisao foi aceita pelo backend: o rascunho local nao serve mais.
      limparProgresso()
      setConfirmAberto(false)
      setFinalizado(true)
      toast.success("Revisao confirmada! Os boletins serao gerados e enviados.")
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Nao foi possivel confirmar a revisao. Tente novamente."
      )
    } finally {
      setEnviando(false)
    }
  }, [itens, dataExecucao])

  useEffect(() => {
    if (!mounted) return

    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable) return

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (finalizado) return
        if (bloqueadoPorPendencias) {
          toast.error(`${textoPendencias}. Revise todos antes de confirmar.`)
          return
        }
        setConfirmAberto(true)
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
  }, [
    mounted,
    focadoId,
    itensFiltrados,
    confirmAberto,
    ajudaAberta,
    finalizado,
    bloqueadoPorPendencias,
    textoPendencias,
    aprovar,
    rejeitar,
  ])

  if (!mounted) {
    return (
      <div className="flex min-h-svh flex-col">
        <PageHeader
          dataExtenso={dataExtenso}
          janelaTemporal={janelaTemporal}
          onAbrirAjuda={() => {}}
        />
        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm text-muted-foreground">Carregando curadoria...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <PageHeader
        dataExtenso={dataExtenso}
        janelaTemporal={janelaTemporal}
        onAbrirAjuda={() => setAjudaAberta(true)}
      />

      <StatsBar {...stats} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-5 pb-28">
        {erroCarregamento && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <TriangleAlertIcon
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="text-sm text-foreground/90">
              <span className="font-semibold">Nao foi possivel carregar o boletim.</span>{" "}
              {erroCarregamento}. Verifique se o workflow do repositorio
              boletim-automacao ja publicou o output/boletim.json de hoje.
            </div>
          </div>
        )}

        {fontesEmDefeso.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="text-sm text-amber-900">
              <span className="font-semibold">Fontes suspensas nesta edicao:</span>{" "}
              {fontesEmDefeso.map((fonte) => fonte.fonte).join(", ")}.{" "}
              {resumoDefeso}
            </div>
          </div>
        )}

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

      <div className="fixed left-4 bottom-4 z-40 md:left-8 md:bottom-8">
        <AddItemDialog onAdicionar={adicionarItemManual} desabilitado={finalizado} />
      </div>

      <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 md:right-8 md:bottom-8">
        {bloqueadoPorPendencias && !finalizado && (
          <p
            id="aviso-pendencias"
            role="status"
            className="max-w-xs rounded-lg border border-warning/40 bg-background/95 px-3 py-2 text-right text-xs text-foreground/80 shadow-lg backdrop-blur"
          >
            {textoPendencias}. Use o filtro &ldquo;Pendentes&rdquo; para
            encontr&aacute;-{stats.pendentes === 1 ? "lo" : "los"}.
          </p>
        )}

        <Button
          size="lg"
          className="h-12 px-6 text-base shadow-lg"
          disabled={finalizado || bloqueadoPorPendencias}
          aria-describedby={
            bloqueadoPorPendencias && !finalizado ? "aviso-pendencias" : undefined
          }
          onClick={() => setConfirmAberto(true)}
        >
          {finalizado
            ? "Revisao confirmada"
            : bloqueadoPorPendencias
              ? textoPendencias
              : "Confirmar revisao"}
          {!finalizado && !bloqueadoPorPendencias && (
            <ArrowRightIcon data-icon="inline-end" />
          )}
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
