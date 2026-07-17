import { NextResponse } from "next/server"
import type { RevisaoPayload } from "@/lib/types"

/**
 * POST /api/revisao
 * Recebe a curadoria final confirmada pela bibliotecária e dispara a geração dos boletins.
 * TODO: integrar com o pipeline real de geração e envio dos boletins.
 */
export async function POST(request: Request) {
  let payload: RevisaoPayload

  try {
    payload = (await request.json()) as RevisaoPayload
  } catch {
    return NextResponse.json({ erro: "Payload inválido." }, { status: 400 })
  }

  if (!payload?.itens || !Array.isArray(payload.itens)) {
    return NextResponse.json({ erro: "Lista de itens ausente." }, { status: 400 })
  }

  // Mock: apenas ecoa um resumo do que seria processado.
  const incluidos = payload.itens.filter((i) => i.status !== "rejeitado" && i.boletins.length > 0)

  return NextResponse.json({
    ok: true,
    recebidoEm: new Date().toISOString(),
    itensIncluidos: incluidos.length,
    itensRejeitados: payload.itens.length - incluidos.length,
  })
}
