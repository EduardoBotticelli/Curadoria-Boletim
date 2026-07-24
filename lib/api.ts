import type { BoletimId, BoletimMetadata, Noticia } from "./types"

const BOLETIM_URL =
  "https://raw.githubusercontent.com/EduardoBotticelli/boletim-automacao/refs/heads/main/output/boletim.json"

interface BackendBoletimRejeitado {
  boletim: string
  motivo: string
}

interface BackendItem {
  fonte?: string
  categoria?: string
  titulo?: string
  data_publicacao?: string
  resumo?: string
  motivo_filtragem?: string
  palavras_chave_detectadas?: string[]
  boletins_confirmados?: string[]
  boletins_rejeitados?: BackendBoletimRejeitado[]
  boletins?: string[]
  url?: string
}

interface BackendJson {
  data_execucao?: string
  janela_aplicada?: { inicio?: string; fim?: string }
  itens?: BackendItem[]
  fontes_sem_publicacao_hoje?: Array<{ fonte: string; motivo: string }>
  fontes_sem_resultado?: Array<{ fonte: string; motivo: string }>
  fontes_com_erro_tecnico?: Array<{ fonte: string; motivo: string }>
  boletins_config?: {
    fontes_em_defeso?: string[]
  }
}

const BOLETIM_IDS_VALIDOS: BoletimId[] = [
  "trabalhista-empresarial",
  "direito-tributario",
  "societario-ma",
  "mercado-capitais-fundos",
  "regulatorio-oleo-gas",
  "imobiliario-infraestrutura",
  "ambiental-esg",
  "propriedade-intelectual",
  "contencioso-civel",
]

function ehBoletimValido(valor: string): valor is BoletimId {
  return (BOLETIM_IDS_VALIDOS as string[]).includes(valor)
}

function filtrarBoletinsValidos(ids: string[] | undefined): BoletimId[] {
  if (!Array.isArray(ids)) return []
  return ids.filter(ehBoletimValido)
}

function converterItem(item: BackendItem, indice: number): Noticia {
  const boletinsBrutos =
    item.boletins && item.boletins.length > 0 ? item.boletins : item.boletins_confirmados || []

  const boletinsFinais = filtrarBoletinsValidos(boletinsBrutos)

  const boletinsRejeitados = (item.boletins_rejeitados || [])
    .filter((rej) => rej && typeof rej.boletim === "string" && ehBoletimValido(rej.boletim))
    .map((rej) => ({
      boletim: rej.boletim as BoletimId,
      motivo: rej.motivo || "",
    }))

  return {
    id: `real-${indice}`,
    fonte: item.fonte || "Fonte desconhecida",
    categoria: item.categoria || "Sem categoria",
    titulo: item.titulo || "(sem titulo)",
    data_publicacao: item.data_publicacao || "",
    resumo: item.resumo || "",
    motivo_filtragem: item.motivo_filtragem || "",
    palavras_chave_detectadas: Array.isArray(item.palavras_chave_detectadas)
      ? item.palavras_chave_detectadas
      : [],
    boletins_confirmados_ia: boletinsFinais,
    boletins_rejeitados: boletinsRejeitados,
    url: item.url || "",
    origem: "scraper",
  }
}

export interface DadosBoletim {
  noticias: Noticia[]
  metadata: BoletimMetadata
}

export async function buscarBoletimReal(): Promise<DadosBoletim> {
  try {
    const resposta = await fetch(BOLETIM_URL, {
      next: { revalidate: 300 },
    })

    if (!resposta.ok) {
      throw new Error(`GitHub retornou status ${resposta.status}`)
    }

    const json: BackendJson = await resposta.json()
    const itens = Array.isArray(json.itens) ? json.itens : []
    const noticias = itens.map(converterItem)

    const fontesEmDefeso = Array.isArray(json.boletins_config?.fontes_em_defeso)
      ? json.boletins_config.fontes_em_defeso
      : []

    const metadata: BoletimMetadata = {
      data_execucao: json.data_execucao || new Date().toISOString().split("T")[0],
      janela_aplicada: {
        inicio: json.janela_aplicada?.inicio || "",
        fim: json.janela_aplicada?.fim || "",
      },
      fontes_sem_publicacao: (json.fontes_sem_publicacao_hoje || []).length,
      fontes_sem_resultado: (json.fontes_sem_resultado || []).length,
      fontes_com_erro_tecnico: (json.fontes_com_erro_tecnico || []).length,
      fontes_em_defeso: fontesEmDefeso,
    }

    return { noticias, metadata }
  } catch (erro) {
    console.error("[buscarBoletimReal] Falha ao buscar boletim:", erro)
    return {
      noticias: [],
      metadata: {
        data_execucao: new Date().toISOString().split("T")[0],
        janela_aplicada: { inicio: "", fim: "" },
        fontes_sem_publicacao: 0,
        fontes_sem_resultado: 0,
        fontes_com_erro_tecnico: 0,
        fontes_em_defeso: [],
      },
    }
  }
}
