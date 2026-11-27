"use client";

import { useState } from "react";

export type ErrosDe<V> = Partial<Record<keyof V, string>>;

/** Os campos do formulário usam o nome da chave como `id`, para receberem o foco quando inválidos. */
export function useFormulario<V extends object>(inicial: V, validar: (valores: V) => ErrosDe<V>) {
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<ErrosDe<V>>({});

  function alterar<K extends keyof V>(campo: K, valor: V[K]) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    // Só reavalia os erros já exibidos: não acusa o campo enquanto ainda é digitado.
    setErros((atuais) => {
      const revalidados = validar(novos);
      const proximos: ErrosDe<V> = {};
      for (const chave of Object.keys(atuais) as (keyof V)[]) {
        if (revalidados[chave]) proximos[chave] = revalidados[chave];
      }
      return proximos;
    });
  }

  function validarTudo(): boolean {
    const encontrados = validar(valores);
    setErros(encontrados);
    const primeiro = Object.keys(encontrados)[0];
    if (primeiro) document.getElementById(primeiro)?.focus();
    return !primeiro;
  }

  function reiniciar() {
    setValores(inicial);
    setErros({});
  }

  return { valores, erros, alterar, validarTudo, reiniciar };
}
