var APPS_SCRIPT_URL = "https://google.com";
var GEMINI_API_KEY = "AQ.Ab8RN6Kh2XtimPJN9j3DtObWM-K00TGrFfbsMiKdo9uwLCEXoA";

var turmasPorTurno = {
  "Manhã": ["1º Ano A", "1º Ano B", "2º Ano A", "2º Ano Técnico Adm", "3º Ano A", "3º Ano B"],
  "Tarde": ["1º Ano C", "2º Ano B", "3º Ano C"],
  "Noite": ["2º Ano C", "3º Ano D"]
};

var turnoAtual = "Manhã";
var registrosGlobais = [];

function chamarServidor(payload) {
  return fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(function(resp) {
    return resp.json();
  });
}

function atualizarDropdownTurmas(turno) {
  var select = document.getElementById("select-turma");
  if (!select) return;
  select.innerHTML = "";
  var lista = turmasPorTurno[turno] || [];
  for (var i = 0; i < lista.length; i++) {
    var opt = document.createElement("option");
    opt.value = lista[i];
    opt.textContent = lista[i];
    select.appendChild(opt);
  }
}

function selecionarTurno(turno, botao) {
  turnoAtual = turno;
  var botoes = document.querySelectorAll(".turno-btn");
  for (var i = 0; i < botoes.length; i++) {
    botoes[i].classList.remove("active");
  }
  botao.classList.add("active");
  atualizarDropdownTurmas(turno);
}

function mudarTela(tela) {
  var telas = ["captura", "whatsapp", "relatorio"];
  for (var i = 0; i < telas.length; i++) {
    var t = telas[i];
    var elTela = document.getElementById("tela-" + t);
    var elPc = document.getElementById("nav-pc-" + t);
    var elMob = document.getElementById("nav-mob-" + t);
    if (elTela) {
      if (t === tela) elTela.classList.remove("hidden");
      else elTela.classList.add("hidden");
    }
    if (elPc) {
      if (t === tela) elPc.classList.add("active");
      else elPc.classList.remove("active");
    }
    if (elMob) {
      if (t === tela) elMob.classList.add("active");
      else elMob.classList.remove("active");
    }
  }
}

function mostrarStatusIA(msg, tipo) {
  var box = document.getElementById("status-ia");
  if (!box) return;
  box.textContent = msg;
  box.style.display = "block";
  box.style.background = tipo === "erro" ? "#fee2e2" : (tipo === "sucesso" ? "#d1fae5" : "#fef3c7");
  box.style.color = tipo === "erro" ? "#991b1b" : (tipo === "sucesso" ? "#065f46" : "#92400e");
}

function criarMensagemPadrao(nome, turma, turno) {
  return "Olá! Aqui é da equipe da E.E. Pedro Augusto Barreto. Notamos a ausência do(a) estudante " + nome + ", da turma " + turma + ", nas primeiras aulas do turno da " + turno + " hoje. Está tudo bem por aí? Por favor, nos informe o motivo da falta para que possamos registrar e apoiar no que for preciso.";
}

