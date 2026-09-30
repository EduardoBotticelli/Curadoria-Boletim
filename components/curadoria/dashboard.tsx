"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  InboxIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { RadaresVaziosDialog } from "./radares-vazios-dialog"
import { BOLETIM_IDS, BOLETINS } from "@/lib/boletins"
import {
  carregarManuais,
  carregarProgresso,
  carregarRadaresVaziosConfirmados,
  escolherRadares,
  itemInicial,
  limparProgresso,
  montarPayloadRevisao,
  radaresSemConteudo,
  restaurarItem,
  salvarManuais,
  salvarProgresso,
  vaiParaOEmail,
} from "@/lib/revisao"
import type { BoletimId, FonteEmDefeso, ItemRevisao, Noticia } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DashboardProps {
  dataExtenso: string
  janelaTemporal: string
  dataExecucao: string
  noticias: Noticia[]
  fontesEmDefeso: FonteEmDefeso[]
  erroCarregamento: string | null
}

function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = (iso || "").split("-")
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso
}

function listarRadares(radares: BoletimId[]): string {
  return radares.map((radar) => BOLETINS[radar]).join(", ")
}

/**
 * A revisao do dia.
 *
 * A noticia com Radar chega incluida; quem revisa so age para retirar uma
 * noticia ou mudar o Radar dela. A que chegou sem Radar fica na lista
 * recolhida "Sem Radar definido": nao bloqueia nada e so entra no e-mail se
 * alguem escolher um Radar para ela. O unico bloqueio e o Radar que sairia
 * sem nenhuma noticia, que precisa de uma noticia ou da confirmacao de que
 * sai assim (um botao confirma todos de uma vez).
 */
