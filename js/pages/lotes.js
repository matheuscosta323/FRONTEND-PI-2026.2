import { CONFIG } from "../config.js";
import { buscarLotes, buscarResumo, buscarAlertas } from "../api/nodered.js";
import { cartaoKpi, renderLotes, renderPaginacao } from "../components/cards.js";
import { montarMenu, mostrarAlertasNoMenu } from "../components/menu.js";
import { saudacao, hhmm } from "../utils/format.js";

const $ = (id) => document.getElementById(id);
let pagina = 1;

async function carregar() {
  try {
    const [lista, { resumo }, alertas] = await Promise.all([buscarLotes(pagina), buscarResumo(), buscarAlertas()]);
    $("kpis").innerHTML =
      cartaoKpi("Lotes monitorados", resumo.lotes, `${resumo.uva} uva · ${resumo.manga} manga`) +
      cartaoKpi("Alertas abertos", alertas.length, alertas.length ? `${alertas.length} requer atenção` : "tudo em ordem");
    renderLotes($("lotesBody"), lista.lotes, { prefixo: "", seta: true, alertas });
    renderPaginacao($("paginacao"), lista.pagina, lista.paginas, (p) => { pagina = p; carregar(); });
    mostrarAlertasNoMenu(alertas.length);
    $("updatedAt").textContent = `Atualizada às ${hhmm(new Date())}`;
  } catch (erro) {
    console.error(erro);
    $("lotesBody").innerHTML = `<tr><td colspan="5" class="empty">Não foi possível falar com o Node-RED em ${CONFIG.apiBase}.</td></tr>`;
  }
  lucide.createIcons();
}

montarMenu("lotes", "../");
$("greeting").textContent = `${saudacao()}, Rafael`;
carregar();
setInterval(carregar, CONFIG.refreshMs);
