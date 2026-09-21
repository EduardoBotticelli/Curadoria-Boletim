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

/** Status que a pessoa atribui ao item dentro do portal. */
export type StatusRevisao =
  | "pendente"
  | "aprovado"
  | "rejeitado"
  | "ajustado"

/**
 * Status canonico gravado no decisoes_alice.json.
 * O gerar_boletim_final.py so reconhece estes dois valores no campo "status";
 * "pendente" e "ajustado" sao detalhes do portal e viajam em "status_portal".
 */
export type StatusFinal = "aprovado" | "rejeitado"

export type OrigemNoticia = "scraper" | "manual"

export interface BoletimRejeitado {
  boletim: BoletimId
  motivo: string
}

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
  motivo_filtragem: string
  palavras_chave_detectadas: string[]
  boletins_confirmados_ia: BoletimId[]
  boletins_rejeitados: BoletimRejeitado[]
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
  decisoes: DecisaoExportada[]
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
