import type { Noticia } from "./types"

export const NOTICIAS_MOCK: Noticia[] = [
  {
    id: "n-01",
    fonte: "BCB",
    categoria: "Normativo",
    titulo:
      "BCB publica Resolução que altera regras de constituição de fundos de investimento em direitos creditórios",
    data_publicacao: "2026-07-16",
    resumo:
      "O Banco Central do Brasil publicou resolução alterando os requisitos prudenciais aplicáveis a FIDCs, incluindo novos limites de concentração por cedente e exigências adicionais de transparência na cessão de créditos.",
    motivo_filtragem:
      "Norma do BCB com impacto direto na estruturação de fundos de investimento e operações de crédito.",
    palavras_chave_detectadas: ["FIDC", "resolução", "fundos de investimento", "cessão de créditos"],
    boletins_confirmados_ia: ["mercado-capitais-fundos"],
    boletins_rejeitados: [
      {
        boletim: "direito-tributario",
        motivo: "A norma não trata de aspectos tributários dos fundos.",
      },
    ],
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolucao",
  },
  {
    id: "n-02",
    fonte: "CVM",
    categoria: "Ofício Circular",
    titulo:
      "CVM divulga entendimento sobre divulgação de fatores ESG em ofertas públicas e formulários de referência",
    data_publicacao: "2026-07-16",
    resumo:
      "A Superintendência de Registro de Valores Mobiliários divulgou ofício circular consolidando orientações sobre a divulgação de informações relacionadas a práticas ambientais, sociais e de governança por companhias abertas, com efeitos sobre ofertas públicas em andamento.",
    motivo_filtragem:
      "Orientação da CVM que afeta companhias abertas, ofertas públicas e divulgação de práticas ESG.",
    palavras_chave_detectadas: ["ESG", "oferta pública", "formulário de referência", "companhias abertas"],
    boletins_confirmados_ia: ["mercado-capitais-fundos", "ambiental-esg", "societario-ma"],
    boletins_rejeitados: [],
    url: "https://www.gov.br/cvm/pt-br/assuntos/noticias",
  },
  {
    id: "n-03",
    fonte: "ANPD",
    categoria: "Regulamento",
    titulo:
      "ANPD abre consulta pública sobre regulamento de transferência internacional de dados pessoais no setor financeiro",
    data_publicacao: "2026-07-15",
    resumo:
      "A Autoridade Nacional de Proteção de Dados abriu consulta pública para colher contribuições sobre regras específicas de transferência internacional de dados no setor financeiro, incluindo cláusulas contratuais padrão setoriais.",
    motivo_filtragem:
      "Consulta pública da ANPD com impacto em conformidade com a LGPD por instituições financeiras.",
    palavras_chave_detectadas: ["LGPD", "transferência internacional", "dados pessoais", "consulta pública"],
    boletins_confirmados_ia: ["propriedade-intelectual"],
    boletins_rejeitados: [
      {
        boletim: "mercado-capitais-fundos",
        motivo: "O foco é proteção de dados, não regulação de mercado de capitais.",
      },
    ],
    url: "https://www.gov.br/anpd/pt-br/assuntos/noticias",
  },
  {
    id: "n-04",
    fonte: "DOU",
    categoria: "Medida Provisória",
    titulo:
      "Medida Provisória altera regras de tributação de aplicações financeiras de pessoas jurídicas no exterior",
    data_publicacao: "2026-07-16",
    resumo:
      "Publicada no Diário Oficial da União medida provisória que modifica o regime de tributação de lucros e rendimentos auferidos por pessoas jurídicas brasileiras em aplicações financeiras no exterior, com vigência a partir de 2027.",
    motivo_filtragem:
      "Alteração legislativa tributária relevante com impacto em planejamento de investimentos internacionais.",
    palavras_chave_detectadas: ["medida provisória", "tributação", "aplicações financeiras", "exterior"],
    boletins_confirmados_ia: ["direito-tributario", "mercado-capitais-fundos"],
    boletins_rejeitados: [
      {
        boletim: "societario-ma",
        motivo: "Não há impacto direto em operações societárias ou de M&A.",
      },
    ],
    url: "https://www.in.gov.br/web/dou",
  },
  {
    id: "n-05",
    fonte: "TST",
    categoria: "Jurisprudência",
    titulo:
      "TST fixa tese sobre validade de acordo de compensação de jornada em atividades insalubres sem licença prévia",
    data_publicacao: "2026-07-15",
    resumo:
      "O Tribunal Superior do Trabalho, em julgamento de incidente de recursos repetitivos, fixou tese sobre a validade de regimes de compensação de jornada em ambientes insalubres firmados por acordo individual, sem a licença prévia prevista na CLT.",
    motivo_filtragem:
      "Tese vinculante do TST com impacto direto na gestão de jornada por empregadores.",
    palavras_chave_detectadas: ["TST", "compensação de jornada", "insalubridade", "recursos repetitivos"],
    boletins_confirmados_ia: ["trabalhista-empresarial"],
    boletins_rejeitados: [],
    url: "https://www.tst.jus.br/noticias",
  },
  {
    id: "n-06",
    fonte: "ANP",
    categoria: "Resolução",
    titulo:
      "ANP aprova novas regras para individualização da produção em campos compartilhados do pré-sal",
    data_publicacao: "2026-07-16",
    resumo:
      "A Agência Nacional do Petróleo aprovou resolução com novos procedimentos para acordos de individualização da produção (AIP) em jazidas compartilhadas, afetando consórcios operando em blocos do pré-sal.",
    motivo_filtragem:
      "Norma regulatória da ANP com impacto em contratos de exploração e produção de petróleo.",
    palavras_chave_detectadas: ["ANP", "pré-sal", "individualização da produção", "consórcios"],
    boletins_confirmados_ia: ["regulatorio-oleo-gas"],
    boletins_rejeitados: [
      {
        boletim: "ambiental-esg",
        motivo: "A norma trata de aspectos contratuais, não de licenciamento ambiental.",
      },
    ],
    url: "https://www.gov.br/anp/pt-br/canais_atendimento/imprensa",
  },
  {
    id: "n-07",
    fonte: "CADE",
    categoria: "Decisão",
    titulo:
      "CADE aprova com restrições aquisição de rede varejista por grupo internacional de e-commerce",
    data_publicacao: "2026-07-15",
    resumo:
      "O Tribunal do CADE aprovou, mediante celebração de acordo em controle de concentrações, a aquisição de rede varejista nacional por grupo internacional, impondo remédios estruturais de desinvestimento em três estados.",
    motivo_filtragem:
      "Decisão do CADE relevante para precedentes em controle de concentrações.",
    palavras_chave_detectadas: ["CADE", "ato de concentração", "remédios", "aquisição"],
    boletins_confirmados_ia: ["societario-ma"],
    boletins_rejeitados: [
      {
        boletim: "contencioso-civel",
        motivo: "Trata-se de processo administrativo concorrencial, não contencioso judicial.",
      },
    ],
    url: "https://www.gov.br/cade/pt-br/assuntos/noticias",
  },
  {
    id: "n-08",
    fonte: "IBAMA",
    categoria: "Instrução Normativa",
    titulo:
      "IBAMA publica instrução normativa sobre compensação ambiental em empreendimentos de transmissão de energia",
    data_publicacao: "2026-07-16",
    resumo:
      "Nova instrução normativa do IBAMA detalha critérios de cálculo e destinação da compensação ambiental prevista na Lei do SNUC para empreendimentos lineares de transmissão de energia elétrica.",
    motivo_filtragem:
      "Norma ambiental com impacto em licenciamento de projetos de infraestrutura energética.",
    palavras_chave_detectadas: ["IBAMA", "compensação ambiental", "licenciamento", "transmissão de energia"],
    boletins_confirmados_ia: ["ambiental-esg", "imobiliario-infraestrutura"],
    boletins_rejeitados: [
      {
        boletim: "regulatorio-oleo-gas",
        motivo: "O empreendimento é de energia elétrica, não de óleo e gás.",
      },
    ],
    url: "https://www.gov.br/ibama/pt-br/assuntos/noticias",
  },
  {
    id: "n-09",
    fonte: "DOU",
    categoria: "Aviso",
    titulo: "Ministério do Esporte divulga calendário de repasses para projetos de esporte amador em 2027",
    data_publicacao: "2026-07-15",
    resumo:
      "O Ministério do Esporte publicou aviso com o cronograma de repasses de recursos da Lei de Incentivo ao Esporte para projetos de esporte amador aprovados para o exercício de 2027.",
    motivo_filtragem:
      "Menção a 'lei de incentivo' e 'repasses' acionou o filtro de matéria tributária.",
    palavras_chave_detectadas: ["lei de incentivo", "repasses", "recursos"],
    boletins_confirmados_ia: ["direito-tributario"],
    boletins_rejeitados: [
      {
        boletim: "contencioso-civel",
        motivo: "Não há disputa judicial envolvida.",
      },
    ],
    url: "https://www.in.gov.br/web/dou",
  },
  {
    id: "n-10",
    fonte: "STJ",
    categoria: "Jurisprudência",
    titulo:
      "STJ define termo inicial dos juros de mora em ação de indenização por inadimplemento contratual entre empresas",
    data_publicacao: "2026-07-15",
    resumo:
      "A Segunda Seção do STJ, em recurso repetitivo, definiu o termo inicial dos juros de mora em indenizações decorrentes de inadimplemento contratual em relações interempresariais, uniformizando divergência entre as turmas.",
    motivo_filtragem:
      "Precedente vinculante do STJ com impacto em estratégias de contencioso contratual.",
    palavras_chave_detectadas: ["STJ", "juros de mora", "recurso repetitivo", "inadimplemento contratual"],
    boletins_confirmados_ia: ["contencioso-civel"],
    boletins_rejeitados: [],
    url: "https://www.stj.jus.br/sites/portalp/Inicio",
  },
  {
    id: "n-11",
    fonte: "Receita Federal",
    categoria: "Solução de Consulta",
    titulo:
      "Receita Federal publica solução de consulta sobre incidência de PIS/Cofins em reembolso de despesas em contratos de rateio",
    data_publicacao: "2026-07-16",
    resumo:
      "A Coordenação-Geral de Tributação (Cosit) publicou solução de consulta vinculante sobre a não incidência de PIS/Cofins em valores recebidos a título de reembolso em contratos de compartilhamento de custos entre empresas do mesmo grupo.",
    motivo_filtragem:
      "Entendimento vinculante da Receita com impacto em estruturas de cost sharing de grupos empresariais.",
    palavras_chave_detectadas: ["PIS/Cofins", "solução de consulta", "rateio de despesas", "cost sharing"],
    boletins_confirmados_ia: ["direito-tributario", "societario-ma"],
    boletins_rejeitados: [],
    url: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias",
  },
  {
    id: "n-12",
    fonte: "INPI",
    categoria: "Portaria",
    titulo:
      "INPI institui trâmite prioritário para pedidos de patente relacionados a inteligência artificial aplicada à saúde",
    data_publicacao: "2026-07-15",
    resumo:
      "O Instituto Nacional da Propriedade Industrial publicou portaria criando modalidade de exame prioritário para pedidos de patente de invenções que envolvam inteligência artificial aplicada a diagnósticos e tratamentos de saúde.",
    motivo_filtragem:
      "Mudança procedimental do INPI relevante para estratégias de proteção patentária.",
    palavras_chave_detectadas: ["INPI", "patente", "inteligência artificial", "exame prioritário"],
    boletins_confirmados_ia: ["propriedade-intelectual"],
    boletins_rejeitados: [],
    url: "https://www.gov.br/inpi/pt-br/central-de-conteudo/noticias",
  },
  {
    id: "n-13",
    fonte: "Ministério das Cidades",
    categoria: "Portaria",
    titulo:
      "Governo federal regulamenta novo marco de garantias para financiamento imobiliário com alienação fiduciária de segundo grau",
    data_publicacao: "2026-07-16",
    resumo:
      "Portaria interministerial regulamenta dispositivos do marco legal das garantias, viabilizando a alienação fiduciária de segundo grau sobre imóveis já onerados, com impacto direto no mercado de crédito imobiliário.",
    motivo_filtragem:
      "Regulamentação com impacto em garantias imobiliárias e estruturação de financiamentos.",
    palavras_chave_detectadas: ["alienação fiduciária", "marco das garantias", "crédito imobiliário"],
    boletins_confirmados_ia: ["imobiliario-infraestrutura", "mercado-capitais-fundos"],
    boletins_rejeitados: [
      {
        boletim: "direito-tributario",
        motivo: "A portaria não altera a tributação das operações.",
      },
    ],
    url: "https://www.gov.br/cidades/pt-br/assuntos/noticias",
  },
  {
    id: "n-14",
    fonte: "MTE",
    categoria: "Nota Técnica",
    titulo:
      "Ministério do Trabalho divulga nota técnica sobre fiscalização de trabalho em plataformas digitais",
    data_publicacao: "2026-07-15",
    resumo:
      "Nota técnica da Secretaria de Inspeção do Trabalho orienta auditores-fiscais sobre critérios de caracterização de vínculo empregatício de trabalhadores de plataformas digitais de transporte e entrega.",
    motivo_filtragem:
      "Orientação de fiscalização com impacto em empresas de tecnologia e plataformas digitais.",
    palavras_chave_detectadas: ["plataformas digitais", "vínculo empregatício", "fiscalização", "gig economy"],
    boletins_confirmados_ia: ["trabalhista-empresarial", "propriedade-intelectual"],
    boletins_rejeitados: [
      {
        boletim: "contencioso-civel",
        motivo: "A matéria é trabalhista e administrativa, sem contencioso cível direto.",
      },
    ],
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo",
  },
  {
    id: "n-15",
    fonte: "ANEEL",
    categoria: "Comunicado",
    titulo: "ANEEL divulga resultado de pesquisa de satisfação de consumidores residenciais de energia elétrica",
    data_publicacao: "2026-07-15",
    resumo:
      "A Agência Nacional de Energia Elétrica divulgou o índice anual de satisfação do consumidor residencial, apontando melhora na percepção sobre qualidade do fornecimento nas regiões Sul e Sudeste.",
    motivo_filtragem:
      "Comunicado de agência reguladora captado pelo coletor, mas sem identificação clara de impacto jurídico.",
    palavras_chave_detectadas: ["ANEEL", "pesquisa de satisfação", "consumidores"],
    boletins_confirmados_ia: [],
    boletins_rejeitados: [
      {
        boletim: "regulatorio-oleo-gas",
        motivo: "Setor elétrico, sem relação com óleo e gás.",
      },
      {
        boletim: "imobiliario-infraestrutura",
        motivo: "Pesquisa de opinião, sem impacto em projetos de infraestrutura.",
      },
      {
        boletim: "contencioso-civel",
        motivo: "Não há litígio ou precedente relevante.",
      },
    ],
    url: "https://www.gov.br/aneel/pt-br/assuntos/noticias",
  },
]
