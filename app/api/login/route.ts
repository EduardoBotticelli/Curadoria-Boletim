import { NextResponse } from "next/server"

const AUTH_COOKIE_NAME = "curadoria-auth"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias em segundos

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const senhaDigitada: string | undefined = body?.senha
    const senhaEsperada = process.env.SITE_PASSWORD

    if (!senhaEsperada) {
      return NextResponse.json(
        { erro: "Senha nao configurada no servidor" },
        { status: 500 }
      )
    }

    if (!senhaDigitada) {
      return NextResponse.json({ erro: "Senha obrigatoria" }, { status: 400 })
    }

    if (senhaDigitada !== senhaEsperada) {
      return NextResponse.json({ erro: "Senha incorreta" }, { status: 401 })
    }

    // Senha correta - seta cookie
    const resposta = NextResponse.json({ sucesso: true })
    resposta.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: senhaEsperada,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return resposta
  } catch {
    return NextResponse.json({ erro: "Erro ao processar login" }, { status: 500 })
  }
}
