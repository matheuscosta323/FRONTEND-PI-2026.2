const rotuloStatus = { saudavel: "Saudável", atencao: "Atenção", critico: "Crítico", estavel: "Estável" };
const nomeFruta = { uva: "Uva", manga: "Manga" };
const iconeFruta = { uva: "grape", manga: "leaf" };


export function haMin(minutos) {
  if (minutos == null) return "--";
  if (minutos < 60) return "há " + minutos + " min";
  return "há " + Math.floor(minutos / 60) + " h";
}

export function cartaoKpi(rotulo, valor, nota = "") {
  return `<article class="card kpi"><p class="label">${rotulo}</p><p class="value">${valor}<span>${nota}</span></p></article>`;
}


export function renderLotes(tbody, lotes, prefixo, comSeta = false, alertas = []) {
  let html = "";
  for (const lote of lotes) {
    const link = prefixo + "lote.html?codigo=" + lote.codigo;

    let qtd = 0;
    for (const alerta of alertas) {
      if (alerta.local.includes(lote.codigo)) qtd++;
    }
    const bolinha = qtd > 0 ? `<span class="badge-lote">${qtd}</span>` : "";
    const seta = comSeta ? `<td class="seta"><a href="${link}"><i data-lucide="chevron-right"></i></a></td>` : "";

    html += `
      <tr>
        <td><a href="${link}"><strong>${lote.nome}${bolinha}</strong><small>${lote.codigo}</small></a></td>
        <td><span class="fruta"><span class="fruta-icon fruta-${lote.fruta}"><i data-lucide="${iconeFruta[lote.fruta]}"></i></span>${nomeFruta[lote.fruta]}</span></td>
        <td><span class="status status-${lote.status}">${rotuloStatus[lote.status]}</span></td>
        <td>${haMin(lote.minutosAtras)}</td>
        ${seta}
      </tr>`;
  }
  tbody.innerHTML = html;
}
