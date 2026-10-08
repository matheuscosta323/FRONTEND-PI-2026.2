// Monta a sidebar. "ativo" = item destacado, "base" = "" no index e "../" dentro de pages/
const PRINCIPAL = [
  ["inicio", "index.html", "layout-grid", "Visão geral"],
  ["lotes", "pages/lotes.html", "map", "Lotes"],
  ["sensores", "pages/sensores.html", "radio-tower", "Sensores"],
  ["alertas", "pages/alertas.html", "bell", "Alertas"],
];
const GESTAO = [
  ["propriedades", "pages/propriedades.html", "building-2", "Propriedades"],
  ["equipe", "pages/equipe.html", "users", "Equipe"],
];

export function montarMenu(ativo, base) {
  const item = ([id, href, icone, nome]) => `
    <a class="nav-item ${id === ativo ? "is-active" : ""}" href="${base}${href}">
      <i data-lucide="${icone}"></i>${nome}${id === "alertas" ? '<span class="badge-count" id="alertCount" hidden>0</span>' : ""}
    </a>`;

  document.getElementById("menu").innerHTML = `
    <a class="brand" href="${base}index.html"><span class="brand-logo"><i data-lucide="sprout"></i></span>NomeProjeto</a>
    <nav class="nav">
      ${PRINCIPAL.map(item).join("")}
      <p class="nav-group">Gestão</p>
      ${GESTAO.map(item).join("")}
    </nav>
    <a class="user" href="${base}pages/perfil.html">
      <span class="avatar">RM</span>
      <span><strong>Rafael Mendes</strong><small>Gestor da fazenda</small></span>
    </a>`;
}

// número vermelho ao lado de "Alertas"
export function mostrarAlertasNoMenu(qtd) {
  const el = document.getElementById("alertCount");
  el.textContent = qtd;
  el.hidden = qtd === 0;
}
