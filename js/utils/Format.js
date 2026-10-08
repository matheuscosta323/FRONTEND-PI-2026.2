const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

export const pad = (n) => String(n).padStart(2, "0");
export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const diaCurto = (d) => `${d.getDate()} ${MESES[d.getMonth()]}`;
export const num = (v, casas = 1) => Number(v).toFixed(casas).replace(".", ",");
export const media = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN);

export function saudacao(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
