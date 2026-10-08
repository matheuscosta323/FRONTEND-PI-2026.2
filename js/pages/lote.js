import { CONFIG } from "../config.js";
import { buscarLote, buscarAlertas } from "../api/nodered.js";
import { cartaoKpi, renderAlertasLote } from "../components/cards.js";
import { montarMenu, mostrarAlertasNoMenu } from "../components/menu.js";
import { renderGraficoLinha } from "../components/charts.js";
import { saudacao, hhmm, num } from "../utils/format.js";

const $ = (id) => document.getElementById(id);
const codigo = new URLSearchParams(location.search).get("codigo");
let leituras = [];

// só as leituras dos últimos "dias" dias
const recentes = (dias) => leituras.filter((l) => l.data.getTime() >= Date.now() - dias * 864e5);

function desenharGraficos() {
  renderGraficoLinha($("chartUmidade"), recentes(Number($("periodoUmidade").value)), "umidade", "#4f86a0");
  renderGraficoLinha($("chartTemp"), recentes(Number($("periodoTemp").value)), "temperatura", "#b8964f");
}

async function carregar() {
  try {
    const [dados, alertas] = await Promise.all([buscarLote(codigo, 7), buscarAlertas()]);
    const { lote } = dados;
    leituras = dados.leituras;

    $("titulo").innerHTML = `Lote <span>${lote.codigo} - ${lote.nome}</span>`;
    $("kpis").innerHTML =
      cartaoKpi("Temperatura média do lote", dados.mediaTemperatura == null ? "--" : num(dados.mediaTemperatura) + "°C") +
      cartaoKpi("Umidade média do lote", dados.mediaUmidade == null ? "--" : num(dados.mediaUmidade, 0) + "%");
    $("semSensor").hidden = leituras.length > 0;
    renderAlertasLote($("alertsLote"), dados.alertas);
    desenharGraficos();
    mostrarAlertasNoMenu(alertas.length);
    $("updatedAt").textContent = `Atualizada às ${hhmm(new Date())}`;
  } catch (erro) {
    console.error(erro);
    $("titulo").textContent = erro.message.includes("404") ? "Lote não encontrado" : "Não foi possível carregar o lote";
  }
  lucide.createIcons();
}

montarMenu("lotes", "../");
$("greeting").textContent = `${saudacao()}, Rafael`;
$("periodoUmidade").onchange = desenharGraficos;
$("periodoTemp").onchange = desenharGraficos;

// botão de ligar: usa o telefone do config.js
const ligar = $("ligar");
if (CONFIG.telefoneTransportadora) ligar.href = "tel:" + CONFIG.telefoneTransportadora;
else { ligar.classList.add("desativado"); ligar.title = "Defina telefoneTransportadora no config.js"; }

carregar();
setInterval(carregar, CONFIG.refreshMs);
