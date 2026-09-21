import { NextResponse } from "next/server"

// Configuracao via env vars (setar no Vercel)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER || "EduardoBotticelli"
const GITHUB_REPO = process.env.GITHUB_REPO || "boletim-automacao"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main"
const DECISOES_PATH = "output/decisoes_alice.json"

const VERSAO_FORMATO = 2

/**
 * Uma decisao ja no formato canonico.
 * O contrato completo esta em lib/types.ts (DecisaoExportada) e e lido pelo
 * scripts/gerar_boletim_final.py do repo boletim-automacao.
 */
interface DecisaoCanonica {
  id?: string
  status?: string
  status_portal?: string
  origem?: string
  url?: string
  fonte?: string
  titulo?: string
  radares_finais?: string[]
  boletins?: string[]
  [campo: string]: unknown
}

/** Formato antigo do portal, mantido para nao quebrar uma aba ja aberta. */
interface DecisaoLegada {
  id?: string
  status?: string
  boletins?: string[]
  [campo: string]: unknown
}

interface CorpoRecebido {
  versao_formato?: number
  revisao_concluida?: boolean
  confirmado_em?: string
  confirmadoEm?: string
  data_execucao?: string
  decisoes?: DecisaoCanonica[]
  itens?: DecisaoLegada[]
}

interface PayloadDecisoes {
  versao_formato: number
  revisao_concluida: true
  origem: string
  confirmado_em: string
  data_execucao: string
  total_itens: number
  total_aprovados: number
  total_rejeitados: number
  decisoes: DecisaoCanonica[]
}

const STATUS_CANONICOS = new Set(["aprovado", "rejeitado"])

/**
 * Converte o corpo recebido no payload canonico gravado no repositorio.
 *
 * Duas entradas sao aceitas:
 * - "decisoes": formato atual, ja canonico;
 * - "itens": formato antigo ({ id, status, boletins }). Ele e convertido, mas
 *   sem url/fonte/titulo o gerar_boletim_final.py nao consegue casar as
 *   decisoes com o boletim.json, entao a requisicao e recusada com uma
 *   mensagem explicita em vez de gravar um arquivo que nao gera nada.
 */
function normalizarCorpo(corpo: CorpoRecebido): PayloadDecisoes | { erro: string } {
  const confirmadoEm =
    corpo.confirmado_em || corpo.confirmadoEm || new Date().toISOString()

  if (Array.isArray(corpo.decisoes)) {
    const decisoes = corpo.decisoes

    if (decisoes.length === 0) {
      return { erro: "A revisao nao contem nenhuma decisao." }
    }

    for (const decisao of decisoes) {
      const status = String(decisao.status || "").toLowerCase()
      if (!STATUS_CANONICOS.has(status)) {
        return {
          erro: `Decisao com status invalido: "${decisao.status}". Use "aprovado" ou "rejeitado".`,
        }
      }

      const temChave =
        Boolean(decisao.url) || (Boolean(decisao.fonte) && Boolean(decisao.titulo))
      if (!temChave) {
        return {
          erro: "Ha decisao sem url e sem fonte + titulo; o backend nao conseguiria casar o item.",
        }
      }
    }

    const aprovados = decisoes.filter(
      (decisao) => String(decisao.status).toLowerCase() === "aprovado"
    ).length

    return {
      versao_formato: corpo.versao_formato || VERSAO_FORMATO,
      revisao_concluida: true,
      origem: "portal-curadoria",
      confirmado_em: confirmadoEm,
      data_execucao: corpo.data_execucao || "",
      total_itens: decisoes.length,
      total_aprovados: aprovados,
      total_rejeitados: decisoes.length - aprovados,
      decisoes,
    }
  }

  if (Array.isArray(corpo.itens)) {
    return {
      erro:
        "Formato de revisao desatualizado (campo 'itens' sem url/fonte/titulo). " +
        "Recarregue a pagina para carregar a versao atual do portal.",
    }
  }

  return { erro: "Payload invalido (campo 'decisoes' obrigatorio)." }
}

