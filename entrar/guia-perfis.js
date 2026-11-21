/* Como o Ramon lida com cada aluno, pelo resultado do DISC e dos 4 Animais.
   Usado só no Painel do Ramon. São orientações práticas de mentoria, não diagnóstico psicológico. */
window.GUIA_PERFIS = {
  disc: {
    D: { comunicar: "Vá direto ao ponto: resultado primeiro, detalhe depois. Mensagens curtas.",
         motivar: "Desafio e meta clara. Mostre o ranking e o próximo prêmio.",
         cobrar: "Com número e prazo, sem rodeio. Ele respeita firmeza.",
         evitar: "Enrolar, dar aula longa ou decidir por ele.",
         individual: "Traga 2 ou 3 opções e deixe ele escolher. Feche com prazo." },
    I: { comunicar: "Conversa leve, com entusiasmo e histórias. Áudio funciona bem.",
         motivar: "Reconhecimento público: cite o progresso dele no grupo.",
         cobrar: "De forma positiva, transformando a tarefa em algo para mostrar à turma.",
         evitar: "Planilhas frias e cobrança seca. Ele some se se sentir julgado.",
         individual: "Comece pelo que ele conquistou. Termine com UMA tarefa simples e escrita." },
    S: { comunicar: "Calma e passo a passo. Explique o porquê de cada mudança.",
         motivar: "Segurança: mostre que é possível, com exemplo de alguém parecido.",
         cobrar: "Com acolhimento e combinado claro. Ofereça ajuda antes.",
         evitar: "Mudanças bruscas, pressão e exposição na frente da turma.",
         individual: "Pergunte como ele está antes do negócio. Proponha um passo pequeno." },
    C: { comunicar: "Dados, lógica e método. Mande material por escrito.",
         motivar: "Qualidade e domínio: mostre o modelo bem feito e as fontes.",
         cobrar: "Com critérios objetivos do que é 'pronto'.",
         evitar: "Promessas vagas, improviso e erro de informação.",
         individual: "Leve números e um plano estruturado. Dê espaço para as perguntas dele." }
  },
  animais: {
    T: { comunicar: "Objetivo e rápido: o que fazer, para quando, qual ganho.",
         motivar: "Competição e resultado visível. Ele gosta de liderar a turma.",
         cobrar: "Direto, com número. Reconheça a velocidade, cobre o acabamento.",
         evitar: "Reuniões longas e muitos detalhes de uma vez.",
         mensagem: "{nome}, faltam {falta} pontos para o {premio}. Em 2 dias dá. Bora?" },
    G: { comunicar: "Próximo e caloroso. Pergunte como ele está.",
         motivar: "Pertencimento: ele quer se sentir parte da Panela.",
         cobrar: "Com carinho e oferta de ajuda, nunca com bronca.",
         evitar: "Frieza e comparação com os colegas.",
         mensagem: "{nome}, que saudade de você aqui na Panela! Separei um tempero que é a sua cara. Posso te mandar?" },
    L: { comunicar: "Organizado: lista, prazo e passo a passo.",
         motivar: "Ver o checklist completo e o progresso medido.",
         cobrar: "Com o combinado escrito e a data.",
         evitar: "Mudar o plano sem avisar e improvisar.",
         mensagem: "{nome}, seu progresso: {pontos} pontos. Próximos 3 passos: {passos}. Consegue até sexta?" },
    A: { comunicar: "Visão e possibilidades: mostre aonde a ideia pode chegar.",
         motivar: "Liberdade para criar. Desafie a tirar UMA ideia do papel.",
         cobrar: "Ajude a transformar a ideia em próximo passo concreto.",
         evitar: "Rotina chata e excesso de regra.",
         mensagem: "{nome}, imagina o seu negócio com {premio}? Você está a {falta} pontos. Que tal começar pelo tempero de hoje?" }
  }
};

