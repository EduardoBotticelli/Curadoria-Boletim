import { idEstavel } from "./ids"
import type {
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
 * Lanca erro se ainda houver item pendente: a revisao so pode ser concluida
 * depois que cada item recebeu uma decisao explicita.
 */
export function montarPayloadRevisao(
  itens: ItemRevisao[],
  dataExecucao: string
): RevisaoPayload {
  const pendentes = itensPendentes(itens)

  if (pendentes.length > 0) {
    throw new Error(
      `A revisao tem ${pendentes.length} item(ns) pendente(s). ` +
        "Revise todos antes de confirmar."
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

export function salvarProgresso(dataExecucao: string, itens: ItemRevisao[]): void {
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
  }
  gravarJson(CHAVE_PROGRESSO, payload)
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
