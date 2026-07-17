import type { BoletimId } from "./types"

export const BOLETINS: Record<BoletimId, string> = {
  "trabalhista-empresarial": "Trabalhista Empresarial",
  "direito-tributario": "Direito Tributário",
  "societario-ma": "Societário, Fusões e Aquisições",
  "mercado-capitais-fundos": "Mercado de Capitais e Fundos",
  "regulatorio-oleo-gas": "Regulatório e Óleo e Gás",
  "imobiliario-infraestrutura": "Imobiliário e Infraestrutura",
  "ambiental-esg": "Ambiental e ESG",
  "propriedade-intelectual": "PI, Tecnologia e Privacidade",
  "contencioso-civel": "Contencioso Cível",
}

export const BOLETIM_IDS = Object.keys(BOLETINS) as BoletimId[]

export function nomeBoletim(id: BoletimId): string {
  return BOLETINS[id]
}
