import { NextResponse } from "next/server"
import { NOTICIAS_MOCK } from "@/lib/mock-data"

/**
 * GET /api/noticias
 * Retorna as notícias pré-filtradas pela IA para curadoria do dia.
 * TODO: integrar com o pipeline real de coleta/classificação (substituir mock).
 */
export async function GET() {
  return NextResponse.json({
    data: new Date().toISOString(),
    total: NOTICIAS_MOCK.length,
    noticias: NOTICIAS_MOCK,
  })
}
