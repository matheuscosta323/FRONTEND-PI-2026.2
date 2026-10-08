import { num, media } from "../utils/format.js";
import { LOTES, RESUMO, ALERTAS } from "../data/lotes.js";

const ROTULO = { saudavel: "Saudável", atencao: "Atenção", critico: "Crítico", estavel: "Estável" };
const ICONE_FRUTA = { uva: "grape", manga: "leaf" };

export function renderKpis(el) {
  const itens = [
    ["Lotes monitorados", RESUMO.lotes, `${RESUMO.uva} uva · ${RESUMO.manga} manga`],
    ["Sensores ativos", RESUMO.sensoresAtivos, `de ${RESUMO.sensoresTotal} instalados`],
    ["Alertas abertos", ALERTAS.length, ALERTAS.length ? `${ALERTAS.length} requer atenção` : "tudo em ordem"],
  ];
  el.innerHTML = itens.map(([rotulo, valor, nota]) => `
    <article class="card kpi"><p class="label">${rotulo}</p><p class="value">${valor}<span>${nota}</span></p></article>`).join("");
}

export function renderStats(el, leituras) {
  const t = media(leituras.map((l) => l.temperatura));
  const u = leituras.at(-1)?.umidade;
  el.innerHTML = `
    <div class="stat"><span class="stat-icon temp"><i data-lucide="thermometer"></i></span>
      <div><small>Temperatura</small><strong>${isNaN(t) ? "--" : num(t) + " °C"}</strong><small>média observada</small></div></div>
    <div class="stat"><span class="stat-icon umid"><i data-lucide="droplets"></i></span>
      <div><small>Umidade do ar</small><strong>${u == null ? "--" : num(u, 0) + "%"}</strong><small>leitura recente</small></div></div>`;
}

export function renderLotes(tbody) {
  tbody.innerHTML = LOTES.map((l) => `
    <tr>
      <td><strong>${l.nome}</strong><small>${l.codigo}</small></td>
      <td><span class="fruta"><span class="fruta-icon fruta-${l.fruta}"><i data-lucide="${ICONE_FRUTA[l.fruta]}"></i></span>${l.fruta === "uva" ? "Uva" : "Manga"}</span></td>
      <td><span class="status status-${l.status}">${ROTULO[l.status]}</span></td>
      <td>${l.leitura}</td>
    </tr>`).join("");
}

export function renderAlertas(lista, contador) {
  contador.textContent = ALERTAS.length;
  contador.hidden = !ALERTAS.length;
  lista.innerHTML = ALERTAS.length
    ? ALERTAS.map((a) => `
      <a class="alert-item" href="pages/alertas.html"><span class="stat-icon"><i data-lucide="thermometer-sun"></i></span>
        <div><strong>${a.titulo}</strong><small>${a.local}</small><small>${a.quando}</small></div><i data-lucide="chevron-right"></i></a>`).join("")
    : `<p class="empty">Nenhum alerta aberto no momento.</p>`;
}
