import type { BoletimId } from "./types"

export const BOLETIM_IDS: BoletimId[] = [
  "direito-tributario",
  "trabalhista-empresarial",
  "societario-ma",
  "mercado-capitais-fundos",
  "regulatorio-oleo-gas",
  "imobiliario-infraestrutura",
  "ambiental-esg",
  "propriedade-intelectual",
  "contencioso-civel",
]

export const BOLETINS: Record<BoletimId, string> = {
  "direito-tributario": "Radar Tributário",
  "trabalhista-empresarial": "Radar Trabalhista Empresarial",
  "societario-ma": "Radar Societário, Fusões e Aquisições",
  "mercado-capitais-fundos": "Radar Mercado de Capitais e Fundos de Investimento",
  "regulatorio-oleo-gas": "Radar Regulatório e Óleo e Gás",
  "imobiliario-infraestrutura": "Radar Negócios Imobiliários e Infraestrutura",
  "ambiental-esg": "Radar Ambiental e ESG",
  "propriedade-intelectual":
    "Radar Propriedade Intelectual, Tecnologia e Privacidade",
  "contencioso-civel": "Radar Solução de Conflitos",
}

export const DESCRICAO_RADARES =
  "Informativo com atualizações legislativas, regulamentações, consultas públicas e publicações de órgãos reguladores."

export const CLUSTERS_POR_BOLETIM: Record<BoletimId, string[]> = {
  "trabalhista-empresarial": ["Amber", "Pink"],
  "direito-tributario": [
    "Tributário Consultivo",
    "Tributário Contencioso",
  ],
  "societario-ma": [
    "White",
    "Purple",
    "Due Diligence",
  ],
  "mercado-capitais-fundos": [
    "Financeiro Green",
    "Fundos",
  ],
  "regulatorio-oleo-gas": [
    "Regulatório",
    "Óleo & Gás Blue",
  ],
  "imobiliario-infraestrutura": [
    "Imobiliário",
    "Infraestrutura",
  ],
  "ambiental-esg": ["Ambiental"],
  "propriedade-intelectual": ["Propriedade Intelectual"],
  "contencioso-civel": [
    "Contencioso Carbon",
    "Contencioso Gold",
  ],
}
