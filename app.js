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
  var NV_ = window.NUVEM || null, usuarioNuvem = null, contaNuvem = null, timerNuvem = null, carregando = !!NV_;
  function salvar() {
    Armazem.gravar(memoria);
    if (NV_ && usuarioNuvem && memoria && memoria.nuvem && !memoria.mentor) {
      clearTimeout(timerNuvem);
      var uid = usuarioNuvem.uid, txt = JSON.stringify(memoria);
      timerNuvem = setTimeout(function () {
        NV_.db.collection("progresso").doc(uid).set({ dados: txt, atualizado: NV_.agora() }).catch(function () { toast("Sem conexão: o progresso fica salvo aqui e sobe quando a internet voltar."); });
      }, 900);
    }
  }
  function sairConta() {
    Armazem.apagar(); contaNuvem = null; atual = "inicio";
    if (NV_ && usuarioNuvem) { NV_.auth.signOut(); } else desenhar();
  }

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
      '<span class="l-cruz l-x1"></span><span class="l-cruz l-x2"></span><img class="l-poster" src="panela-logo-arte.jpg" alt=""></section>' +
      '<section class="l-form"><div class="l-in">' +
      '<div class="l-topo"><span>Hub de Empreendedores Católicos</span><span>Nº 001</span></div>' +
      '<div class="l-tit"><span class="l-num">01 — Acesso</span><h1>Área do<br>participante</h1><p>Entre com o seu e-mail e senha ou com o Google. Primeira vez? Faça o pré-cadastro.</p></div>' +
      '<div class="l-abas" role="tablist"><button type="button" role="tab" class="on" data-aba="entrar">Entrar</button><button type="button" role="tab" data-aba="cadastro">Pré-cadastro</button></div>' +
      '<form id="f-login" class="l-campos" novalidate data-modo="entrar">' +
      '<div class="campo so-cad"><label for="l-nome">Nome completo</label><input id="l-nome" autocomplete="name"></div>' +
      '<div class="campo"><label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="email" inputmode="email"></div>' +
      '<div class="campo so-cad"><label for="l-zap">WhatsApp</label><input id="l-zap" type="tel" autocomplete="tel" inputmode="tel" placeholder="(DDD) 9 0000-0000"></div>' +
      '<div class="l-duas so-cad"><div class="campo"><label for="l-perfil">Seu momento</label><select id="l-perfil">' + P.perfis.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="l-turma">Como entrou</label><select id="l-turma"><option value="hub">Fui ao 1º Encontro do Hub (R$ 997)</option><option value="geral">Inscrição geral (R$ 1.697)</option></select></div></div>' +
      '<div class="campo"><label for="l-senha">Senha</label><div class="senha"><input id="l-senha" type="password" autocomplete="current-password"><button type="button" class="olho" data-olho="l-senha" aria-label="Mostrar a senha" aria-pressed="false"></button></div></div>' +
      '<div class="campo so-cad"><label for="l-senha2">Repita a senha</label><div class="senha"><input id="l-senha2" type="password" autocomplete="new-password"><button type="button" class="olho" data-olho="l-senha2" aria-label="Mostrar a senha" aria-pressed="false"></button></div></div>' +
      '<p class="erro" id="l-erro" role="alert"></p>' +
      '<button class="l-entrar" type="submit"><span id="l-acao">Entrar na Panela</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>' +
      '<button type="button" class="l-esqueci so-entrar" id="b-esqueci">Esqueci minha senha</button>' +
      '<div class="l-ou"><span>ou</span></div>' +
      '<button type="button" class="l-google" id="b-google"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span id="l-google-t">Entrar com o Google</span></button>' +
      '<button class="l-demo" type="button" id="b-demo">Entrar como participante de demonstração</button>' +
      '<p class="l-nota" id="l-nota">No pré-cadastro, o seu acesso é liberado depois da confirmação da inscrição. A demonstração não precisa de senha.</p>' +
      '</form><div class="l-rodape"><span>Orar · Trabalhar · Servir · Amar</span><span>Panela só é ruim pra quem tá de fora</span></div>' +
      "</div></section></div>"));
    document.getElementById("b-demo").addEventListener("click", function () {
      if (!window.TEMPEROS_DATA && !CAT) { fetch("temperos.json").then(function (r) { return r.json(); }).then(function (j) { window.TEMPEROS_DATA = j; entrarDemo(); }).catch(entrarDemo); return; }
      if (!window.TEMPEROS_DATA) window.TEMPEROS_DATA = CAT; entrarDemo();
    });
    ligarAcesso();
  }

  /* ---------- Acesso: entrar, pré-cadastro, Google, esqueci a senha ---------- */
  var ERROS = { "auth/invalid-credential": "E-mail ou senha incorretos.", "auth/wrong-password": "E-mail ou senha incorretos.", "auth/user-not-found": "Não achamos esse e-mail. Faça o pré-cadastro.",
    "auth/email-already-in-use": "Esse e-mail já tem cadastro. Use Entrar ou Esqueci minha senha.", "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-email": "Confira o e-mail digitado.", "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.", "auth/network-request-failed": "Sem internet no momento. Tente de novo." };
  function msgErro(e) { return ERROS[e && e.code] || "Não deu certo agora. Tente de novo em instantes."; }
  function ligarOlhos(raiz) {
    (raiz || document).querySelectorAll("[data-olho]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = document.getElementById(b.getAttribute("data-olho")), ver = i.type === "password";
        i.type = ver ? "text" : "password"; b.setAttribute("aria-pressed", String(ver)); b.setAttribute("aria-label", ver ? "Esconder a senha" : "Mostrar a senha"); b.classList.toggle("aberto", ver);
      });
    });
  }
  function ligarAcesso() {
    var f = document.getElementById("f-login"), er = document.getElementById("l-erro");
    function v(id) { return (document.getElementById(id).value || "").trim(); }
    function modo(m) {
      f.setAttribute("data-modo", m); er.textContent = "";
      document.querySelectorAll("[data-aba]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-aba") === m); b.setAttribute("aria-selected", String(b.getAttribute("data-aba") === m)); });
      document.getElementById("l-acao").textContent = m === "cadastro" ? "Fazer meu pré-cadastro" : "Entrar na Panela";
      document.getElementById("l-google-t").textContent = m === "cadastro" ? "Cadastrar com o Google" : "Entrar com o Google";
      document.getElementById("l-senha").setAttribute("autocomplete", m === "cadastro" ? "new-password" : "current-password");
    }
    document.querySelectorAll("[data-aba]").forEach(function (b) { b.addEventListener("click", function () { modo(b.getAttribute("data-aba")); }); });
    ligarOlhos(f);
    function ocupado(sim) { f.querySelectorAll("button").forEach(function (b) { b.disabled = sim; }); }
    f.addEventListener("submit", function (e) {
      e.preventDefault(); er.textContent = "";
      var cad = f.getAttribute("data-modo") === "cadastro", email = v("l-email").toLowerCase(), senha = document.getElementById("l-senha").value;
      if (!/^\S+@\S+\.\S+$/.test(email)) { er.textContent = "Digite um e-mail válido."; return; }
      if (cad) {
        if (!v("l-nome")) { er.textContent = "Digite o seu nome."; return; }
        if (v("l-zap").replace(/\D/g, "").length < 10) { er.textContent = "Digite o WhatsApp com DDD."; return; }
        if (senha.length < 6) { er.textContent = "A senha precisa ter pelo menos 6 caracteres."; return; }
        if (senha !== document.getElementById("l-senha2").value) { er.textContent = "As duas senhas não são iguais."; return; }
      } else if (!senha) { er.textContent = "Digite a sua senha."; return; }
      if (!NV_) { // prévia sem internet: entra só neste navegador
        var turma = document.getElementById("l-turma").value;
        memoria = { aluno: { nome: v("l-nome") || email.split("@")[0], email: email, perfil: document.getElementById("l-perfil").value, turma: turma, valor: turma === "hub" ? 997 : 1697, inicio: new Date().toISOString() },
          diagnosticos: [], rascunho: null, cupons: [], encontrosVistos: [], individual: null };
        salvar(); ir("inicio"); return;
      }
      ocupado(true);
      if (cad) {
        dadosCadastro = { nome: v("l-nome"), whatsapp: v("l-zap"), perfil: document.getElementById("l-perfil").value, turma: document.getElementById("l-turma").value, metodo: "senha" };
        NV_.auth.createUserWithEmailAndPassword(email, senha).then(function (r) { return r.user.updateProfile({ displayName: dadosCadastro.nome }); })
          .catch(function (x) { er.textContent = msgErro(x); ocupado(false); });
      } else {
        NV_.auth.signInWithEmailAndPassword(email, senha).catch(function (x) { er.textContent = msgErro(x); ocupado(false); });
      }
    });
    document.getElementById("b-esqueci").addEventListener("click", function () {
      var email = v("l-email").toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) { er.textContent = "Digite o seu e-mail acima e toque de novo em Esqueci minha senha."; document.getElementById("l-email").focus(); return; }
      if (!NV_) { er.textContent = "Na prévia não há envio de e-mail."; return; }
      NV_.auth.sendPasswordResetEmail(email).then(function () { er.textContent = ""; toast("Se esse e-mail tiver cadastro, chega um link para criar uma senha nova. Veja também o spam."); }, function (x) { er.textContent = msgErro(x); });
    });
    document.getElementById("b-google").addEventListener("click", function () {
      if (!NV_) { er.textContent = "Na prévia o login com o Google não funciona. Use a demonstração."; return; }
      if (f.getAttribute("data-modo") === "cadastro") dadosCadastro = { nome: v("l-nome"), whatsapp: v("l-zap"), perfil: document.getElementById("l-perfil").value, turma: document.getElementById("l-turma").value, metodo: "google" };
      NV_.auth.signInWithPopup(NV_.google).catch(function (x) {
        if (x && (x.code === "auth/popup-blocked" || x.code === "auth/operation-not-supported-in-this-environment")) return NV_.auth.signInWithRedirect(NV_.google);
        er.textContent = msgErro(x);
      });
    });
  }
  var dadosCadastro = null;

  /* Depois do login: carrega o cadastro e decide a tela */
  function sha256(t) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }); }
  function quandoEntrar(u) {
    usuarioNuvem = u; carregando = true; desenharCarregando();
    var email = (u.email || "").toLowerCase();
    sha256(email).then(function (h) {
      if (h === MENTOR_ID && u.emailVerified) { memoria = { mentor: true, nuvem: true, nome: u.displayName || "Ramon" }; Armazem.gravar(memoria); return carregarMentor().then(function () { carregando = false; desenhar(); }); }
      var ref = NV_.db.collection("usuarios").doc(u.uid);
      return ref.get().then(function (doc) {
        if (doc.exists) return doc.data();
        var dc = dadosCadastro || {};
        if (!dc.whatsapp) { carregando = false; contaNuvem = null; return telaCompletar(u); }
        return criarConta(u, dc);
      }).then(function (conta) {
        if (!conta) return;
        contaNuvem = conta; dadosCadastro = null;
        if (conta.status !== "liberado") { carregando = false; return telaAguardando(conta); }
        return NV_.db.collection("progresso").doc(u.uid).get().then(function (p) {
          var d = null; try { d = p.exists ? JSON.parse(p.data().dados) : null; } catch (e) {}
          if (!d) d = { aluno: { nome: conta.nome, email: conta.email, perfil: conta.perfil, turma: conta.turma, valor: conta.valor, inicio: new Date().toISOString(), ramo: conta.ramo || null }, diagnosticos: [], rascunho: null, cupons: [], encontrosVistos: [], individual: null };
          d.nuvem = true; memoria = d; carregando = false; salvar(); desenhar();
        });
      });
    }).catch(function () { carregando = false; toast("Não consegui carregar a sua conta. Confira a internet e entre de novo."); NV_.auth.signOut(); });
  }
  function criarConta(u, dc) {
    var email = (u.email || "").toLowerCase();
    return NV_.db.collection("convites").doc(email).get().catch(function () { return null; }).then(function (cv) {
      var c = cv && cv.exists ? cv.data() : null, turma = (c && c.turma) || dc.turma || "hub";
      var conta = { nome: dc.nome || u.displayName || (c && c.nome) || email.split("@")[0], email: email, whatsapp: dc.whatsapp || (c && c.whatsapp) || "", perfil: dc.perfil || "negocio",
        turma: turma, valor: turma === "hub" ? 997 : 1697, ramo: null, status: c ? "liberado" : "pendente", metodo: dc.metodo || "google", criadoEm: new Date().toISOString() };
      if (c) conta.liberadoEm = new Date().toISOString();
      return NV_.db.collection("usuarios").doc(u.uid).set(conta).then(function () { return conta; });
    });
  }
  function desenharCarregando() {
    document.getElementById("raiz").innerHTML = '<div class="carregando"><img src="logo-h-web.jpg" alt="A Panela"><span class="rot">Abrindo a sua Panela…</span></div>';
  }
  function cartaoSimples(html) {
    var raiz = document.getElementById("raiz");
    raiz.innerHTML = '<div class="espera"><div class="card espera-c"><img src="logo-h-web.jpg" alt="A Panela">' + html + '<button class="btn contorno" id="b-sair-espera" type="button">Sair</button></div></div>';
    document.getElementById("b-sair-espera").onclick = sairConta;
  }
  function telaAguardando(conta) {
    var pausado = conta.status === "pausado";
    cartaoSimples('<span class="rot">' + (pausado ? "Acesso pausado" : "Pré-cadastro recebido") + "</span><h1>" + (pausado ? "Seu acesso está pausado" : "Quase lá, " + esc(conta.nome.split(" ")[0]) + "!") + "</h1>" +
      (pausado ? '<p>Fale com o Ramon para reativar o seu acesso à Panela.</p>' :
        '<p>Recebemos o seu pré-cadastro. Assim que a sua inscrição for confirmada, o Ramon libera o seu acesso e você recebe um aviso.</p><p class="muted">Já confirmou? Feche e abra a plataforma de novo daqui a pouco.</p>') +
      '<button class="btn" id="b-atualizar" type="button">Ver se já foi liberado</button>');
    document.getElementById("b-atualizar").onclick = function () { if (usuarioNuvem) quandoEntrar(usuarioNuvem); };
  }
  function telaCompletar(u) {
    cartaoSimples('<span class="rot">Falta pouco</span><h1>Complete o seu cadastro</h1><form id="f-comp" class="l-campos" novalidate>' +
      '<div class="campo"><label for="c-nome">Nome completo</label><input id="c-nome" autocomplete="name" value="' + esc(u.displayName || "") + '"></div>' +
      '<div class="campo"><label for="c-zap">WhatsApp</label><input id="c-zap" type="tel" inputmode="tel" autocomplete="tel" placeholder="(DDD) 9 0000-0000"></div>' +
      '<div class="campo"><label for="c-perfil">Seu momento</label><select id="c-perfil">' + P.perfis.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nome) + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label for="c-turma">Como entrou</label><select id="c-turma"><option value="hub">Fui ao 1º Encontro do Hub (R$ 997)</option><option value="geral">Inscrição geral (R$ 1.697)</option></select></div>' +
      '<p class="erro" id="c-erro" role="alert"></p><button class="btn" type="submit">Enviar pré-cadastro</button></form>');
    document.getElementById("f-comp").onsubmit = function (e) {
      e.preventDefault();
      var nome = document.getElementById("c-nome").value.trim(), zap = document.getElementById("c-zap").value.trim();
      if (!nome || zap.replace(/\D/g, "").length < 10) { document.getElementById("c-erro").textContent = "Preencha o nome e o WhatsApp com DDD."; return; }
      dadosCadastro = { nome: nome, whatsapp: zap, perfil: document.getElementById("c-perfil").value, turma: document.getElementById("c-turma").value, metodo: "google" };
      quandoEntrar(u);
    };
  }

  /* Abertura: as linhas se juntam, as cores chegam e a panela se forma até virar a logo. */
  function animarEntrada() {
    if (!document.body.animate) return;
    var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visto = false; try { visto = sessionStorage.getItem("panela-intro") === "1"; } catch (e) {}
    if (reduz || visto) return;
    try { sessionStorage.setItem("panela-intro", "1"); } catch (e) {}
    var box = document.createElement("div"); box.className = "abertura"; box.setAttribute("role", "presentation");
    box.innerHTML = '<div class="ab-arte"><img class="ab-img" src="' + (window.LOGIN_ARTE_URI || "panela-logo-arte.jpg") + '" alt=""></div><button class="ab-pular" type="button">Pular</button>';
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
      // 2) jatos de tinta espirrando nas cores da arte
      var JATOS = [["#E2231A", 0.17, 0.38, 0.15], ["#F5B800", 0.175, 0.235, 0.06], ["#2D5BD7", 0.46, 0.575, 0.11], ["#2D5BD7", 0.8, 0.435, 0.1],
        ["#E2231A", 0.325, 0.615, 0.08], ["#F5B800", 0.26, 0.4, 0.035], ["#E2231A", 0.1, 0.5, 0.055]];
      function mancha(cx, cy, r) {
        var n = 18, pts = [];
        for (var k = 0; k < n; k++) { var a = k / n * Math.PI * 2, rr = r * (0.72 + rnd() * 0.5); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        var d = "M" + ((pts[0][0] + pts[n - 1][0]) / 2) + " " + ((pts[0][1] + pts[n - 1][1]) / 2);
        for (k = 0; k < n; k++) { var p = pts[k], q = pts[(k + 1) % n]; d += "Q" + p[0] + " " + p[1] + " " + (p[0] + q[0]) / 2 + " " + (p[1] + q[1]) / 2; }
        return d + "Z";
      }
      JATOS.forEach(function (j, k) {
        var cx = W * j[1], cy = H * j[2], r = W * j[3], cor = j[0], t0 = 600 + k * 140;
        var g = document.createElementNS(NS, "g"); g.setAttribute("class", "tinta"); g.setAttribute("fill", cor); svg.appendChild(g);
        var corpo = document.createElementNS(NS, "path"); corpo.setAttribute("d", mancha(cx, cy, r)); g.appendChild(corpo);
        anims.push(corpo.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.12)", opacity: 0.92, offset: 0.55 }, { transform: "scale(1)", opacity: 0.88 }],
          { duration: 520, delay: t0, easing: "cubic-bezier(.15,.9,.25,1)", fill: "both", transformOrigin: cx + "px " + cy + "px" }));
        corpo.style.transformOrigin = cx + "px " + cy + "px";
        var gotas = 10 + Math.round(r / W * 60);
        for (var m = 0; m < gotas; m++) {
          var ang = rnd() * Math.PI * 2, dist = r * (1.05 + rnd() * 1.4), gr = Math.max(1.5, r * (0.03 + rnd() * 0.1));
          var gx = cx + Math.cos(ang) * dist, gy = cy + Math.sin(ang) * dist, el;
          if (m % 4 === 0) {
            el = document.createElementNS(NS, "ellipse"); el.setAttribute("cx", gx); el.setAttribute("cy", gy); el.setAttribute("rx", gr * 2.6); el.setAttribute("ry", gr * 0.7);
            el.setAttribute("transform", "rotate(" + (ang * 180 / Math.PI) + " " + gx + " " + gy + ")");
          } else { el = document.createElementNS(NS, "circle"); el.setAttribute("cx", gx); el.setAttribute("cy", gy); el.setAttribute("r", gr); }
          g.appendChild(el);
          anims.push(el.animate([{ translate: (cx - gx) + "px " + (cy - gy) + "px", scale: "0.2", opacity: 0 }, { translate: "0px 0px", scale: "1", opacity: 0.9 }],
            { duration: 380 + rnd() * 260, delay: t0 + 60 + rnd() * 90, easing: "cubic-bezier(.1,.8,.2,1)", fill: "both" }));
        }
        anims.push(g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, delay: 2300 + k * 60, easing: "ease-in", fill: "forwards" }));
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
    memoria = { demo: true, aluno: { nome: "Ana Demonstração", email: "demo@apanela.com.br", perfil: "negocio", turma: "hub", valor: 997, inicio: dia(35), ramo: "confeitaria" },
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
    var matLivre = idx === 0 || n.feitas.indexOf(aulas[idx - 1].id) >= 0;
    h += '<div class="card nv-mat' + (matLivre ? "" : " travado") + '"><div><span class="rot">Material de apoio · PDF' + (matLivre ? "" : " · bloqueado") + '</span><b>Aula ' + ("0" + (idx + 1)).slice(-2) + " · " + esc(a.titulo) + '</b><small class="muted">' +
      (matLivre ? "Explicação passo a passo, exemplos, a ferramenta para imprimir e os pedidos prontos para o Claude." : "Libera quando você concluir a aula anterior: " + esc(aulas[idx - 1].titulo) + ".") + "</small></div>" +
      (matLivre ? '<div class="nv-mat-b"><a class="btn" href="' + pdfAula(idx) + '" target="_blank" rel="noopener">Abrir o PDF</a><a class="btn contorno" href="' + pdfAula(idx) + '" download>Baixar</a></div>' :
        '<div class="nv-mat-b"><span class="nv-cadeado" aria-hidden="true">🔒</span><button class="btn contorno" type="button" data-nv-ir="' + (idx - 1) + '">Ir para a aula anterior</button></div>') + "</div>";
    h += '<div class="card"><span class="rot">Missão da aula</span><p style="margin:6px 0 0"><b>' + esc(a.tarefa) + '</b></p><p class="muted" style="font-size:12.5px;margin:8px 0 0">Ficou com dúvida? Leve para o grupo da Panela no WhatsApp ou para o seu encontro individual.</p></div>';
    h += '<div class="card"><label class="rot" for="nv-notas">Anotações</label><textarea id="nv-notas" class="nv-notas" rows="4" placeholder="Escreva aqui o que você quer lembrar desta aula. Só você vê.">' + esc(n.notas[a.id] || "") + '</textarea><div style="margin-top:10px"><button class="btn peq" id="nv-salvar">Salvar</button></div></div>';
    h += '</div><aside class="nv-lista" aria-label="Módulos e aulas">' + NV.modulos.map(function (m) {
      var feitasM = m.aulas.filter(function (x) { return n.feitas.indexOf(x.id) >= 0; }).length, pm = Math.round(feitasM / m.aulas.length * 100);
      var aberto = m.aulas.indexOf(a) >= 0;
      return '<details class="nv-mod"' + (aberto ? " open" : "") + '><summary><span class="nv-pct">' + pm + "%</span>" + esc(m.titulo) + "</summary>" + m.aulas.map(function (x) {
        var ok = n.feitas.indexOf(x.id) >= 0;
        return '<button class="nv-item' + (x === a ? " at" : "") + (ok ? " ok" : "") + '" data-nv-aula="' + x.id + '"' + (x === a ? ' aria-current="true"' : "") + '><span class="nv-ck">' + (ok ? "✓" : "") + "</span><span>" + esc(x.titulo) + (n.fav.indexOf(x.id) >= 0 ? " ★" : "") + "</span><small>" + esc(x.dur) + "</small></button>";
      }).join("") + "</details>";
    }).join("") + '<div class="nv-mod nv-guias"><span class="rot">Guias práticos</span>' + (function () {
      var feitasT = aulas.filter(function (x) { return n.feitas.indexOf(x.id) >= 0; }).length, livre = feitasT === aulas.length;
      return GUIAS.map(function (g) {
        return livre ? '<a class="nv-guia" href="' + BASE_MAT + g[0] + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7"/></svg><span>' + esc(g[1]) + "<small>PDF · " + g[2] + "</small></span></a>"
          : '<div class="nv-guia travado" aria-disabled="true"><span class="nv-cadeado" aria-hidden="true">🔒</span><span>' + esc(g[1]) + "<small>Libera ao concluir o nivelamento · " + feitasT + "/" + aulas.length + "</small></span></div>";
      }).join("");
    })() + "</div>" + (NV.emBreve || []).map(function (t) { return '<div class="nv-mod nv-breve"><span class="nv-pct">🔒</span><span>' + esc(t) + "</span><small>em breve</small></div>"; }).join("") + "</aside></div>";
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

  /* ---------- Painel do mentor (acesso do Ramon) ----------
     Enquanto o servidor da turma não existe, mostra a turma de exemplo (guia-perfis.js), marcada como exemplo.
     Quando houver servidor, basta trocar turmaMentor() pela lista real de alunos. */
  var MENTOR_ID = "a7a59f44c8ed4492fa10d5a7ffdbb7a3e79c84862eea1ca65c18d75c72ea97ea";
  var alunoSel = null, filtroM = "todos";
  function nomeAreaM(ar, a) { return ((ar[(a.aluno || {}).perfil] || ar.negocio || {}).nome) || ar.id; }
  var MD = null, verExemplo = false;
  function carregarMentor() {
    var db = NV_.db;
    return Promise.all([db.collection("usuarios").get(), db.collection("progresso").get(), db.collection("convites").get()]).then(function (r) {
      var prog = {}; r[1].forEach(function (d) { try { prog[d.id] = JSON.parse(d.data().dados); } catch (e) {} });
      MD = { usuarios: r[0].docs.map(function (d) { var x = d.data(); x.uid = d.id; return x; }), prog: prog, convites: r[2].docs.map(function (d) { var x = d.data(); x.email = d.id; return x; }) };
    }).catch(function () { MD = { usuarios: [], prog: {}, convites: [], erro: true }; });
  }
  function turmaReal() {
    return MD.usuarios.filter(function (u) { return u.status === "liberado" || u.status === "pausado"; }).map(function (u) {
      var d = MD.prog[u.uid] || { aluno: {}, diagnosticos: [], testes: { disc: [], animais: [] }, encontrosVistos: [], cupons: [], diasAtivos: [] };
      d.aluno = Object.assign({ nome: u.nome, email: u.email, perfil: u.perfil, turma: u.turma, valor: u.valor, inicio: u.liberadoEm || u.criadoEm }, d.aluno || {});
      d.aluno.pagamento = u.pagamento || "avista"; d.aluno.parcelasPagas = u.parcelasPagas || 0;
      d.testes = d.testes || { disc: [], animais: [] }; d.encontrosVistos = d.encontrosVistos || []; d.cupons = d.cupons || []; d.diagnosticos = d.diagnosticos || [];
      d._uid = u.uid; d._status = u.status; d._zap = u.whatsapp; return d;
    });
  }
  function turmaMentor() { return (memoria && memoria.nuvem && MD && !verExemplo) ? turmaReal() : (window.TURMA_EXEMPLO || []).slice(); }
  function comAluno(a, fn) { var m = memoria; memoria = a; try { return fn(); } finally { memoria = m; } }
  function diasSem(a) { var u = (a.diasAtivos || [])[0] || a.ultimoAcesso || a.aluno.inicio; return Math.floor((Date.now() - new Date(u).getTime()) / 864e5); }
  function recebido(a) { var v = a.aluno.valor || 0; return a.aluno.pagamento === "cartao6x" ? Math.round(v / 6 * (a.aluno.parcelasPagas || 0) * 100) / 100 : v; }
  function moeda(v) { return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function infoAluno(a) {
    return comAluno(a, function () {
      var pt = pontuacao(), nd = a.diagnosticos.length, ini = nd ? mediaGeral(a.diagnosticos[0].notas) : null, atu = nd ? mediaGeral(a.diagnosticos[nd - 1].notas) : null;
      var disc = (a.testes && a.testes.disc[0]) || null, ani = (a.testes && a.testes.animais[0]) || null;
      var prox = PREMIOS.filter(function (p) { return p.pts > pt.total; })[0];
      var fraca = nd ? P.areas.slice().sort(function (x, y) { return a.diagnosticos[nd - 1].notas[x.id] - a.diagnosticos[nd - 1].notas[y.id]; })[0] : null;
      var alertas = [];
      var ds = diasSem(a);
      if (ds >= 5) alertas.push(["sumiu", "Sem entrar há " + ds + " dias"]);
      if (!nd) alertas.push(["diag", "Ainda não fez o diagnóstico"]);
      if (nd > 1 && atu < mediaGeral(a.diagnosticos[nd - 2].notas)) alertas.push(["caiu", "Nota caiu no último diagnóstico"]);
      if (a.individual && !a.individual.feito) alertas.push(["ind", "Pediu individual: " + (a.individual.tema || "sem tema")]);
      if (a.respostaAberta) alertas.push(["duv", "Dúvida sem resposta"]);
      if (a.aluno.pagamento === "cartao6x" && (a.aluno.parcelasPagas || 0) < Math.min(6, 1 + Math.floor((Date.now() - new Date(a.aluno.inicio)) / (30 * 864e5)))) alertas.push(["pag", "Parcela em aberto"]);
      return { pt: pt, nv: nivel(pt.total), ini: ini, atu: atu, evol: nd > 1 ? atu - ini : 0, disc: disc, ani: ani, prox: prox, fraca: fraca, alertas: alertas, ds: ds, np: nivProg() };
    });
  }
  function avatarDe(a) {
    var u = a.testes && a.testes.animais[0], arq = u ? ARQ_ANIMAL[u.principal] : null, ini = esc((a.aluno.nome || "?").charAt(0));
    return '<span class="avatar m-av">' + ini + (arq ? '<img src="avatares/' + arq + '.png" alt="" onerror="this.remove()">' : "") + "</span>";
  }
  function mensagemPara(a, inf) {
    var nome = a.aluno.nome.split(" ")[0], g = window.GUIA_PERFIS || {}, base = inf.ani && g.animais && g.animais[inf.ani.principal] && g.animais[inf.ani.principal].mensagem;
    var falta = inf.prox ? inf.prox.pts - inf.pt.total : 0;
    var txt = base ? base.replace(/\{nome\}/g, nome).replace(/\{falta\}/g, falta).replace(/\{premio\}/g, inf.prox ? inf.prox.nome : "próximo prêmio") : nome + ", passando para saber como você está. Bora para o próximo passo?";
    if (inf.fraca) txt += "\n\nMinha sugestão para esta semana: dar atenção a " + nomeAreaM(inf.fraca, a).toLowerCase() + ". Separei um tempero para você na plataforma.";
    return txt;
  }
  function telaMentor() {
    var raiz = document.getElementById("raiz"), turma = turmaMentor(), infos = turma.map(infoAluno);
    var contratado = turma.reduce(function (s, a) { return s + (a.aluno.valor || 0); }, 0), rec = turma.reduce(function (s, a) { return s + recebido(a); }, 0);
    var ativos = infos.filter(function (i) { return i.ds <= 7; }).length, evolM = infos.filter(function (i) { return i.ini != null; });
    var evolMed = evolM.length ? Math.round(evolM.reduce(function (s, i) { return s + i.evol; }, 0) / evolM.length) : 0;
    var atencao = turma.map(function (a, k) { return [a, infos[k]]; }).filter(function (x) { return x[1].alertas.length; });
    var lista = turma.map(function (a, k) { return [a, infos[k], k]; }).filter(function (x) {
      return filtroM === "todos" || (filtroM === "atencao" && x[1].alertas.length) || (filtroM === "hub" && x[0].aluno.turma === "hub") || (filtroM === "geral" && x[0].aluno.turma !== "hub");
    }).sort(function (x, y) { return y[1].pt.total - x[1].pt.total; });
    var h = '<div class="mentor"><header class="m-topo"><img src="logo-h-web.jpg" alt="A Panela"><div><span class="rot">Acesso do mentor</span><b>Painel do Ramon</b></div><button class="btn peq contorno" id="m-sair">Sair</button></header>';
    var real = memoria && memoria.nuvem && MD && !verExemplo;
    h += real ? "" : '<div class="m-aviso">Dados de exemplo: a turma abaixo é fictícia.' + (memoria && memoria.nuvem ? ' <button class="m-link" id="m-real">Voltar para a turma real</button>' : "") + "</div>";
    if (memoria && memoria.nuvem && MD) h += painelAcessos();
    h += '<div class="m-corpo"><section class="m-kpis">' +
      [["Alunos", turma.length, turma.filter(function (a) { return a.aluno.turma === "hub"; }).length + " do 1º Encontro"], ["Faturamento contratado", moeda(contratado), "ticket médio " + moeda(turma.length ? contratado / turma.length : 0)],
       ["Recebido até hoje", moeda(rec), "a receber " + moeda(contratado - rec)], ["Ativos na semana", ativos + " de " + turma.length, Math.round(ativos / Math.max(1, turma.length) * 100) + "% entraram nos últimos 7 dias"],
       ["Evolução média", (evolMed >= 0 ? "+" : "") + evolMed + " pts", "na nota geral do diagnóstico"]].map(function (k) {
        return '<div class="card m-kpi"><span class="rot">' + k[0] + "</span><b>" + k[1] + "</b><small>" + k[2] + "</small></div>"; }).join("") + "</section>";
    h += '<section class="card m-atencao"><span class="rot">Precisam de você hoje</span>' + (atencao.length ? atencao.map(function (x) {
      return '<button class="m-alerta" data-m-aluno="' + turma.indexOf(x[0]) + '">' + avatarDe(x[0]) + "<span><b>" + esc(x[0].aluno.nome) + "</b>" + x[1].alertas.map(function (al) { return '<em class="m-tag t-' + al[0] + '">' + esc(al[1]) + "</em>"; }).join("") + "</span></button>"; }).join("") :
      '<p class="muted">Ninguém precisa de atenção agora.</p>') + "</section>";
    h += '<section class="card m-lista"><div class="m-lista-topo"><span class="rot">A turma</span><div class="m-filtros">' + [["todos", "Todos"], ["atencao", "Precisam de atenção"], ["hub", "1º Encontro"], ["geral", "Inscrição geral"]].map(function (f) {
      return '<button class="chip' + (filtroM === f[0] ? " on" : "") + '" data-m-filtro="' + f[0] + '">' + f[1] + "</button>"; }).join("") + '</div></div><div class="m-tab-rolar"><table class="m-tab"><thead><tr><th>Aluno</th><th>Perfil</th><th>Pontos</th><th>Nota</th><th>Nivelamento</th><th>Encontros</th><th>Último acesso</th><th>Pagamento</th></tr></thead><tbody>' +
      lista.map(function (x) {
        var a = x[0], i = x[1], T2 = window.PANELA_TESTES;
        return '<tr data-m-aluno="' + x[2] + '" tabindex="0"><td><div class="m-nome">' + avatarDe(a) + "<span><b>" + esc(a.aluno.nome) + "</b><small>" + esc(a.aluno.ramo || "ramo não escolhido") + "</small></span></div></td>" +
          "<td>" + (i.disc ? '<span class="chip">DISC ' + i.disc.principal + "</span>" : "") + (i.ani ? ' <span class="chip">' + esc(T2.animais.perfis[i.ani.principal].nome) + "</span>" : "") + "</td>" +
          "<td><b>" + i.pt.total + '</b><small class="muted"> · ' + esc(i.nv) + "</small></td>" +
          "<td>" + (i.ini == null ? "–" : i.ini + " → <b>" + i.atu + '</b> <small class="' + (i.evol >= 0 ? "m-up" : "m-down") + '">' + (i.evol >= 0 ? "+" : "") + i.evol + "</small>") + "</td>" +
          "<td>" + i.np.feitas + "/" + i.np.total + "</td><td>" + a.encontrosVistos.length + "/" + P.encontros.length + "</td>" +
          '<td class="' + (i.ds >= 5 ? "m-down" : "") + '">' + (i.ds === 0 ? "hoje" : "há " + i.ds + " dia" + (i.ds > 1 ? "s" : "")) + "</td>" +
          "<td>" + (a.aluno.pagamento === "cartao6x" ? (a.aluno.parcelasPagas || 0) + "/6 no cartão" : "à vista") + "</td></tr>";
      }).join("") + "</tbody></table></div></section>";
    if (alunoSel != null && turma[alunoSel]) h += detalheAluno(turma[alunoSel], infos[alunoSel]);
    h += '<section class="card m-guia"><span class="rot">Como lidar com cada personalidade</span><div class="m-guia-g">' + ["D", "I", "S", "C"].map(function (k) {
      var g = (window.GUIA_PERFIS || { disc: {} }).disc[k] || {}, pf = window.PANELA_TESTES.disc.perfis[k];
      return '<div class="m-gcard"><b>' + k + " · " + esc(pf.nome) + "</b><p><strong>Comunicar:</strong> " + esc(g.comunicar || "") + "</p><p><strong>Motivar:</strong> " + esc(g.motivar || "") + "</p><p><strong>Cobrar:</strong> " + esc(g.cobrar || "") + "</p><p><strong>Evitar:</strong> " + esc(g.evitar || "") + "</p></div>";
    }).join("") + "</div></section></div></div>";
    raiz.innerHTML = h;
    document.getElementById("m-sair").onclick = function () { alunoSel = null; sairConta(); };
    raiz.querySelectorAll("[data-m-filtro]").forEach(function (b) { b.onclick = function () { filtroM = b.getAttribute("data-m-filtro"); telaMentor(); }; });
    raiz.querySelectorAll("[data-m-aluno]").forEach(function (b) {
      function abre() { alunoSel = +b.getAttribute("data-m-aluno"); telaMentor(); var d = document.getElementById("m-det"); if (d) d.scrollIntoView({ block: "start", behavior: "smooth" }); }
      b.onclick = abre; b.onkeydown = function (e) { if (e.key === "Enter") abre(); };
    });
    ligarAcessos();
    var fx = document.getElementById("m-fechar"); if (fx) fx.onclick = function () { alunoSel = null; telaMentor(); };
    var cm = document.getElementById("m-copiar");
    if (cm) cm.onclick = function () { var t = cm.getAttribute("data-txt"); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast("Mensagem copiada. Cole no WhatsApp do aluno."); }, function () { window.prompt("Copie a mensagem:", t); }); };
  }

  /* Aba de acessos do mentor: pré-cadastros, novo aluno, pausar/reativar */
  function painelAcessos() {
    var pend = MD.usuarios.filter(function (u) { return u.status === "pendente"; }), paus = MD.usuarios.filter(function (u) { return u.status === "pausado"; });
    var conv = MD.convites.filter(function (c) { return !MD.usuarios.some(function (u) { return u.email === c.email; }); });
    var h = '<div class="m-corpo m-acessos"><section class="card"><div class="m-lista-topo"><span class="rot">Pré-cadastros aguardando liberação · ' + pend.length + '</span><button class="btn peq" id="m-atualizar" type="button">Atualizar</button></div>' +
      (MD.erro ? '<p class="erro">Não consegui ler os cadastros. Confira se as regras do Firebase foram publicadas.</p>' : "") +
      (pend.length ? pend.map(function (u) {
        return '<div class="m-pend"><div><b>' + esc(u.nome) + '</b><small>' + esc(u.email) + " · " + esc(u.whatsapp || "sem WhatsApp") + " · " + (u.turma === "hub" ? "1º Encontro (R$ 997)" : "Inscrição geral (R$ 1.697)") + " · " + (u.metodo === "google" ? "Google" : "e-mail e senha") + "</small></div>" +
          '<div class="m-pend-b"><select data-m-pag="' + u.uid + '" aria-label="Forma de pagamento"><option value="avista">À vista / Pix</option><option value="cartao6x">Cartão 6x</option></select><button class="btn peq" data-m-liberar="' + u.uid + '">Liberar acesso</button><button class="btn peq contorno" data-m-recusar="' + u.uid + '">Recusar</button></div></div>';
      }).join("") : '<p class="muted">Nenhum pré-cadastro esperando.</p>') + "</section>" +
      '<section class="card"><span class="rot">Novo aluno (acesso direto)</span><p class="muted" style="font-size:12.5px;margin:4px 0 10px">Para venda pelo WhatsApp ou cortesia. O aluno entra com esse e-mail (pré-cadastro ou Google) e já cai liberado.</p>' +
      '<form id="m-novo" class="m-novo"><input id="mn-nome" placeholder="Nome" aria-label="Nome do aluno"><input id="mn-email" type="email" placeholder="E-mail" aria-label="E-mail do aluno"><input id="mn-zap" type="tel" placeholder="WhatsApp" aria-label="WhatsApp do aluno">' +
      '<select id="mn-turma" aria-label="Turma"><option value="hub">1º Encontro (R$ 997)</option><option value="geral">Inscrição geral (R$ 1.697)</option></select><button class="btn" type="submit">Gerar acesso</button></form><div id="mn-msg"></div>' +
      (conv.length ? '<p class="rot" style="margin-top:14px">Convites ainda não usados · ' + conv.length + "</p>" + conv.map(function (c) { return '<div class="m-conv"><span>' + esc(c.nome || "") + " · " + esc(c.email) + '</span><button class="m-link" data-m-apagar-conv="' + esc(c.email) + '">Cancelar</button></div>'; }).join("") : "") + "</section>" +
      (paus.length ? '<section class="card"><span class="rot">Acessos pausados · ' + paus.length + "</span>" + paus.map(function (u) { return '<div class="m-conv"><span>' + esc(u.nome) + " · " + esc(u.email) + '</span><button class="btn peq" data-m-reativar="' + u.uid + '">Reativar</button></div>'; }).join("") + "</section>" : "") +
      (MD.usuarios.filter(function (u) { return u.status === "liberado"; }).length ? "" : '<p class="muted" style="text-align:center">Ainda não há alunos liberados. <button class="m-link" id="m-exemplo">Ver o painel com a turma de exemplo</button></p>') + "</div>";
    return h;
  }
  function msgAcesso(nome, email) {
    return "Oi, " + nome.split(" ")[0] + "! Seu acesso à Panela está liberado 🍲\n\n1. Entre em https://panela.usevox.com.br\n2. Toque em Pré-cadastro e use o e-mail " + email + " (ou toque em Cadastrar com o Google, se esse e-mail for do Google).\n\nPanela só é ruim pra quem tá de fora. Te espero lá dentro!";
  }
  function ligarAcessos() {
    if (!(memoria && memoria.nuvem)) return;
    var db = NV_.db;
    function recarregar() { carregarMentor().then(telaMentor); }
    var at = document.getElementById("m-atualizar"); if (at) at.onclick = recarregar;
    var ex = document.getElementById("m-exemplo"); if (ex) ex.onclick = function () { verExemplo = true; telaMentor(); };
    var re = document.getElementById("m-real"); if (re) re.onclick = function () { verExemplo = false; telaMentor(); };
    document.querySelectorAll("[data-m-liberar]").forEach(function (b) {
      b.onclick = function () {
        var uid = b.getAttribute("data-m-liberar"), pag = document.querySelector('[data-m-pag="' + uid + '"]').value;
        b.disabled = true;
        db.collection("usuarios").doc(uid).update({ status: "liberado", liberadoEm: new Date().toISOString(), pagamento: pag, parcelasPagas: pag === "cartao6x" ? 1 : 0 }).then(function () {
          var u = MD.usuarios.filter(function (x) { return x.uid === uid; })[0];
          toast("Acesso liberado para " + u.nome.split(" ")[0] + ".");
          var t = msgAcesso(u.nome, u.email).replace("Toque em Pré-cadastro e use o e-mail " + u.email + " (ou toque em Cadastrar com o Google, se esse e-mail for do Google).", "Entre com o mesmo e-mail do seu pré-cadastro.");
          if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast("Mensagem de aviso copiada para colar no WhatsApp dele."); }, function () {});
          recarregar();
        }, function () { b.disabled = false; toast("Não consegui liberar. Tente de novo."); });
      };
    });
    document.querySelectorAll("[data-m-recusar]").forEach(function (b) {
      b.onclick = function () { if (!confirm("Recusar este pré-cadastro? A pessoa não terá acesso.")) return; db.collection("usuarios").doc(b.getAttribute("data-m-recusar")).update({ status: "recusado" }).then(recarregar); };
    });
    document.querySelectorAll("[data-m-reativar]").forEach(function (b) { b.onclick = function () { db.collection("usuarios").doc(b.getAttribute("data-m-reativar")).update({ status: "liberado" }).then(recarregar); }; });
    document.querySelectorAll("[data-m-apagar-conv]").forEach(function (b) { b.onclick = function () { db.collection("convites").doc(b.getAttribute("data-m-apagar-conv")).delete().then(recarregar); }; });
    var fn = document.getElementById("m-novo");
    if (fn) fn.onsubmit = function (e) {
      e.preventDefault();
      var nome = document.getElementById("mn-nome").value.trim(), email = document.getElementById("mn-email").value.trim().toLowerCase(), zap = document.getElementById("mn-zap").value.trim(), turma = document.getElementById("mn-turma").value;
      if (!nome || !/^\S+@\S+\.\S+$/.test(email)) { toast("Preencha o nome e um e-mail válido."); return; }
      db.collection("convites").doc(email).set({ nome: nome, whatsapp: zap, turma: turma, valor: turma === "hub" ? 997 : 1697, criadoEm: new Date().toISOString() }).then(function () {
        var t = msgAcesso(nome, email);
        document.getElementById("mn-msg").innerHTML = '<div class="m-msg"><span class="rot">Acesso gerado. Mande esta mensagem para ' + esc(nome.split(" ")[0]) + '</span><p>' + esc(t).replace(/\n/g, "<br>") + '</p><button class="btn peq" id="mn-copiar" type="button">Copiar para o WhatsApp</button></div>';
        document.getElementById("mn-copiar").onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast("Mensagem copiada."); }, function () { window.prompt("Copie a mensagem:", t); }); };
        MD.convites.push({ nome: nome, email: email, turma: turma });
      }, function () { toast("Não consegui gerar o acesso. Confira as regras do Firebase."); });
    };
    // pausar a partir do detalhe do aluno
    var pz = document.getElementById("m-pausar");
    if (pz) pz.onclick = function () { if (!confirm("Pausar o acesso deste aluno?")) return; db.collection("usuarios").doc(pz.getAttribute("data-uid")).update({ status: "pausado" }).then(recarregar); };
  }
  function detalheAluno(a, i) {
    var g = window.GUIA_PERFIS || { disc: {}, animais: {} }, T2 = window.PANELA_TESTES, nd = a.diagnosticos.length;
    var gd = i.disc ? g.disc[i.disc.principal] : null, ga = i.ani ? g.animais[i.ani.principal] : null;
    var barras = nd ? P.areas.map(function (ar) {
      var v0 = a.diagnosticos[0].notas[ar.id], v1 = a.diagnosticos[nd - 1].notas[ar.id];
      return '<div class="m-barra"><span>' + esc(nomeAreaM(ar, a)) + '</span><div><i class="b0" style="width:' + v0 + '%"></i><i class="b1" style="width:' + v1 + '%"></i></div><b>' + v1 + "</b></div>"; }).join("") : '<p class="muted">Ainda sem diagnóstico.</p>';
    var faltam = i.pt.itens.filter(function (x) { return x.pts < x.max; }).sort(function (x, y) { return (y.max - y.pts) - (x.max - x.pts); }).slice(0, 3);
    var msg = mensagemPara(a, i);
    return '<section class="card m-det" id="m-det"><div class="m-det-topo">' + avatarDe(a) + "<div><span class=\"rot\">Aluno</span><h2>" + esc(a.aluno.nome) + '</h2><small class="muted">' + esc(a.aluno.ramo || "") + " · " + (a.aluno.turma === "hub" ? "1º Encontro do Hub" : "Inscrição geral") + " · " + i.pt.total + " pts · " + esc(i.nv) + '</small></div>' + (a._uid ? '<button class="btn peq contorno" id="m-pausar" data-uid="' + a._uid + '">Pausar acesso</button>' : "") + '<button class="btn peq contorno" id="m-fechar">Fechar</button></div>' +
      '<div class="m-det-g"><div><h3>Evolução por área</h3><p class="muted" style="font-size:12px;margin:2px 0 8px">Cinza: 1º diagnóstico · cor: último</p>' + barras + "</div>" +
      "<div><h3>Para ele progredir</h3><ul class=\"lista\">" + (i.fraca ? "<li>Área mais fraca: <b>" + esc(nomeAreaM(i.fraca, a)) + "</b>. Indique um tempero dessa área e leve o caso para o próximo encontro.</li>" : "") +
      faltam.map(function (x) { return "<li>" + esc(x.nome) + ": " + esc(x.detalhe) + " (vale até +" + (x.max - x.pts) + " pts)</li>"; }).join("") +
      (i.prox ? "<li>Faltam <b>" + (i.prox.pts - i.pt.total) + " pts</b> para o prêmio " + esc(i.prox.nome) + ".</li>" : "<li>Já liberou todos os prêmios.</li>") + "</ul>" +
      "<h3 style=\"margin-top:14px\">Como lidar com " + esc(a.aluno.nome.split(" ")[0]) + "</h3>" +
      (gd ? "<p><strong>DISC " + i.disc.principal + " (" + esc(T2.disc.perfis[i.disc.principal].nome) + "):</strong> " + esc(gd.comunicar) + " " + esc(gd.motivar) + "</p><p><strong>No individual:</strong> " + esc(gd.individual) + "</p><p><strong>Evite:</strong> " + esc(gd.evitar) + "</p>" : '<p class="muted">Ainda não fez o DISC.</p>') +
      (ga ? "<p><strong>" + esc(T2.animais.perfis[i.ani.principal].nome) + ":</strong> " + esc(ga.comunicar) + " " + esc(ga.cobrar) + "</p>" : "") +
      '<div class="m-msg"><span class="rot">Mensagem pronta no tom dele</span><p>' + esc(msg).replace(/\n/g, "<br>") + '</p><button class="btn peq" id="m-copiar" data-txt="' + esc(msg) + '">Copiar para o WhatsApp</button></div></div></div></section>';
  }
  /* ---------- Montagem ---------- */
  function desenhar() {
    var d = dados();
    if (carregando && !d) return desenharCarregando();
    if (!d) return telaLogin();
    if (d.mentor) return telaMentor();
    marcarDia();
    var telas = { inicio: telaInicio, nivelamento: telaNivelamento, diagnostico: telaDiagnostico, plano: telaPlano, encontros: telaEncontros, temperos: telaTemperos, perfil: telaPerfil, conquistas: telaConquistas, cashback: telaCashback, individual: telaIndividual, regras: telaRegras };
    var menu = MENU.map(function (m) { return '<button data-ir="' + m[0] + '" class="' + (atual === m[0] ? "ativo" : "") + '"' + (atual === m[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" aria-hidden="true">' + m[2] + "</svg>" + m[1] + "</button>"; }).join("");
    var raiz = document.getElementById("raiz");
    raiz.innerHTML = (d.demo ? '<div class="aviso-demo">Participante de demonstração: os dados ficam só neste navegador.</div>' : "") +
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
    if (sm) sm.addEventListener("click", sairConta);
    var sair = document.getElementById("b-sair");
    if (sair) sair.addEventListener("click", sairConta);
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

  if (NV_) {
    if (memoria && !memoria.demo) { memoria = null; }
    desenhar();
    NV_.auth.getRedirectResult().catch(function () {});
    NV_.auth.onAuthStateChanged(function (u) {
      if (u) return quandoEntrar(u);
      usuarioNuvem = null; contaNuvem = null; carregando = false;
      if (!(memoria && memoria.demo)) { Armazem.apagar(); }
      desenhar();
    });
  } else desenhar();
  animarEntrada();
})();