function processarFotoComIA(input) {
  if (!input.files || !input.files.length) return;
  var arquivo = input.files.item(0);
  var turma = document.getElementById("select-turma").value;
  mostrarStatusIA("⏳ Lendo lista de chamada com IA...", "carregando");

  var r = new FileReader();
  r.readAsDataURL(arquivo);
  r.onload = function() {
    var base64Data = r.result.split(",").pop();
    var promptTexto = "Analise esta foto de chamada escolar da turma " + turma + " (" + turnoAtual + "). Liste APENAS os nomes dos alunos marcados com falta (F ou ausencia). Responda SOMENTE um JSON puro neste formato exato: {\"nomes\": [\"Nome 1\", \"Nome 2\"]}";
    var urlApi = "https://googleapis.com" + GEMINI_API_KEY;

    fetch(urlApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptTexto },
            { inline_data: { mime_type: arquivo.type, data: base64Data } }
          ]
        }]
      })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error.message);
      var textoBruto = data.candidates.content.parts.text;
      var textoLimpo = textoBruto.replace(/```json/g, "").replace(/```/g, "").trim();
      var json = JSON.parse(textoLimpo);

      if (!json.nomes || json.nomes.length === 0) {
        mostrarStatusIA("ℹ️ Nenhuma falta ('F') identificada nesta foto.", "sucesso");
        return null;
      }

      var alunosFormatados = json.nomes.map(function(nome) {
        return { nome: nome, mensagem: criarMensagemPadrao(nome, turma, turnoAtual) };
      });

      mostrarStatusIA("✅ " + alunosFormatados.length + " falta(s) lida(s)! Salvando na planilha...", "carregando");

      return chamarServidor({
        acao: "salvarFaltas",
        dados: { turno: turnoAtual, turma: turma, alunos: alunosFormatados }
      }).then(function() {
        mostrarStatusIA("🎉 Sucesso! " + alunosFormatados.length + " aluno(s) salvo(s) na planilha!", "sucesso");
        input.value = "";
        carregarDadosPlanilha();
      });
    })
    .catch(function(erro) {
      mostrarStatusIA("❌ Erro na leitura/envio: " + erro.message, "erro");
    });
  };
}
function processarTextoManual() {
  var campo = document.getElementById("input-manual");
  var texto = campo.value.trim();
  if (!texto) {
    alert("Digite pelo menos um nome antes de enviar.");
    return;
  }

  var turma = document.getElementById("select-turma").value;
  var listaNomes = texto.split(",").map(function(n) { return n.trim(); }).filter(Boolean);
  var alunos = listaNomes.map(function(nome) {
    return { nome: nome, mensagem: criarMensagemPadrao(nome, turma, turnoAtual) };
  });

  mostrarStatusIA("⏳ Salvando na planilha...", "carregando");
  chamarServidor({
    acao: "salvarFaltas",
    dados: { turno: turnoAtual, turma: turma, alunos: alunos }
  })
  .then(function() {
    mostrarStatusIA("✅ " + alunos.length + " aluno(s) salvo(s)!", "sucesso");
    campo.value = "";
    carregarDadosPlanilha();
  })
  .catch(function(err) {
    mostrarStatusIA("❌ Erro ao salvar: " + err.message, "erro");
  });
}

function carregarDadosPlanilha() {
  var el = document.getElementById("lista-recente-captura");
  if (el) el.innerHTML = "<p class=\"subtitle\">Sincronizando com a planilha...</p>";
  chamarServidor({ acao: "listarRegistros" })
    .then(function(dados) {
      registrosGlobais = Array.isArray(dados) ? dados : [];
      renderizarListaCaptura();
      renderizarTelaWhatsApp();
      renderizarRelatorio();
    })
    .catch(function(err) {
      if (el) el.innerHTML = "<p style=\"color:#dc2626;font-size:13px;\">Erro ao conectar na planilha: " + err.message + "</p>";
    });
}

function renderizarListaCaptura() {
  var el = document.getElementById("lista-recente-captura");
  if (!el) return;
  if (!registrosGlobais.length) {
    el.innerHTML = "<p class=\"subtitle\">Nenhum registro ainda.</p>";
    return;
  }
  el.innerHTML = registrosGlobais.slice(0, 6).map(function(r) {
    var classeBadge = r.status === "Contatado" ? "badge-ok" : "badge-pendente";
    return "<div class=\"card\" style=\"margin:0;display:flex;justify-content:space-between;align-items:center;\">" +
      "<div><strong>" + r.nome + "</strong><div class=\"subtitle\" style=\"font-size:12px;\">" + r.turma + " • " + r.turno + " (" + r.data + ")</div></div>" +
      "<span class=\"badge " + classeBadge + "\">" + r.status + "</span>" +
    "</div>";
  }).join("");
}

