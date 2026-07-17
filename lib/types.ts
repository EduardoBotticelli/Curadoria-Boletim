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

export type StatusRevisao = "pendente" | "aprovado" | "rejeitado" | "ajustado"

export interface BoletimRejeitado {
  boletim: BoletimId
  motivo: string
}

export interface Noticia {
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
}

export interface ItemRevisao {
  noticia: Noticia
  status: StatusRevisao
  boletinsFinais: BoletimId[]
}

export interface RevisaoPayload {
  confirmadoEm: string
  itens: {
    id: string
    status: StatusRevisao
    boletins: BoletimId[]
  }[]
}
