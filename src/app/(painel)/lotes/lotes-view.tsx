"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAlertas } from "@/components/layout/alertas-provider";
import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/monitoramento/kpi-card";
import { LinhasLotes } from "@/components/monitoramento/tabela-lotes";
import { buscarLotes, buscarResumo } from "@/lib/api/nodered";
import { CONFIG } from "@/lib/config";
import { usePolling } from "@/hooks/use-polling";

export function LotesView() {
  const [pagina, setPagina] = useState(1);
  const buscarPagina = useCallback(async () => {
    const [lista, dados] = await Promise.all([buscarLotes(pagina), buscarResumo()]);
    return { lista, resumo: dados.resumo };
  }, [pagina]);

  const { dados, erro, atualizadoEm } = usePolling(buscarPagina);
  const alertas = useAlertas() ?? [];
  const lista = dados?.lista;
  const paginaAtual = lista?.pagina ?? pagina;

  return (
    <>
      <Topbar atualizadoEm={atualizadoEm} />
      <main className="page">
        <div className="page-head">
          <h2>Lotes Monitorados</h2>
          <Link className="btn-outline" href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar ao dashboard
          </Link>
        </div>

        <section className="kpis duas">
          {dados && (
            <>
              <KpiCard
                rotulo="Lotes monitorados"
                valor={dados.resumo.lotes}
                nota={`${dados.resumo.uva} uva · ${dados.resumo.manga} manga`}
              />
              <KpiCard
                rotulo="Alertas abertos"
                valor={alertas.length}
                nota={alertas.length > 0 ? `${alertas.length} requer atenção` : "tudo em ordem"}
              />
            </>
          )}
        </section>

        <section className="card">
          <div className="table-scroll">
            <table className="table grande">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Fruta</th>
                  <th>Status</th>
                  <th>Última leitura</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {erro && !dados ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      Não foi possível falar com o Node-RED em {CONFIG.noderedUrl}.
                    </td>
                  </tr>
                ) : (
                  <LinhasLotes lotes={lista?.lotes ?? []} comSeta alertas={alertas} />
                )}
              </tbody>
            </table>
          </div>
        </section>

        {lista && (
          <nav className="paginacao" aria-label="Paginação">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={paginaAtual === 1}
              onClick={() => setPagina(paginaAtual - 1)}
            >
              &lt;
            </button>
            {Array.from({ length: lista.paginas }, (_, i) => i + 1).map((p) => (
              <button
                type="button"
                key={p}
                className={p === paginaAtual ? "ativo" : ""}
                aria-current={p === paginaAtual ? "page" : undefined}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              aria-label="Próxima página"
              disabled={paginaAtual === lista.paginas}
              onClick={() => setPagina(paginaAtual + 1)}
            >
              &gt;
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
