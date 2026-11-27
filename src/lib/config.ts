export const APP_NOME = "AgroOps";

export const CONFIG = {
  // 127.0.0.1 em vez de localhost: no Windows, localhost pode resolver para
  // IPv6 (::1) enquanto o servidor Flask escuta apenas em IPv4.
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000/api",
  telefoneTransportadora: process.env.NEXT_PUBLIC_TELEFONE_TRANSPORTADORA ?? "",
  results: 50,
  refreshMs: 15000,
  emailGestao: "gestao@agroops.com.br",
  emailSuporte: "suporte@agroops.com.br",
};
