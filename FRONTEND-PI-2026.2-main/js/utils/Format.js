const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function hhmm(data) {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function diaCurto(data) {
  return data.getDate() + " " + meses[data.getMonth()];
}
export function num(valor, casas = 1) {
  return valor.toFixed(casas).replace(".", ",");
}

export function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
