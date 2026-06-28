/****************************************************************
 *  EMAILS AUTOMÁTICOS DO CALENDÁRIO - KEHILÁ
 *  --------------------------------------------------------------
 *  Google Apps Script que, todo dia de manhã:
 *    1) Se AMANHÃ for dia 1 do mês -> manda RESUMO do próximo
 *       mês inteiro, agrupado por categoria (cor do evento).
 *    2) Pra cada evento que acontece AMANHÃ -> email "Amanhã".
 *    3) Pra cada evento que acontece HOJE  -> email "Hoje".
 *
 *  Como usar:
 *    1. Cole este código em script.google.com (novo projeto)
 *    2. Preencha as constantes em CONFIGURAÇÃO abaixo
 *    3. Rode "testarAgora" uma vez (autoriza o acesso)
 *    4. Crie um acionador de tempo diário na função "rodarDiariamente"
 ****************************************************************/

// ====== CONFIGURAÇÃO (preencha com seus dados) ================

// ID do calendário (Configurações da agenda -> "ID da agenda")
const CALENDAR_ID = "SEU_CALENDAR_ID@group.calendar.google.com";

// Quem recebe os emails (separados por vírgula)
const DESTINATARIOS = [
  "seu-email@gmail.com",
  // "outra.pessoa@gmail.com",
];

// Mapa: cor do evento (colorId do Google) -> nome da categoria.
// Ajuste os nomes das categorias conforme seu uso.
const CATEGORIAS = {
  "11": "Geral",          // vermelho (Tomato)
  "3":  "Mulheres",       // roxo (Grape)
  "1":  "Mulheres",       // lavanda (Lavender)
  "5":  "Infantil",       // amarelo (Banana)
  "8":  "Acontecimentos", // cinza (Graphite)
  "10": "Casais jovens",  // verde (Basil)
  "2":  "Casais jovens",  // verde claro (Sage)
  "9":  "Kehilá +",       // azul (Blueberry)
  "7":  "Kehilá +",       // azul turquesa (Peacock)
};

// Qualquer cor não mapeada cai aqui (nenhum evento se perde)
const CATEGORIA_PADRAO = "Outros";

// ====== FUNÇÃO PRINCIPAL (o acionador roda esta) ==============

function rodarDiariamente() {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) {
    Logger.log("ERRO: não achei o calendário. Confere o CALENDAR_ID.");
    return;
  }

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  // 1) RESUMO MENSAL: se amanhã é dia 1, hoje é o último dia do mês
  if (amanha.getDate() === 1) {
    enviarResumoMensal(cal, amanha);
  }

  // 2) EVENTOS DE AMANHÃ
  eventosDoDia(cal, amanha).forEach(function (ev) {
    enviarEmailEvento(ev, "Amanhã");
  });

  // 3) EVENTOS DE HOJE
  eventosDoDia(cal, hoje).forEach(function (ev) {
    enviarEmailEvento(ev, "Hoje");
  });
}

// ====== RESUMO DO MÊS =========================================

function enviarResumoMensal(cal, primeiroDiaDoMes) {
  const inicio = new Date(primeiroDiaDoMes.getFullYear(),
                          primeiroDiaDoMes.getMonth(), 1);
  const fim = new Date(primeiroDiaDoMes.getFullYear(),
                       primeiroDiaDoMes.getMonth() + 1, 1);

  const eventos = cal.getEvents(inicio, fim);
  if (eventos.length === 0) {
    Logger.log("Sem eventos no próximo mês, não enviei resumo.");
    return;
  }

  // Agrupa por categoria
  const grupos = {};
  eventos.forEach(function (ev) {
    const cat = categoriaDoEvento(ev);
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(ev);
  });

  const nomeMes = formatarMes(inicio);
  let corpo = "<h2>📅 Eventos de " + nomeMes + "</h2>";

  const ordem = ["Geral", "Mulheres", "Infantil", "Acontecimentos",
                 "Casais jovens", "Kehilá +", "Outros"];

  ordem.forEach(function (cat) {
    if (!grupos[cat]) return;
    corpo += "<h3>" + emojiDaCategoria(cat) + " " + cat + "</h3><ul>";
    grupos[cat].forEach(function (ev) {
      corpo += "<li><b>" + ev.getTitle() + "</b> — " +
               formatarDataHora(ev) + "</li>";
    });
    corpo += "</ul>";
  });

  MailApp.sendEmail({
    to: DESTINATARIOS.join(","),
    subject: "📅 Eventos de " + nomeMes,
    htmlBody: corpo,
  });
  Logger.log("Resumo de " + nomeMes + " enviado.");
}

// ====== EMAIL DE UM EVENTO (hoje / amanhã) ====================

function enviarEmailEvento(ev, quando) {
  const cat = categoriaDoEvento(ev);
  const titulo = ev.getTitle();
  const assunto = quando + ": " + titulo;

  let corpo = "<h2>" + emojiDaCategoria(cat) + " " + titulo + "</h2>";
  corpo += "<p><b>Quando:</b> " + formatarDataHora(ev) + "</p>";
  corpo += "<p><b>Categoria:</b> " + cat + "</p>";

  const local = ev.getLocation();
  if (local) corpo += "<p><b>Local:</b> " + local + "</p>";

  const desc = ev.getDescription();
  if (desc) corpo += "<p>" + desc + "</p>";

  MailApp.sendEmail({
    to: DESTINATARIOS.join(","),
    subject: assunto,
    htmlBody: corpo,
  });
  Logger.log("Email '" + assunto + "' enviado.");
}

// ====== AUXILIARES ============================================

function eventosDoDia(cal, data) {
  const inicio = new Date(data.getFullYear(), data.getMonth(),
                          data.getDate(), 0, 0, 0);
  const fim = new Date(data.getFullYear(), data.getMonth(),
                       data.getDate(), 23, 59, 59);
  return cal.getEvents(inicio, fim);
}

function categoriaDoEvento(ev) {
  const cor = ev.getColor(); // "1".."11" ou "" (cor padrão)
  return CATEGORIAS[cor] || CATEGORIA_PADRAO;
}

function emojiDaCategoria(cat) {
  const emojis = {
    "Geral": "🔴",
    "Mulheres": "🟣",
    "Infantil": "🟡",
    "Acontecimentos": "⚪",
    "Casais jovens": "🟢",
    "Kehilá +": "🔵",
    "Outros": "⚫",
  };
  return emojis[cat] || "•";
}

function formatarDataHora(ev) {
  const tz = Session.getScriptTimeZone();
  if (ev.isAllDayEvent()) {
    return Utilities.formatDate(ev.getAllDayStartDate(), tz, "dd 'de' MMMM");
  }
  const dia = Utilities.formatDate(ev.getStartTime(), tz, "dd 'de' MMMM");
  const hi = Utilities.formatDate(ev.getStartTime(), tz, "HH:mm");
  const hf = Utilities.formatDate(ev.getEndTime(), tz, "HH:mm");
  return dia + ", " + hi + " - " + hf;
}

function formatarMes(data) {
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(data, tz, "MMMM 'de' yyyy");
}

// ====== TESTE MANUAL ==========================================
// Selecione no topo e clique ▶ pra testar sem esperar o agendamento.

function testarAgora() {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const hoje = new Date();
  const primeiroDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  enviarResumoMensal(cal, primeiroDoMes);
}
