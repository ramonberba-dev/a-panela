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
    ["nivelamento", "Nivelamento", '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'],
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
      '<div class="login2">' +
      '<section class="l-arte" aria-hidden="true"><span class="l-cota l-c1">FIG. 01 · A PANELA</span><span class="l-cota l-c2">MENTORIA · TURMA 01</span>' +
      '<span class="l-cruz l-x1"></span><span class="l-cruz l-x2"></span><img class="l-poster" src="login-arte.jpg" alt=""></section>' +
      '<section class="l-form"><div class="l-in">' +
      '<div class="l-topo"><span>Hub de Empreendedores Católicos</span><span>Nº 001</span></div>' +
      '<div class="l-tit"><span class="l-num">01 — Acesso</span><h1>Área do<br>participante</h1><p>Entre com o e-mail da sua inscrição e o código de acesso que você recebeu.</p></div>' +
      '<form id="f-login" class="l-campos" novalidate>' +
      '<div class="campo"><label for="l-nome">Seu nome</label><input id="l-nome" autocomplete="name"></div>' +
      '<div class="campo"><label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="email"></div>' +
      '<div class="l-duas"><div class="campo"><label for="l-perfil">Seu momento</label><select id="l-perfil">' + P.perfis.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="l-turma">Como entrou</label><select id="l-turma"><option value="hub">Fui ao 1º Encontro do Hub (R$ 997)</option><option value="geral">Inscrição geral (R$ 1.697)</option></select></div></div>' +
      '<p class="erro" id="l-erro" role="alert"></p>' +
      '<button class="l-entrar" type="submit"><span>Entrar na Panela</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>' +
      '<button class="l-demo" type="button" id="b-demo">Entrar como participante de demonstração</button>' +
      '<p class="l-nota">Demonstração: não é preciso código. Na versão no ar, o acesso é liberado depois da confirmação do pagamento.</p>' +
      '</form><div class="l-rodape"><span>Orar · Trabalhar · Servir · Amar</span><span>Panela só é ruim pra quem tá de fora</span></div>' +
      "</div></section></div>"));
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

  /* Abertura: as linhas se juntam, as cores chegam e a panela se forma até virar a logo. */
  function animarEntrada() {
    if (!document.body.animate) return;
    var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visto = false; try { visto = sessionStorage.getItem("panela-intro") === "1"; } catch (e) {}
    if (reduz || visto) return;
    try { sessionStorage.setItem("panela-intro", "1"); } catch (e) {}
    var box = document.createElement("div"); box.className = "abertura"; box.setAttribute("role", "presentation");
    box.innerHTML = '<div class="ab-arte"><img class="ab-img" src="' + (window.LOGIN_ARTE_URI || "login-arte.jpg") + '" alt=""></div><button class="ab-pular" type="button">Pular</button>';
    document.body.appendChild(box);
    var arte = box.querySelector(".ab-arte"), img = box.querySelector(".ab-img");
    var anims = [], camada = null, acabou = false;
    function terminar() {
      if (acabou) return; acabou = true;
      anims.forEach(function (a) { try { a.finish(); } catch (e) {} });
      sair();
    }
    function sair() {
      if (box.classList.contains("saindo")) return;
      box.classList.add("saindo");
      setTimeout(function () { box.remove(); }, 650);
    }
    function rodar() {
      var ra = arte.getBoundingClientRect(), ri = img.getBoundingClientRect();
      if (!ri.width) { terminar(); return; }
      camada = document.createElement("div"); camada.className = "l-anim"; camada.setAttribute("aria-hidden", "true");
      camada.style.cssText = "left:" + (ri.left - ra.left) + "px;top:" + (ri.top - ra.top) + "px;width:" + ri.width + "px;height:" + ri.height + "px";
      var W = ri.width, H = ri.height, NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("width", W); svg.setAttribute("height", H);
      camada.appendChild(svg);
      var rnd = (function (x) { return function () { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; })(20261120);
      // 1) linhas de prancheta convergindo
      for (var i = 0; i < 34; i++) {
        var vert = i % 2 === 0, ln = document.createElementNS(NS, "line");
        if (vert) { var x = W * (0.06 + rnd() * 0.88), y1 = H * (0.02 + rnd() * 0.3), y2 = y1 + H * (0.25 + rnd() * 0.45); ln.setAttribute("x1", x); ln.setAttribute("x2", x); ln.setAttribute("y1", y1); ln.setAttribute("y2", Math.min(H * 0.86, y2)); }
        else { var y = H * (0.06 + rnd() * 0.78), x1 = W * (rnd() * 0.3), x2 = x1 + W * (0.3 + rnd() * 0.5); ln.setAttribute("y1", y); ln.setAttribute("y2", y); ln.setAttribute("x1", x1); ln.setAttribute("x2", Math.min(W, x2)); }
        ln.setAttribute("pathLength", "1"); ln.setAttribute("class", i % 5 === 0 ? "tr" : "tl"); if (i % 3 === 0) ln.setAttribute("stroke-dasharray", "0.02 0.012");
        svg.appendChild(ln);
        var dx = vert ? (rnd() < 0.5 ? -1 : 1) * W * (0.4 + rnd() * 0.5) : 0, dy = vert ? 0 : (rnd() < 0.5 ? -1 : 1) * H * (0.3 + rnd() * 0.4);
        var d0 = 80 + i * 28;
        anims.push(ln.animate([{ transform: "translate(" + dx + "px," + dy + "px)", opacity: 0, strokeDashoffset: 1 }, { transform: "translate(0,0)", opacity: 1, strokeDashoffset: 0 }],
          { duration: 900, delay: d0, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }));
        anims.push(ln.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 2500 + (i % 6) * 40, easing: "ease-out", fill: "forwards" }));
      }
      // cruzinhas de marcação
      [[0.08, 0.1], [0.92, 0.12], [0.06, 0.82], [0.94, 0.8], [0.5, 0.47]].forEach(function (p, k) {
        var g = document.createElementNS(NS, "path"), cx = W * p[0], cy = H * p[1], r = Math.max(8, W * 0.018);
        g.setAttribute("d", "M" + (cx - r) + " " + cy + "H" + (cx + r) + "M" + cx + " " + (cy - r) + "V" + (cy + r)); g.setAttribute("class", "tl");
        svg.appendChild(g);
        anims.push(g.animate([{ opacity: 0, transform: "rotate(-90deg) scale(2.5)", transformOrigin: cx + "px " + cy + "px" }, { opacity: 1, transform: "none", transformOrigin: cx + "px " + cy + "px" }], { duration: 700, delay: 300 + k * 120, easing: "ease-out", fill: "both" }));
        anims.push(g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 2600, fill: "forwards" }));
      });
      // 2) blocos de cor chegando em volta da panela (posições da arte)
      var BL = [["#E2231A", 0.04, 0.17, 0.26, 0.5], ["#F5B800", 0.14, 0.21, 0.07, 0.1], ["#2D5BD7", 0.39, 0.5, 0.14, 0.27], ["#2D5BD7", 0.73, 0.36, 0.14, 0.24], ["#E2231A", 0.27, 0.6, 0.11, 0.16], ["#F5B800", 0.24, 0.42, 0.04, 0.05], ["#E2231A", 0.04, 0.53, 0.14, 0.05]];
      BL.forEach(function (b, k) {
        var el = document.createElement("i"); el.className = "l-bloco";
        el.style.cssText = "background:" + b[0] + ";left:" + b[1] * 100 + "%;top:" + b[2] * 100 + "%;width:" + b[3] * 100 + "%;height:" + b[4] * 100 + "%";
        camada.appendChild(el);
        var ang = rnd() * Math.PI * 2, dist = Math.max(W, H) * 0.9;
        anims.push(el.animate([{ transform: "translate(" + Math.cos(ang) * dist + "px," + Math.sin(ang) * dist + "px) rotate(" + (rnd() * 80 - 40) + "deg) scale(.6)", opacity: 0 },
          { transform: "none", opacity: 0.9, offset: 0.8 }, { transform: "none", opacity: 0.9 }], { duration: 1100, delay: 650 + k * 110, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }));
        anims.push(el.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 700, delay: 2300 + k * 50, easing: "ease-in", fill: "forwards" }));
      });
      arte.appendChild(camada);
      // 3) a panela aparece em traço e depois ganha as cores
      anims.push(img.animate([{ opacity: 0, clipPath: "inset(48% 48% 48% 48%)", filter: "grayscale(1) contrast(1.6) brightness(1.15)" },
        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", filter: "grayscale(1) contrast(1.6) brightness(1.15)", offset: 0.55 },
        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", filter: "grayscale(0) contrast(1) brightness(1)" }], { duration: 2200, delay: 900, easing: "cubic-bezier(.3,.6,.2,1)", fill: "both" }));
      var ultima = anims[anims.length - 1];
      ultima.onfinish = function () { acabou = true; setTimeout(sair, 700); };
      box.addEventListener("click", terminar, { once: true });
    }
    img.style.animation = "none";
    if (img.complete && img.naturalWidth) requestAnimationFrame(rodar); else { img.addEventListener("load", function () { requestAnimationFrame(rodar); }, { once: true }); img.addEventListener("error", terminar, { once: true }); }
    setTimeout(function () { if (!camada) terminar(); }, 4000);
    setTimeout(sair, 7000);
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
      '<div class="card ind" data-ir="nivelamento" style="cursor:pointer"><span class="rot">Nivelamento</span><b>' + nivProg().feitas + "/" + nivProg().total + "</b><small>" + (nivProg().feitas < nivProg().total ? "aulas · continuar" : "concluído!") + "</small></div>" +
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


  /* ---------- Nivelamento: aulas em vídeo no formato "player + lista de módulos" (nivelamento.js) ---------- */
  var NV = window.NIVELAMENTO || { modulos: [], emBreve: [] };
  var aulaSel = null, teatro = false;
  function nivAulas() { var l = []; NV.modulos.forEach(function (m) { m.aulas.forEach(function (a) { l.push(a); }); }); return l; }
  function nivD() {
    var d = dados();
    if (!d.nivel) d.nivel = { feitas: [], fav: [], notas: {}, aval: {}, ferr: {}, ultima: null };
    return d.nivel;
  }
  function ferrPreenchida(a) {
    var f = nivD().ferr[a.id] || {};
    return !!a.ferramenta && a.ferramenta.campos.some(function (_, i) { return (f[i] || "").trim(); });
  }
  function nivProg() {
    var aulas = nivAulas(), n = nivD();
    var comF = aulas.filter(function (a) { return a.ferramenta; });
    return { feitas: aulas.filter(function (a) { return n.feitas.indexOf(a.id) >= 0; }).length, total: aulas.length,
      ferr: comF.filter(ferrPreenchida).length, ferrTotal: comF.length };
  }
  function aulaAtual() {
    var aulas = nivAulas(), n = nivD();
    var id = aulaSel || n.ultima || (aulas.filter(function (a) { return n.feitas.indexOf(a.id) < 0; })[0] || aulas[0]).id;
    return aulas.filter(function (a) { return a.id === id; })[0] || aulas[0];
  }
  function textoFerramenta(a) {
    var f = nivD().ferr[a.id] || {};
    return a.ferramenta.nome.toUpperCase() + "\n" + a.ferramenta.campos.map(function (c, i) { return "- " + c.rot + ": " + ((f[i] || "").trim() || "(não preenchido)"); }).join("\n");
  }

  /* ---------- Planilha do plano semanal (aula 9): grade, pedras grandes e número do dia ---------- */
  var DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], TURNOS = ["Manhã", "Tarde", "Noite"];
  var CATS = { "": "Sem marcação", F: "Família, fé e saúde", P: "Pedra grande", T: "Trabalho e rotina", C: "Com o Claude" }, ORDEM_C = ["", "F", "P", "T", "C"];
  var semOff = 0;
  function segundaDe(d) { d = new Date(d); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
  function semAtual() { var x = segundaDe(new Date()); x.setDate(x.getDate() + 7 * semOff); return x; }
  function ddmm(d) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }
  function rotSemana() { var a = semAtual(), b = new Date(a); b.setDate(b.getDate() + 6); return ddmm(a) + " a " + ddmm(b); }
  function planD() {
    var n = nivD(); if (!n.plan) n.plan = {};
    var k = semAtual().toISOString().slice(0, 10);
    if (!n.plan[k]) {
      var f7 = n.ferr.semana || {}, f8 = n.ferr.pedras || {}, f10 = n.ferr.metas || {};
      n.plan[k] = { grade: {}, encerrar: f7[4] || "", pedras: [0, 1, 2].map(function (i) { return { t: f8[i] || "", passos: "", dia: "", ok: false }; }),
        num: { nome: f10[4] || "", meta: "", real: {} }, balanco: "" };
    }
    return n.plan[k];
  }
  function numRes(p) {
    var meta = parseFloat(String(p.num.meta).replace(",", ".")) || 0, tot = 0, bat = 0;
    DIAS.slice(0, 6).forEach(function (d) { var v = parseFloat(String(p.num.real[d] || "").replace(",", ".")); if (!isNaN(v)) { tot += v; if (meta && v >= meta) bat++; } });
    var alvo = meta * 6; return { meta: meta, tot: tot, alvo: alvo, pct: alvo ? Math.round(tot / alvo * 100) : 0, bat: bat };
  }
  function htmlRes(p) {
    var r = numRes(p);
    return '<div><small>Total da semana</small><b>' + r.tot + (r.alvo ? " / " + r.alvo : "") + '</b></div><div><small>Da meta</small><b>' + (r.alvo ? r.pct + "%" : "–") + '</b></div><div><small>Dias que bateu</small><b>' + r.bat + " de 6</b></div>" +
      '<div class="pl-barra" aria-hidden="true"><i style="width:' + Math.min(100, r.pct) + '%"></i></div>';
  }
  function planilhaHTML() {
    var p = planD();
    var leg = ORDEM_C.slice(1).map(function (c) { return '<span class="pl-leg c-' + c + '"><i></i>' + CATS[c] + "</span>"; }).join("");
    var grade = '<div class="pl-rolar"><table class="pl-grade"><thead><tr><th></th>' + DIAS.map(function (d) { return "<th>" + d + "</th>"; }).join("") + "</tr></thead><tbody>" +
      TURNOS.map(function (t) {
        return "<tr><th>" + t + "</th>" + DIAS.map(function (d) {
          var k = d + "-" + t, c = p.grade[k] || { t: "", c: "" };
          return '<td><div class="pl-cel c-' + (c.c || "0") + '"><button type="button" class="pl-cat" data-pl-cat="' + k + '" title="Trocar a cor: ' + CATS[c.c || ""] + '" aria-label="Cor do bloco ' + d + " " + t + ": " + CATS[c.c || ""] + '"></button><textarea rows="2" data-pl-cel="' + k + '" aria-label="' + d + " " + t + '">' + esc(c.t) + "</textarea></div></td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    var pedras = p.pedras.map(function (x, i) {
      return '<div class="pl-pedra"><span class="pl-n">' + (i + 1) + '</span><input data-pl-pedra="' + i + '" data-k="t" placeholder="Pedra grande ' + (i + 1) + '" value="' + esc(x.t) + '"><input data-pl-pedra="' + i + '" data-k="passos" placeholder="Próximo passo (até 1 hora)" value="' + esc(x.passos) + '">' +
        '<select data-pl-pedra="' + i + '" data-k="dia" aria-label="Dia da pedra ' + (i + 1) + '"><option value="">Dia</option>' + DIAS.map(function (d) { return "<option" + (x.dia === d ? " selected" : "") + ">" + d + "</option>"; }).join("") + "</select>" +
        '<label class="pl-ok"><input type="checkbox" data-pl-pedra="' + i + '" data-k="ok"' + (x.ok ? " checked" : "") + "> Feito</label></div>";
    }).join("");
    var num = '<div class="pl-num-topo"><div class="campo"><label for="pl-nome">O que eu conto todo dia</label><input id="pl-nome" data-pl-num="nome" placeholder="Ex.: contatos, propostas, posts" value="' + esc(p.num.nome) + '"></div>' +
      '<div class="campo"><label for="pl-meta">Meta por dia</label><input id="pl-meta" data-pl-num="meta" inputmode="decimal" placeholder="Ex.: 5" value="' + esc(p.num.meta) + '"></div></div>' +
      '<div class="pl-dias">' + DIAS.slice(0, 6).map(function (d) { return '<label><span>' + d + '</span><input inputmode="decimal" data-pl-real="' + d + '" value="' + esc(p.num.real[d] || "") + '"></label>'; }).join("") + "</div>" +
      '<div class="pl-res" id="pl-res">' + htmlRes(p) + "</div>";
    return '<div class="card pl" id="pl"><div class="nv-ferr-topo"><div><span class="rot">Ferramenta da aula</span><h2>Planilha do plano semanal</h2><p class="muted" style="margin:4px 0 0">Use aqui mesmo (salva sozinha) ou baixe em Excel, que também abre no Google Planilhas.</p></div>' +
      '<div class="pl-sem"><button type="button" class="nv-ic" data-pl-sem="-1" aria-label="Semana anterior">‹</button><span><small>Semana</small><b>' + rotSemana() + '</b></span><button type="button" class="nv-ic" data-pl-sem="1" aria-label="Próxima semana">›</button></div></div>' +
      '<h3 class="pl-tit"><span>01</span> Grade da semana</h3><p class="muted pl-dica">Escreva o que entra em cada bloco e toque na bolinha para trocar a cor.</p><div class="pl-legs">' + leg + "</div>" + grade +
      '<div class="campo" style="max-width:280px;margin-top:12px"><label for="pl-enc">Meu horário de encerrar o dia</label><input id="pl-enc" data-pl-campo="encerrar" placeholder="Ex.: 18h30" value="' + esc(p.encerrar) + '"></div>' +
      '<h3 class="pl-tit"><span>02</span> Pedras grandes</h3><p class="muted pl-dica">As 3 prioridades que mais mexem no resultado. Vieram da aula 8; ajuste se precisar.</p>' + pedras +
      '<h3 class="pl-tit"><span>03</span> Número do dia</h3><p class="muted pl-dica">Anote no fim de cada dia quanto você fez. O resto a planilha calcula.</p>' + num +
      '<div class="campo" style="margin-top:14px"><label for="pl-bal">Balanço da semana: onde a grade furou e o que aprendi</label><textarea id="pl-bal" rows="3" data-pl-campo="balanco">' + esc(p.balanco) + "</textarea></div>" +
      '<div class="pl-acoes"><button class="btn" id="pl-xlsx" type="button">Baixar em Excel</button><button class="btn contorno" id="pl-claude" type="button">Copiar para o Claude analisar</button><button class="btn contorno" id="pl-imp" type="button">Imprimir ou salvar PDF</button></div>' +
      '<p class="muted" style="font-size:12px;margin:10px 0 0">No Google Planilhas: Arquivo › Importar › Fazer upload e escolha o arquivo baixado.</p></div>';
  }
  function textoPlanilha(p) {
    var r = numRes(p), l = ["PLANO DA SEMANA (" + rotSemana() + ")", "", "GRADE DA SEMANA"];
    DIAS.forEach(function (d) {
      var it = TURNOS.map(function (t) { var c = p.grade[d + "-" + t]; return c && c.t.trim() ? t + ": " + c.t.trim() + (c.c ? " [" + CATS[c.c] + "]" : "") : ""; }).filter(Boolean);
      if (it.length) l.push("- " + d + " · " + it.join(" | "));
    });
    l.push("Horário de encerrar o dia: " + (p.encerrar || "(não definido)"), "", "PEDRAS GRANDES");
    p.pedras.forEach(function (x, i) { l.push((i + 1) + ". " + (x.t || "(vazia)") + (x.passos ? " · próximo passo: " + x.passos : "") + (x.dia ? " · " + x.dia : "") + (x.ok ? " · FEITO" : "")); });
    l.push("", "NÚMERO DO DIA: " + (p.num.nome || "(indicador)") + " · meta " + (p.num.meta || "?") + " por dia");
    DIAS.slice(0, 6).forEach(function (d) { l.push("- " + d + ": " + (p.num.real[d] || "-")); });
    l.push("Total: " + r.tot + (r.alvo ? " de " + r.alvo + " (" + r.pct + "%)" : "") + " · dias que bateu: " + r.bat + " de 6", "", "BALANÇO: " + (p.balanco || "(em branco)"));
    return "Analise a minha semana abaixo. Diga onde a grade furou e por quê, se as pedras grandes andaram, como foi o número do dia e o que eu devo proteger na próxima semana. Sugira a grade da próxima semana e liste o que você, Claude, pode assumir para eu ganhar tempo com a família.\n\n" + l.join("\n");
  }
  function salvarArquivo(nome, dados, tipo) {
    if (window.claude && window.claude.use) {
      return window.claude.use("downloads").then(function (dl) {
        if (!dl) { toast("Download indisponível aqui."); return; }
        return dl.save({ filename: nome, data: dados instanceof Blob ? dados : new Blob([dados], { type: tipo }) }).then(function () { toast("Arquivo salvo: " + nome); }, function (e) { if (!e || e.code !== "declined") toast("Não foi possível baixar agora."); });
      });
    }
    var a = document.createElement("a"); a.href = URL.createObjectURL(dados instanceof Blob ? dados : new Blob([dados], { type: tipo })); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); toast("Baixando " + nome);
  }
  function carregarXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (ok, erro) {
      var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      sc.onload = function () { ok(window.XLSX); }; sc.onerror = erro; document.head.appendChild(sc);
    });
  }
  function baixarPlanilha() {
    var p = planD(), r = numRes(p), sem = semAtual().toISOString().slice(0, 10), nome = "Plano semanal - A Panela - " + sem;
    var abaGrade = [["PLANO DA SEMANA · " + rotSemana()], [], ["Turno"].concat(DIAS)].concat(TURNOS.map(function (t) {
      return [t].concat(DIAS.map(function (d) { var c = p.grade[d + "-" + t]; return c ? (c.c ? "[" + CATS[c.c] + "] " : "") + c.t : ""; }));
    })).concat([[], ["Horário de encerrar o dia", p.encerrar]]);
    var abaPedras = [["#", "Pedra grande", "Próximo passo", "Dia", "Feito"]].concat(p.pedras.map(function (x, i) { return [i + 1, x.t, x.passos, x.dia, x.ok ? "Sim" : "Não"]; }));
    var abaNum = [["Indicador", p.num.nome], ["Meta por dia", r.meta || ""], [], ["Dia", "Meta", "Realizado", "Bateu?"]].concat(DIAS.slice(0, 6).map(function (d) {
      var v = parseFloat(String(p.num.real[d] || "").replace(",", ".")); return [d, r.meta || "", isNaN(v) ? "" : v, isNaN(v) || !r.meta ? "" : v >= r.meta ? "Sim" : "Não"];
    })).concat([[], ["Total", r.alvo || "", r.tot, r.bat + " de 6"], ["% da meta", r.alvo ? r.pct / 100 : ""]]);
    carregarXLSX().then(function (X) {
      var wb = X.utils.book_new();
      function aba(dados, nomeA, larg) { var ws = X.utils.aoa_to_sheet(dados); ws["!cols"] = larg.map(function (w) { return { wch: w }; }); X.utils.book_append_sheet(wb, ws, nomeA); return ws; }
      aba(abaGrade, "Grade da semana", [24, 22, 22, 22, 22, 22, 22, 22]);
      aba(abaPedras, "Pedras grandes", [4, 40, 40, 8, 8]);
      var wn = aba(abaNum, "Número do dia", [24, 12, 12, 10]);
      wn["C11"] = { t: "n", f: "SUM(C5:C10)", v: r.tot }; if (r.alvo) { wn["B12"] = { t: "n", f: "IFERROR(C11/B11,0)", v: r.pct / 100, z: "0%" }; }
      aba([["Balanço da semana"], [p.balanco || ""], [], ["Pedido para o Claude"], [textoPlanilha(p).split("\n\n")[0]]], "Balanço", [100]);
      var buf = X.write(wb, { bookType: "xlsx", type: "array" });
      salvarArquivo(nome + ".xlsx", new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    }).catch(function () {
      var csv = abaGrade.concat([[]], abaPedras, [[]], abaNum).map(function (l) { return l.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
      salvarArquivo(nome + ".csv", "\ufeff" + csv, "text/csv");
    });
  }
  function ligarPlanilha() {
    var el = document.getElementById("pl"); if (!el) return;
    var p = planD();
    el.querySelectorAll("[data-pl-sem]").forEach(function (b) { b.addEventListener("click", function () { semOff += +b.getAttribute("data-pl-sem"); desenhar(); var x = document.getElementById("pl"); if (x) x.scrollIntoView({ block: "start" }); }); });
    el.querySelectorAll("[data-pl-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-pl-cat"), c = p.grade[k] || (p.grade[k] = { t: "", c: "" });
        c.c = ORDEM_C[(ORDEM_C.indexOf(c.c || "") + 1) % ORDEM_C.length]; salvar();
        b.parentNode.className = "pl-cel c-" + (c.c || "0"); b.title = "Trocar a cor: " + CATS[c.c]; b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/: .*$/, ": " + CATS[c.c]));
      });
    });
    el.querySelectorAll("[data-pl-cel]").forEach(function (t) { t.addEventListener("input", function () { var k = t.getAttribute("data-pl-cel"); (p.grade[k] || (p.grade[k] = { t: "", c: "" })).t = t.value; salvar(); }); });
    el.querySelectorAll("[data-pl-campo]").forEach(function (t) { t.addEventListener("input", function () { p[t.getAttribute("data-pl-campo")] = t.value; salvar(); }); });
    el.querySelectorAll("[data-pl-pedra]").forEach(function (t) {
      t.addEventListener(t.type === "checkbox" || t.tagName === "SELECT" ? "change" : "input", function () { var x = p.pedras[+t.getAttribute("data-pl-pedra")]; x[t.getAttribute("data-k")] = t.type === "checkbox" ? t.checked : t.value; salvar(); });
    });
    function atualiza() { document.getElementById("pl-res").innerHTML = htmlRes(p); }
    el.querySelectorAll("[data-pl-num]").forEach(function (t) { t.addEventListener("input", function () { p.num[t.getAttribute("data-pl-num")] = t.value; salvar(); atualiza(); }); });
    el.querySelectorAll("[data-pl-real]").forEach(function (t) { t.addEventListener("input", function () { p.num.real[t.getAttribute("data-pl-real")] = t.value; salvar(); atualiza(); }); });
    document.getElementById("pl-xlsx").addEventListener("click", baixarPlanilha);
    document.getElementById("pl-claude").addEventListener("click", function () {
      var txt = textoPlanilha(p);
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Copiado! Cole no Claude."); }, function () { window.prompt("Copie o texto:", txt); });
      else window.prompt("Copie o texto:", txt);
    });
    document.getElementById("pl-imp").addEventListener("click", function () {
      document.body.classList.add("imp-pl");
      window.addEventListener("afterprint", function f() { document.body.classList.remove("imp-pl"); window.removeEventListener("afterprint", f); });
      window.print();
    });
  }

  /* Material de apoio em PDF de cada aula e guias */
  var BASE_MAT = (location.protocol === "https:" || location.protocol === "http:") && !/claude\.ai|claudeusercontent/.test(location.host) ? "materiais/" : "https://panela.usevox.com.br/materiais/";
  var GUIAS = [["guia-claude.pdf", "Guia prático inicial do Claude", "32 páginas"], ["guia-grok-claude.pdf", "Grok + Claude: a dupla do seu negócio", "18 páginas"]];
  function pdfAula(idx) { return BASE_MAT + "aula-" + ("0" + (idx + 1)).slice(-2) + ".pdf"; }
  function telaNivelamento() {
    var n = nivD(), aulas = nivAulas(), a = aulaAtual(), idx = aulas.indexOf(a), pr = nivProg();
    var pct = Math.round(pr.feitas / pr.total * 100), feita = n.feitas.indexOf(a.id) >= 0, fav = n.fav.indexOf(a.id) >= 0, nota = n.aval[a.id] || 0;
    var h = '<div class="nv-topo"><div><span class="rot">A Panela · Nivelamento</span><h1>O kit básico antes do 1º encontro</h1>' +
      '<p class="muted" style="margin:4px 0 0"><b style="color:var(--ink)">' + pct + "% concluído</b> · " + pr.feitas + "/" + pr.total + " aulas · " + pr.ferr + "/" + pr.ferrTotal + ' ferramentas preenchidas</p></div>' +
      '<div class="nv-prog" role="progressbar" aria-label="Progresso do nivelamento" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div></div>';
    h += '<div class="nv' + (teatro ? " teatro" : "") + '"><div class="nv-principal">';
    h += '<div class="nv-player">' + (a.video ? '<iframe src="' + esc(a.video) + '" loading="lazy" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowfullscreen title="' + esc(a.titulo) + '"></iframe>' :
      '<div class="nv-sem"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg><b>' + esc(a.titulo) + '</b><span>Vídeo em gravação · ' + esc(a.dur) + " min</span></div>") + "</div>";
    h += '<div class="nv-ctrl"><div><button class="nv-ic" data-nv-ir="' + (idx - 1) + '"' + (idx ? "" : " disabled") + ' aria-label="Aula anterior"><svg viewBox="0 0 24 24"><path d="M6 5v14M18 5l-9 7 9 7z"/></svg></button>' +
      '<button class="nv-ic" data-nv-ir="' + (idx + 1) + '"' + (idx < aulas.length - 1 ? "" : " disabled") + ' aria-label="Próxima aula"><svg viewBox="0 0 24 24"><path d="M18 5v14M6 5l9 7-9 7z"/></svg></button></div>' +
      '<button class="nv-ic nv-teatro-b" id="nv-teatro" aria-label="Modo teatro" aria-pressed="' + teatro + '"><svg viewBox="0 0 24 24"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg></button></div>';
    h += '<div class="card nv-aula"><span class="rot">Aula ' + (idx + 1) + " de " + aulas.length + " · " + esc(a.dur) + " min</span><h2>" + esc(a.titulo) + '</h2><p style="margin:6px 0 0">' + esc(a.resumo) + "</p>" +
      '<div class="nv-acoes"><button class="btn" id="nv-concluir">' + (feita ? (idx < aulas.length - 1 ? "Próxima aula" : "Aula concluída") : "Concluir e avançar") + "</button>" +
      '<button class="btn contorno' + (fav ? " on" : "") + '" id="nv-fav" aria-pressed="' + fav + '">' + (fav ? "★ Favorita" : "☆ Favoritar") + "</button>" +
      '<span class="nv-estrelas" role="group" aria-label="Avaliar a aula">' + [1, 2, 3, 4, 5].map(function (k) { return '<button data-nv-nota="' + k + '" aria-label="' + k + " estrela" + (k > 1 ? "s" : "") + '" class="' + (k <= nota ? "on" : "") + '">★</button>'; }).join("") + "</span></div>" +
      '<h3 style="margin-top:18px">Nesta aula</h3><ul class="lista">' + a.pontos.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    if (a.ferramenta) {
      var f = n.ferr[a.id] || {};
      h += '<div class="card nv-ferr"><div class="nv-ferr-topo"><div><span class="rot">Ferramenta da aula</span><h2>' + esc(a.ferramenta.nome) + '</h2></div><span class="chip">' + (ferrPreenchida(a) ? "Salva automaticamente" : "Preencha aqui") + "</span></div>" +
        a.ferramenta.campos.map(function (c, i) { return '<div class="campo"><label for="nvf-' + i + '">' + esc(c.rot) + "</label>" + (c.dica ? '<small class="muted">' + esc(c.dica) + "</small>" : "") + '<textarea id="nvf-' + i + '" data-nv-campo="' + i + '" rows="2">' + esc(f[i] || "") + "</textarea></div>"; }).join("") +
        '<div class="nv-pedido"><span class="rot">Pedido pronto para o Claude</span><p>' + esc(a.prompt) + '</p><button class="btn peq" id="nv-copiar">Copiar a ferramenta com o pedido</button></div></div>';
    } else if (a.prompt) {
      h += '<div class="card nv-ferr"><span class="rot">Tudo o que você preencheu</span><h2>O manual do seu negócio para o Claude</h2><p class="muted" style="margin:6px 0 12px">Junta todas as ferramentas do nivelamento num texto só, pronto para colar nas instruções do seu Projeto no Claude.</p>' +
        '<div class="nv-pedido"><span class="rot">Pedido pronto para o Claude</span><p>' + esc(a.prompt) + '</p><button class="btn peq" id="nv-copiar-tudo">Copiar tudo do nivelamento</button></div></div>';
    }
    if (a.id === "planilha") h += planilhaHTML();
    h += '<div class="card nv-mat"><div><span class="rot">Material de apoio · PDF</span><b>Aula ' + ("0" + (idx + 1)).slice(-2) + " · " + esc(a.titulo) + '</b><small class="muted">Explicação passo a passo, exemplos, a ferramenta para imprimir e os pedidos prontos para o Claude.</small></div>' +
      '<div class="nv-mat-b"><a class="btn" href="' + pdfAula(idx) + '" target="_blank" rel="noopener">Abrir o PDF</a><a class="btn contorno" href="' + pdfAula(idx) + '" download>Baixar</a></div></div>';
    h += '<div class="card"><span class="rot">Missão da aula</span><p style="margin:6px 0 0"><b>' + esc(a.tarefa) + '</b></p><p class="muted" style="font-size:12.5px;margin:8px 0 0">Ficou com dúvida? Leve para o grupo da Panela no WhatsApp ou para o seu encontro individual.</p></div>';
    h += '<div class="card"><label class="rot" for="nv-notas">Anotações</label><textarea id="nv-notas" class="nv-notas" rows="4" placeholder="Escreva aqui o que você quer lembrar desta aula. Só você vê.">' + esc(n.notas[a.id] || "") + '</textarea><div style="margin-top:10px"><button class="btn peq" id="nv-salvar">Salvar</button></div></div>';
    h += '</div><aside class="nv-lista" aria-label="Módulos e aulas">' + NV.modulos.map(function (m) {
      var feitasM = m.aulas.filter(function (x) { return n.feitas.indexOf(x.id) >= 0; }).length, pm = Math.round(feitasM / m.aulas.length * 100);
      var aberto = m.aulas.indexOf(a) >= 0;
      return '<details class="nv-mod"' + (aberto ? " open" : "") + '><summary><span class="nv-pct">' + pm + "%</span>" + esc(m.titulo) + "</summary>" + m.aulas.map(function (x) {
        var ok = n.feitas.indexOf(x.id) >= 0;
        return '<button class="nv-item' + (x === a ? " at" : "") + (ok ? " ok" : "") + '" data-nv-aula="' + x.id + '"' + (x === a ? ' aria-current="true"' : "") + '><span class="nv-ck">' + (ok ? "✓" : "") + "</span><span>" + esc(x.titulo) + (n.fav.indexOf(x.id) >= 0 ? " ★" : "") + "</span><small>" + esc(x.dur) + "</small></button>";
      }).join("") + "</details>";
    }).join("") + '<div class="nv-mod nv-guias"><span class="rot">Guias práticos</span>' + GUIAS.map(function (g) { return '<a class="nv-guia" href="' + BASE_MAT + g[0] + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7"/></svg><span>' + esc(g[1]) + "<small>PDF · " + g[2] + "</small></span></a>"; }).join("") + "</div>" + (NV.emBreve || []).map(function (t) { return '<div class="nv-mod nv-breve"><span class="nv-pct">🔒</span><span>' + esc(t) + "</span><small>em breve</small></div>"; }).join("") + "</aside></div>";
    return h;
  }
  function ligarNivelamento() {
    if (atual !== "nivelamento") return;
    var n = nivD(), aulas = nivAulas(), a = aulaAtual(), idx = aulas.indexOf(a);
    function abrir(id) { aulaSel = id; n.ultima = id; salvar(); desenhar(); var t = document.querySelector(".nv-topo"); if (t) t.scrollIntoView({ block: "start" }); }
    document.querySelectorAll("[data-nv-aula]").forEach(function (b) { b.addEventListener("click", function () { abrir(b.getAttribute("data-nv-aula")); }); });
    document.querySelectorAll("[data-nv-ir]").forEach(function (b) { b.addEventListener("click", function () { var k = +b.getAttribute("data-nv-ir"); if (aulas[k]) abrir(aulas[k].id); }); });
    var te = document.getElementById("nv-teatro"); if (te) te.addEventListener("click", function () { teatro = !teatro; desenhar(); });
    var co = document.getElementById("nv-concluir");
    if (co) co.addEventListener("click", function () {
      var nova = n.feitas.indexOf(a.id) < 0;
      if (nova) { n.feitas.push(a.id); salvar(); }
      if (idx < aulas.length - 1) { abrir(aulas[idx + 1].id); if (nova) toast("Aula concluída! +10 pontos"); }
      else { desenhar(); if (nova) toast("Nivelamento concluído! Você está pronto para o 1º encontro."); }
    });
    var fv = document.getElementById("nv-fav");
    if (fv) fv.addEventListener("click", function () { var i = n.fav.indexOf(a.id); if (i >= 0) n.fav.splice(i, 1); else n.fav.push(a.id); salvar(); desenhar(); });
    document.querySelectorAll("[data-nv-nota]").forEach(function (b) { b.addEventListener("click", function () { n.aval[a.id] = +b.getAttribute("data-nv-nota"); salvar(); toast("Obrigado pela avaliação!"); desenhar(); }); });
    document.querySelectorAll("[data-nv-campo]").forEach(function (t) {
      t.addEventListener("input", function () { n.ferr[a.id] = n.ferr[a.id] || {}; n.ferr[a.id][t.getAttribute("data-nv-campo")] = t.value; salvar(); });
    });
    function copiar(txt) {
      var ok = function () { toast("Copiado! Cole no Claude."); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { window.prompt("Copie o texto:", txt); });
      else window.prompt("Copie o texto:", txt);
    }
    var cp = document.getElementById("nv-copiar"); if (cp) cp.addEventListener("click", function () { copiar(a.prompt + "\n\n" + textoFerramenta(a)); });
    var ct = document.getElementById("nv-copiar-tudo");
    if (ct) ct.addEventListener("click", function () {
      var partes = aulas.filter(function (x) { return x.ferramenta; }).map(textoFerramenta);
      copiar("MANUAL DO MEU NEGÓCIO (preenchido no Nivelamento de A Panela)\n\n" + partes.join("\n\n") + "\n\n" + a.prompt);
    });
    if (a.id === "planilha") ligarPlanilha();
    var sv = document.getElementById("nv-salvar");
    if (sv) sv.addEventListener("click", function () { n.notas[a.id] = document.getElementById("nv-notas").value; salvar(); toast("Anotação salva."); });
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
    var np = nivProg();
    add("Aulas do nivelamento", np.feitas * 10, np.total * 10, np.feitas + " de " + np.total + " aulas");
    add("Ferramentas do nivelamento preenchidas", np.ferr * 15, np.ferrTotal * 15, np.ferr + " de " + np.ferrTotal);
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


  /* Celular: barra fixa embaixo com as 4 abas principais + "Mais" (grade com todas as abas numa tela só). */
  var PRINCIPAIS = ["inicio", "nivelamento", "diagnostico", "temperos"];
  function icone(id) { var m = MENU.filter(function (x) { return x[0] === id; })[0]; return '<svg viewBox="0 0 24 24" aria-hidden="true">' + m[2] + "</svg>"; }
  function nomeMenu(id) { var m = MENU.filter(function (x) { return x[0] === id; })[0]; return m[1]; }
  function barraInferior() {
    var naMais = PRINCIPAIS.indexOf(atual) < 0;
    return '<nav class="tabbar" aria-label="Navegação principal">' + PRINCIPAIS.map(function (id) {
      return '<button data-ir="' + id + '" class="' + (atual === id ? "ativo" : "") + '"' + (atual === id ? ' aria-current="page"' : "") + ">" + icone(id) + "<span>" + (id === "diagnostico" ? "Diagnóstico" : nomeMenu(id)) + "</span></button>";
    }).join("") + '<button id="b-mais" class="' + (naMais ? "ativo" : "") + '" aria-expanded="false" aria-controls="folha-mais"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>Mais</span></button></nav>' +
      '<div class="folha-fundo" id="folha-fundo" hidden></div><div class="folha" id="folha-mais" hidden role="dialog" aria-label="Todas as abas"><div class="folha-alca"></div><span class="rot">Todas as abas</span><div class="folha-grade">' +
      MENU.map(function (m) { return '<button data-ir="' + m[0] + '" class="' + (atual === m[0] ? "ativo" : "") + '">' + icone(m[0]) + "<span>" + m[1] + "</span></button>"; }).join("") +
      '</div><button class="btn contorno" id="b-sair-mob" style="width:100%;justify-content:center;margin-top:14px">Sair</button></div>';
  }
  /* ---------- Montagem ---------- */
  function desenhar() {
    var d = dados();
    if (!d) return telaLogin();
    marcarDia();
    var telas = { inicio: telaInicio, nivelamento: telaNivelamento, diagnostico: telaDiagnostico, plano: telaPlano, encontros: telaEncontros, temperos: telaTemperos, perfil: telaPerfil, conquistas: telaConquistas, cashback: telaCashback, individual: telaIndividual, regras: telaRegras };
    var menu = MENU.map(function (m) { return '<button data-ir="' + m[0] + '" class="' + (atual === m[0] ? "ativo" : "") + '"' + (atual === m[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" aria-hidden="true">' + m[2] + "</svg>" + m[1] + "</button>"; }).join("");
    var raiz = document.getElementById("raiz");
    raiz.innerHTML = '<div class="aviso-demo">Versão de demonstração: os dados ficam só neste navegador.</div>' +
      '<header class="topo-mob"><img src="logo-h-web.jpg" alt="A Panela"><button class="topo-mob-perfil" data-ir="conquistas" aria-label="Minhas conquistas">' + avatar() + "</button></header>" +
      '<div class="app"><aside class="lateral"><img src="logo-h-web.jpg" alt="A Panela"><nav class="menu" aria-label="Área do participante">' + menu + "</nav>" +
      '<div class="perfil"><div class="quem">' + avatar() + '<div><b>' + esc(d.aluno.nome) + "</b>" + (animalDe() ? "<small>" + esc(animalDe()) + "</small>" : "") + '</div></div><span class="muted">' + esc(d.aluno.email) + '</span><button class="btn peq contorno" id="b-sair">Sair</button></div></aside>' +
      '<main class="conteudo">' + telas[atual]() + "</main></div>" + barraInferior();
    ligar();
  }

  function ligar() {
    var d = dados();
    ligarNivelamento();
    document.querySelectorAll("[data-ir]").forEach(function (b) { b.addEventListener("click", function () { ir(b.getAttribute("data-ir")); }); });
    var bm = document.getElementById("b-mais"), fo = document.getElementById("folha-mais"), ff = document.getElementById("folha-fundo");
    function folha(abrir) { if (!fo) return; fo.hidden = !abrir; ff.hidden = !abrir; bm.setAttribute("aria-expanded", String(abrir)); document.body.classList.toggle("sem-rolar", abrir); }
    if (bm) { bm.addEventListener("click", function () { folha(fo.hidden); }); ff.addEventListener("click", function () { folha(false); }); }
    document.body.classList.remove("sem-rolar");
    var sm = document.getElementById("b-sair-mob");
    if (sm) sm.addEventListener("click", function () { Armazem.apagar(); atual = "inicio"; desenhar(); });
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
  animarEntrada();
})();
