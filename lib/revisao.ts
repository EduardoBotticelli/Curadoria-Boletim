import { BOLETIM_IDS } from "./boletins"
import { idEstavel } from "./ids"
import type {
  AcaoRevisao,
  BoletimId,
  DecisaoExportada,
  ItemRevisao,
  Noticia,
  RevisaoPayload,
  StatusRevisao,
} from "./types"
import { VERSAO_FORMATO_DECISOES } from "./types"

/** Situacoes em que o item vai para o e-mail. */
export function vaiParaOEmail(item: ItemRevisao): boolean {
  return (item.status === "aprovado" || item.status === "ajustado") && item.boletinsFinais.length > 0
}

/**
 * Situacao inicial de um item: com Radar definido pelo pipeline, chega
 * aprovado; sem Radar, fica na lista "Sem Radar definido". Nenhum item exige
 * decisao: quem revisa so age para retirar ou mudar o Radar.
 */
export function itemInicial(noticia: Noticia): ItemRevisao {
  const temRadar = noticia.radares_definidos.length > 0
  return {
    noticia,
    status: temRadar ? "aprovado" : "sem_radar",
    boletinsFinais: [...noticia.radares_definidos],
  }
}

/** Volta o item a como chegou do pipeline (desfaz retirada ou troca de Radar). */
export function restaurarItem(item: ItemRevisao): ItemRevisao {
  const inicial = itemInicial(item.noticia)
  return { ...item, status: inicial.status, boletinsFinais: inicial.boletinsFinais }
}

/**
 * Aplica uma escolha de Radares feita no painel do item. Sem nenhum Radar,
 * o item sai do e-mail: volta a "sem_radar" se tinha chegado assim, ou fica
 * "rejeitado" (retirado). Com os mesmos Radares de origem, volta a aprovado.
 */
export function escolherRadares(item: ItemRevisao, radares: BoletimId[]): ItemRevisao {
  const origem = item.noticia.radares_definidos
  if (radares.length === 0) {
    return { ...item, status: origem.length > 0 ? "rejeitado" : "sem_radar", boletinsFinais: [] }
  }
  const iguais =
    radares.length === origem.length && radares.every((radar) => origem.includes(radar))
  return { ...item, status: iguais ? "aprovado" : "ajustado", boletinsFinais: [...radares] }
}

/**
 * Radares que sairiam sem nenhuma noticia com as decisoes atuais.
 *
 * Conta apenas o que de fato vai para o e-mail: item retirado ou sem Radar
 * nao alimenta Radar nenhum.
 */
export function radaresSemConteudo(itens: ItemRevisao[]): BoletimId[] {
  const comConteudo = new Set<BoletimId>()

  for (const item of itens) {
    if (!vaiParaOEmail(item)) continue
    for (const radar of item.boletinsFinais) comConteudo.add(radar)
  }

  return BOLETIM_IDS.filter((radar) => !comConteudo.has(radar))
}

/** Ordem em que os candidatos aparecem: primeiro o que ja vai para o e-mail. */
const PESO_STATUS: Record<StatusRevisao, number> = {
  aprovado: 0,
  ajustado: 0,
  sem_radar: 1,
  rejeitado: 2,
}

/**
 * Itens que ainda nao estao em um Radar e poderiam entrar nele.
 *
 * Sao os candidatos oferecidos quando um Radar ficaria vazio: tudo o que foi
 * coletado nesta edicao e nao esta nesse Radar. A ordem poe na frente o que
 * ja vai para outro Radar, depois o que chegou sem Radar, e por ultimo o que
 * foi retirado — sem esconder nenhum dos tres, porque a escolha e de quem
 * revisa.
 */
export function candidatosParaRadar(
  itens: ItemRevisao[],
  radar: BoletimId
): ItemRevisao[] {
  return itens
    .filter((item) => !item.boletinsFinais.includes(radar))
    .sort((a, b) => PESO_STATUS[a.status] - PESO_STATUS[b.status])
}

export const MOTIVO_RETIRADA = "Retirada na revisão."
export const MOTIVO_SEM_RADAR =
  "Chegou sem Radar definido e nenhum Radar foi atribuído na revisão."

function acaoDoItem(item: ItemRevisao): AcaoRevisao {
  if (item.noticia.origem === "manual") return "adicionada"
  if (item.status === "rejeitado") return "retirada"
  if (item.status === "sem_radar") return "sem_radar"
  if (item.status === "ajustado") {
    return item.noticia.radares_definidos.length > 0 ? "radar_alterado" : "radar_atribuido"
  }
  return "mantida"
}