export function Dashboard({
  dataExtenso,
  janelaTemporal,
  dataExecucao,
  noticias,
  fontesEmDefeso,
  erroCarregamento,
}: DashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [itens, setItens] = useState<ItemRevisao[]>(() => noticias.map(itemInicial))
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todas")
  const [boletimFiltro, setBoletimFiltro] = useState<BoletimId | "todos">("todos")
  const [focadoId, setFocadoId] = useState<string | null>(null)
  const [ajusteAbertoId, setAjusteAbertoId] = useState<string | null>(null)
  const [semRadarAberto, setSemRadarAberto] = useState(false)
  const [confirmAberto, setConfirmAberto] = useState(false)
  const [radaresVaziosAberto, setRadaresVaziosAberto] = useState(false)
  const [radaresVaziosConfirmados, setRadaresVaziosConfirmados] = useState<BoletimId[]>([])
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  // Restaura, ao montar no cliente, os itens manuais e o progresso da revisao
  // salvos para esta mesma edicao.
  useEffect(() => {
    setMounted(true)

    const manuais = carregarManuais(dataExecucao)
    const progresso = carregarProgresso(dataExecucao)

    setRadaresVaziosConfirmados(carregarRadaresVaziosConfirmados(dataExecucao))

    setItens((atual) => {
      const idsExistentes = new Set(atual.map((item) => item.noticia.id))

      const itensManuais: ItemRevisao[] = manuais
        .filter((noticia) => !idsExistentes.has(noticia.id))
        .map(itemInicial)

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
    salvarProgresso(dataExecucao, itens, radaresVaziosConfirmados)
  }, [mounted, finalizado, dataExecucao, itens, radaresVaziosConfirmados])

  // Fontes que nao foram consultadas nesta edicao. So o nome e a data de
  // volta: o motivo registrado no pipeline pode ser tecnico.
  const textoFontesSuspensas = useMemo(
    () =>
      fontesEmDefeso
        .map((fonte) =>
          fonte.reativar_em
            ? `${fonte.fonte} (volta em ${formatarDataCurta(fonte.reativar_em)})`
            : fonte.fonte
        )
        .join(", "),
    [fontesEmDefeso]
  )

  const principais = useMemo(() => itens.filter((item) => item.status !== "sem_radar"), [itens])
  const semRadar = useMemo(() => itens.filter((item) => item.status === "sem_radar"), [itens])

  const stats = useMemo(
    () => ({
      noEmail: itens.filter(vaiParaOEmail).length,
      alteradas: itens.filter((item) => item.status === "ajustado").length,
      retiradas: itens.filter((item) => item.status === "rejeitado").length,
      semRadar: semRadar.length,
    }),
    [itens, semRadar]
  )

  const contagemBoletins = useMemo(() => {
    const contagem = Object.fromEntries(BOLETIM_IDS.map((id) => [id, 0])) as Record<BoletimId, number>
    for (const item of itens) {
      if (!vaiParaOEmail(item)) continue
      for (const boletim of item.boletinsFinais) contagem[boletim]++
    }
    return contagem
  }, [itens])

  const itensFiltrados = useMemo(() => {
    return principais.filter((item) => {
      if (statusFiltro === "alteradas" && item.status !== "ajustado") return false
      if (statusFiltro === "retiradas" && item.status !== "rejeitado") return false
      if (boletimFiltro !== "todos" && !item.boletinsFinais.includes(boletimFiltro)) {
        return false
      }
      return true
    })
  }, [principais, statusFiltro, boletimFiltro])

  const atualizarItem = useCallback(
    (id: string, mudar: (item: ItemRevisao) => ItemRevisao) => {
      setItens((atual) => atual.map((item) => (item.noticia.id === id ? mudar(item) : item)))
    },
    []
  )

  const desfazer = useCallback(
    (id: string) => {
      atualizarItem(id, restaurarItem)
      toast("Notícia de volta como chegou")
    },
    [atualizarItem]
  )

  const retirar = useCallback(
    (id: string) => {
      atualizarItem(id, (item) => escolherRadares(item, []))
      setAjusteAbertoId((atual) => (atual === id ? null : atual))
      toast("Notícia retirada do e-mail", {
        action: { label: "Desfazer", onClick: () => atualizarItem(id, restaurarItem) },
      })
    },
    [atualizarItem]
  )

  const salvarRadares = useCallback(
    (id: string, radares: BoletimId[]) => {
      const antes = itens.find((item) => item.noticia.id === id)
      atualizarItem(id, (item) => escolherRadares(item, radares))
      setAjusteAbertoId(null)
      if (radares.length === 0) {
        toast("Notícia fora do e-mail")
      } else if (antes?.status === "sem_radar") {
        toast.success(`Notícia incluída em ${listarRadares(radares)}`)
      } else {
        toast.success("Radar alterado")
      }
    },
    [itens, atualizarItem]
  )

  const adicionarItemManual = useCallback(
    (noticia: Noticia) => {
      setItens((atual) => {
        // O id manual e derivado do conteudo, entao adicionar a mesma noticia
        // duas vezes apenas atualiza a existente em vez de duplicar.
        if (atual.some((item) => item.noticia.id === noticia.id)) {
          toast.info("Essa notícia já foi adicionada.")
          return atual
        }

        const novaLista = [itemInicial(noticia), ...atual]
        const manuais = novaLista
          .filter((item) => item.noticia.origem === "manual")
          .map((item) => item.noticia)
        salvarManuais(dataExecucao, manuais)
        return novaLista
      })
    },
    [dataExecucao]
  )

  // Radares que sairiam sem nenhuma noticia com as decisoes de agora.
  const radaresVazios = useMemo(() => radaresSemConteudo(itens), [itens])

  // A confirmacao vale para o Radar que esta vazio agora. Se ele receber uma
  // noticia depois e voltar a ficar vazio, a decisao precisa ser tomada de novo.
  useEffect(() => {
    setRadaresVaziosConfirmados((atual) => {
      const vazios = new Set(radaresVazios)
      const filtrado = atual.filter((radar) => vazios.has(radar))
      return filtrado.length === atual.length ? atual : filtrado
    })
  }, [radaresVazios])

  const radaresVaziosPendentes = useMemo(() => {
    const confirmados = new Set(radaresVaziosConfirmados)
    return radaresVazios.filter((radar) => !confirmados.has(radar))
  }, [radaresVazios, radaresVaziosConfirmados])

  const bloqueado = radaresVaziosPendentes.length > 0

  const resumoConfirmacao = useMemo(
    () => ({
      incluidas: stats.noEmail,
      retiradas: stats.retiradas,
      alteradas: stats.alteradas,
      semRadar: stats.semRadar,
      boletinsGerados: BOLETIM_IDS.filter((id) => contagemBoletins[id] > 0).map((id) => ({
        boletim: id,
        quantidade: contagemBoletins[id],
      })),
    }),
    [stats, contagemBoletins]
  )

  /** Acrescenta uma noticia a um Radar que estava vazio. */
  const incluirNoRadar = useCallback(
    (id: string, radar: BoletimId) => {
      atualizarItem(id, (item) =>
        item.boletinsFinais.includes(radar)
          ? item
          : escolherRadares(item, [...item.boletinsFinais, radar])
      )
      toast.success(`Notícia incluída em ${BOLETINS[radar]}`)
    },
    [atualizarItem]
  )

  const alternarConfirmacaoRadarVazio = useCallback(
    (radar: BoletimId, confirmado: boolean) => {
      setRadaresVaziosConfirmados((atual) => {
        if (confirmado) {
          return atual.includes(radar) ? atual : [...atual, radar]
        }
        return atual.filter((outro) => outro !== radar)
      })
    },
    []
  )

  /** Um clique: todos os Radares vazios saem sem publicacoes. */
  const confirmarTodosVazios = useCallback(() => {
    setRadaresVaziosConfirmados([...radaresVazios])
    toast.success(
      radaresVazios.length === 1
        ? "O Radar sem notícias vai sair sem publicações."
        : `Os ${radaresVazios.length} Radares sem notícias vão sair sem publicações.`
    )
  }, [radaresVazios])

  const abrirConfirmacao = useCallback(() => {
    if (finalizado) return
    if (bloqueado) {
      setRadaresVaziosAberto(true)
      return
    }
    setConfirmAberto(true)
  }, [finalizado, bloqueado])

  const confirmarRevisao = useCallback(async () => {
    if (itens.length === 0) {
      toast.error("Não há notícias nesta edição.")
      return
    }

    // Rede de seguranca: o botao ja leva aos Radares vazios, e o
    // montarPayloadRevisao tambem recusa.
    if (radaresVaziosPendentes.length > 0) {
      setConfirmAberto(false)
      setRadaresVaziosAberto(true)
      return
    }

    setEnviando(true)
    try {
      const resposta = await fetch("/api/revisao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          montarPayloadRevisao(itens, dataExecucao, radaresVaziosConfirmados)
        ),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro || "Não foi possível enviar a revisão.")
      }

      // A revisao foi aceita: o rascunho local nao serve mais.
      limparProgresso()
      setConfirmAberto(false)
      setFinalizado(true)
      toast.success("Revisão confirmada. Os Radares vão ser gerados e enviados.")
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível confirmar a revisão. Tente novamente."
      )
    } finally {
      setEnviando(false)
    }
  }, [itens, dataExecucao, radaresVaziosConfirmados, radaresVaziosPendentes])

  useEffect(() => {
    if (!mounted) return

    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable) return

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        abrirConfirmacao()
        return
      }

      if (confirmAberto || ajudaAberta || radaresVaziosAberto) return

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
      const focado = itens.find((item) => item.noticia.id === focadoId)
      if (!focado) return
      const tecla = e.key.toLowerCase()
      if (tecla === "r") {
        e.preventDefault()
        if (focado.status === "rejeitado") desfazer(focadoId)
        else if (vaiParaOEmail(focado)) retirar(focadoId)
      } else if (tecla === "e") {
        e.preventDefault()
        if (focado.status !== "rejeitado") {
          setAjusteAbertoId((atual) => (atual === focadoId ? null : focadoId))
        }
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [
    mounted,
    focadoId,
    itens,
    itensFiltrados,
    confirmAberto,
    ajudaAberta,
    radaresVaziosAberto,
    finalizado,
    abrirConfirmacao,
    retirar,
    desfazer,
  ])

  function cartao(item: ItemRevisao) {
    return (
      <NewsCard
        key={item.noticia.id}
        item={item}
        focado={focadoId === item.noticia.id}
        ajusteAberto={ajusteAbertoId === item.noticia.id}
        desabilitado={finalizado}
        onFocar={() => setFocadoId(item.noticia.id)}
        onRetirar={() => retirar(item.noticia.id)}
        onDesfazer={() => desfazer(item.noticia.id)}
        onAbrirAjuste={(aberto) => setAjusteAbertoId(aberto ? item.noticia.id : null)}
        onSalvarRadares={(radares) => salvarRadares(item.noticia.id, radares)}
      />
    )
  }

  if (!mounted) {
    return (
      <div className="flex min-h-svh flex-col">
        <PageHeader
          dataExtenso={dataExtenso}
          janelaTemporal={janelaTemporal}
          onAbrirAjuda={() => {}}
        />
        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm text-muted-foreground">Carregando as notícias...</p>
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
              <span className="font-semibold">Não foi possível carregar as notícias de hoje.</span>{" "}
              Tente recarregar a página em alguns minutos. Se continuar, avise o responsável
              pelo sistema.
            </div>
          </div>
        )}

        {fontesEmDefeso.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="text-sm text-amber-900">
              <span className="font-semibold">Fontes não consultadas nesta edição:</span>{" "}
              {textoFontesSuspensas}.
            </div>
          </div>
        )}

        {radaresVazios.length > 0 && !finalizado && (
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
            <TriangleAlertIcon
              className="mt-0.5 size-5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 text-sm text-foreground/90">
              <span className="font-semibold">
                {radaresVazios.length === 1
                  ? "1 Radar está sem notícias:"
                  : `${radaresVazios.length} Radares estão sem notícias:`}
              </span>{" "}
              {listarRadares(radaresVazios)}.{" "}
              {radaresVazios.length === 1
                ? bloqueado
                  ? "Ele pode sair assim, com o aviso de que não houve publicações no período, ou você pode incluir alguma notícia nele."
                  : "Vai sair sem publicações, como você confirmou."
                : bloqueado
                  ? "Eles podem sair assim, com o aviso de que não houve publicações no período, ou você pode incluir alguma notícia neles."
                  : "Vão sair sem publicações, como você confirmou."}
            </div>
            <div className="flex flex-wrap gap-2">
              {bloqueado && (
                <Button size="sm" onClick={confirmarTodosVazios}>
                  Enviar sem publicações
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setRadaresVaziosAberto(true)}>
                {bloqueado ? "Incluir notícias" : "Rever"}
              </Button>
            </div>
          </div>
        )}

        {finalizado && (
          <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
            <CheckCircle2Icon className="size-5 shrink-0 text-success" aria-hidden="true" />
            <p className="text-sm text-foreground/90">
              Revisão confirmada. Os Radares estão sendo gerados e serão enviados aos advogados.
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
              <EmptyTitle>Nenhuma notícia aqui</EmptyTitle>
              <EmptyDescription>
                Nenhuma notícia corresponde aos filtros escolhidos.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">{itensFiltrados.map(cartao)}</div>
        )}

        {semRadar.length > 0 && (
          <Collapsible open={semRadarAberto} onOpenChange={setSemRadarAberto}>
            <section
              aria-label="Sem Radar definido"
              className="mt-4 rounded-xl border border-dashed bg-muted/30"
            >
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  />
                }
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Sem Radar definido ({semRadar.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Notícias coletadas que não foram associadas a nenhum Radar. Ficam fora do
                    e-mail, a menos que você escolha um Radar para alguma delas.
                  </span>
                </div>
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-150",
                    semRadarAberto && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col gap-3 px-4 pb-4">{semRadar.map(cartao)}</div>
              </CollapsibleContent>
            </section>
          </Collapsible>
        )}
      </main>

      <div className="fixed left-4 bottom-4 z-40 md:left-8 md:bottom-8">
        <AddItemDialog onAdicionar={adicionarItemManual} desabilitado={finalizado} />
      </div>

      <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 md:right-8 md:bottom-8">
        {bloqueado && !finalizado && (
          <p
            id="aviso-radares-vazios"
            role="status"
            className="hidden max-w-xs rounded-lg border border-warning/40 bg-background/95 px-3 py-2 text-right text-xs text-foreground/80 shadow-lg backdrop-blur md:block"
          >
            Antes de enviar, confirme os Radares que estão sem notícias.
          </p>
        )}

        <Button
          size="lg"
          className="h-12 px-6 text-base shadow-lg"
          disabled={finalizado}
          aria-describedby={bloqueado && !finalizado ? "aviso-radares-vazios" : undefined}
          onClick={abrirConfirmacao}
        >
          {finalizado ? "Revisão confirmada" : "Confirmar e enviar"}
          {!finalizado && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </div>

      <ConfirmDialog
        aberto={confirmAberto}
        onAbertoChange={setConfirmAberto}
        incluidas={resumoConfirmacao.incluidas}
        retiradas={resumoConfirmacao.retiradas}
        alteradas={resumoConfirmacao.alteradas}
        semRadar={resumoConfirmacao.semRadar}
        boletinsGerados={resumoConfirmacao.boletinsGerados}
        radaresVazios={radaresVazios}
        enviando={enviando}
        onConfirmar={confirmarRevisao}
      />

      <RadaresVaziosDialog
        aberto={radaresVaziosAberto}
        onAbertoChange={setRadaresVaziosAberto}
        radaresVazios={radaresVazios}
        itens={itens}
        confirmados={radaresVaziosConfirmados}
        onIncluir={incluirNoRadar}
        onAlternarConfirmacao={alternarConfirmacaoRadarVazio}
        onConfirmarTodos={confirmarTodosVazios}
      />

      <ShortcutsDialog aberto={ajudaAberta} onAbertoChange={setAjudaAberta} />
    </div>
  )
}
