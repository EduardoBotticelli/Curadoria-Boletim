import { Dashboard } from "@/components/curadoria/dashboard"

export default function Page() {
  const agora = new Date()
  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
  const janelaTemporal = "Janela: ontem 18h \u2014 hoje 8h"

  return <Dashboard dataExtenso={dataExtenso} janelaTemporal={janelaTemporal} />
}
