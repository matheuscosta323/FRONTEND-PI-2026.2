export const APP_NOME = "AgroOps";

export const CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  noderedUrl: process.env.NEXT_PUBLIC_NODERED_URL ?? "http://localhost:1880/api",
  telefoneTransportadora: process.env.NEXT_PUBLIC_TELEFONE_TRANSPORTADORA ?? "",
  results: 50,
  refreshMs: 15000,
  emailGestao: "gestao@agroops.com.br",
  emailSuporte: "suporte@agroops.com.br",
};