/**
 * Monta a decisao canonica de um item.
 *
 * Regras que o gerar_boletim_final.py depende:
 * - "url", "fonte" e "titulo" sao os valores ORIGINAIS, porque sao a chave de
 *   casamento com o item do boletim.json;
 * - "status" so assume "aprovado" ou "rejeitado";
 * - itens manuais levam o conteudo completo em "noticia", porque nao existem
 *   no boletim.json.
 *
 * O item sem Radar que ninguem tocou vira "rejeitado" com status_portal
 * "sem_radar" e o motivo escrito: nao entra no e-mail, e o registro deixa
 * claro que nao foi retirado por alguem, so nao tinha Radar. "acao_revisao"
 * e "radares_originais" registram o que quem revisa fez em cada item.
 */
export function montarDecisao(item: ItemRevisao): DecisaoExportada {
  const { noticia } = item

  const incluir = vaiParaOEmail(item)
  const radares = incluir ? item.boletinsFinais : []

  if ((item.status === "aprovado" || item.status === "ajustado") && radares.length === 0) {
    throw new Error(
      `Item aprovado sem nenhum Radar: "${noticia.titulo}". ` +
        "Escolha ao menos um Radar ou retire o item."
    )
  }

  const decisao: DecisaoExportada = {
    id: noticia.id,
    status: incluir ? "aprovado" : "rejeitado",
    status_portal: item.status,
    acao_revisao: acaoDoItem(item),
    origem: noticia.origem,
    url: noticia.url,
    fonte: noticia.fonte,
    titulo: noticia.titulo,
    radares_originais: [...noticia.radares_definidos],
    radares_finais: radares,
    boletins: radares,
  }

  if (item.status === "rejeitado") decisao.motivo = MOTIVO_RETIRADA
  if (item.status === "sem_radar") decisao.motivo = MOTIVO_SEM_RADAR

  if (item.tituloEditado && item.tituloEditado !== noticia.titulo) {
    decisao.titulo_editado = item.tituloEditado
  }
  if (item.resumoEditado && item.resumoEditado !== noticia.resumo) {
    decisao.resumo_editado = item.resumoEditado
  }
  if (item.fonteEditada && item.fonteEditada !== noticia.fonte) {
    decisao.fonte_editada = item.fonteEditada
  }
  if (item.urlEditada && item.urlEditada !== noticia.url) {
    decisao.url_editada = item.urlEditada
  }
  if (
    item.dataPublicacaoEditada &&
    item.dataPublicacaoEditada !== noticia.data_publicacao
  ) {
    decisao.data_publicacao_editada = item.dataPublicacaoEditada
  }

  if (noticia.origem === "manual") {
    decisao.noticia = {
      fonte: noticia.fonte,
      categoria: noticia.categoria,
      titulo: noticia.titulo,
      data_publicacao: noticia.data_publicacao,
      resumo: noticia.resumo,
      url: noticia.url,
      boletins: radares,
    }
  }

  return decisao
}

/**
 * Monta o payload completo enviado para POST /api/revisao.
 *
 * Nada fica a espera de decisao: o que chegou com Radar vai, o que chegou
 * sem Radar fica de fora com o motivo. O unico bloqueio e o Radar que
 * sairia sem nenhuma noticia sem que ninguem tenha dito que pode sair assim:
 * quem revisa inclui alguma publicacao nesse Radar ou marca que ele sai
 * vazio mesmo assim, e essa marcacao viaja no payload.
 */
export function montarPayloadRevisao(
  itens: ItemRevisao[],
  dataExecucao: string,
  radaresVaziosConfirmados: BoletimId[] = []
): RevisaoPayload {
  const confirmados = new Set(radaresVaziosConfirmados)
  const vazios = radaresSemConteudo(itens)
  const semDecisao = vazios.filter((radar) => !confirmados.has(radar))

  if (semDecisao.length > 0) {
    throw new Error(
      `${semDecisao.length} Radar(es) sairiam sem nenhuma notícia. ` +
        "Inclua alguma ou confirme que saem sem publicações."
    )
  }

  const decisoes = itens.map(montarDecisao)
  const aprovados = decisoes.filter((d) => d.status === "aprovado").length

  return {
    versao_formato: VERSAO_FORMATO_DECISOES,
    revisao_concluida: true,
    origem: "portal-curadoria",
    confirmado_em: new Date().toISOString(),
    data_execucao: dataExecucao,
    total_itens: decisoes.length,
    total_aprovados: aprovados,
    total_rejeitados: decisoes.length - aprovados,
    total_sem_radar: decisoes.filter((d) => d.status_portal === "sem_radar").length,
    decisoes,
    // So os que de fato ficaram vazios: marcar um Radar e depois completa-lo
    // nao deve registrar uma ciencia que nao vale mais.
    radares_sem_conteudo_confirmados: vazios,
  }
}

