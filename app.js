/* Área do participante de A Panela.
   Versão de demonstração: os dados ficam no navegador (localStorage).
   Na versão no ar, a classe Armazem passa a falar com o servidor (Cloudflare Worker),
   sem mudar o resto do app. */
(function () {
  "use strict";
  var P = window.PANELA;
  var CHAVE = "panela-demo-v1";

  /* ---------- Armazenamento ---------- */
  var Armazem = {
    ler: function () {
      try { return JSON.parse(localStorage.getItem(CHAVE)) || null; } catch (e) { return null; }
    },
    gravar: function (d) {
      try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* navegador sem armazenamento: segue em memória */ }
      memoria = d;
    },
    apagar: function () { try { localStorage.removeItem(CHAVE); } catch (e) {} memoria = null; }
  };
  var memoria = Armazem.ler();

  function dados() { return memoria; }
  function salvar() { Armazem.gravar(memoria); }

  /* ---------- Utilidades ---------- */
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function moeda(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function dataBR(iso) { var d = new Date(iso); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function perfil() { var d = dados(); return (d && d.aluno.perfil) || "negocio"; }
  function A(a) { return a[perfil()]; }
  function area(id) { return P.areas.filter(function (a) { return a.id === id; })[0]; }
  function ultimoDiag() { var d = dados(); return d && d.diagnosticos.length ? d.diagnosticos[d.diagnosticos.length - 1] : null; }
  function mediaGeral(notas) { var v = Object.keys(notas).map(function (k) { return notas[k]; }); return Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length); }

  /* ---------- Gráficos (SVG) ---------- */
  function radar(notas, notasAntes) {
    var n = P.areas.length, cx = 160, cy = 150, R = 110, s = "";
    function ponto(i, r) { var ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]; }
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      s += '<polygon fill="none" stroke="#E4E4DF" points="' + P.areas.map(function (a, i) { return ponto(i, R * f).join(","); }).join(" ") + '"/>';
    });
    P.areas.forEach(function (a, i) {
      var p = ponto(i, R), l = ponto(i, R + 22);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#E4E4DF"/>';
      s += '<text x="' + l[0] + '" y="' + (l[1] + 4) + '" text-anchor="middle" font-size="10.5" font-family="Inter" fill="#6A6A66">' + esc(A(a).nome.split(" ")[0]) + '</text>';
    });
    function poli(nt, cor, fill) {
      return '<polygon points="' + P.areas.map(function (a, i) { return ponto(i, R * (nt[a.id] || 0) / 100).join(","); }).join(" ") + '" fill="' + fill + '" stroke="' + cor + '" stroke-width="2"/>';
    }
    if (notasAntes) s += poli(notasAntes, "#B9B9B4", "rgba(185,185,180,.12)");
    s += poli(notas, "#2D5BD7", "rgba(45,91,215,.18)");
    return '<svg class="grafico" viewBox="0 0 320 300" role="img" aria-label="Radar do diagnóstico">' + s + "</svg>";
  }
  function linha(diags) {
    var W = 520, H = 200, m = 30;
    if (diags.length < 2) return '<div class="vazio">Faça o diagnóstico mais uma vez para ver a sua evolução neste gráfico.</div>';
    var xs = function (i) { return m + i * (W - 2 * m) / (diags.length - 1); };
    var ys = function (v) { return H - m - v * (H - 2 * m) / 100; };
    var s = "";
    [0, 25, 50, 75, 100].forEach(function (v) { s += '<line x1="' + m + '" x2="' + (W - m) + '" y1="' + ys(v) + '" y2="' + ys(v) + '" stroke="#ECECE8"/><text x="4" y="' + (ys(v) + 4) + '" font-size="10" fill="#6A6A66" font-family="Inter">' + v + "</text>"; });
    var pts = diags.map(function (d, i) { return xs(i) + "," + ys(mediaGeral(d.notas)); }).join(" ");
    s += '<polyline points="' + pts + '" fill="none" stroke="#E2231A" stroke-width="2.5"/>';
    diags.forEach(function (d, i) {
      s += '<circle cx="' + xs(i) + '" cy="' + ys(mediaGeral(d.notas)) + '" r="4" fill="#E2231A"/>';
      s += '<text x="' + xs(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#6A6A66" font-family="Inter">Teste ' + (i + 1) + "</text>";
    });
    return '<svg class="grafico" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Evolução da nota geral">' + s + "</svg>";
  }
  function barras(notas) {
    return '<div class="lista-areas">' + P.areas.map(function (a) {
      var v = notas[a.id] || 0;
      return "<div><span>" + esc(A(a).nome) + '</span><span class="barra"><i style="width:' + v + "%;background:" + a.cor + '"></i></span><span>' + v + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---------- Navegação ---------- */
  var MENU = [
    ["inicio", "Início", '<path d="M4 11l8-7 8 7v9H4z"/>'],
    ["diagnostico", "Diagnóstico", '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'],
    ["perfil", "Testes de perfil", '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/>'],
    ["plano", "Meu plano", '<path d="M5 5h14v14H5zM9 9h6M9 13h6"/>'],
    ["encontros", "Encontros", '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'],
    ["temperos", "Temperos", '<path d="M8 3h8l-1 4H9zM7 7h10v14H7z"/>'],
    ["cashback", "Cashback VOX", '<rect x="3" y="7" width="18" height="11" rx="2"/><path d="M8 12h.01M16 12h.01"/>'],
    ["individual", "Individual", '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>'],
    ["conquistas", "Conquistas", '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 21h8M10 17h4v4h-4z"/>'],
    ["regras", "Regras da Panela", '<path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6"/>']
  ];
  var atual = "inicio", subDiag = null, testeAtivo = null;

  function ir(p) { atual = p; subDiag = null; testeAtivo = null; desenhar(); window.scrollTo(0, 0); }

  /* ---------- Telas ---------- */
  function telaLogin() {
    var raiz = document.getElementById("raiz");
    raiz.innerHTML = "";
    raiz.appendChild(el(
      '<div class="login"><div class="caixa card" style="padding:28px">' +
      '<img src="logo-h-web.jpg" alt="A Panela">' +
      "<div><h1>Área do participante</h1><p class=\"muted\" style=\"margin:6px 0 0\">Entre com o e-mail da sua inscrição e o código de acesso que você recebeu.</p></div>" +
      '<form id="f-login" class="grid" novalidate>' +
      '<div class="campo"><label for="l-nome">Seu nome</label><input id="l-nome" autocomplete="name"></div>' +
      '<div class="campo"><label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="email"></div>' +
      '<div class="campo"><label for="l-perfil">Qual é o seu momento?</label><select id="l-perfil">' + P.perfis.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="l-turma">Como você entrou na Panela?</label><select id="l-turma"><option value="hub">Fui ao 1º Encontro do Hub (R$ 997)</option><option value="geral">Inscrição geral (R$ 1.697)</option></select></div>' +
      '<p class="erro" id="l-erro" role="alert"></p>' +
      '<button class="btn" type="submit">Entrar na Panela</button>' +
      '<button class="btn contorno" type="button" id="b-demo">Entrar como participante de demonstração</button>' +
      '<p class="muted" style="font-size:12px;margin:0">Demonstração: não é preciso código. Na versão no ar, o acesso é liberado depois da confirmação do pagamento.</p>' +
      "</form></div></div>"));
    document.getElementById("b-demo").addEventListener("click", function () {
      if (!window.TEMPEROS_DATA && !CAT) { fetch("temperos.json").then(function (r) { return r.json(); }).then(function (j) { window.TEMPEROS_DATA = j; entrarDemo(); }).catch(entrarDemo); return; }
      if (!window.TEMPEROS_DATA) window.TEMPEROS_DATA = CAT; entrarDemo();
    });
    document.getElementById("f-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = document.getElementById("l-nome").value.trim(), email = document.getElementById("l-email").value.trim();
      if (!nome || !/^\S+@\S+\.\S+$/.test(email)) { document.getElementById("l-erro").textContent = "Preencha o seu nome e um e-mail válido."; return; }
      var turma = document.getElementById("l-turma").value;
      memoria = { aluno: { nome: nome, email: email, perfil: document.getElementById("l-perfil").value, turma: turma, valor: turma === "hub" ? 997 : 1697, inicio: new Date().toISOString() },
        diagnosticos: [], rascunho: null, cupons: [], encontrosVistos: [], individual: null };
      salvar(); ir("inicio");
    });
  }


  /* Participante de demonstração (para o Meet de apresentação): entra já com histórico completo. */
  function entrarDemo() {
    function dia(n) { var x = new Date(); x.setDate(x.getDate() - n); return x.toISOString(); }
    memoria = { aluno: { nome: "Ana Demonstração", email: "demo@apanela.com.br", perfil: "negocio", turma: "hub", valor: 997, inicio: dia(35), ramo: "confeitaria" },
      diagnosticos: [], rascunho: null, cupons: [{ mes: 1, codigo: "PANELA-ANA-M1-DEMO", resgate: dia(20) }], encontrosVistos: [1, 2, 3, 4, 5],
      individual: { dia: "Quarta", tema: "Organizar as encomendas de Natal", data: dia(6) },
      testes: { disc: [], animais: [] }, diasAtivos: [], temperosAbertos: [], temperosUsados: [] };
    var base = { estrategia: 2, marketing: 2, vendas: 3, pessoas: 2, ia: 1, fe: 4 }, ganho = [0, 1, 1];
    [33, 18, 3].forEach(function (quando, k) {
      var resp = {};
      P.areas.forEach(function (a, ai) {
        A(a).perguntas.forEach(function (_, i) { resp[a.id + "-" + i] = Math.max(1, Math.min(5, base[a.id] + (k ? ganho[k] * ((i + ai) % 2 ? 1 : 0) + (k === 2 && i < 4 ? 1 : 0) : 0) - (i % 3 === 0 ? 1 : 0) + 1)); });
        resp["aberta-" + a.id] = k === 2 && a.id === "vendas" ? "Quero vender mais encomendas pelo Instagram sem passar o dia no WhatsApp." : "";
      });
      memoria.diagnosticos.push({ data: dia(quando), perfil: "negocio", resp: resp, notas: notasDe(resp) });
    });
    var rDisc = resultado(T.disc, T.disc.perguntas.map(function (_, i) { return i % 4 === 0 ? 2 : 1; }));
    memoria.testes.disc.push({ data: dia(34), resp: [], pct: rDisc.pct, principal: rDisc.principal, secundario: rDisc.secundario });
    var rAni = resultado(T.animais, T.animais.perguntas.map(function (_, i) { return i % 3 === 0 ? 3 : 1; }));
    memoria.testes.animais.push({ data: dia(34), resp: [], pct: rAni.pct, principal: rAni.principal, secundario: rAni.secundario });
    for (var i = 0; i < 14; i++) memoria.diasAtivos.push(dia(i * 2).slice(0, 10));
    var cat = window.TEMPEROS_DATA;
    var ids = cat ? cat.skills.filter(function (x) { return x.biz === "confeitaria"; }).slice(0, 12).map(function (x) { return x.id; }) : [];
    memoria.temperosAbertos = ids; memoria.temperosUsados = ids.slice(0, 6);
    salvar(); atual = "inicio"; desenhar(); toast("Entrou como participante de demonstração.");
  }

  function cabecalho(titulo, sub, acoes) {
    return '<div class="topo-pag"><div><span class="rot">A Panela</span><h1>' + titulo + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" + (acoes || "") + "</div>";
  }

  function telaInicio() {
    var d = dados(), u = ultimoDiag(), nome = esc(d.aluno.nome.split(" ")[0]);
    var prox = P.encontros.filter(function (e) { return d.encontrosVistos.indexOf(e.n) < 0; })[0];
    var h = '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:4px">' + avatar("grande") + '<div style="flex:1;min-width:240px">' + cabecalho("Olá, " + nome + "!", "Panela só é ruim pra quem tá de fora. Que bom ter você aqui dentro." + (animalDe() ? "" : ' <a href="#" data-ir="perfil">Faça o teste dos 4 animais</a> e ganhe a sua foto de perfil.')) + "</div></div>";
    h += '<div class="grid g4" style="margin-bottom:16px">' +
      '<div class="card ind"><span class="rot">Nota geral</span><b>' + (u ? mediaGeral(u.notas) : "—") + "</b><small>" + (u ? "último diagnóstico" : "faça o diagnóstico") + "</small></div>" +
      '<div class="card ind" data-ir="conquistas" style="cursor:pointer"><span class="rot">Pontos</span><b>' + pontuacao().total + "</b><small>" + nivel(pontuacao().total) + " · ver prêmios</small></div>" +
      '<div class="card ind"><span class="rot">Encontros</span><b>' + d.encontrosVistos.length + "/" + P.encontros.length + "</b><small>marcados como vistos</small></div>" +
      '<div class="card ind"><span class="rot">Cashback VOX</span><b>' + moeda(d.aluno.valor * 0.3) + "</b><small>em 3 cupons mensais</small></div></div>";
    h += '<div class="grid g2">';
    h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2>O seu momento hoje</h2>' +
      '<button class="btn peq contorno" data-ir="diagnostico">' + (u ? "Refazer" : "Fazer agora") + "</button></div>" +
      (u ? radar(u.notas, d.diagnosticos.length > 1 ? d.diagnosticos[d.diagnosticos.length - 2].notas : null) :
        '<div class="vazio" style="margin-top:14px">Comece pelo diagnóstico. Leva uns 15 minutos e mostra onde você está forte e onde precisa de atenção.</div>') + "</div>";
    h += '<div class="card"><h2>Prepare-se para o próximo encontro</h2>' +
      (prox ? '<div class="item"><span class="num">' + prox.n + "</span><div><b>" + esc(prox.titulo) + "</b><p>" + esc(prox.prep) + '</p></div></div><button class="btn peq" data-ir="encontros">Ver encontros</button>' :
        '<div class="vazio">Você marcou todos os encontros como vistos. Parabéns!</div>') +
      '<div style="margin-top:18px"><h2>Sua evolução</h2>' + linha(d.diagnosticos) + "</div></div>";
    h += "</div>";
    return h;
  }

  function notasDe(resp) {
    var n = {};
    P.areas.forEach(function (a) {
      var soma = 0, q = 0;
      A(a).perguntas.forEach(function (_, i) { var v = resp[a.id + "-" + i]; if (v) { soma += v; q++; } });
      n[a.id] = q ? Math.round((soma / q - 1) / 4 * 100) : 0;
    });
    return n;
  }

  function telaDiagnostico() {
    var d = dados();
    if (subDiag !== null) return telaQuestionario();
    var u = ultimoDiag();
    var h = cabecalho("Diagnóstico do negócio", "Responda com sinceridade. Você pode refazer quando quiser e acompanhar a evolução.",
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="b-novo">' + (d.rascunho ? "Continuar teste" : u ? "Refazer o teste" : "Começar o teste") + "</button>" +
      (d.diagnosticos.length ? '<button class="btn perigo" id="b-zerar">Zerar histórico</button>' : "") + "</div>");
    h += seletorPerfil();
    if (!u) return h + '<div class="vazio">Você ainda não fez o diagnóstico. São ' + P.areas.length + " blocos curtos, com uma pergunta aberta em cada um.</div>";
    var antes = d.diagnosticos.length > 1 ? d.diagnosticos[d.diagnosticos.length - 2].notas : null;
    var ordem = P.areas.slice().sort(function (a, b) { return u.notas[a.id] - u.notas[b.id]; });
    h += '<div class="grid g2"><div class="card"><h2>Resultado de ' + dataBR(u.data) + "</h2>" + radar(u.notas, antes) +
      (antes ? '<p class="muted" style="font-size:12px;margin:6px 0 0">Em cinza: o teste anterior. Em azul: o atual.</p>' : "") + "</div>" +
      '<div class="card"><h2>Por área</h2><div style="margin-top:12px">' + barras(u.notas) + "</div>" +
      '<div style="margin-top:18px"><span class="rot">Onde focar primeiro</span>' +
      ordem.slice(0, 2).map(function (a) { return '<div class="item"><span class="num" style="background:' + a.cor + ";border-color:" + a.cor + ';color:#fff">!</span><div><b>' + esc(A(a).nome) + " · " + u.notas[a.id] + "</b><p>Veja o seu plano para esta área.</p></div></div>"; }).join("") +
      '<button class="btn peq contorno" data-ir="plano">Ver meu plano</button></div></div></div>';
    h += '<div class="card" style="margin-top:16px"><h2>Histórico</h2>' + linha(d.diagnosticos) +
      '<div style="margin-top:10px">' + d.diagnosticos.slice().reverse().map(function (x, i) {
        return '<div class="item"><span class="num">' + (d.diagnosticos.length - i) + "</span><div><b>Nota geral " + mediaGeral(x.notas) + "</b><p>" + dataBR(x.data) + "</p></div></div>";
      }).join("") + "</div></div>";
    return h;
  }

  function telaQuestionario() {
    var d = dados(), r = d.rascunho, a = P.areas[subDiag], ad = A(a);
    var h = cabecalho("Diagnóstico · " + esc(ad.nome), "Bloco " + (subDiag + 1) + " de " + P.areas.length + ". Suas respostas ficam salvas enquanto você responde.");
    h += '<div class="passos">' + P.areas.map(function (x, i) { return '<span class="' + (i < subDiag ? "ok" : i === subDiag ? "at" : "") + '">' + esc(A(x).nome) + "</span>"; }).join("") + "</div>";
    h += '<div class="card"><form id="f-bloco">';
    ad.perguntas.forEach(function (q, i) {
      var nomeC = a.id + "-" + i;
      h += '<fieldset class="pergunta" style="border:0;margin:0;padding:16px 0"><legend style="padding:0"><p>' + (i + 1) + ". " + esc(q) + '</p></legend><div class="escala">' +
        P.escala.map(function (rot, v) { return '<label><input type="radio" name="' + nomeC + '" value="' + (v + 1) + '"' + (r.resp[nomeC] === v + 1 ? " checked" : "") + ">" + esc(rot) + "</label>"; }).join("") + "</div></fieldset>";
    });
    h += '<div class="pergunta"><p>' + esc(ad.aberta) + '</p><textarea name="aberta-' + a.id + '" placeholder="Escreva com as suas palavras">' + esc(r.resp["aberta-" + a.id] || "") + "</textarea></div>";
    h += '<p class="erro" id="d-erro" role="alert"></p><div class="nav-diag"><div style="display:flex;gap:8px"><button type="button" class="btn contorno" id="d-voltar">' + (subDiag ? "Voltar" : "Sair") + "</button></div>" +
      '<button type="submit" class="btn">' + (subDiag === P.areas.length - 1 ? "Ver meu resultado" : "Próximo bloco") + "</button></div></form></div>";
    return h;
  }

  function seletorPerfil() {
    var d = dados();
    return '<div class="card" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span class="rot">Seu perfil</span>' +
      P.perfis.map(function (x) { return '<button class="btn peq ' + (perfil() === x.id ? "" : "contorno") + '" data-perfil="' + x.id + '" title="' + esc(x.desc) + '">' + esc(x.nome) + "</button>"; }).join("") +
      '<span class="muted" style="font-size:12px">As perguntas mudam conforme o perfil.' + (d.rascunho ? " Trocar o perfil apaga o teste em andamento." : "") + "</span></div>";
  }


  /* ---------- Testes de perfil (DISC e 4 Animais) ---------- */
  var T = window.PANELA_TESTES;
  function hist(id) { var d = dados(); d.testes = d.testes || { disc: [], animais: [] }; return d.testes[id]; }
  function ultimoTeste(id) { var h = hist(id); return h.length ? h[h.length - 1] : null; }
  function ordemOpcoes(i) { var b = [0, 1, 2, 3]; var r = (i * 3 + 1) % 4; b = b.slice(r).concat(b.slice(0, r)); return i % 2 ? b.reverse() : b; }
  function resultado(t, resp) {
    var c = {}; t.fatores.forEach(function (f) { c[f] = 0; });
    resp.forEach(function (k) { if (k != null) c[t.fatores[k]]++; });
    var pct = {}; t.fatores.forEach(function (f) { pct[f] = Math.round(c[f] / t.perguntas.length * 100); });
    var ord = t.fatores.slice().sort(function (a, b) { return pct[b] - pct[a]; });
    return { pct: pct, principal: ord[0], secundario: ord[1] };
  }
  function barrasTeste(t, r) {
    return '<div class="lista-areas">' + t.fatores.map(function (f) {
      var p = t.perfis[f];
      return "<div><span>" + esc(p.nome) + '</span><span class="barra"><i style="width:' + r.pct[f] + "%;background:" + p.cor + '"></i></span><span>' + r.pct[f] + "%</span></div>";
    }).join("") + "</div>";
  }
  function cartaoResultado(t, u) {
    var p = t.perfis[u.principal], s = t.perfis[u.secundario];
    return '<div class="card resultado-teste"><div class="resultado-topo">' + (t.id === "animais" ? avatar("grande") : "") + '<div><span class="rot">' + esc(t.nome) + " · " + dataBR(u.data) + '</span>' +
      '<h2 class="perfil-nome" style="color:' + p.cor + '">' + esc(p.nome) + '</h2><p class="muted" style="margin:0 0 12px">com traços de <b>' + esc(s.nome) + "</b>" + (t.id === "animais" ? " · este animal virou a sua foto de perfil" : "") + "</p></div></div>" +
      "<p>" + esc(p.resumo) + "</p>" + barrasTeste(t, u) +
      '<div class="grid g2" style="margin-top:16px"><div><b style="font-size:13px">Pontos fortes</b><ul class="lista">' + p.forcas.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
      '<div><b style="font-size:13px">Pontos de atenção</b><ul class="lista">' + p.cuidados.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div></div>" +
      '<div class="dica"><span class="rot">Na Panela</span><p>' + esc(p.panela) + "</p></div></div>";
  }
  var ARQ_ANIMAL = { T: "tubarao", G: "gato", L: "lobo", A: "aguia" };
  function avatar(cls) {
    var d = dados(), u = ultimoTeste("animais"), ini = esc(d.aluno.nome.charAt(0).toUpperCase());
    if (!u) return '<span class="avatar ' + (cls || "") + '" title="Faça o teste dos 4 animais para ganhar a sua foto de perfil">' + ini + "</span>";
    var nome = T.animais.perfis[u.principal].nome;
    return '<span class="avatar ' + (cls || "") + '" title="' + esc(nome) + '">' + ini + '<img src="avatares/' + ARQ_ANIMAL[u.principal] + '.png" alt="' + esc(nome) + '" style="position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;background:#fff" onerror="this.remove()"></span>';
  }
  function animalDe() { var u = ultimoTeste("animais"); return u ? T.animais.perfis[u.principal].nome : ""; }
  function telaPerfil() {
    if (testeAtivo) return telaTeste();
    var h = cabecalho("Testes de perfil", "Conhecer o seu jeito ajuda a liderar, vender e escolher os temperos certos. Refaça quando quiser.");
    h += '<div class="grid g2">' + ["disc", "animais"].map(function (id) {
      var t = T[id], u = ultimoTeste(id);
      var topo = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:start;gap:10px;flex-wrap:wrap"><div><span class="rot">' + t.perguntas.length + " perguntas · 5 minutos</span><h2 style=\"margin-top:4px\">" + esc(t.nome) + '</h2><p class="muted" style="margin:2px 0 0">' + esc(t.sub) + '</p></div><button class="btn peq' + (u ? " contorno" : "") + '" data-teste="' + id + '">' + (u ? "Refazer" : "Fazer o teste") + "</button></div>";
      if (!u) return topo + '<div class="vazio" style="margin-top:14px">Escolha, em cada pergunta, a opção que mais combina com você. Não existe resposta certa.</div></div>';
      return topo + "</div>";
    }).join("") + "</div>";
    ["disc", "animais"].forEach(function (id) { var u = ultimoTeste(id); if (u) h += '<div style="margin-top:16px">' + cartaoResultado(T[id], u) + "</div>"; });
    h += '<p class="muted" style="font-size:12px;margin-top:14px">Os testes são ferramentas de autoconhecimento, não um diagnóstico psicológico. O Ramon usa o resultado para preparar o seu individual.</p>';
    return h;
  }
  function telaTeste() {
    var d = dados(), t = T[testeAtivo.id], i = testeAtivo.i, resp = testeAtivo.resp;
    var h = cabecalho("Teste " + esc(t.nome), "Pergunta " + (i + 1) + " de " + t.perguntas.length + ". Escolha a opção que mais combina com você.");
    h += '<div class="barra" style="margin-bottom:16px"><i style="width:' + Math.round(i / t.perguntas.length * 100) + '%"></i></div>';
    h += '<div class="card"><p class="enunciado">Qual destas frases é mais você?</p><div class="opcoes">' +
      ordemOpcoes(i).map(function (k) { return '<button class="opcao' + (resp[i] === k ? " marcada" : "") + '" data-opcao="' + k + '">' + esc(t.perguntas[i][k]) + "</button>"; }).join("") + "</div>" +
      '<div class="nav-diag"><button class="btn contorno" id="t-voltar">' + (i ? "Voltar" : "Sair") + "</button></div></div>";
    return h;
  }

  function telaPlano() {
    var u = ultimoDiag();
    var h = cabecalho("Meu plano", "Montado a partir do seu último diagnóstico. Ele muda sempre que você refaz o teste.");
    if (!u) return h + '<div class="vazio">Faça o diagnóstico para gerar o seu plano. <br><br><button class="btn" data-ir="diagnostico">Fazer o diagnóstico</button></div>';
    var ordem = P.areas.slice().sort(function (a, b) { return u.notas[a.id] - u.notas[b.id]; });
    h += '<div class="grid g3">' + ordem.slice(0, 3).map(function (a, i) {
      var enc = P.encontros.filter(function (e) { return e.area === a.id; });
      var tem = P.temperos.filter(function (t) { return t.area === a.id; });
      var fracas = A(a).perguntas.map(function (q, k) { return [q, u.resp[a.id + "-" + k] || 0]; }).sort(function (x, y) { return x[1] - y[1]; }).slice(0, 2);
      return '<div class="card"><span class="rot">Prioridade ' + (i + 1) + '</span><h2 style="margin:6px 0 4px">' + esc(A(a).nome) + '</h2><div class="barra" style="margin-bottom:12px"><i style="width:' + u.notas[a.id] + "%;background:" + a.cor + '"></i></div>' +
        '<b style="font-size:13px">Pontos para trabalhar</b><ul style="margin:6px 0 12px;padding-left:18px;font-size:13px">' + fracas.map(function (f) { return "<li>" + esc(f[0]) + "</li>"; }).join("") + "</ul>" +
        (enc.length ? '<b style="font-size:13px">Encontros que ajudam</b><ul style="margin:6px 0 12px;padding-left:18px;font-size:13px">' + enc.map(function (e) { return "<li>" + e.n + ". " + esc(e.titulo) + "</li>"; }).join("") + "</ul>" : "") +
        (tem.length ? '<b style="font-size:13px">Temperos indicados</b><ul style="margin:6px 0 0;padding-left:18px;font-size:13px">' + tem.map(function (t) { return "<li>" + esc(t.nome) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    }).join("") + "</div>";
    var abertas = P.areas.map(function (a) { return [a, u.resp["aberta-" + a.id]]; }).filter(function (x) { return x[1]; });
    if (abertas.length) h += '<div class="card" style="margin-top:16px"><h2>O que você nos contou</h2><p class="muted" style="margin:4px 0 10px">O Ramon lê estas respostas para personalizar os encontros e o seu individual.</p>' +
      abertas.map(function (x) { return '<div class="item"><span class="num" style="background:' + x[0].cor + ";border-color:" + x[0].cor + ';color:#fff"> </span><div><b>' + esc(A(x[0]).aberta) + "</b><p>" + esc(x[1]) + "</p></div></div>"; }).join("") + "</div>";
    return h;
  }

  function telaEncontros() {
    var d = dados();
    var h = cabecalho("Encontros", "Ao vivo às 20h. A gravação aparece aqui em até 48 horas.");
    h += '<div class="card">' + P.encontros.map(function (e) {
      var visto = d.encontrosVistos.indexOf(e.n) >= 0;
      return '<div class="item"><span class="num ' + (visto ? "ok" : e.n === 8 ? "br" : "") + '">' + e.n + '</span><div style="flex:1"><b>' + esc(e.titulo) + '</b><p><span class="chip">' + esc(A(area(e.area)).nome) + "</span> Prepare-se: " + esc(e.prep) + '</p></div><button class="btn peq ' + (visto ? "" : "contorno") + '" data-visto="' + e.n + '">' + (visto ? "Visto" : "Marcar como visto") + "</button></div>";
    }).join("") + '<p class="muted" style="font-size:12px;margin:12px 0 0">Os vídeos dos encontros entram aqui assim que forem gravados (hospedados no Bunny Stream).</p></div>';
    return h;
  }

  /* ---------- Temperos: a biblioteca de skills por ramo (temperos.json) ---------- */
  var CAT = null, catErro = false, ramoSel = null, tBusca = "", tAreas = [], tNivel = "";
  var AREA_PANELA = { estrategia: ["Gestão"], marketing: ["Marketing"], vendas: ["Vendas", "Atendimento"], pessoas: ["Equipe"], ia: ["Operação"], fe: ["Gestão"] };
  var AREAS_T = ["Atendimento", "Vendas", "Marketing", "Operação", "Equipe", "Gestão", "Finanças"];
  function carregarCatalogo() {
    if (CAT || catErro) return;
    if (window.TEMPEROS_DATA) { CAT = window.TEMPEROS_DATA; return; }
    fetch("temperos.json").then(function (r) { return r.json(); }).then(function (j) { CAT = j; if (atual === "temperos") desenhar(); })
      .catch(function () { catErro = true; if (atual === "temperos") desenhar(); });
  }
  function semAcento(x) { return String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function nomeRamo(k) { var b = CAT.biz.filter(function (x) { return x.key === k; })[0]; return b ? b.nome : k; }
  function numT(n) { return "#" + ("00" + n).slice(-3); }
  function indicadas() {
    var u = ultimoDiag(); if (!u || !ramoSel) return [];
    var fracas = P.areas.slice().sort(function (a, b) { return u.notas[a.id] - u.notas[b.id]; }).slice(0, 2);
    var alvo = []; fracas.forEach(function (a) { alvo = alvo.concat(AREA_PANELA[a.id] || []); });
    return CAT.skills.filter(function (x) { return x.biz === ramoSel && alvo.indexOf(x.area) >= 0 && x.lvl === "Iniciante"; }).slice(0, 3);
  }
  function filtrarT() {
    var q = semAcento(tBusca.trim());
    return CAT.skills.filter(function (x) {
      if (!q && x.biz !== ramoSel) return false;
      if (q && semAcento(x.t + " " + x.d + " " + x.area + " " + nomeRamo(x.biz)).indexOf(q) < 0) return false;
      if (tAreas.length && tAreas.indexOf(x.area) < 0) return false;
      if (tNivel && x.lvl !== tNivel) return false;
      return true;
    });
  }
  function cartaoT(x, mostrarRamo) {
    return '<button class="tcard" data-abrir="' + x.id + '"><span class="ttopo"><span class="tnum">' + numT(x.id) + '</span><span class="tnivel n' + x.lvl.charAt(0) + '">' + esc(x.lvl) + "</span>" +
      (x.kind === "exclusiva" ? '<span class="tex">Exclusivo</span>' : "") + "</span><b>" + esc(x.t) + "</b><p>" + esc(x.d) + '</p><span class="tpe"><span class="chip">' + esc(x.area) + "</span>" +
      (mostrarRamo ? '<span class="muted" style="font-size:11px">' + esc(nomeRamo(x.biz)) + "</span>" : "") + "</span></button>";
  }
  function gradeT() {
    var lista = filtrarT(), q = tBusca.trim();
    var topo = '<div class="tcab"><div><span class="rot">' + (q ? "Busca em todos os ramos" : "Seu ramo") + '</span><h2 style="margin-top:4px">' + (q ? "“" + esc(q) + "”" : esc(nomeRamo(ramoSel))) + '</h2></div><span class="chip">' + lista.length + " temperos</span></div>";
    if (!lista.length) return topo + '<div class="vazio">Nenhum tempero com esses filtros. Tente limpar um filtro.</div>';
    return topo + '<div class="tgrade">' + lista.map(function (x) { return cartaoT(x, !!q); }).join("") + "</div>";
  }
  function filtrosT() {
    return '<div class="card tfiltros" style="margin-bottom:16px"><input id="t-busca" type="search" placeholder="Buscar tempero em todos os ramos (ex.: cardápio, orçamento, Instagram)" value="' + esc(tBusca) + '" aria-label="Buscar tempero">' +
      '<div class="tchips">' + AREAS_T.map(function (a) { var on = tAreas.indexOf(a) >= 0; return '<button class="chip' + (on ? " on" : "") + '" data-tarea="' + a + '" aria-pressed="' + on + '">' + a + "</button>"; }).join("") + "</div>" +
      '<select id="t-nivel" aria-label="Nível"><option value="">Todos os níveis</option>' + ["Iniciante", "Intermediário", "Avançado"].map(function (n) { return "<option" + (tNivel === n ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select></div>";
  }
  function telaTemperos() {
    carregarCatalogo();
    var d = dados();
    var h = cabecalho("Temperos", "Cada tempero é uma skill: dá sabor ao seu negócio e faz o Claude entregar o que você não conseguiria sozinho.");
    if (catErro) return h + '<div class="vazio">Não foi possível carregar os temperos. Recarregue a página.</div>';
    if (!CAT) return h + '<div class="vazio">Carregando a despensa de temperos…</div>';
    if (!ramoSel) ramoSel = d.aluno.ramo || null;
    var noRamo = ramoSel ? CAT.skills.filter(function (x) { return x.biz === ramoSel; }).length : 0;
    h += '<div class="grid g4" style="margin-bottom:16px"><div class="card ind"><span class="rot">Temperos</span><b>' + CAT.skills.length + '</b><small>na despensa</small></div>' +
      '<div class="card ind"><span class="rot">Ramos</span><b>' + CAT.biz.length + '</b><small>tipos de negócio</small></div>' +
      '<div class="card ind"><span class="rot">Seu ramo</span><b class="ind-txt">' + (ramoSel ? esc(nomeRamo(ramoSel)) : "—") + "</b><small>" + (ramoSel ? noRamo + " temperos" : "escolha abaixo") + "</small></div>" +
      '<div class="card ind"><span class="rot">Como usar</span><b class="ind-txt">Copie ou baixe</b><small>e coloque no Claude</small></div></div>';
    h += '<div class="card" style="margin-bottom:16px"><span class="rot">Escolha o seu ramo</span><div class="ramos">' + CAT.biz.map(function (b) {
      return '<button class="ramo' + (b.key === ramoSel ? " ativo" : "") + '" data-ramo="' + b.key + '"><b>' + esc(b.nome) + "</b><small>" + esc(b.desc) + "</small></button>";
    }).join("") + "</div></div>";
    if (!ramoSel) return h + '<div class="vazio" style="margin-bottom:16px">Escolha o seu ramo para ver os temperos feitos para o seu negócio. Não achou o seu? Use a busca: ela procura em todos os ramos.</div>' + filtrosT() + '<div id="t-grade"></div><dialog id="t-dlg" class="tdlg"></dialog>';
    var ind = indicadas();
    if (ind.length) h += '<div class="card" style="margin-bottom:16px;border-top:3px solid var(--vermelho)"><span class="rot">Indicados pelo seu diagnóstico</span><div class="tgrade" style="margin-top:10px">' + ind.map(function (x) { return cartaoT(x, false); }).join("") + "</div></div>";
    h += filtrosT() + '<div id="t-grade">' + gradeT() + '</div><dialog id="t-dlg" class="tdlg"></dialog>';
    return h;
  }
  function abrirT(id) {
    var x = CAT.skills.filter(function (k) { return k.id === id; })[0], dlg = document.getElementById("t-dlg"); if (!x || !dlg) return;
    dlg.innerHTML = '<div class="tdlg-topo"><div><span class="rot">' + numT(x.id) + " · " + esc(nomeRamo(x.biz)) + " · " + esc(x.area) + " · " + esc(x.lvl) + '</span><h2 style="margin:6px 0 4px">' + esc(x.t) +
      '</h2><p class="muted" style="margin:0">' + esc(x.d) + '</p></div><button class="btn peq contorno" id="t-fechar">Fechar</button></div>' +
      '<pre class="tmd">' + esc(x.md) + '</pre><div class="tdlg-acoes"><button class="btn" id="t-copiar">Copiar o tempero</button><button class="btn contorno" id="t-baixar">Baixar (.md)</button>' +
      '<span class="muted" style="font-size:12px">No Claude: Configurações › Capacidades › Skills › enviar a skill. Ou cole o texto numa conversa.</span></div>';
    dlg.showModal();
    registrarTempero("abriu", x.id);
    document.getElementById("t-fechar").onclick = function () { dlg.close(); };
    dlg.onclick = function (e) { if (e.target === dlg) dlg.close(); };
    document.getElementById("t-copiar").onclick = function () {
      (navigator.clipboard ? navigator.clipboard.writeText(x.md) : Promise.reject()).then(function () { registrarTempero("usou", x.id); toast("Tempero copiado!"); }, function () { toast("Não deu para copiar aqui. Selecione o texto e copie."); });
    };
    document.getElementById("t-baixar").onclick = function () {
      if (window.claude && window.claude.use) {
        window.claude.use("downloads").then(function (dl) {
          if (!dl) { toast("Download indisponível aqui. Use Copiar."); return; }
          dl.save({ filename: x.name + ".md", data: x.md }).then(function () { registrarTempero("usou", x.id); toast("Arquivo salvo: " + x.name + ".md"); }, function (e) { if (!e || e.code !== "declined") toast("Não foi possível baixar agora."); });
        });
        return;
      }
      try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([x.md], { type: "text/markdown" })); a.download = x.name + ".md"; document.body.appendChild(a); a.click(); a.remove(); registrarTempero("usou", x.id); toast("Baixando " + x.name + ".md"); }
      catch (e) { toast("Download indisponível aqui. Use Copiar."); }
    };
  }
  function ligarGradeT() {
    document.querySelectorAll("[data-abrir]").forEach(function (b) { b.onclick = function () { abrirT(+b.getAttribute("data-abrir")); }; });
  }
  function atualizarGradeT() { var g = document.getElementById("t-grade"); if (!g) return; g.innerHTML = (ramoSel || tBusca.trim()) ? gradeT() : ""; ligarGradeT(); }

  function telaCashback() {
    var d = dados(), total = d.aluno.valor * 0.3, parcela = Math.round(total / 3 * 100) / 100;
    var inicio = new Date(d.aluno.inicio);
    var h = cabecalho("Cashback VOX", "30% do valor investido volta em 3 cupons, um por mês. Cada cupom vale 30 dias depois do resgate, no site da VOX ou na loja.");
    h += '<div class="grid g3">';
    [1, 2, 3].forEach(function (m) {
      var libera = new Date(inicio); libera.setMonth(libera.getMonth() + (m - 1));
      var cup = d.cupons.filter(function (c) { return c.mes === m; })[0];
      var liberado = new Date() >= libera;
      h += '<div class="card"><span class="rot">Mês ' + m + '</span><h2 style="margin:6px 0">' + moeda(parcela) + "</h2>";
      if (cup) {
        var vence = new Date(cup.resgate); vence.setDate(vence.getDate() + 30);
        h += '<div class="cupom"><code>' + esc(cup.codigo) + '</code><span style="font-size:12px">Válido até ' + vence.toLocaleDateString("pt-BR") + "</span></div>";
      } else if (liberado) {
        h += '<button class="btn" data-resgatar="' + m + '">Resgatar cupom</button>';
      } else {
        h += '<p class="muted" style="margin:0">Libera em ' + libera.toLocaleDateString("pt-BR") + "</p>";
      }
      h += "</div>";
    });
    h += '</div><p class="muted" style="font-size:12px;margin-top:12px">Na demonstração o código é gerado aqui. Na versão no ar, ele vira um cupom de verdade na loja da VOX e é conferido na loja física.</p>';
    return h;
  }

  function telaIndividual() {
    var d = dados();
    var h = cabecalho("Encontro individual", "Uma conversa só sua por mês, em dia de semana às 20h.");
    h += '<div class="grid g2"><div class="card"><h2>Pedir horário</h2><form id="f-ind" class="grid" style="margin-top:12px" novalidate>' +
      '<div class="campo"><label for="i-dia">Dia que prefere</label><select id="i-dia"><option>Segunda</option><option>Terça</option><option>Quarta</option><option>Quinta</option><option>Sexta</option></select></div>' +
      '<div class="campo"><label for="i-tema">O que você quer levar para a conversa?</label><textarea id="i-tema" rows="4"></textarea></div>' +
      '<button class="btn" type="submit">Enviar pedido</button></form></div>' +
      '<div class="card"><h2>Seu pedido</h2>' + (d.individual ? '<div class="item"><span class="num">20h</span><div><b>' + esc(d.individual.dia) + "</b><p>" + esc(d.individual.tema || "Sem tema") + "</p><p>Pedido em " + dataBR(d.individual.data) + "</p></div></div>" : '<div class="vazio">Nenhum pedido ainda.</div>') +
      '<p class="muted" style="font-size:12px">Para remarcar, avise com 24 horas. Sem aviso, o encontro do mês conta como realizado.</p></div></div>';
    return h;
  }

  function telaRegras() {
    var regras = ["Os encontros começam e terminam no horário. A gravação sobe em até 48 horas.",
      "Perdeu o encontro? Assista à gravação e faça a tarefa do mesmo jeito.",
      "O individual é agendado; remarcar só com 24 horas de aviso. Os individuais não acumulam.",
      "O grupo é para dúvidas e ajuda entre os participantes. Sem propaganda.",
      "O que é partilhado na turma fica na turma.",
      "Nenhum dado pessoal de cliente vai para o grupo ou para a IA.",
      "O acesso é pessoal e intransferível; não compartilhe vídeos e materiais.",
      "Garantia de 7 dias a partir da compra.",
      "A mentoria não promete resultado financeiro: o resultado depende da sua aplicação."];
    return cabecalho("Regras da Panela", "Panela boa tem combinados claros.") + '<div class="card">' +
      regras.map(function (r, i) { return '<div class="item"><span class="num">' + (i + 1) + "</span><div><b>" + esc(r) + "</b></div></div>"; }).join("") + "</div>";
  }

  /* ---------- Conquistas: pontos por desempenho e uso da plataforma, com prêmios ---------- */
  var PREMIOS = [
    { pts: 250, nome: "Boosts Secretos", desc: "Temperos turbinados que só quem cozinha de verdade recebe. O conteúdo é surpresa.", cor: "#E2231A" },
    { pts: 550, nome: "Guia prático de criação de Sites", desc: "Passo a passo para colocar o site ou a página de vendas no ar com o Claude.", cor: "#2D5BD7" },
    { pts: 850, nome: "Guia prático de criação de Apps", desc: "Do zero ao aplicativo instalado no celular, com o Claude.", cor: "#F5B800" },
    { pts: 1150, nome: "App Angelus", desc: "O app de gestão de redes sociais: posts, agenda e respostas do Instagram.", cor: "#7E8A75" }
  ];
  function hoje() { return new Date().toISOString().slice(0, 10); }
  function marcarDia() {
    var d = dados(); if (!d) return;
    d.diasAtivos = d.diasAtivos || [];
    if (d.diasAtivos.indexOf(hoje()) < 0) { d.diasAtivos.push(hoje()); salvar(); }
  }
  function registrarTempero(tipo, id) {
    var d = dados(), k = tipo === "abriu" ? "temperosAbertos" : "temperosUsados";
    d[k] = d[k] || [];
    if (d[k].indexOf(id) < 0) { d[k].push(id); salvar(); }
  }
  function pontuacao() {
    var d = dados(), itens = [];
    function add(nome, pts, max, detalhe) { itens.push({ nome: nome, pts: Math.min(pts, max), max: max, detalhe: detalhe }); }
    var nd = d.diagnosticos.length;
    add("Diagnóstico feito", nd ? 100 : 0, 100, nd ? "feito" : "ainda não fez");
    add("Refazer o diagnóstico", Math.max(0, nd - 1) * 50, 150, Math.max(0, nd - 1) + " de 3 refeitos");
    var evol = nd > 1 ? mediaGeral(d.diagnosticos[nd - 1].notas) - mediaGeral(d.diagnosticos[0].notas) : 0;
    add("Evolução da nota geral", Math.max(0, evol) * 10, 150, nd > 1 ? (evol >= 0 ? "+" : "") + evol + " pontos na nota" : "refaça o teste para medir");
    var t = d.testes || { disc: [], animais: [] };
    add("Testes de perfil", (t.disc.length ? 50 : 0) + (t.animais.length ? 50 : 0), 100, (t.disc.length ? 1 : 0) + (t.animais.length ? 1 : 0) + " de 2 testes");
    add("Encontros vistos", d.encontrosVistos.length * 30, 360, d.encontrosVistos.length + " de " + P.encontros.length);
    add("Ramo escolhido nos temperos", d.aluno.ramo ? 20 : 0, 20, d.aluno.ramo ? "escolhido" : "escolha na aba Temperos");
    add("Temperos explorados", (d.temperosAbertos || []).length * 5, 100, (d.temperosAbertos || []).length + " abertos");
    add("Temperos usados (copiados ou baixados)", (d.temperosUsados || []).length * 15, 150, (d.temperosUsados || []).length + " usados");
    add("Encontro individual pedido", d.individual ? 40 : 0, 40, d.individual ? "pedido" : "ainda não pediu");
    add("Cashback resgatado", d.cupons.length * 20, 60, d.cupons.length + " de 3 cupons");
    add("Dias em que entrou na plataforma", (d.diasAtivos || []).length * 10, 200, (d.diasAtivos || []).length + " dias");
    var total = itens.reduce(function (s, i) { return s + i.pts; }, 0), max = itens.reduce(function (s, i) { return s + i.max; }, 0);
    return { itens: itens, total: total, max: max };
  }
  function nivel(total) {
    var nomes = ["Ajudante de cozinha", "Cozinheiro", "Sous-chef", "Chef", "Chef da Panela"], n = 0;
    PREMIOS.forEach(function (p, i) { if (total >= p.pts) n = i + 1; });
    return nomes[n];
  }
  function telaConquistas() {
    var p = pontuacao(), prox = PREMIOS.filter(function (x) { return p.total < x.pts; })[0];
    var h = cabecalho("Conquistas", "Quanto mais você cozinha, mais a Panela te dá. Seus pontos vêm do seu desempenho e do uso da plataforma.");
    h += '<div class="grid g3" style="margin-bottom:16px"><div class="card ind"><span class="rot">Seus pontos</span><b>' + p.total + '</b><small>de ' + p.max + ' possíveis</small></div>' +
      '<div class="card ind"><span class="rot">Nível</span><b class="ind-txt">' + nivel(p.total) + '</b><small>' + PREMIOS.filter(function (x) { return p.total >= x.pts; }).length + " de " + PREMIOS.length + " prêmios</small></div>" +
      '<div class="card ind"><span class="rot">Próximo prêmio</span><b class="ind-txt">' + (prox ? esc(prox.nome) : "Todos liberados!") + "</b><small>" + (prox ? "faltam " + (prox.pts - p.total) + " pontos" : "você é Chef da Panela") + "</small></div></div>";
    var maxP = PREMIOS[PREMIOS.length - 1].pts;
    h += '<div class="card" style="margin-bottom:16px"><span class="rot">Sua trilha</span><div class="trilha"><div class="trilha-barra"><i style="width:' + Math.min(100, p.total / maxP * 100) + '%"></i></div>' +
      PREMIOS.map(function (x) { var ok = p.total >= x.pts; return '<span class="marco' + (ok ? " ok" : "") + '" style="left:' + (x.pts / maxP * 100) + '%;--c:' + x.cor + '"><em>' + x.pts + "</em></span>"; }).join("") + "</div></div>";
    h += '<div class="grid g2" style="margin-bottom:16px">' + PREMIOS.map(function (x) {
      var ok = p.total >= x.pts;
      return '<div class="card premio' + (ok ? " liberado" : "") + '" style="--c:' + x.cor + '"><div class="premio-topo"><span class="rot">' + x.pts + ' pontos</span><span class="selo">' + (ok ? "Liberado" : "Bloqueado") + "</span></div>" +
        "<h2>" + esc(x.nome) + '</h2><p class="muted" style="margin:6px 0 12px">' + (ok || x.nome !== "Boosts Secretos" ? esc(x.desc) : "Segredo. Chegue aos " + x.pts + " pontos para descobrir.") + "</p>" +
        (ok ? '<button class="btn peq" data-premio="' + esc(x.nome) + '">Resgatar</button>' : '<div class="barra"><i style="width:' + Math.min(100, p.total / x.pts * 100) + "%;background:" + x.cor + '"></i></div>') + "</div>";
    }).join("") + "</div>";
    h += '<div class="card"><h2>Como ganhar pontos</h2><div style="margin-top:8px">' + p.itens.map(function (i) {
      return '<div class="item"><span class="num' + (i.pts >= i.max ? " ok" : "") + '">' + i.pts + '</span><div style="flex:1"><b>' + esc(i.nome) + "</b><p>" + esc(i.detalhe) + " · até " + i.max + ' pontos</p></div></div>';
    }).join("") + '</div><p class="muted" style="font-size:12px;margin:12px 0 0">O Ramon acompanha os pontos de toda a turma e também avalia a participação nos encontros e as tarefas aplicadas no seu negócio.</p></div>';
    return h;
  }

  /* ---------- Montagem ---------- */
  function desenhar() {
    var d = dados();
    if (!d) return telaLogin();
    marcarDia();
    var telas = { inicio: telaInicio, diagnostico: telaDiagnostico, plano: telaPlano, encontros: telaEncontros, temperos: telaTemperos, perfil: telaPerfil, conquistas: telaConquistas, cashback: telaCashback, individual: telaIndividual, regras: telaRegras };
    var menu = MENU.map(function (m) { return '<button data-ir="' + m[0] + '" class="' + (atual === m[0] ? "ativo" : "") + '"' + (atual === m[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" aria-hidden="true">' + m[2] + "</svg>" + m[1] + "</button>"; }).join("");
    var raiz = document.getElementById("raiz");
    raiz.innerHTML = '<div class="aviso-demo">Versão de demonstração: os dados ficam só neste navegador.</div>' +
      '<div class="barra-mob">' + MENU.map(function (m) { return '<button data-ir="' + m[0] + '" class="' + (atual === m[0] ? "ativo" : "") + '">' + m[1] + "</button>"; }).join("") + "</div>" +
      '<div class="app"><aside class="lateral"><img src="logo-h-web.jpg" alt="A Panela"><nav class="menu" aria-label="Área do participante">' + menu + "</nav>" +
      '<div class="perfil"><div class="quem">' + avatar() + '<div><b>' + esc(d.aluno.nome) + "</b>" + (animalDe() ? "<small>" + esc(animalDe()) + "</small>" : "") + '</div></div><span class="muted">' + esc(d.aluno.email) + '</span><button class="btn peq contorno" id="b-sair">Sair</button></div></aside>' +
      '<main class="conteudo">' + telas[atual]() + "</main></div>";
    ligar();
  }

  function ligar() {
    var d = dados();
    document.querySelectorAll("[data-ir]").forEach(function (b) { b.addEventListener("click", function () { ir(b.getAttribute("data-ir")); }); });
    var sair = document.getElementById("b-sair");
    if (sair) sair.addEventListener("click", function () { Armazem.apagar(); atual = "inicio"; desenhar(); });
    var novo = document.getElementById("b-novo");
    if (novo) novo.addEventListener("click", function () { if (!d.rascunho) { d.rascunho = { resp: {} }; salvar(); } subDiag = 0; desenhar(); });
    var zerar = document.getElementById("b-zerar");
    if (zerar) zerar.addEventListener("click", function () {
      if (zerar.dataset.conf) { d.diagnosticos = []; d.rascunho = null; salvar(); toast("Histórico zerado."); desenhar(); }
      else { zerar.dataset.conf = "1"; zerar.textContent = "Toque de novo para confirmar"; }
    });
    var fb = document.getElementById("f-bloco");
    if (fb) {
      var guardar = function () {
        var a = P.areas[subDiag];
        A(a).perguntas.forEach(function (_, i) { var c = fb.querySelector('input[name="' + a.id + "-" + i + '"]:checked'); if (c) d.rascunho.resp[a.id + "-" + i] = +c.value; });
        d.rascunho.resp["aberta-" + a.id] = fb.querySelector("textarea").value; salvar();
      };
      fb.addEventListener("change", guardar);
      document.getElementById("d-voltar").addEventListener("click", function () { guardar(); if (subDiag) { subDiag--; desenhar(); } else { subDiag = null; desenhar(); } window.scrollTo(0, 0); });
      fb.addEventListener("submit", function (e) {
        e.preventDefault(); guardar();
        var a = P.areas[subDiag], falta = A(a).perguntas.filter(function (_, i) { return !d.rascunho.resp[a.id + "-" + i]; }).length;
        if (falta) { document.getElementById("d-erro").textContent = "Faltam " + falta + " pergunta(s) neste bloco."; return; }
        if (subDiag < P.areas.length - 1) { subDiag++; desenhar(); window.scrollTo(0, 0); return; }
        d.diagnosticos.push({ data: new Date().toISOString(), perfil: perfil(), resp: d.rascunho.resp, notas: notasDe(d.rascunho.resp) });
        d.rascunho = null; salvar(); subDiag = null; toast("Diagnóstico salvo!"); desenhar(); window.scrollTo(0, 0);
      });
    }
    document.querySelectorAll("[data-visto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.getAttribute("data-visto"), i = d.encontrosVistos.indexOf(n);
        if (i >= 0) d.encontrosVistos.splice(i, 1); else d.encontrosVistos.push(n);
        salvar(); desenhar();
      });
    });
    document.querySelectorAll("[data-ramo]").forEach(function (b) {
      b.addEventListener("click", function () {
        ramoSel = b.getAttribute("data-ramo"); d.aluno.ramo = ramoSel; tBusca = ""; salvar(); desenhar();
        var g = document.getElementById("t-grade"); if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    var tb = document.getElementById("t-busca");
    if (tb) tb.addEventListener("input", function () { tBusca = tb.value; atualizarGradeT(); });
    document.querySelectorAll("[data-tarea]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-tarea"), i = tAreas.indexOf(a);
        if (i >= 0) tAreas.splice(i, 1); else tAreas.push(a);
        b.classList.toggle("on", i < 0); b.setAttribute("aria-pressed", String(i < 0)); atualizarGradeT();
      });
    });
    var tn = document.getElementById("t-nivel");
    if (tn) tn.addEventListener("change", function () { tNivel = tn.value; atualizarGradeT(); });
    ligarGradeT();
    document.querySelectorAll("[data-resgatar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = +b.getAttribute("data-resgatar"), sufixo = Math.random().toString(36).slice(2, 6).toUpperCase();
        var ini = d.aluno.nome.split(" ")[0].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 8);
        d.cupons.push({ mes: m, codigo: "PANELA-" + ini + "-M" + m + "-" + sufixo, resgate: new Date().toISOString() });
        salvar(); toast("Cupom gerado!"); desenhar();
      });
    });
    document.querySelectorAll("[data-perfil]").forEach(function (b) {
      b.addEventListener("click", function () {
        var novo = b.getAttribute("data-perfil"); if (novo === perfil()) return;
        d.aluno.perfil = novo; d.rascunho = null; salvar(); toast("Perfil alterado."); desenhar();
      });
    });
    document.querySelectorAll("[data-teste]").forEach(function (b) {
      b.addEventListener("click", function () { testeAtivo = { id: b.getAttribute("data-teste"), i: 0, resp: [] }; desenhar(); window.scrollTo(0, 0); });
    });
    document.querySelectorAll("[data-opcao]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = T[testeAtivo.id];
        testeAtivo.resp[testeAtivo.i] = +b.getAttribute("data-opcao");
        if (testeAtivo.i < t.perguntas.length - 1) { testeAtivo.i++; desenhar(); return; }
        var r = resultado(t, testeAtivo.resp);
        hist(testeAtivo.id).push({ data: new Date().toISOString(), resp: testeAtivo.resp, pct: r.pct, principal: r.principal, secundario: r.secundario });
        salvar(); testeAtivo = null; toast("Resultado salvo!"); desenhar(); window.scrollTo(0, 0);
      });
    });
    var tv = document.getElementById("t-voltar");
    if (tv) tv.addEventListener("click", function () { if (testeAtivo.i) testeAtivo.i--; else testeAtivo = null; desenhar(); });
    document.querySelectorAll("[data-premio]").forEach(function (b) {
      b.addEventListener("click", function () { toast("Pedido de resgate enviado: " + b.getAttribute("data-premio") + ". O Ramon libera para você."); });
    });
    var fi = document.getElementById("f-ind");
    if (fi) fi.addEventListener("submit", function (e) {
      e.preventDefault();
      d.individual = { dia: document.getElementById("i-dia").value, tema: document.getElementById("i-tema").value.trim(), data: new Date().toISOString() };
      salvar(); toast("Pedido enviado!"); desenhar();
    });
  }

  desenhar();
})();
