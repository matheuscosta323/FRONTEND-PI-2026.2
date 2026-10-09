
const itens = [
  ["inicio", "index.html", "layout-grid", "Visão geral"],
  ["lotes", "pages/lotes.html", "map", "Lotes"],
  ["sensores", "pages/sensores.html", "radio-tower", "Sensores"],
  ["alertas", "pages/alertas.html", "bell", "Alertas"],
  ["propriedades", "pages/propriedades.html", "building-2", "Propriedades"],
  ["equipe", "pages/equipe.html", "users", "Equipe"],
];

export function montarMenu(ativo, base) {
  let links = "";
  for (const [id, link, icone, nome] of itens) {
    if (id === "propriedades") {
      links += `<p class="nav-group">Gestão</p>`;
    }
    const classe = id === ativo ? "nav-item is-active" : "nav-item";
    let badge = "";
    if (id === "alertas") {
      badge = `<span class="badge-count" id="alertCount" hidden>0</span>`;
    }
    links += `<a class="${classe}" href="${base}${link}"><i data-lucide="${icone}"></i>${nome}${badge}</a>`;
  }

  document.getElementById("menu").innerHTML = `
    <a class="brand" href="${base}index.html"><span class="brand-logo"><i data-lucide="sprout"></i></span>NomeProjeto</a>
    <nav class="nav">${links}</nav>
    <a class="user" href="${base}pages/perfil.html">
      <span class="avatar">RM</span>
      <span><strong>Rafael Mendes</strong><small>Gestor da fazenda</small></span>
    </a>`;
}

// número vermelho ao lado de "Alertas"
export function mostrarAlertasNoMenu(qtd) {
  const badge = document.getElementById("alertCount");
  badge.textContent = qtd;
  badge.hidden = qtd === 0;
}