function renderizarTelaWhatsApp() {
  var el = document.getElementById("grid-cards-whatsapp");
  if (!el) return;
  var filtro = document.getElementById("filtro-turno-wpp").value;
  var lista = registrosGlobais.filter(function(r) { return filtro === "todos" || r.turno === filtro; });
  if (!lista.length) {
    el.innerHTML = "<p class=\"subtitle\">Nenhum aluno neste filtro.</p>";
    return;
  }

  el.innerHTML = lista.map(function(r) {
    var classeBadge = r.status === "Contatado" ? "badge-ok" : "badge-pendente";
    return "<div class=\"card\" style=\"margin:0;\">" +
      "<div style=\"display:flex;justify-content:space-between;align-items:start;\">" +
        "<div><span style=\"font-size:11px;font-weight:700;color:#0d9488;\">" + r.turma + " • " + r.turno + " (" + r.data + ")</span>" +
        "<h3 style=\"font-size:16px;margin-top:2px;\">" + r.nome + "</h3></div>" +
        "<span class=\"badge " + classeBadge + "\">" + r.status + "</span>" +
      "</div>" +
      "<div class=\"msg-box\">\"" + r.mensagem + "\"</div>" +
      "<button type=\"button\" data-wpp-id=\"" + r.id + "\" class=\"btn-wpp\">💬 Copiar e Abrir WhatsApp</button>" +
      "<div class=\"flex-row\" style=\"margin-top:8px;\">" +
        "<select id=\"cat-" + r.id + "\" style=\"width:130px;padding:8px;font-size:12px;\">" +
          "<option value=\"\">Motivo...</option>" +
          "<option value=\"Saúde\"" + (r.categoria === "Saúde" ? " selected" : "") + ">Saúde</option>" +
          "<option value=\"Transporte\"" + (r.categoria === "Transporte" ? " selected" : "") + ">Transporte</option>" +
          "<option value=\"Trabalho\"" + (r.categoria === "Trabalho" ? " selected" : "") + ">Trabalho</option>" +
          "<option value=\"Familiar\"" + (r.categoria === "Familiar" ? " selected" : "") + ">Familiar</option>" +
          "<option value=\"Sem Resposta\"" + (r.categoria === "Sem Resposta" ? " selected" : "") + ">Sem Resposta</option>" +
        "</select>" +
        "<input type=\"text\" id=\"mot-" + r.id + "\" value=\"" + (r.motivo || "") + "\" placeholder=\"Detalhes...\" style=\"padding:8px;font-size:12px;\">" +
        "<button type=\"button\" data-save-id=\"" + r.id + "\" class=\"btn-dark btn-save-retorno\" style=\"padding:8px 12px;font-size:12px;\">Salvar</button>" +
      "</div>" +
    "</div>";
  }).join("");
}

function copiarEAbrirWhatsApp(id, btn) {
  var r = registrosGlobais.find(function(x) { return x.id === id; });
  if (!r) return;
  if (navigator.clipboard) navigator.clipboard.writeText(r.mensagem);
  
  chamarServidor({
    acao: "atualizarRegistro",
    id: id,
    status: "Contatado",
    motivo: r.motivo,
    categoria: r.categoria
  });

  r.status = "Contatado";
  setTimeout(function() {
    renderizarTelaWhatsApp();
    renderizarRelatorio();
  }, 1000);

  var ehCelular = /Android|iPhone|iPad/i.test(navigator.userAgent);
  var tel = (r.telefone || "").replace(/\D/g, "");
  if (tel && !tel.startsWith("55")) tel = "55" + tel;

  var destino = "";
  if (tel) {
    btn.textContent = "✅ Abrindo conversa direta...";
    destino = ehCelular 
      ? "whatsapp://send?phone=" + tel + "&text=" + encodeURIComponent(r.mensagem)
      : "https://whatsapp.com" + tel + "&text=" + encodeURIComponent(r.mensagem);
  } else {
    btn.textContent = "✅ Copiado! (Sem tel na agenda)";
    destino = ehCelular 
      ? "whatsapp://send?text=" + encodeURIComponent(r.mensagem)
      : "https://whatsapp.com";
  }

  window.open(destino, "aba_whatsapp_escola");
}

function salvarRetorno(id, btn) {
  var cat = document.getElementById("cat-" + id).value;
  var mot = document.getElementById("mot-" + id).value;
  btn.textContent = "...";
  chamarServidor({
    acao: "atualizarRegistro",
    id: id,
    status: "Contatado",
    motivo: mot,
    categoria: cat
  }).then(function() {
    btn.textContent = "Salvar";
    carregarDadosPlanilha();
  });
}

