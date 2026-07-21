import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_COOKIE_NAME = "curadoria-auth"

// Rotas que NAO precisam de autenticacao
const PUBLIC_PATHS = ["/login", "/api/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permite rotas publicas sem autenticacao
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Verifica se o cookie de autenticacao existe
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)
  const senhaEsperada = process.env.SITE_PASSWORD

  // Se nao ha senha configurada no ambiente, deixa passar (evita quebrar em dev)
  if (!senhaEsperada) {
    return NextResponse.next()
  }

  // Se o cookie existe e bate com a senha, permite acesso
  if (authCookie?.value === senhaEsperada) {
    return NextResponse.next()
  }

  // Redireciona para tela de login
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("from", pathname)
  return NextResponse.redirect(loginUrl)
}

// Aplica o middleware a todas as rotas exceto assets internos do Next
export const config = {
  matcher: [
    /*
     * Ignora:
     * - _next/static (arquivos estaticos)
     * - _next/image (otimizacao de imagens)
     * - favicon.ico
     * - qualquer arquivo com extensao (.png, .svg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
}