/** Gera o id estavel de um item adicionado manualmente. */
export function idItemManual(url: string, fonte: string, titulo: string): string {
  return idEstavel("mn", url, fonte, titulo)
}

// ---------------------------------------------------------------------------
// Persistencia local da revisao em andamento
//
// O estado da curadoria so existia na memoria da aba: recarregar a pagina
// apagava a revisao inteira. Guardamos o progresso no localStorage, sempre
// preso a data_execucao do boletim, para que uma nova edicao comece limpa.
// ---------------------------------------------------------------------------

const CHAVE_PROGRESSO = "curadoria-progresso-v2"
const CHAVE_MANUAIS = "curadoria-manuais-v2"

interface ProgressoItem {
  status: StatusRevisao
  boletinsFinais: string[]
}

interface ProgressoSalvo {
  data_execucao: string
  atualizado_em: string
  itens: Record<string, ProgressoItem>
  /** Radares que quem revisa aceitou enviar sem nenhuma publicacao. */
  radares_vazios_confirmados?: string[]
}

interface ManuaisSalvos {
  data_execucao: string
  noticias: Noticia[]
}

function lerJson<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave)
    if (!bruto) return null
    return JSON.parse(bruto) as T
  } catch {
    return null
  }
}

function gravarJson(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // localStorage indisponivel (aba anonima, cota cheia). A revisao continua
    // funcionando em memoria.
  }
}

function apagar(chave: string): void {
  try {
    localStorage.removeItem(chave)
  } catch {
    // Ignora.
  }
}

const STATUS_VALIDOS: StatusRevisao[] = ["aprovado", "ajustado", "rejeitado", "sem_radar"]

/**
 * Progresso salvo desta edicao. Entrada com status que nao existe mais (o
 * "pendente" de uma aba aberta antes da mudanca) e ignorada: o item volta a
 * como chegou do pipeline.
 */
export function carregarProgresso(dataExecucao: string): Record<string, ProgressoItem> {
  const salvo = lerJson<ProgressoSalvo>(CHAVE_PROGRESSO)
  if (!salvo || salvo.data_execucao !== dataExecucao) return {}
  if (!salvo.itens || typeof salvo.itens !== "object") return {}
  return Object.fromEntries(
    Object.entries(salvo.itens).filter(([, item]) => STATUS_VALIDOS.includes(item?.status))
  )
}

export function salvarProgresso(
  dataExecucao: string,
  itens: ItemRevisao[],
  radaresVaziosConfirmados: BoletimId[] = []
): void {
  const mapa: Record<string, ProgressoItem> = {}
  for (const item of itens) {
    mapa[item.noticia.id] = {
      status: item.status,
      boletinsFinais: item.boletinsFinais,
    }
  }

  const payload: ProgressoSalvo = {
    data_execucao: dataExecucao,
    atualizado_em: new Date().toISOString(),
    itens: mapa,
    radares_vazios_confirmados: radaresVaziosConfirmados,
  }
  gravarJson(CHAVE_PROGRESSO, payload)
}

/** Radares que ja receberam a ciencia de sair vazios, nesta mesma edicao. */
export function carregarRadaresVaziosConfirmados(
  dataExecucao: string
): BoletimId[] {
  const salvo = lerJson<ProgressoSalvo>(CHAVE_PROGRESSO)
  if (!salvo || salvo.data_execucao !== dataExecucao) return []

  const lista = salvo.radares_vazios_confirmados
  if (!Array.isArray(lista)) return []

  return lista.filter((radar): radar is BoletimId =>
    (BOLETIM_IDS as string[]).includes(radar)
  )
}

export function limparProgresso(): void {
  apagar(CHAVE_PROGRESSO)
  apagar(CHAVE_MANUAIS)
}

export function carregarManuais(dataExecucao: string): Noticia[] {
  const salvo = lerJson<ManuaisSalvos>(CHAVE_MANUAIS)
  if (!salvo || salvo.data_execucao !== dataExecucao) return []
  if (!Array.isArray(salvo.noticias)) return []
  return salvo.noticias.filter((n) => n && typeof n.id === "string")
}

export function salvarManuais(dataExecucao: string, noticias: Noticia[]): void {
  const payload: ManuaisSalvos = { data_execucao: dataExecucao, noticias }
  gravarJson(CHAVE_MANUAIS, payload)
}
