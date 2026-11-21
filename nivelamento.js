/* Nivelamento de A Panela: aulas curtas em vídeo que dão a todo participante o mesmo kit básico antes do 1º encontro.
   Estrutura inspirada no formato de aulas da Íntegros (aulas curtas com ferramenta); conteúdo próprio da Panela.
   video: código do vídeo no Bunny Stream (preencher quando gravar). roteiro: tópicos para o Ramon gravar (não aparece para o aluno). */
window.NIVELAMENTO = {
  modulos: [
    {
      id: "comece", titulo: "Comece por aqui",
      aulas: [
        {
          id: "boas-vindas", titulo: "Bem-vindo à Panela", dur: "4:00", video: null,
          resumo: "Por que esta mentoria existe, como ela funciona e o que você vai ter feito daqui a 12 semanas.",
          pontos: ["Panela só é ruim pra quem tá de fora: o que é este grupo", "Os 12 encontros, os individuais e o grupo de dúvidas", "O combinado: aplicar, não só assistir"],
          tarefa: "Entre no grupo de dúvidas no WhatsApp e se apresente: nome, negócio e a tarefa que mais rouba o seu tempo.",
          roteiro: ["Abertura: a história de quem fazia tudo sozinho e não via a família", "O que é a Panela (grupo seleto que se ajuda) e a frase de Santa Teresa: entre as panelas também anda o Senhor", "Como funciona: encontros, individuais, grupo, plataforma", "O combinado: cada aula tem uma ferramenta; quem preenche chega pronto", "Missão: se apresentar no grupo"]
        },
        {
          id: "plataforma", titulo: "Como usar a plataforma", dur: "3:00", video: null,
          resumo: "Um passeio rápido pelas abas: diagnóstico, testes de perfil, nivelamento, encontros, temperos e conquistas.",
          pontos: ["Onde estão as aulas e como marcar como concluída", "As ferramentas que você preenche dentro da aula", "Como os pontos e os prêmios funcionam"],
          tarefa: "Instale a plataforma no celular (Adicionar à tela de início) e faça o diagnóstico.",
          roteiro: ["Tela a tela, sem pressa: Início, Diagnóstico, Testes de perfil", "Nivelamento: vídeo, ferramenta, anotações, concluir e avançar", "Temperos e Conquistas", "Como instalar no celular", "Missão: fazer o diagnóstico"]
        }
      ]
    },
    {
      id: "nivelamento", titulo: "Nivelamento",
      aulas: [
        {
          id: "negocio", titulo: "O seu negócio em uma página", dur: "10:00", video: null,
          resumo: "Antes de colocar a IA para trabalhar, você precisa enxergar o seu negócio inteiro numa folha só.",
          pontos: ["O que você vende, para quem e como o dinheiro entra", "Onde o seu tempo vai embora", "O que trava hoje: o gargalo número 1"],
          ferramenta: {
            nome: "Raio-X em uma página",
            campos: [
              { rot: "O que eu vendo", dica: "Produtos ou serviços principais, em uma frase cada." },
              { rot: "Para quem eu vendo", dica: "Quem compra de você hoje (e quem você gostaria que comprasse)." },
              { rot: "Como o cliente chega até mim", dica: "Indicação, Instagram, loja, WhatsApp, parcerias..." },
              { rot: "Quanto entra por mês (aproximado)", dica: "Uma faixa já serve. Fica só com você." },
              { rot: "Onde o meu tempo vai embora", dica: "As 3 tarefas que mais tomam o seu dia." },
              { rot: "O que mais trava o negócio hoje", dica: "O gargalo número 1." }
            ]
          },
          prompt: "Você é meu consultor de negócios. Abaixo está o raio-X do meu negócio. Me devolva: (1) um resumo em 5 linhas, (2) os 3 pontos fortes, (3) os 3 riscos e (4) qual das tarefas que tomam o meu tempo pode ser feita por você, Claude, já nesta semana.",
          tarefa: "Preencha o raio-X e salve o resumo que o Claude devolver: ele vai para o seu Projeto no 3º encontro.",
          roteiro: ["Abertura: dono que sabe tudo de cabeça, mas nunca colocou no papel", "Os 6 campos do raio-X, com um exemplo real (loja, confeitaria ou consultório)", "Demonstração: colar o raio-X no Claude com o pedido pronto", "Ler a resposta e mostrar o que aproveitar", "Missão: preencher e guardar"]
        },
        {
          id: "produto", titulo: "O que você entrega de verdade", dur: "11:00", video: null,
          resumo: "Cliente não compra o seu currículo, compra a mudança que você traz. Vamos organizar os seus produtos do mais simples ao mais completo.",
          pontos: ["A transformação: como o cliente está antes e depois de você", "Porta de entrada, produto principal e o que se repete todo mês", "Qual produto dá mais resultado com menos esforço"],
          ferramenta: {
            nome: "Mapa dos produtos",
            campos: [
              { rot: "Antes: como o meu cliente chega", dica: "A dor, o problema, o que ele sente." },
              { rot: "Depois: como ele sai", dica: "O resultado que ele percebe e conta para os outros." },
              { rot: "Porta de entrada", dica: "O produto barato ou simples que faz a pessoa te conhecer." },
              { rot: "Produto principal", dica: "Onde está o seu melhor resultado e a melhor margem." },
              { rot: "O que pode se repetir (recorrência)", dica: "Assinatura, manutenção, recompra, pacote mensal." }
            ]
          },
          prompt: "Com base no mapa dos meus produtos abaixo, sugira: (1) uma frase de transformação que eu possa usar no Instagram, (2) 3 ideias de porta de entrada e (3) uma forma de tornar parte do faturamento recorrente. Seja prático e use o meu ramo como exemplo.",
          tarefa: "Escolha UMA porta de entrada para testar nas próximas 4 semanas.",
          roteiro: ["Abertura: ninguém compra a furadeira, compra o furo", "Antes e depois: exemplo de 2 ramos diferentes", "A escada: porta de entrada, principal, recorrente (desenho na tela)", "Demonstração no Claude com o mapa preenchido", "Missão: escolher a porta de entrada"]
        },
        {
          id: "cliente", titulo: "O cliente que você quer servir", dur: "11:00", video: null,
          resumo: "Quem tenta vender para todo mundo não fala com ninguém. A ficha do cliente ideal guia o conteúdo, a venda e até o Claude.",
          pontos: ["Os clientes que dão lucro e os que dão trabalho", "A dor real (e não a que você acha que ele tem)", "Onde ele está e o que faz ele decidir"],
          ferramenta: {
            nome: "Ficha do cliente ideal",
            campos: [
              { rot: "Quem é (idade, profissão, momento de vida)", dica: "Pense no seu melhor cliente real." },
              { rot: "A dor que tira o sono dele", dica: "Nas palavras dele, não nas suas." },
              { rot: "O que ele já tentou e não deu certo", dica: "Concorrentes, soluções caseiras, nada." },
              { rot: "Onde ele está", dica: "Instagram, WhatsApp, igreja, bairro, LinkedIn, eventos." },
              { rot: "O que faz ele decidir comprar", dica: "Preço, confiança, rapidez, indicação, garantia." },
              { rot: "O cliente que eu NÃO quero", dica: "Quem dá trabalho e não dá lucro." }
            ]
          },
          prompt: "Esta é a ficha do meu cliente ideal. Escreva: (1) um parágrafo que descreva essa pessoa como se fosse real, com nome, (2) as 10 perguntas que ela mais faria antes de comprar e (3) 5 ideias de conteúdo que respondem essas perguntas.",
          tarefa: "Converse com 3 clientes bons esta semana e confira se a ficha bate.",
          roteiro: ["Abertura: o cliente que pede desconto e o que indica 5 amigos", "Preenchendo a ficha com um cliente real (sem dados pessoais)", "Por que o Claude precisa dessa ficha: tudo o que ele escrever fica melhor", "Demonstração: a persona com nome e as 10 perguntas", "Missão: 3 conversas para validar"]
        },
        {
          id: "atracao", titulo: "De onde vêm os seus clientes", dur: "10:00", video: null,
          resumo: "Todo negócio tem 2 ou 3 caminhos que trazem quase todos os clientes. Descubra os seus e faça a conta simples que mostra quanto esforço cada venda pede.",
          pontos: ["Os canais: indicação, redes, WhatsApp, loja, parcerias", "A conta simples: contatos, conversas e vendas", "O número do dia: quantos contatos você precisa fazer"],
          ferramenta: {
            nome: "Mapa dos canais",
            campos: [
              { rot: "Canal 1 e quantos clientes ele trouxe no último mês", dica: "Ex.: indicação, 6 clientes." },
              { rot: "Canal 2 e quantos clientes trouxe", dica: "" },
              { rot: "Canal 3 e quantos clientes trouxe", dica: "" },
              { rot: "De cada 10 conversas, quantas viram venda", dica: "Um chute honesto já ajuda." },
              { rot: "Quantas vendas eu quero por mês", dica: "" }
            ]
          },
          prompt: "Com os números do meu mapa de canais abaixo, calcule quantos contatos por semana e por dia eu preciso fazer para chegar às vendas que quero. Depois sugira como dobrar o canal que mais funciona, gastando no máximo 30 minutos por dia.",
          tarefa: "Defina o seu número do dia (contatos por dia) e cumpra por 5 dias seguidos.",
          roteiro: ["Abertura: quem não sabe de onde vem o cliente não sabe onde investir", "Os canais mais comuns e como medir sem sistema", "A conta na lousa: contatos, conversas, vendas", "Demonstração: o Claude calculando o número do dia", "Missão: 5 dias de número do dia"]
        },
        {
          id: "semana", titulo: "A semana que cabe na sua vida", dur: "10:00", video: null,
          resumo: "A agenda não é para caber o trabalho; é para caber a vida. Primeiro entram família, oração e saúde. Depois, o trabalho que dá resultado. A burocracia vai para o Claude.",
          pontos: ["Os blocos fixos que não se negociam", "O trabalho que só você pode fazer", "A burocracia que pode sair das suas costas"],
          ferramenta: {
            nome: "Grade da semana",
            campos: [
              { rot: "Blocos fixos de família, oração e saúde", dica: "Ex.: jantar às 19h30, missa no domingo, academia 3x." },
              { rot: "Trabalho que só eu posso fazer (e quando)", dica: "Venda, atendimento-chave, criação." },
              { rot: "Tarefas que posso delegar a alguém", dica: "" },
              { rot: "Burocracia que o Claude pode fazer", dica: "Planilhas, e-mails, orçamentos, posts, relatórios." },
              { rot: "Meu horário de encerrar o dia", dica: "A hora em que o trabalho para." }
            ]
          },
          prompt: "Monte a minha semana em uma tabela de segunda a domingo, por horário, respeitando primeiro os blocos fixos abaixo. Depois encaixe o trabalho que só eu posso fazer. Por fim, liste as tarefas de burocracia e diga como você, Claude, pode fazer cada uma.",
          tarefa: "Siga a grade por uma semana e anote onde ela furou.",
          roteiro: ["Abertura: o pescador de Porto de Galinhas (a família no fim do plano)", "Os 3 tipos de bloco, com a minha própria agenda na tela", "Demonstração: o Claude montando a semana em tabela", "O horário de encerrar o dia como regra", "Missão: uma semana seguindo a grade"]
        },
        {
          id: "pedras", titulo: "Pedras grandes primeiro", dur: "9:00", video: null,
          resumo: "Se a areia entra primeiro, as pedras grandes não cabem. Toda segunda, 3 prioridades que mexem no resultado; o resto vem depois.",
          pontos: ["O que é pedra grande, pedrinha e areia", "As 3 prioridades da semana", "O que cortar sem culpa"],
          ferramenta: {
            nome: "Plano da semana",
            campos: [
              { rot: "Pedra grande 1", dica: "O que, se eu fizer esta semana, mais mexe no resultado?" },
              { rot: "Pedra grande 2", dica: "" },
              { rot: "Pedra grande 3", dica: "" },
              { rot: "O que vou cortar ou adiar", dica: "" },
              { rot: "O que vou pedir ao Claude", dica: "" }
            ]
          },
          prompt: "Estas são as minhas 3 pedras grandes da semana. Quebre cada uma em passos de no máximo 1 hora, distribua de segunda a sexta e me diga o que você, Claude, pode adiantar hoje.",
          tarefa: "Toda segunda de manhã, 15 minutos: preencher o plano da semana.",
          roteiro: ["Abertura: o pote com pedras, pedrinhas e areia", "Como escolher a pedra grande: a pergunta do resultado", "O que cortar e como dizer não", "Demonstração: o Claude quebrando as pedras em passos", "Missão: o ritual de segunda"]
        },
        {
          id: "planilha", titulo: "A planilha do plano semanal", dur: "5:00", video: null,
          resumo: "A planilha que junta a grade da semana, as pedras grandes e o número do dia, para acompanhar sem esforço. Ela fica aqui embaixo: use na própria aula ou baixe em Excel.",
          pontos: ["As 3 partes: grade da semana, pedras grandes e número do dia", "Usar aqui mesmo ou baixar em Excel (abre no Google Planilhas)", "Como pedir ao Claude para analisar a sua semana"],
          tarefa: "Preencha a planilha da semana atual aqui na aula e, no domingo, copie para o Claude analisar.",
          roteiro: ["Mostrar a planilha na tela, parte por parte", "As cores da grade: família, pedra grande, rotina e Claude", "Preencher uma semana de exemplo", "Baixar em Excel e abrir no Google Planilhas", "Pedir ao Claude a análise da semana", "Missão: a semana atual preenchida"]
        },
        {
          id: "metas", titulo: "Metas que cabem na vida real", dur: "10:00", video: null,
          resumo: "Meta boa é a que você enxerga no dia. Vamos descer da meta do ano até o número de hoje, sem sacrificar o que importa.",
          pontos: ["A meta do ano e o porquê dela", "Do ano para o mês, do mês para a semana, da semana para o dia", "A meta que respeita a família"],
          ferramenta: {
            nome: "Desdobramento de metas",
            campos: [
              { rot: "Minha meta para os próximos 12 meses", dica: "Faturamento, clientes ou outro número que importa." },
              { rot: "Por que essa meta importa (para mim e para a família)", dica: "" },
              { rot: "Quanto isso é por mês", dica: "" },
              { rot: "O que preciso fazer toda semana para chegar lá", dica: "" },
              { rot: "Meu número do dia", dica: "Contatos, posts, propostas, visitas..." },
              { rot: "O que eu NÃO vou sacrificar", dica: "" }
            ]
          },
          prompt: "Desdobre a minha meta abaixo em metas mensais (considerando a sazonalidade do meu ramo), semanais e diárias. Diga se ela é realista para quem trabalha no horário que defini e sugira um ajuste se não for.",
          tarefa: "Escreva o número do dia num lugar que você veja toda manhã.",
          roteiro: ["Abertura: meta de virada de ano que morre em fevereiro", "A escada: ano, mês, semana, dia (na tela)", "O que não se sacrifica", "Demonstração: o Claude desdobrando com sazonalidade", "Missão: o número do dia à vista"]
        },
        {
          id: "claude", titulo: "O Claude pronto para o 1º encontro", dur: "12:00", video: null,
          resumo: "Conta criada, um Projeto do seu negócio com tudo o que você preencheu no nivelamento e a primeira tarefa resolvida.",
          pontos: ["Criar a conta e escolher o plano", "Montar o Projeto do negócio com as ferramentas do nivelamento", "A primeira tarefa de burocracia resolvida"],
          prompt: "Leia tudo o que está neste Projeto (raio-X, produtos, cliente ideal, canais, semana e metas) e me faça 5 perguntas para entender melhor o meu negócio. Depois, resolva a tarefa de burocracia que eu indicar.",
          tarefa: "Crie o Projeto do negócio e resolva UMA tarefa de burocracia com o Claude.",
          roteiro: ["Abertura: o funcionário invisível precisa de manual", "Conta e plano (indicar o curso para quem quiser o passo a passo)", "Criar o Projeto e colar as ferramentas do nivelamento (botão Copiar tudo)", "Demonstração: as 5 perguntas e a primeira tarefa", "Missão: Projeto pronto"]
        },
        {
          id: "checklist", titulo: "Checklist antes do 1º encontro", dur: "3:00", video: null,
          resumo: "Tudo o que você precisa ter feito para chegar no 1º encontro e aproveitar cada minuto.",
          pontos: ["Diagnóstico e testes de perfil feitos", "As ferramentas do nivelamento preenchidas", "Uma tarefa que rouba o seu tempo para resolvermos ao vivo"],
          tarefa: "Marque todas as aulas como concluídas e traga a sua tarefa para o 1º encontro.",
          roteiro: ["Recapitular o kit: raio-X, produtos, cliente, canais, semana, pedras, metas", "Diagnóstico e testes", "A tarefa que vamos resolver ao vivo", "Até o 1º encontro"]
        }
      ]
    }
  ],
  emBreve: ["Gravações dos encontros", "Curso O Funcionário Invisível"]
};