function renderizarRelatorio() {
  var total = registrosGlobais.length;
  var ok = registrosGlobais.filter(function(r) { return r.status === "Contatado"; }).length;
  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-retorno").textContent = (total ? Math.round((ok / total) * 100) : 0) + "%";

  var alunosCount = {};
  var porTurma = {};
  registrosGlobais.forEach(function(r) {
    var chave = r.nome + " (" + r.turma + ")";
    alunosCount[chave] = (alunosCount[chave] || 0) + 1;
    if (!porTurma[r.turma]) porTurma[r.turma] = { turno: r.turno, total: 0, motivos: [], alunos: {} };
    porTurma[r.turma].total++;
    if (r.categoria) porTurma[r.turma].motivos.push(r.categoria);
    porTurma[r.turma].alunos[r.nome] = (porTurma[r.turma].alunos[r.nome] || 0) + 1;
  });

  var criticosQtd = Object.values(alunosCount).filter(function(q) { return q >= 2; }).length;
  document.getElementById("kpi-criticos").textContent = criticosQtd;

  var tbody = document.getElementById("tabela-relatorio-corpo");
  var keys = Object.keys(porTurma);
  if (!keys.length) {
    tbody.innerHTML = "<tr><td colspan=\"5\">Nenhum dado ainda.</td></tr>";
    return;
  }

  tbody.innerHTML = keys.map(function(t) {
    var info = porTurma[t];
    var mots = Array.from(new Set(info.motivos)).join(", ") || "Aguardando";
    var listaCriticos = [];
    for (var nomeAluno in info.alunos) {
      if (info.alunos[nomeAluno] >= 2) {
        listaCriticos.push(nomeAluno + " (" + info.alunos[nomeAluno] + "x)");
      }
    }
    var crit = listaCriticos.join(", ") || "-";
    var cor = crit !== "-" ? "#dc2626" : "#94a3b8";
    return "<tr><td><strong>" + t + "</strong></td><td>" + info.turno + "</td><td><strong>" + info.total + "</strong></td><td>" + mots + "</td><td style=\"color:" + cor + ";font-weight:600;\">" + crit + "</td></tr>";
  }).join("");
}

function exportarCSV() {
  if (!registrosGlobais.length) return alert("Sem dados para exportar.");
  var csv = "\uFEFFData;Turno;Turma;Nome_Aluno;Status;Categoria;Motivo_Falta\n";
  registrosGlobais.forEach(function(r) {
    csv += "\"" + r.data + "\";\"" + r.turno + "\";\"" + r.turma + "\";\"" + r.nome + "\";\"" + r.status + "\";\"" + r.categoria + "\";\"" + r.motivo + "\"\n";
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = "Busca_Ativa_" + new Date().toLocaleDateString("pt-BR").replace(/\//g, "-") + ".csv";
  a.click();
}

document.getElementById("nav-pc-captura").addEventListener("click", function() { mudarTela("captura"); });
document.getElementById("nav-pc-whatsapp").addEventListener("click", function() { mudarTela("whatsapp"); });
document.getElementById("nav-pc-relatorio").addEventListener("click", function() { mudarTela("relatorio"); });

document.getElementById("nav-mob-captura").addEventListener("click", function() { mudarTela("captura"); });
document.getElementById("nav-mob-whatsapp").addEventListener("click", function() { mudarTela("whatsapp"); });
document.getElementById("nav-mob-relatorio").addEventListener("click", function() { mudarTela("relatorio"); });

document.getElementById("btn-sync-pc").addEventListener("click", carregarDadosPlanilha);
document.getElementById("btn-sync-mob").addEventListener("click", carregarDadosPlanilha);
document.getElementById("btn-enviar-manual").addEventListener("click", processarTextoManual);
document.getElementById("btn-exportar-csv").addEventListener("click", exportarCSV);
document.getElementById("filtro-turno-wpp").addEventListener("change", renderizarTelaWhatsApp);
document.getElementById("input-foto").addEventListener("change", function() { processarFotoComIA(this); });

var botoesTurno = document.querySelectorAll(".turno-btn");
