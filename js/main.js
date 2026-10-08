import { CONFIG } from "./config.js";
import { buscarLeituras, buscarResumo, buscarAlertas } from "./api/nodered.js";
import { renderKpis, renderStats, renderLotes, renderAlertas } from "./components/cards.js";
import { renderGrafico } from "./components/charts.js";
import { saudacao, hhmm } from "./utils/format.js";
import { montarMenu } from "./components/menu.js";

const $ = (id) => document.getElementById(id);

async function atualizar() {
  try {
    const [{ leituras }, { resumo, lotes }, alertas] = await Promise.all([
      buscarLeituras(), buscarResumo(), buscarAlertas(),
    ]);
    renderKpis($("kpis"), resumo, alertas);
    renderStats($("sideStats"), leituras);
    if (leituras.length) renderGrafico($("chartCondicoes"), leituras);
    renderLotes($("lotesBody"), lotes);
    renderAlertas($("alertsList"), $("alertCount"), alertas);
    $("updatedAt").textContent = `Atualizada às ${hhmm(new Date())}`;
  } catch (erro) {
    console.error(erro);
    $("sideStats").innerHTML = `<p class="empty">Não foi possível falar com o Node-RED. Verifique se ele está rodando em ${CONFIG.apiBase}.</p>`;
  }
  lucide.createIcons();
}

montarMenu("inicio", "");
$("greeting").textContent = `${saudacao()}, Rafael`;
atualizar();
setInterval(atualizar, CONFIG.refreshMs);
