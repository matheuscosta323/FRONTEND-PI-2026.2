import { num, media } from "../utils/format.js";

const ROTULO = { saudavel: "Saudável", atencao: "Atenção", critico: "Crítico", estavel: "Estável" };
const ICONE_FRUTA = { uva: "grape", manga: "leaf" };
export const haMin = (m) => (m == null ? "--" : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)} h`);

export function cartaoKpi(rotulo, valor, nota = "") {
  return `<article class="card kpi"><p class="label">${rotulo}</p><p class="value">${valor}<span>${nota}</span></p></article>`;
}

export function renderKpis(el, resumo, alertas) {
  const itens = [
    ["Lotes monitorados", resumo.lotes, `${resumo.uva} uva · ${resumo.manga} manga`],
    ["Sensores ativos", resumo.sensoresAtivos, `de ${resumo.sensoresTotal} instalados`],
    ["Alertas abertos", alertas.length, alertas.length ? `${alertas.length} requer atenção` : "tudo em ordem"],
  ];
  el.innerHTML = itens.map(([rotulo, valor, nota]) => cartaoKpi(rotulo, valor, nota)).join("");
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

export function renderLotes(tbody, lotes, { prefixo = "pages/", seta = false, alertas = null } = {}) {
  tbody.innerHTML = lotes.map((l) => {
    const href = `${prefixo}lote.html?codigo=${l.codigo}`;
    const qtd = alertas ? alertas.filter((a) => a.local.includes(l.codigo)).length : 0;
    return `
    <tr>
      <td><a href="${href}"><strong>${l.nome}${qtd ? `<span class="badge-lote">${qtd}</span>` : ""}</strong><small>${l.codigo}</small></a></td>
      <td><span class="fruta"><span class="fruta-icon fruta-${l.fruta}"><i data-lucide="${ICONE_FRUTA[l.fruta]}"></i></span>${l.fruta === "uva" ? "Uva" : "Manga"}</span></td>
      <td><span class="status status-${l.status}">${ROTULO[l.status]}</span></td>
      <td>${haMin(l.minutosAtras)}</td>
      ${seta ? `<td class="seta"><a href="${href}" aria-label="Abrir lote"><i data-lucide="chevron-right"></i></a></td>` : ""}
    </tr>`;
  }).join("");
}

export function renderAlertasLote(el, alertas) {
  el.innerHTML = alertas.length
    ? alertas.map((a) => `
      <div class="alert-item"><span class="stat-icon"><i data-lucide="triangle-alert"></i></span>
        <div><strong>${a.titulo}</strong><small>${a.detalhe}</small><small>${haMin(a.minutosAtras)}</small></div>
        <span class="status status-${a.nivel}">${a.nivel === "critico" ? "Crítico" : "Atenção"}</span></div>`).join("")
    : `<p class="empty">Nenhum alerta neste lote.</p>`;
}

export function renderPaginacao(el, atual, total, aoMudar) {
  el.innerHTML = "";
  const botao = (texto, pagina, ativo = false) => {
    const b = document.createElement("button");
    b.textContent = texto;
    b.className = ativo ? "ativo" : "";
    b.disabled = pagina < 1 || pagina > total;
    b.onclick = () => aoMudar(pagina);
    el.append(b);
  };
  botao("<", atual - 1);
  for (let p = 1; p <= total; p++) botao(p, p, p === atual);
  botao(">", atual + 1);
}

export function renderAlertas(lista, contador, alertas) {
  contador.textContent = alertas.length;
  contador.hidden = !alertas.length;
  lista.innerHTML = alertas.length
    ? alertas.map((a) => `
      <a class="alert-item" href="pages/alertas.html"><span class="stat-icon"><i data-lucide="thermometer-sun"></i></span>
        <div><strong>${a.titulo}</strong><small>${a.local}</small><small>${haMin(a.minutosAtras)}</small></div><i data-lucide="chevron-right"></i></a>`).join("")
    : `<p class="empty">Nenhum alerta aberto no momento.</p>`;
}
