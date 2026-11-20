/* Testes de perfil da Área do participante: DISC e 4 Animais.
   Cada pergunta tem 4 opções; a pessoa escolhe a que MAIS combina com ela.
   As opções estão na ordem do fator (DISC: D, I, S, C · Animais: T, G, L, A) e o app embaralha na tela.
   São ferramentas de autoconhecimento, não diagnóstico psicológico. */
window.PANELA_TESTES = {
  disc: {
    id: "disc", nome: "DISC", sub: "Como você age, se comunica e decide",
    fatores: ["D", "I", "S", "C"],
    perguntas: [
      ["Decidido", "Animado", "Paciente", "Cuidadoso"],
      ["Vou direto ao ponto", "Conto histórias", "Escuto com calma", "Explico com detalhes"],
      ["Gosto de desafios", "Gosto de gente", "Gosto de estabilidade", "Gosto de precisão"],
      ["Competitivo", "Otimista", "Leal", "Analítico"],
      ["Numa reunião, quero a decisão", "Numa reunião, quero o clima bom", "Numa reunião, quero todos de acordo", "Numa reunião, quero os dados certos"],
      ["Corro riscos", "Convenço pessoas", "Mantenho a rotina", "Sigo as regras"],
      ["Sob pressão, assumo o comando", "Sob pressão, falo mais", "Sob pressão, fico quieto e aguento", "Sob pressão, reviso tudo"],
      ["Ousado", "Espontâneo", "Calmo", "Organizado"],
      ["Me irrita a lentidão", "Me irrita a solidão", "Me irrita a mudança brusca", "Me irrita o erro"],
      ["Quero ganhar", "Quero ser reconhecido", "Quero segurança", "Quero fazer certo"],
      ["Mando e resolvo", "Inspiro e animo", "Apoio e ajudo", "Planejo e confiro"],
      ["Firme", "Falante", "Gentil", "Exigente"],
      ["Prefiro resultado rápido", "Prefiro trabalho em equipe", "Prefiro um passo de cada vez", "Prefiro um método claro"],
      ["Independente", "Entusiasmado", "Constante", "Disciplinado"],
      ["Diante de um problema, ajo", "Diante de um problema, chamo alguém", "Diante de um problema, espero entender", "Diante de um problema, pesquiso"],
      ["Assertivo", "Persuasivo", "Tolerante", "Perfeccionista"],
      ["Meu medo: perder o controle", "Meu medo: ser rejeitado", "Meu medo: perder a estabilidade", "Meu medo: ser criticado por um erro"],
      ["Prático", "Criativo", "Prestativo", "Lógico"],
      ["Falo o que penso", "Falo com emoção", "Falo com cuidado", "Falo com fatos"],
      ["Líder", "Comunicador", "Conciliador", "Especialista"]
    ],
    perfis: {
      D: { nome: "Dominância", cor: "#E2231A", resumo: "Você é movido a resultado e desafio. Decide rápido, assume a frente e não gosta de enrolação.",
        forcas: ["Toma decisões difíceis", "Resolve problemas com rapidez", "Puxa a equipe para a meta"],
        cuidados: ["Ouvir antes de decidir", "Paciência com o ritmo dos outros", "Não atropelar as pessoas"],
        panela: "Use o Claude para conferir os detalhes que você pula e para preparar conversas com a equipe." },
      I: { nome: "Influência", cor: "#F5B800", resumo: "Você é movido a pessoas e reconhecimento. Comunica bem, anima o ambiente e convence com facilidade.",
        forcas: ["Vende e encanta", "Cria bom clima", "Abre portas e faz contatos"],
        cuidados: ["Terminar o que começa", "Organizar a rotina", "Cuidar dos números"],
        panela: "Use o Claude para organizar agenda, tarefas e o controle que costuma ficar para depois." },
      S: { nome: "Estabilidade", cor: "#7E8A75", resumo: "Você é movido a segurança e harmonia. É leal, paciente e o porto seguro de quem está perto.",
        forcas: ["Constância e confiança", "Ouve e acolhe", "Mantém a equipe unida"],
        cuidados: ["Aceitar mudanças", "Dizer não quando precisa", "Tomar a iniciativa"],
        panela: "Use o Claude para testar mudanças pequenas, com segurança, antes de virar a chave." },
      C: { nome: "Conformidade", cor: "#2D5BD7", resumo: "Você é movido a qualidade e precisão. Analisa, planeja e faz bem feito.",
        forcas: ["Atenção aos detalhes", "Planejamento e método", "Decisões baseadas em dados"],
        cuidados: ["Não travar no perfeccionismo", "Decidir sem ter 100% das informações", "Mostrar mais o que sente"],
        panela: "Use o Claude para acelerar análises e chegar mais rápido à decisão, sem perder a qualidade." }
    }
  },
  animais: {
    id: "animais", nome: "4 Animais", sub: "Tubarão, Gato, Lobo ou Águia?",
    fatores: ["T", "G", "L", "A"],
    perguntas: [
      ["Resultado", "Pessoas", "Organização", "Ideias"],
      ["Faço acontecer", "Faço amizades", "Faço do jeito certo", "Faço diferente"],
      ["Rápido", "Afetuoso", "Metódico", "Visionário"],
      ["Gosto de metas", "Gosto de harmonia", "Gosto de regras claras", "Gosto de novidades"],
      ["No trabalho, quero vencer", "No trabalho, quero me sentir parte", "No trabalho, quero tudo no lugar", "No trabalho, quero liberdade para criar"],
      ["Prático", "Sensível", "Detalhista", "Criativo"],
      ["Me cansa a indecisão", "Me cansa o conflito", "Me cansa a bagunça", "Me cansa a rotina"],
      ["Penso no agora", "Penso nas pessoas", "Penso no processo", "Penso no futuro"],
      ["Competitivo", "Acolhedor", "Responsável", "Inovador"],
      ["Decido pela urgência", "Decido pelo coração", "Decido pelos fatos", "Decido pela intuição"],
      ["Sou bom em executar", "Sou bom em unir", "Sou bom em controlar", "Sou bom em imaginar"],
      ["Direto", "Gentil", "Cauteloso", "Inquieto"],
      ["Meu lema: feito é melhor que perfeito", "Meu lema: juntos somos mais", "Meu lema: cada coisa no seu lugar", "Meu lema: e se fosse diferente?"],
      ["Corajoso", "Comunicativo", "Leal às regras", "Sonhador"],
      ["Um projeto novo: começo já", "Um projeto novo: chamo a turma", "Um projeto novo: faço o plano", "Um projeto novo: desenho a visão"],
      ["Ação", "Emoção", "Razão", "Inspiração"],
      ["Me cobram por ser impaciente", "Me cobram por ser mole demais", "Me cobram por ser rígido", "Me cobram por viver no mundo da lua"],
      ["Gosto de mandar", "Gosto de agradar", "Gosto de planejar", "Gosto de inventar"],
      ["Foco", "Empatia", "Disciplina", "Criatividade"],
      ["Prefiro liderar", "Prefiro conviver", "Prefiro organizar", "Prefiro inovar"]
    ],
    perfis: {
      T: { nome: "Tubarão", cor: "#2D5BD7", resumo: "Você é o executor. Foco em ação e resultado: vê o objetivo e vai atrás, sem rodeios.",
        forcas: ["Rapidez para agir", "Coragem para decidir", "Garra para bater meta"],
        cuidados: ["Paciência com as pessoas", "Ouvir antes de agir", "Não passar por cima dos detalhes"],
        panela: "Delegue ao Claude o que é detalhe e rotina; fique com as decisões." },
      G: { nome: "Gato", cor: "#E2231A", resumo: "Você é o comunicador. Foco em relacionamento e sentimento: cuida das pessoas e do clima.",
        forcas: ["Empatia e escuta", "Cria laços com clientes", "Equipe engajada"],
        cuidados: ["Decidir mesmo com conflito", "Cobrar quando precisa", "Organizar números e prazos"],
        panela: "Use o Claude para estruturar processos e cobranças sem perder o seu jeito acolhedor." },
      L: { nome: "Lobo", cor: "#7E8A75", resumo: "Você é o organizador. Foco em método, regra e controle: faz tudo funcionar direitinho.",
        forcas: ["Organização e disciplina", "Cumpre o combinado", "Controle de processos"],
        cuidados: ["Abrir espaço para o novo", "Flexibilidade", "Não travar no excesso de controle"],
        panela: "Use o Claude para automatizar controles e liberar tempo para pensar no novo." },
      A: { nome: "Águia", cor: "#F5B800", resumo: "Você é o visionário. Foco em ideias e futuro: enxerga oportunidades que ninguém viu.",
        forcas: ["Criatividade", "Visão de futuro", "Inovação"],
        cuidados: ["Tirar as ideias do papel", "Terminar o que começa", "Rotina e detalhes"],
        panela: "Use o Claude como o seu braço de execução: da ideia ao plano, ao site e ao post." }
    }
  }
};
