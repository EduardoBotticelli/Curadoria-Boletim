import { BOLETIM_IDS } from "./boletins"
import { idEstavel } from "./ids"
import type {
  BoletimId,
  DecisaoExportada,
  ItemRevisao,
  Noticia,
  RevisaoPayload,
  StatusRevisao,
} from "./types"
import { VERSAO_FORMATO_DECISOES } from "./types"

/** Itens que ainda nao receberam decisao da pessoa que revisa. */
export function itensPendentes(itens: ItemRevisao[]): ItemRevisao[] {
  return itens.filter((item) => item.status === "pendente")
}

/**
 * Radares que sairiam sem nenhuma noticia com as decisoes atuais.
 *
 * Conta apenas o que de fato vai para o e-mail: item pendente ou rejeitado
 * nao alimenta Radar nenhum.
 */
export function radaresSemConteudo(itens: ItemRevisao[]): BoletimId[] {
  const comConteudo = new Set<BoletimId>()

  for (const item of itens) {
    if (item.status === "rejeitado" || item.status === "pendente") continue
    for (const radar of item.boletinsFinais) comConteudo.add(radar)
  }

  return BOLETIM_IDS.filter((radar) => !comConteudo.has(radar))
}

/** Ordem em que os candidatos aparecem: primeiro o que ja passou no crivo. */
const PESO_STATUS: Record<StatusRevisao, number> = {
  aprovado: 0,
  ajustado: 0,
  pendente: 1,
  rejeitado: 2,
}

/**
 * Itens coletados que ainda nao estao em um Radar e poderiam entrar nele.
 *
 * Sao os candidatos oferecidos quando um Radar ficaria vazio: tudo o que foi
 * coletado nesta edicao e nao foi classificado para esse Radar. A ordem poe
 * na frente o que ja foi aprovado para outro Radar, depois o que ninguem
 * olhou, e por ultimo o que foi rejeitado — sem esconder nenhum dos tres,
 * porque a escolha e de quem revisa.
 */
export function candidatosParaRadar(
  itens: ItemRevisao[],
  radar: BoletimId
): ItemRevisao[] {
  return itens
    .filter((item) => !item.boletinsFinais.includes(radar))
    .sort((a, b) => PESO_STATUS[a.status] - PESO_STATUS[b.status])
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
 * Item pendente nao vira decisao: quem revisa precisa dizer o que fazer com
 * ele. Converter pendente em rejeitado aqui transformaria "ninguem olhou"
 * em "foi recusado", que sao coisas diferentes e nao da para distinguir
 * depois. A funcao lanca erro nesse caso; a interface impede que isso
 * chegue ate aqui.
 */
export function montarDecisao(item: ItemRevisao): DecisaoExportada {
  const { noticia } = item

  if (item.status === "pendente") {
    throw new Error(
      `Item ainda pendente de revisao: "${noticia.titulo}". ` +
        "Nenhum item pendente pode virar decisao."
    )
  }

  const incluir = item.status === "aprovado" || item.status === "ajustado"
  const radares = incluir ? item.boletinsFinais : []

  if (incluir && radares.length === 0) {
    throw new Error(
      `Item aprovado sem nenhum Radar: "${noticia.titulo}". ` +
        "Escolha ao menos um Radar ou remova o item."
    )
  }

  const decisao: DecisaoExportada = {
    id: noticia.id,
    status: incluir ? "aprovado" : "rejeitado",
    status_portal: item.status,
    origem: noticia.origem,
    url: noticia.url,
    fonte: noticia.fonte,
    titulo: noticia.titulo,
    radares_finais: radares,
    boletins: radares,
  }

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
 * Lanca erro em dois casos, os dois por falta de decisao humana:
 * - ainda ha item pendente: cada item precisa de uma decisao explicita;
 * - um Radar sairia sem nenhuma noticia e ninguem disse o que fazer com ele.
 *   Para liberar, quem revisa inclui alguma publicacao nesse Radar ou marca
 *   que ele pode sair vazio mesmo assim — e essa marcacao viaja no payload.
 */
export function montarPayloadRevisao(
  itens: ItemRevisao[],
  dataExecucao: string,
  radaresVaziosConfirmados: BoletimId[] = []
): RevisaoPayload {
  const pendentes = itensPendentes(itens)

  if (pendentes.length > 0) {
    throw new Error(
      `A revisao tem ${pendentes.length} item(ns) pendente(s). ` +
        "Revise todos antes de confirmar."
    )
  }

  const confirmados = new Set(radaresVaziosConfirmados)
  const vazios = radaresSemConteudo(itens)
  const semDecisao = vazios.filter((radar) => !confirmados.has(radar))

  if (semDecisao.length > 0) {
    throw new Error(
      `${semDecisao.length} Radar(es) sairiam sem nenhuma publicacao. ` +
        "Inclua alguma ou confirme o envio vazio antes de concluir."
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

export function carregarProgresso(dataExecucao: string): Record<string, ProgressoItem> {
  const salvo = lerJson<ProgressoSalvo>(CHAVE_PROGRESSO)
  if (!salvo || salvo.data_execucao !== dataExecucao) return {}
  if (!salvo.itens || typeof salvo.itens !== "object") return {}
  return salvo.itens
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
