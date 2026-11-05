const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function hhmm(data: Date): string {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function diaCurto(data: Date): string {
  return data.getDate() + " " + meses[data.getMonth()];
}

export function num(valor: number, casas = 1): string {
  return valor.toFixed(casas).replace(".", ",");
}

export function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function haMin(minutos: number | null | undefined): string {
  if (minutos == null) return "--";
  if (minutos < 60) return "há " + minutos + " min";
  return "há " + Math.floor(minutos / 60) + " h";
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0];
  if (!primeira) return "?";
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] ?? "" : "";
  return (primeira + ultima).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}
