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

export type StatusRevisao =
  | "pendente"
  | "aprovado"
  | "rejeitado"
  | "ajustado"

export type OrigemNoticia = "scraper" | "manual"

export interface BoletimRejeitado {
  boletim: BoletimId
  motivo: string
}

export interface FonteEmDefeso {
  fonte: string
  motivo: string
  reativar_em: string
}

export interface Noticia {
  /**
   * Identificador estável do item.
   * Deve ser derivado preferencialmente da URL e não da posição no array.
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

export interface DecisaoExportada {
  id: string
  url: string
  fonte: string
  titulo: string
  status: StatusRevisao
  radares_finais: BoletimId[]
  titulo_editado?: string
  resumo_editado?: string
  fonte_editada?: string
  url_editada?: string
  data_publicacao_editada?: string
}

export interface RevisaoPayload {
  revisao_concluida: true
  confirmado_em: string
  decisoes: DecisaoExportada[]
}

export interface JanelaAplicada {
  inicio: string
  fim: string
}

/** Metadados da execução exibidos no portal. */
export interface BoletimMetadata {
  data_execucao: string
  janela_aplicada: JanelaAplicada
  fontes_sem_publicacao: number
  fontes_sem_resultado: number
  fontes_com_erro_tecnico: number
  fontes_em_defeso: FonteEmDefeso[]
}
