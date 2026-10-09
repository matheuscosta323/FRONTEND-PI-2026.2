import { CONFIG } from "./config.js";
import { buscar } from "./api/nodered.js";
import { cartaoKpi, renderLotes, haMin } from "./components/cards.js";
import { desenharGrafico } from "./components/charts.js";
import { montarMenu, mostrarAlertasNoMenu } from "./components/menu.js";
import { saudacao, hhmm, num } from "./utils/format.js";

const kpis = document.getElementById("kpis");
const sideStats = document.getElementById("sideStats");
const canvas = document.getElementById("chartCondicoes");
const lotesBody = document.getElementById("lotesBody");
const alertsList = document.getElementById("alertsList");

const linhas = [
  { campo: "temperatura", nome: "Temperatura (°C)", cor: "#b8964f" },
  { campo: "umidade", nome: "Umidade do ar (%)", cor: "#4f86a0" },
];

async function atualizar() {
  try {
    const leituras = await buscar("/leituras", { results: CONFIG.results });
    const dados = await buscar("/resumo");
    const alertas = await buscar("/alertas");
    const resumo = dados.resumo;

    kpis.innerHTML =
      cartaoKpi("Lotes monitorados", resumo.lotes, resumo.uva + " uva · " + resumo.manga + " manga") +
      cartaoKpi("Sensores ativos", resumo.sensoresAtivos, "de " + resumo.sensoresTotal + " instalados") +
      cartaoKpi("Alertas abertos", alertas.length, alertas.length > 0 ? alertas.length + " requer atenção" : "tudo em ordem");

    let temperaturaMedia = "--";
    let umidadeAtual = "--";
    if (leituras.length > 0) {
      let soma = 0;
      for (const leitura of leituras) {
        soma += leitura.temperatura;
      }
      temperaturaMedia = num(soma / leituras.length) + " °C";
      umidadeAtual = num(leituras[leituras.length - 1].umidade, 0) + "%";
      desenharGrafico(canvas, leituras, linhas, false);
    }
    sideStats.innerHTML = `
      <div class="stat"><span class="stat-icon temp"><i data-lucide="thermometer"></i></span>
        <div><small>Temperatura</small><strong>${temperaturaMedia}</strong><small>média observada</small></div></div>
      <div class="stat"><span class="stat-icon umid"><i data-lucide="droplets"></i></span>
        <div><small>Umidade do ar</small><strong>${umidadeAtual}</strong><small>leitura recente</small></div></div>`;

    renderLotes(lotesBody, dados.lotes, "pages/");

    let htmlAlertas = "";
    for (const alerta of alertas) {
      htmlAlertas += `
        <a class="alert-item" href="pages/alertas.html">
          <span class="stat-icon"><i data-lucide="thermometer-sun"></i></span>
          <div><strong>${alerta.titulo}</strong><small>${alerta.local}</small><small>${haMin(alerta.minutosAtras)}</small></div>
          <i data-lucide="chevron-right"></i>
        </a>`;
    }
    if (htmlAlertas === "") {
      htmlAlertas = `<p class="empty">Nenhum alerta aberto no momento.</p>`;
    }
    alertsList.innerHTML = htmlAlertas;

    mostrarAlertasNoMenu(alertas.length);
    document.getElementById("updatedAt").textContent = "Atualizada às " + hhmm(new Date());
  } catch (erro) {
    console.error(erro);
    sideStats.innerHTML = `<p class="empty">Não foi possível falar com o Node-RED. Verifique se ele está rodando em ${CONFIG.apiBase}.</p>`;
  }
  lucide.createIcons(); 
}

montarMenu("inicio", "");
document.getElementById("greeting").textContent = saudacao() + ", Rafael";
atualizar();
setInterval(atualizar, CONFIG.refreshMs);
