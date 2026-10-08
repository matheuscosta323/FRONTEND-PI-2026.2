import { CONFIG } from "./config.js";
import { buscarLeituras } from "./api/thingspeak.js";
import { renderKpis, renderStats, renderLotes, renderAlertas } from "./components/cards.js";

import { renderGrafico } from "./components/charts.js";

import { saudacao, hhmm } from "./utils/format.js";

const $ = (id) => document.getElementById(id);

async function atualizar() {
  try {
    const { leituras } = await buscarLeituras();
    renderStats($("sideStats"), leituras);
    renderGrafico($("chartCondicoes"), leituras);
    $("updatedAt").textContent = `Atualizada às ${hhmm(new Date())}`;
  } catch (erro) {
    console.error(erro);
    $("sideStats").innerHTML = `<p class="empty">Não foi possível carregar os dados. Verifique o canal do ThingSpeak.</p>`;
  }
  lucide.createIcons();
}

function iniciar() {
  $("greeting").textContent = `${saudacao()}, Rafael`;
  renderKpis($("kpis"));
  renderLotes($("lotesBody"));
  renderAlertas($("alertsList"), $("alertCount"));
  atualizar();
  setInterval(atualizar, CONFIG.refreshMs);
}

// Scripts com defer: Chart.js e Lucide já estão carregados quando o módulo roda.
iniciar();
