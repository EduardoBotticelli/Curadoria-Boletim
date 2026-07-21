"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      })

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({ erro: "Erro desconhecido" }))
        setErro(dados.erro || "Senha incorreta")
        setCarregando(false)
        return
      }

      // Login bem-sucedido: redireciona para pagina original ou home
      const destino = searchParams.get("from") || "/"
      router.push(destino)
      router.refresh()
    } catch {
      setErro("Nao foi possivel fazer login. Tente novamente.")
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-[#0d3320] via-[#1a4d2e] to-[#2d8659] p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <LockIcon className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Curadoria do Boletim</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesso restrito. Digite a senha para continuar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha</Label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Digite a senha"
              autoFocus
              required
            />
          </div>

          {erro && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </div>
          )}

          <Button type="submit" disabled={carregando || !senha}>
            {carregando ? "Verificando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lobo de Rizzo Advogados
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
