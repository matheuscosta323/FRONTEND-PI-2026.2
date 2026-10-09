import { CONFIG } from "../config.js";
import { buscar } from "../api/nodered.js";
import { cartaoKpi, haMin } from "../components/cards.js";
import { desenharGrafico } from "../components/charts.js";
import { montarMenu, mostrarAlertasNoMenu } from "../components/menu.js";
import { saudacao, hhmm, num } from "../utils/format.js";

const titulo = document.getElementById("titulo");
const kpis = document.getElementById("kpis");
const alertsLote = document.getElementById("alertsLote");

const codigo = new URLSearchParams(location.search).get("codigo");
let leituras = [];

function desenharGraficos() {
  const graficos = [
    { canvas: "chartUmidade", periodo: "periodoUmidade", campo: "umidade", nome: "Umidade do ar (%)", cor: "#4f86a0" },
    { canvas: "chartTemp", periodo: "periodoTemp", campo: "temperatura", nome: "Temperatura (°C)", cor: "#b8964f" },
  ];

  for (const g of graficos) {
    const dias = Number(document.getElementById(g.periodo).value);
    const desde = Date.now() - dias * 24 * 60 * 60 * 1000;

    const recentes = [];
    for (const leitura of leituras) {
      if (new Date(leitura.data).getTime() >= desde) recentes.push(leitura);
    }
    desenharGrafico(document.getElementById(g.canvas), recentes, [{ campo: g.campo, nome: g.nome, cor: g.cor }], true);
  }
}

async function carregar() {
  try {
    const dados = await buscar("/lotes/" + codigo, { dias: 7 });
    const alertas = await buscar("/alertas");
    leituras = dados.leituras;

    titulo.innerHTML = `Lote <span>${dados.lote.codigo} - ${dados.lote.nome}</span>`;

    // médias (o Node-RED manda null se o lote não tem sensor)
    let temperatura = "--";
    let umidade = "--";
    if (dados.mediaTemperatura != null) temperatura = num(dados.mediaTemperatura) + "°C";
    if (dados.mediaUmidade != null) umidade = num(dados.mediaUmidade, 0) + "%";
    kpis.innerHTML = cartaoKpi("Temperatura média do lote", temperatura) + cartaoKpi("Umidade média do lote", umidade);

    document.getElementById("semSensor").hidden = leituras.length > 0;
    desenharGraficos();

    let htmlAlertas = "";
    for (const alerta of dados.alertas) {
      const nivel = alerta.nivel === "critico" ? "Crítico" : "Atenção";
      htmlAlertas += `
        <div class="alert-item">
          <span class="stat-icon"><i data-lucide="triangle-alert"></i></span>
          <div><strong>${alerta.titulo}</strong><small>${alerta.detalhe}</small><small>${haMin(alerta.minutosAtras)}</small></div>
          <span class="status status-${alerta.nivel}">${nivel}</span>
        </div>`;
    }
    if (htmlAlertas === "") {
      htmlAlertas = `<p class="empty">Nenhum alerta neste lote.</p>`;
    }
    alertsLote.innerHTML = htmlAlertas;

    mostrarAlertasNoMenu(alertas.length);
    document.getElementById("updatedAt").textContent = "Atualizada às " + hhmm(new Date());
  } catch (erro) {
    console.error(erro);
    if (erro.message.includes("404")) {
      titulo.textContent = "Lote não encontrado";
    } else {
      titulo.textContent = "Não foi possível carregar o lote";
    }
  }
  lucide.createIcons();
}

montarMenu("lotes", "../");
document.getElementById("greeting").textContent = saudacao() + ", Rafael";
document.getElementById("periodoUmidade").onchange = desenharGraficos;
document.getElementById("periodoTemp").onchange = desenharGraficos;