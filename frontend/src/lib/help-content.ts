import {
  BarChart3,
  Database,
  Bot,
} from "lucide-react"

interface Tutorial {
  id: string
  title: string
  description: string
  category: string
  level: 'Básico' | 'Intermediário' | 'Avançado'
  duration: string
  icon: React.ComponentType<{ className?: string }>
  steps: string[]
  tips?: string[]
}

interface FAQ {
  question: string
  answer: string
  category: string
}

export const tutorials: Tutorial[] = [
  {
    id: "dashboard-overview",
    title: "Visão Geral do Dashboard",
    description: "Aprenda a navegar e interpretar as informações do painel principal",
    category: "Dashboard",
    level: "Básico",
    duration: "5 min",
    icon: BarChart3,
    steps: [
      "Acesse o Dashboard através do menu lateral esquerdo",
      "Observe os cartões de resumo na parte superior com métricas de datasets, registros e armazenamento",
      "Navegue pela página usando o scroll para ver todos os gráficos",
      "Visualize o volume de dados mensal e status dos datasets",
      "Analise as métricas de qualidade dos dados",
      "Clique no ícone de expandir nos gráficos para visualização em tela cheia"
    ],
    tips: [
      "O Dashboard é atualizado em tempo real",
      "Use os gráficos em tela cheia para apresentações",
      "Monitore a qualidade dos dados regularmente"
    ]
  },
  {
    id: "datasets-management",
    title: "Gestão de Datasets",
    description: "Como cadastrar, importar e gerenciar conjuntos de dados",
    category: "Datasets",
    level: "Básico",
    duration: "10 min",
    icon: Database,
    steps: [
      "Navegue para o módulo 'Datasets' no menu lateral",
      "Use a barra de pesquisa para encontrar datasets específicos",
      "Clique em 'Novo Dataset' para cadastrar um conjunto de dados",
      "Preencha informações como nome, descrição e tipo de dado",
      "Faça upload dos arquivos de dados (CSV, JSON, Excel)",
      "Configure metadados e categorias para melhor organização",
      "Monitore o status do processamento na lista principal"
    ],
    tips: [
      "Datasets podem ser organizados por categorias",
      "Use nomes descritivos para facilitar buscas futuras",
      "Verifique a qualidade dos dados antes de importar"
    ]
  },
  {
    id: "alice-assistant",
    title: "Usando a Alice - Assistente Virtual",
    description: "Aprenda a usar a Alice para análise e insights sobre seus dados",
    category: "Alice",
    level: "Básico",
    duration: "7 min",
    icon: Bot,
    steps: [
      "Acesse a Alice através do menu lateral esquerdo",
      "Leia a mensagem de boas-vindas para entender as capacidades da Alice",
      "Use as perguntas sugeridas ou digite sua própria pergunta",
      "Pergunte sobre volume de dados, armazenamento, status dos datasets ou tendências",
      "A Alice responderá com informações baseadas nos dados reais dos seus datasets",
      "Você pode fazer perguntas de follow-up para aprofundar a análise",
      "Use pedidos como 'me dê recomendações' para insights personalizados"
    ],
    tips: [
      "A Alice entende perguntas em linguagem natural",
      "Seja específico nas suas perguntas para obter respostas mais precisas",
      "Use a Alice para gerar insights rápidos sem precisar criar relatórios",
      "As respostas são baseadas nos dados atuais dos datasets"
    ]
  },
]

export const faqs: FAQ[] = [
  {
    question: "Como posso alterar minha senha?",
    answer: "Acesse as configurações da sua conta através do menu de perfil. Na seção de segurança, você encontrará a opção para alterar sua senha. Por segurança, você precisará informar a senha atual.",
    category: "Conta"
  },
  {
    question: "Por que alguns datasets não aparecem na minha busca?",
    answer: "Verifique suas permissões de acesso. Alguns datasets podem estar restritos por setor, centro ou nível de usuário. Entre em contato com o administrador do sistema se necessário.",
    category: "Permissões"
  },
  {
    question: "Como exportar dados e relatórios?",
    answer: "Na maioria das telas de listagem, você encontrará botões de exportação (CSV, Excel, PDF). Para análises personalizadas, use a busca de dados para gerar consultas específicas e exportar os resultados.",
    category: "Relatórios"
  },
  {
    question: "O DataPort funciona offline?",
    answer: "Não, o DataPort é um sistema web que requer conexão com internet. Todos os dados são salvos automaticamente na nuvem quando há conexão ativa.",
    category: "Técnico"
  },
  {
    question: "Como recuperar datasets excluídos acidentalmente?",
    answer: "O sistema mantém logs e backups de todas as operações. Entre em contato com o suporte imediatamente. Datasets podem ser recuperados dentro de 30 dias da exclusão.",
    category: "Recuperação"
  },
  {
    question: "Posso usar o sistema no celular ou tablet?",
    answer: "Sim, o DataPort é totalmente responsivo e funciona em dispositivos móveis. Recomendamos usar navegadores atualizados (Chrome, Safari, Edge) para melhor experiência.",
    category: "Técnico"
  },
  {
    question: "Como funcionam as notificações do sistema?",
    answer: "O sistema envia notificações para eventos importantes como: processamento de datasets concluído, alertas de armazenamento e erros de importação. Configure suas preferências no perfil.",
    category: "Notificações"
  },
  {
    question: "Quais formatos de arquivo posso importar para datasets?",
    answer: "O DataPort suporta diversos formatos: CSV, JSON, Excel (XLSX, XLS), XML e arquivos de texto delimitado. Para grandes volumes, recomendamos CSV ou JSON otimizados.",
    category: "Datasets"
  },
  {
    question: "Qual o limite de tamanho para upload de datasets?",
    answer: "O limite padrão é de 500MB por arquivo. Para datasets maiores, utilize a funcionalidade de upload em chunks ou entre em contato com o suporte para aumentar o limite.",
    category: "Datasets"
  },
  {
    question: "Como gero relatórios consolidados de múltiplos datasets?",
    answer: "Use a funcionalidade de busca de dados para consultas que agregam informações de vários datasets, ou crie visualizações personalizadas no dashboard.",
    category: "Relatórios"
  },
  {
    question: "Como monitorar a qualidade dos meus dados?",
    answer: "O dashboard exibe métricas de qualidade, completude e consistência dos dados. Você pode visualizar a evolução mensal e identificar datasets que precisam de atenção.",
    category: "Datasets"
  },
  {
    question: "Posso agendar importações automáticas?",
    answer: "Sim, o sistema permite configurar importações programadas. Entre em contato com o suporte para configurar cronogramas de importação automática.",
    category: "Datasets"
  },
  {
    question: "O que a Alice pode fazer?",
    answer: "A Alice é sua assistente virtual de análise de dados. Ela pode responder perguntas sobre volume de dados, armazenamento, status dos datasets, tendências de crescimento e fornecer recomendações baseadas nos dados disponíveis.",
    category: "Alice"
  },
  {
    question: "A Alice tem acesso aos meus dados reais?",
    answer: "Sim, a Alice analisa os dados reais dos seus datasets para fornecer informações precisas e atualizadas. Ela respeita as mesmas permissões de acesso que você possui no sistema.",
    category: "Alice"
  },
  {
    question: "Como fazer perguntas para a Alice?",
    answer: "Basta digitar sua pergunta em linguagem natural no chat. Por exemplo: 'Quantos datasets temos?', 'Como está o armazenamento?' ou 'Me dê recomendações'. A Alice entenderá e responderá com base nos dados.",
    category: "Alice"
  }
]