/* Turma de exemplo (nomes fictícios) para o painel funcionar antes do servidor. */
window.TURMA_EXEMPLO = (function () {
  function dias(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
  function diasAtivos(n, ultimo) { var a = []; for (var i = 0; i < n; i++) a.push(dias(ultimo + i * 2).slice(0, 10)); return a; }
  function diag(base, delta, quando) {
    var ids = ["estrategia", "marketing", "vendas", "pessoas", "ia", "fe"], n = {};
    ids.forEach(function (k, i) { n[k] = Math.max(5, Math.min(98, base[i] + (delta || 0))); });
    return { data: dias(quando), notas: n, resp: {} };
  }
  function al(nome, perfil, turma, pag, parcelas, ramo, inicio, ultimo, nDias, diags, disc, discSec, ani, aniSec, vistos, abertos, usados, cupons, ind, resposta) {
    return {
      exemplo: true,
      aluno: { nome: nome, email: nome.split(" ")[0].toLowerCase() + "@exemplo.com", perfil: perfil, turma: turma, valor: turma === "hub" ? 997 : 1697, pagamento: pag, parcelasPagas: parcelas, inicio: dias(inicio), ramo: ramo },
      diagnosticos: diags, testes: { disc: disc ? [{ principal: disc, secundario: discSec, data: dias(inicio - 1) }] : [], animais: ani ? [{ principal: ani, secundario: aniSec, data: dias(inicio - 1) }] : [] },
      encontrosVistos: vistos, cupons: cupons, individual: ind ? { dia: "Quarta", tema: ind, data: dias(5) } : null,
      diasAtivos: diasAtivos(nDias, ultimo), temperosAbertos: abertos, temperosUsados: usados, ultimoAcesso: dias(ultimo), respostaAberta: resposta || ""
    };
  }
  var r = function (n) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a; };
  return [
    al("Mariana Exemplo", "negocio", "hub", "cartao6x", 2, "confeitaria", 20, 1, 12, [diag([42, 35, 50, 40, 20, 70], 0, 19), diag([42, 35, 50, 40, 20, 70], 14, 2)], "I", "S", "G", "A", r(3), r(14), r(6), [{ mes: 1 }], "Encomendas de fim de ano", "Passo o dia respondendo WhatsApp e não sobra tempo para produzir."),
    al("Paulo Exemplo", "negocio", "geral", "pix", 0, "oficina", 20, 0, 15, [diag([55, 30, 60, 45, 25, 60], 0, 19), diag([55, 30, 60, 45, 25, 60], 18, 3)], "D", "C", "T", "L", r(3), r(20), r(10), [{ mes: 1 }], "Contratar mais um mecânico", "Quero crescer, mas tudo depende de mim."),
    al("Lúcia Exemplo", "prof", "hub", "cartao6x", 2, "advocacia", 20, 12, 3, [diag([60, 25, 30, 50, 15, 80], 0, 18)], "S", "C", "L", "G", [1], r(3), [], [], "", "Tenho medo de usar IA e errar com o cliente."),
    al("Rafael Exemplo", "novo", "geral", "cartao6x", 2, "lanchonete", 20, 3, 9, [diag([30, 40, 35, 30, 35, 65], 0, 18), diag([30, 40, 35, 30, 35, 65], 6, 4)], "I", "D", "A", "T", [1, 2], r(9), r(2), [], "", "Quero abrir uma hamburgueria mas não sei por onde começar."),
    al("Beatriz Exemplo", "negocio", "hub", "pix", 0, "salao", 20, 2, 11, [diag([50, 55, 45, 35, 30, 75], 0, 19), diag([50, 55, 45, 35, 30, 75], 10, 6)], "C", "S", "L", "T", r(3), r(11), r(5), [{ mes: 1 }], "Escala da equipe", "A equipe falta muito e eu cubro."),
    al("Carlos Exemplo", "prof", "geral", "cartao6x", 1, "planejamento", 20, 16, 2, [], "D", "I", "T", "A", [], [], [], [], "", ""),
    al("Juliana Exemplo", "negocio", "hub", "cartao6x", 2, "moda", 20, 1, 13, [diag([45, 50, 55, 40, 30, 70], 0, 19), diag([45, 50, 55, 40, 30, 70], 9, 8), diag([45, 50, 55, 40, 30, 70], 17, 1)], "I", "D", "G", "T", r(3), r(25), r(12), [{ mes: 1 }], "Vendas pelo Instagram", "Posto todo dia mas não vende."),
    al("Tiago Exemplo", "novo", "geral", "pix", 0, "producao-eventos", 20, 6, 6, [diag([35, 45, 30, 40, 50, 60], 0, 17)], "C", "D", "A", "L", [1, 2], r(6), r(1), [], "", "Quero transformar eventos em negócio.")
  ];
})();
