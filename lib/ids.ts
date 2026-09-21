/**
 * Identificadores estaveis para os itens da curadoria.
 *
 * O boletim.json nao traz campo de id, e a posicao do item no array muda a
 * cada execucao do pipeline. Por isso o id e derivado do conteudo do item:
 * a URL quando existe, senao fonte + titulo normalizados.
 *
 * O id vale apenas dentro do portal (chaves do React, ids de DOM e
 * localStorage). O gerar_boletim_final.py casa decisao com item do
 * boletim.json por URL e por fonte + titulo, entao o backend nunca precisa
 * interpretar esse id.
 */

/** Remove acentos, colapsa espacos e passa para minusculas. */
function normalizar(valor: string): string {
  return (valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * FNV-1a de 32 bits.
 * Deterministico e sem dependencias, entao produz o mesmo valor no servidor
 * (render) e no cliente (hidratacao).
 */
function fnv1a(texto: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}

/**
 * Chave canonica do item: a mesma logica de casamento usada pelo
 * gerar_boletim_final.py (URL primeiro, fonte + titulo como alternativa).
 */
export function chaveCanonica(url: string, fonte: string, titulo: string): string {
  const urlLimpa = (url || "").trim().replace(/\/+$/, "")

  if (/^https?:\/\//i.test(urlLimpa)) {
    return "url:" + urlLimpa.toLowerCase()
  }

  return "fonte_titulo:" + normalizar(fonte) + "||" + normalizar(titulo)
}

/**
 * Gera o id estavel do item.
 * O prefixo separa itens vindos do pipeline ("it") dos manuais ("mn").
 */
export function idEstavel(
  prefixo: string,
  url: string,
  fonte: string,
  titulo: string
): string {
  return `${prefixo}-${fnv1a(chaveCanonica(url, fonte, titulo))}`
}
