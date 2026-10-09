import { CONFIG } from "../config.js";
import { buscar } from "../api/nodered.js";
import { cartaoKpi, renderLotes } from "../components/cards.js";
import { montarMenu, mostrarAlertasNoMenu } from "../components/menu.js";
import { saudacao, hhmm } from "../utils/format.js";

const kpis = document.getElementById("kpis");
const lotesBody = document.getElementById("lotesBody");
const paginacao = document.getElementById("paginacao");

let pagina = 1;

async function carregar() {
  try {
    const lista = await buscar("/lotes", { pagina: pagina });
    const dados = await buscar("/resumo");
    const alertas = await buscar("/alertas");
    const resumo = dados.resumo;
    pagina = lista.pagina;

    kpis.innerHTML =
      cartaoKpi("Lotes monitorados", resumo.lotes, resumo.uva + " uva · " + resumo.manga + " manga") +
      cartaoKpi("Alertas abertos", alertas.length, alertas.length > 0 ? alertas.length + " requer atenção" : "tudo em ordem");

    renderLotes(lotesBody, lista.lotes, "", true, alertas);

    let botoes = `<button data-pagina="${pagina - 1}" ${pagina === 1 ? "disabled" : ""}>&lt;</button>`;
    for (let p = 1; p <= lista.paginas; p++) {
      botoes += `<button data-pagina="${p}" class="${p === pagina ? "ativo" : ""}">${p}</button>`;
    }
    botoes += `<button data-pagina="${pagina + 1}" ${pagina === lista.paginas ? "disabled" : ""}>&gt;</button>`;
    paginacao.innerHTML = botoes;

    mostrarAlertasNoMenu(alertas.length);
    document.getElementById("updatedAt").textContent = "Atualizada às " + hhmm(new Date());
  } catch (erro) {
    console.error(erro);
    lotesBody.innerHTML = `<tr><td colspan="5" class="empty">Não foi possível falar com o Node-RED em ${CONFIG.apiBase}.</td></tr>`;
  }
  lucide.createIcons();
}

paginacao.onclick = function (evento) {
  if (evento.target.dataset.pagina) {
    pagina = Number(evento.target.dataset.pagina);
    carregar();
  }
};

montarMenu("lotes", "../");
document.getElementById("greeting").textContent = saudacao() + ", Rafael";
carregar();
setInterval(carregar, CONFIG.refreshMs);
