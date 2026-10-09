import { diaCurto, hhmm } from "../utils/format.js";

// gráficos já criados (um por canvas), para só trocar os dados nas atualizações
const graficos = {};

// linhas = lista de { campo: "temperatura", nome: "Temperatura", cor: "#b8964f" }
// mostrarEixoY = true mostra os valores na lateral do gráfico
export function desenharGrafico(canvas, leituras, linhas, mostrarEixoY) {
  // menos de 1 dia de leituras: eixo X mostra a hora, senão mostra o dia
  let mostrarHora = false;
  if (leituras.length > 0) {
    const primeira = new Date(leituras[0].data);
    const ultima = new Date(leituras[leituras.length - 1].data);
    mostrarHora = ultima - primeira < 24 * 60 * 60 * 1000;
  }

  const labels = [];
  for (const leitura of leituras) {
    const data = new Date(leitura.data);
    labels.push(mostrarHora ? hhmm(data) : diaCurto(data));
  }

  const datasets = [];
  const escalas = {
    x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, color: "#6b746d" } },
  };
  for (const linha of linhas) {
    const valores = [];
    for (const leitura of leituras) {
      valores.push(leitura[linha.campo]);
    }
    datasets.push({ label: linha.nome, data: valores, borderColor: linha.cor, yAxisID: linha.campo, tension: 0.4, borderWidth: 2, pointRadius: 0 });
    // cada linha tem sua própria escala vertical
    escalas[linha.campo] = { display: mostrarEixoY, border: { display: false }, grid: { color: "#eef0ea" }, ticks: { color: "#6b746d" } };
  }

  // se o gráfico já existe, só troca os dados
  if (graficos[canvas.id]) {
    graficos[canvas.id].data.labels = labels;
    graficos[canvas.id].data.datasets = datasets;
    graficos[canvas.id].update();
    return;
  }

  graficos[canvas.id] = new Chart(canvas, {
    type: "line",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false } },
      scales: escalas,
    },
  });
}
