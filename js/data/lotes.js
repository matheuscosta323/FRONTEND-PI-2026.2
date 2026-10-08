// Dados de exemplo (mock). Substituir quando o backend/Node-RED fornecer lotes e alertas.
export const LOTES = [
  { nome: "Parreira Norte", codigo: "UV-01", fruta: "uva",   status: "saudavel", leitura: "há 4 min" },
  { nome: "Vale Dourado",   codigo: "MG-03", fruta: "manga", status: "atencao",  leitura: "há 7 min" },
  { nome: "Encosta Sul",    codigo: "UV-04", fruta: "uva",   status: "saudavel", leitura: "há 11 min" },
  { nome: "Pomar Leste",    codigo: "MG-02", fruta: "manga", status: "critico",  leitura: "há 18 min" },
  { nome: "Talhão Central", codigo: "UV-06", fruta: "uva",   status: "estavel",  leitura: "há 22 min" },
];

export const RESUMO = { lotes: 12, uva: 7, manga: 5, sensoresAtivos: 47, sensoresTotal: 48 };

export const ALERTAS = [
  { titulo: "Temperatura elevada", local: "Vale Dourado · MG-03", quando: "há 34 min" },
];
