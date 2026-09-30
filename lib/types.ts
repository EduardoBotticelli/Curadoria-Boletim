export type BoletimId =
  | "trabalhista-empresarial"
  | "direito-tributario"
  | "societario-ma"
  | "mercado-capitais-fundos"
  | "regulatorio-oleo-gas"
  | "imobiliario-infraestrutura"
  | "ambiental-esg"
  | "propriedade-intelectual"
  | "contencioso-civel"

/**
 * Situacao do item no portal.
 *
 * - "aprovado": chegou com Radar definido e vai para o e-mail como veio;
 * - "ajustado": quem revisa mudou o Radar (ou deu um Radar a um item que nao
 *   tinha);
 * - "rejeitado": quem revisa retirou o item do e-mail;
 * - "sem_radar": chegou sem Radar e ninguem atribuiu um. Nao entra no e-mail
 *   e nao bloqueia a confirmacao; a decisao exportada registra o motivo.
 */
export type StatusRevisao = "aprovado" | "ajustado" | "rejeitado" | "sem_radar"

/** O que aconteceu com o item na revisao, para o registro das decisoes. */
export type AcaoRevisao =
  | "mantida"
  | "radar_alterado"
  | "radar_atribuido"
  | "retirada"
  | "sem_radar"
  | "adicionada"

/**
 * Status canonico gravado no decisoes_alice.json.
 * O gerar_boletim_final.py so reconhece estes dois valores no campo "status";
 * "ajustado" e "sem_radar" sao detalhes do portal e viajam em "status_portal".
 */
export type StatusFinal = "aprovado" | "rejeitado"

export type OrigemNoticia = "scraper" | "manual"

/**
 * Fonte suspensa pelo pipeline (defeso eleitoral e afins).
 * O backend passou a enviar objetos; o formato antigo era uma lista de
 * strings e continua sendo aceito na normalizacao em lib/api.ts.
 */
export interface FonteEmDefeso {
  fonte: string
  motivo: string
  reativar_em: string
}

export interface Noticia {
  /**
   * Identificador estavel do item.
   * Derivado da URL (ou de fonte + titulo), nunca da posicao no array.
   * Ver lib/ids.ts.
   */
  id: string
  fonte: string
  categoria: string
  titulo: string
  data_publicacao: string
  resumo: string
  /**
   * Radares em que o item chegou do pipeline ("boletins" do boletim.json).
   * Vazio quando o item chegou sem Radar definido.
   */
  radares_definidos: BoletimId[]
  url: string
  origem: OrigemNoticia
}

export interface ItemRevisao {
  noticia: Noticia
  status: StatusRevisao
  boletinsFinais: BoletimId[]
  tituloEditado?: string
  resumoEditado?: string
  fonteEditada?: string
  urlEditada?: string
  dataPublicacaoEditada?: string
}

/**
 * Conteudo completo de um item adicionado manualmente na curadoria.
 * Vai embutido na decisao porque esse item nao existe no boletim.json e o
 * gerar_boletim_final.py nao teria de onde recuperar o texto.
 */
export interface NoticiaExportada {
  fonte: string
  categoria: string
  titulo: string
  data_publicacao: string
  resumo: string
  url: string
  boletins: BoletimId[]
}

/**
 * Uma decisao no formato canonico.
 *
 * Os campos "url", "fonte" e "titulo" carregam SEMPRE os valores originais:
 * sao a chave de casamento com o item do boletim.json. Qualquer edicao feita
 * na curadoria viaja nos campos "*_editado" / "*_editada", que o
 * gerar_boletim_final.py aplica por cima do item original.
 */
export interface DecisaoExportada {
  id: string
  status: StatusFinal
  /** O que a pessoa fez no portal. Apenas para auditoria. */
  status_portal: StatusRevisao
  /** O mesmo, em uma palavra: mantida, retirada, radar_alterado... */
  acao_revisao: AcaoRevisao
  /** Radares com que o item chegou ao portal, para comparar com os finais. */
  radares_originais: BoletimId[]
  /** Por que o item ficou fora do e-mail (retirado ou sem Radar). */
  motivo?: string
  origem: OrigemNoticia
  url: string
  fonte: string
  titulo: string
  radares_finais: BoletimId[]
  /** Alias de radares_finais, aceito pelo gerar_boletim_final.py. */
  boletins: BoletimId[]
  titulo_editado?: string
  resumo_editado?: string
  fonte_editada?: string
  url_editada?: string
  data_publicacao_editada?: string
  /** Preenchido apenas quando origem === "manual". */
  noticia?: NoticiaExportada
}

export const VERSAO_FORMATO_DECISOES = 2

/**
 * Payload gravado em output/decisoes_alice.json no repo boletim-automacao.
 * O gerar_boletim_final.py le "decisoes" e usa "revisao_concluida" para
 * garantir que nao gera e-mails a partir de um rascunho.
 */
export interface RevisaoPayload {
  versao_formato: number
  revisao_concluida: true
  origem: "portal-curadoria"
  confirmado_em: string
  data_execucao: string
  total_itens: number
  total_aprovados: number
  total_rejeitados: number
  /** Dos rejeitados, os que chegaram sem Radar e ninguem atribuiu um. */
  total_sem_radar: number
  decisoes: DecisaoExportada[]
  /**
   * Radares que vao sair sem nenhuma noticia, com ciencia explicita de quem
   * revisou. O portal so libera a confirmacao depois que cada Radar vazio foi
   * completado ou marcado aqui, entao a lista registra uma decisao humana, nao
   * um efeito colateral da curadoria. O gerar_boletim_final.py apenas anota no
   * resumo da geracao: quem decide o conteudo do Radar e o portal.
   */
  radares_sem_conteudo_confirmados: BoletimId[]
}

export interface JanelaAplicada {
  inicio: string
  fim: string
}

/** Metadados da execucao exibidos no portal. */
export interface BoletimMetadata {
  data_execucao: string
  janela_aplicada: JanelaAplicada
  fontes_sem_publicacao: number
  fontes_sem_resultado: number
  fontes_com_erro_tecnico: number
  fontes_em_defeso: FonteEmDefeso[]
}
