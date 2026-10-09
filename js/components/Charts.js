import { diaCurto, hhmm } from "../utils/format.js";

let grafico;

export function renderGrafico(canvas, leituras) {
  const span = leituras.at(-1).data - leituras[0].data;
  const labels = leituras.map((l) => (span < 24 * 3600 * 1000 ? hhmm(l.data) : diaCurto(l.data)));
  const temp = leituras.map((l) => l.temperatura);
  const umid = leituras.map((l) => l.umidade);

  if (grafico) {
    Object.assign(grafico.data, { labels });
    grafico.data.datasets[0].data = temp;
    grafico.data.datasets[1].data = umid;
    return grafico.update();
  }

  const linha = (label, data, cor, eixo) => ({
    label, data, borderColor: cor, yAxisID: eixo, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4,
  });

  grafico = new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [linha("Temperatura (°C)", temp, "#b8964f", "y"), linha("Umidade do ar (%)", umid, "#4f86a0", "y2")] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, color: "#6b746d" } },
        y: { display: false },
        y2: { display: false },
      },
    },
  });
}

const graficosLote = {};

export function renderGraficoLinha(canvas, leituras, campo, cor) {
  const span = leituras.length ? leituras[leituras.length - 1].data - leituras[0].data : 0;
  const labels = leituras.map((l) => (span < 24 * 3600 * 1000 ? hhmm(l.data) : diaCurto(l.data)));
  const valores = leituras.map((l) => l[campo]);

  const existente = graficosLote[canvas.id];
  if (existente) {
    existente.data.labels = labels;
    existente.data.datasets[0].data = valores;
    return existente.update();
  }
  graficosLote[canvas.id] = new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [{ data: valores, borderColor: cor, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, color: "#6b746d" } },
        y: { border: { display: false }, grid: { color: "#eef0ea" }, ticks: { color: "#6b746d" } },
      },
    },
  });
}
