import { idEstavel } from "./ids"
import type { BoletimId, BoletimMetadata, FonteEmDefeso, Noticia } from "./types"

/**
 * Origem do boletim.json.
 *
 * BOLETIM_URL e uma variavel de ambiente do servidor (esta funcao roda apenas
 * em Server Component), util para apontar o portal para uma branch de teste
 * sem alterar codigo. Sem ela, usa o main do repositorio de producao.
 */
const BOLETIM_URL =
  process.env.BOLETIM_URL ||
  "https://raw.githubusercontent.com/EduardoBotticelli/boletim-automacao/refs/heads/main/output/boletim.json"

/**
 * Um item do boletim.json. So os campos que o portal usa: o resto (motivos,
 * palavras-chave, detalhes da classificacao) e registro tecnico do pipeline e
 * fica no log e na auditoria, fora da tela de quem revisa.
 */
interface BackendItem {
  fonte?: string
  categoria?: string
  titulo?: string
  data_publicacao?: string
  resumo?: string
  /** Radares definidos pelo pipeline, ja com o Filtro 1 aplicado. */
  boletins?: string[]
  /** Formato antigo, anterior ao campo "boletins". */
  boletins_confirmados?: string[]
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
    /**
     * Formato atual: [{ fonte, motivo, reativar_em }].
     * Formato antigo: ["CGU | Noticias", ...]. Os dois sao aceitos.
     */
    fontes_em_defeso?: unknown
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

/**
 * Normaliza fontes_em_defeso para o formato de objeto usado no portal.
 *
 * Ate a mudanca recente o backend enviava uma lista de strings. Aceitar os
 * dois formatos evita que o portal quebre se ele voltar a ler um boletim.json
 * antigo (por exemplo depois de um rollback do pipeline).
 */
function normalizarFontesEmDefeso(valor: unknown): FonteEmDefeso[] {
  if (!Array.isArray(valor)) return []

  const resultado: FonteEmDefeso[] = []

  for (const entrada of valor) {
    if (typeof entrada === "string") {
      const fonte = entrada.trim()
      if (fonte) resultado.push({ fonte, motivo: "", reativar_em: "" })
      continue
    }

    if (entrada && typeof entrada === "object") {
      const bruto = entrada as Record<string, unknown>
      const fonte = typeof bruto.fonte === "string" ? bruto.fonte.trim() : ""
      if (!fonte) continue

      resultado.push({
        fonte,
        motivo: typeof bruto.motivo === "string" ? bruto.motivo : "",
        reativar_em: typeof bruto.reativar_em === "string" ? bruto.reativar_em : "",
      })
    }
  }

  return resultado
}

/**
 * Converte um item do boletim.json em Noticia.
 *
 * O Radar do item e o "boletins" que o pipeline gravou, mesmo vazio. Ele ja
 * vem com o Filtro 1 aplicado: quando o pipeline tira um Radar que a fonte
 * nao pode alimentar, "boletins" fica vazio e o item chega sem Radar. O
 * "boletins_confirmados" so e lido em boletim.json antigo, sem "boletins";
 * usa-lo como reserva fazia o item aparecer aprovado justamente no Radar que
 * o Filtro 1 tinha barrado.
 *
 * O conjunto "idsUsados" garante ids unicos mesmo no caso improvavel de duas
 * publicacoes diferentes produzirem a mesma chave canonica.
 */
function converterItem(item: BackendItem, idsUsados: Set<string>): Noticia {
  const radares = filtrarBoletinsValidos(
    Array.isArray(item.boletins) ? item.boletins : item.boletins_confirmados
  )

  const fonte = item.fonte || "Fonte desconhecida"
  const titulo = item.titulo || "(sem titulo)"
  const url = item.url || ""

  let id = idEstavel("it", url, fonte, titulo)
  let sufixo = 2
  while (idsUsados.has(id)) {
    id = `${idEstavel("it", url, fonte, titulo)}-${sufixo}`
    sufixo++
  }
  idsUsados.add(id)

  return {
    id,
    fonte,
    categoria: item.categoria || "",
    titulo,
    data_publicacao: item.data_publicacao || "",
    resumo: item.resumo || "",
    radares_definidos: radares,
    url,
    origem: "scraper",
  }
}

export interface DadosBoletim {
  noticias: Noticia[]
  metadata: BoletimMetadata
  /** Mensagem de falha na leitura do boletim.json, ou null quando deu certo. */
  erro: string | null
}

function metadataVazia(): BoletimMetadata {
  return {
    data_execucao: new Date().toISOString().split("T")[0],
    janela_aplicada: { inicio: "", fim: "" },
    fontes_sem_publicacao: 0,
    fontes_sem_resultado: 0,
    fontes_com_erro_tecnico: 0,
    fontes_em_defeso: [],
  }
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
    const idsUsados = new Set<string>()
    const noticias = itens.map((item) => converterItem(item, idsUsados))

    const metadata: BoletimMetadata = {
      data_execucao: json.data_execucao || new Date().toISOString().split("T")[0],
      janela_aplicada: {
        inicio: json.janela_aplicada?.inicio || "",
        fim: json.janela_aplicada?.fim || "",
      },
      fontes_sem_publicacao: (json.fontes_sem_publicacao_hoje || []).length,
      fontes_sem_resultado: (json.fontes_sem_resultado || []).length,
      fontes_com_erro_tecnico: (json.fontes_com_erro_tecnico || []).length,
      fontes_em_defeso: normalizarFontesEmDefeso(json.boletins_config?.fontes_em_defeso),
    }

    return { noticias, metadata, erro: null }
  } catch (erro) {
    console.error("[buscarBoletimReal] Falha ao buscar boletim:", erro)
    return {
      noticias: [],
      metadata: metadataVazia(),
      erro: erro instanceof Error ? erro.message : String(erro),
    }
  }
}