/**
 * Codifica string para base64 (Node.js runtime).
 * A API do GitHub exige conteudo em base64 para criar/atualizar arquivos.
 */
function toBase64(texto: string): string {
  return Buffer.from(texto, "utf-8").toString("base64")
}

/**
 * Busca o SHA atual do arquivo decisoes_alice.json (se existir).
 * Necessario para atualizar arquivo existente via API do GitHub.
 * Retorna null se o arquivo ainda nao existe.
 */
async function buscarSha(): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DECISOES_PATH}?ref=${GITHUB_BRANCH}`
  const resposta = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  })

  if (resposta.status === 404) return null
  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Falha ao buscar SHA (${resposta.status}): ${texto}`)
  }

  const dados = (await resposta.json()) as { sha?: string }
  return dados.sha || null
}

/**
 * Cria ou atualiza o arquivo decisoes_alice.json no repo do backend.
 */
async function commitDecisoes(payload: PayloadDecisoes): Promise<void> {
  const shaAtual = await buscarSha()

  const conteudoJson = JSON.stringify(payload, null, 2)
  const conteudoBase64 = toBase64(conteudoJson)

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DECISOES_PATH}`

  interface CommitBody {
    message: string
    content: string
    branch: string
    sha?: string
  }

  const body: CommitBody = {
    message: `chore: decisoes da revisao em ${payload.confirmado_em}`,
    content: conteudoBase64,
    branch: GITHUB_BRANCH,
  }
  if (shaAtual) body.sha = shaAtual

  const resposta = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Falha ao commitar decisoes (${resposta.status}): ${texto}`)
  }
}

/**
 * Dispara o workflow gerar_boletim_final.yml via repository_dispatch.
 */
async function dispararWorkflow(): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`
  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "confirmar-revisao",
      client_payload: {
        disparadoEm: new Date().toISOString(),
      },
    }),
  })

  // 204 No Content = sucesso
  if (resposta.status !== 204) {
    const texto = await resposta.text()
    throw new Error(`Falha ao disparar workflow (${resposta.status}): ${texto}`)
  }
}

export async function POST(request: Request) {
  // Verifica configuracao
  if (!GITHUB_TOKEN) {
    console.error("[api/revisao] GITHUB_TOKEN nao configurado no Vercel")
    return NextResponse.json(
      { erro: "Servidor nao configurado. Contate o administrador." },
      { status: 500 }
    )
  }

  // Le e valida o payload
  let corpo: CorpoRecebido
  try {
    corpo = (await request.json()) as CorpoRecebido
  } catch {
    return NextResponse.json({ erro: "Payload invalido (JSON malformado)" }, { status: 400 })
  }

  const normalizado = normalizarCorpo(corpo || {})
  if ("erro" in normalizado) {
    return NextResponse.json({ erro: normalizado.erro }, { status: 400 })
  }

  // 1. Commita decisoes no repo do backend
  try {
    await commitDecisoes(normalizado)
  } catch (erro) {
    console.error("[api/revisao] Erro ao commitar decisoes:", erro)
    return NextResponse.json(
      {
        erro: "Nao foi possivel salvar as decisoes.",
        detalhe: erro instanceof Error ? erro.message : String(erro),
      },
      { status: 502 }
    )
  }

  // 2. Dispara workflow
  try {
    await dispararWorkflow()
  } catch (erro) {
    console.error("[api/revisao] Erro ao disparar workflow:", erro)
    return NextResponse.json(
      {
        erro: "Decisoes salvas, mas nao foi possivel disparar a geracao dos boletins.",
        detalhe: erro instanceof Error ? erro.message : String(erro),
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    sucesso: true,
    mensagem: "Revisao confirmada. Boletins serao gerados em ate 2 minutos.",
    totalItens: normalizado.total_itens,
    totalAprovados: normalizado.total_aprovados,
    confirmadoEm: normalizado.confirmado_em,
  })
}
