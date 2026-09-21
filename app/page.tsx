import { Dashboard } from "@/components/curadoria/dashboard"
import { buscarBoletimReal } from "@/lib/api"

const meses = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

function formatarDataExtenso(iso: string): string {
  if (!iso) return ""
  const partes = iso.split("-")
  if (partes.length !== 3) return iso
  const ano = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])
  if (Number.isNaN(ano) || Number.isNaN(mes) || Number.isNaN(dia)) return iso
  return `${dia} de ${meses[mes - 1]} de ${ano}`
}

function formatarJanela(inicio: string, fim: string): string {
  if (!inicio && !fim) return "Janela nao disponivel"

  function formatar(iso: string): string {
    if (!iso) return "-"
    const [data, hora] = iso.split("T")
    const partesData = data.split("-")
    if (partesData.length !== 3) return iso
    const dia = partesData[2]
    const mes = partesData[1]
    const ano = partesData[0]
    const dataFormatada = `${dia}/${mes}/${ano}`
    if (hora) return `${dataFormatada} ${hora}`
    return dataFormatada
  }

  return `Janela: ${formatar(inicio)} ate ${formatar(fim)}`
}

export default async function Page() {
  const { noticias, metadata, erro } = await buscarBoletimReal()

  const dataExtenso = formatarDataExtenso(metadata.data_execucao)
  const janelaTemporal = formatarJanela(
    metadata.janela_aplicada.inicio,
    metadata.janela_aplicada.fim
  )

  return (
    <Dashboard
      noticias={noticias}
      dataExtenso={dataExtenso}
      janelaTemporal={janelaTemporal}
      dataExecucao={metadata.data_execucao}
      fontesEmDefeso={metadata.fontes_em_defeso}
      erroCarregamento={erro}
    />
  )
}
