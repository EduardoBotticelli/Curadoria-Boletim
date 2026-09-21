# Curadoria-Boletim

Portal interno de curadoria dos Radares jurídicos do Lobo de Rizzo Advogados.
Next.js 16, implantado na Vercel.

## Papel no fluxo

```
boletim-automacao / gerar_boletim.py
  -> output/boletim.json
  -> ESTE PORTAL lê o JSON e apresenta os itens
  -> pessoa aprova, rejeita, ajusta Radares e adiciona itens manuais
  -> POST /api/revisao
  -> boletim-automacao / output/decisoes_alice.json
  -> boletim-automacao / gerar_boletim_final.py
  -> nove output/email_<slug>.html
```

O formato de `decisoes_alice.json` é o contrato entre os dois repositórios e
está documentado em
[`boletim-automacao/docs/contrato-decisoes.md`](https://github.com/EduardoBotticelli/boletim-automacao/blob/main/docs/contrato-decisoes.md).
Os tipos correspondentes ficam em `lib/types.ts` e a montagem do payload em
`lib/revisao.ts`.

## Rodando localmente

```bash
pnpm install
pnpm dev
```

Sem variáveis de ambiente o portal já abre: ele lê o `boletim.json` publicado
no `main` do repositório de backend e a tela de login fica desativada.

### Variáveis de ambiente

| Variável         | Onde   | Para quê |
|------------------|--------|----------|
| `SITE_PASSWORD`  | Vercel | Senha única do portal. Sem ela o `middleware.ts` libera o acesso (útil em dev). |
| `GITHUB_TOKEN`   | Vercel | Token com permissão de escrita no repo `boletim-automacao`. Usado só no servidor, em `app/api/revisao/route.ts`. |
| `GITHUB_OWNER`   | Vercel | Padrão: `EduardoBotticelli`. |
| `GITHUB_REPO`    | Vercel | Padrão: `boletim-automacao`. |
| `GITHUB_BRANCH`  | Vercel | Padrão: `main`. |
| `BOLETIM_URL`    | Opcional | Aponta o portal para outro `boletim.json` (branch de teste). Padrão: o `main` de produção. |

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_`: todas ficam no servidor e
nunca chegam ao bundle do navegador.

## Verificações antes de publicar

```bash
pnpm build        # inclui a checagem de tipos
npx tsc --noEmit  # checagem de tipos isolada
```

A checagem de tipos é parte do build de propósito: os tipos de `lib/types.ts`
descrevem o formato que vem do backend, e uma divergência entre os dois
repositórios precisa quebrar o deploy em vez de quebrar a página no navegador.

## Estrutura

| Caminho | Papel |
|---------|-------|
| `app/page.tsx` | Server Component: busca o boletim e monta o cabeçalho. |
| `lib/api.ts` | Lê e normaliza o `boletim.json` do backend. |
| `lib/types.ts` | Tipos do boletim e o formato canônico das decisões. |
| `lib/ids.ts` | Id estável de cada item, derivado da URL. |
| `lib/revisao.ts` | Monta o payload da revisão e guarda o progresso no navegador. |
| `app/api/revisao/route.ts` | Valida o payload, commita as decisões e dispara o workflow. |
| `components/curadoria/` | Telas da curadoria. |

## Pendências conhecidas

- O visual é provisório. O template definitivo dos e-mails virá do Marketing e
  será aplicado em `scripts/gerar_boletim_final.py` (função `renderizar_html`),
  no repositório `boletim-automacao`.
- `lib/mock-data.ts` e `app/api/noticias/route.ts` são legado da versão com
  dados falsos. Nada na interface os consome.
- `pnpm lint` não funciona: `eslint` não está nas dependências e não há
  `eslint.config.mjs`.
