import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SidebarHistorico from './SidebarHistorico';
import ArmazemSelector from './ArmazemSelector';
import { GiHamburgerMenu } from 'react-icons/gi';

export default function App() {
  const [sidebarAberto, setSidebarAberto] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState('');
  const [busca, setBusca] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://shifaa-inventory-backend.onrender.com';

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet).map((item) => ({
          codigo: String(item.Cod ?? item.Código ?? item.COD ?? item.codigo ?? '').trim(),
          nome: String(item.Desc ?? item.Descrição ?? item.Desc ?? item.nome ?? '').trim(),
          sistema: Number(item.sis ?? item.SIS ?? 0) || 0,
        }));

        setProdutos(json.filter(p => p.codigo));
        setContagem({});
      } catch (err) {
        console.error('Erro ao ler ficheiro:', err);
        alert('Formato do ficheiro inválido. Verifique o .xlsx.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleContagemChange = (codigo, value) => {
    setContagem((prev) => ({ ...prev, [codigo]: value }));
  };

  const salvarContagem = async () => {
    if (!armazem) return alert('Selecione um armazém antes de salvar.');
    if (produtos.length === 0) return alert('Não há produtos carregados.');

    const hoje = new Date().toISOString().split('T')[0];
    const payload = produtos.map((p) => {
      const real = Number(contagem[p.codigo]) || 0;
      return {
        codigo: p.codigo,
        nome: p.nome,
        sistema: p.sistema,
        real,
        diferenca: real - p.sistema,
        data: hoje,
        armazem,
      };
    });

    try {
      const res = await fetch(`${API_URL}/contagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      alert(data.message || 'Contagem registrada com sucesso!');
      setProdutos([]);
      setContagem({});
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar contagem.');
    }
  };

  const exportarParaExcel = () => {
    if (!produtos.length) return alert('Nenhum dado para exportar.');

    const dados = produtos.map((p) => ({
      Código: p.codigo,
      Descrição: p.nome,
      Sistema: p.sistema,
      Real: Number(contagem[p.codigo]) || 0,
      Diferença: (Number(contagem[p.codigo]) || 0) - p.sistema,
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contagem');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `contagem_${armazem || 'geral'}.xlsx`);
  };

  const produtosFiltrados = produtos.filter((p) =>
    (`${p.codigo} ${p.nome}`).toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div
      className={`
        flex min-h-screen bg-gray-50 text-gray-800 transition-all duration-300
        ${sidebarAberto ? 'pl-64' : 'pl-16'}
        max-sm:pl-0
      `}
    >
      {/* SIDEBAR */}
      <SidebarHistorico 
        sidebarAberto={sidebarAberto}
        setSidebarAberto={setSidebarAberto}
        onSelecionarData={(d, a) => {
          fetch(`${API_URL}/contagem/${d}`)
            .then(r => r.json())
            .then((dados) => {
              if (!dados || dados.length === 0) return alert('Nenhuma contagem encontrada nessa data.');
              const produtosSalvos = dados.map(it => ({ codigo: it.codigo, nome: it.nome, sistema: it.sistema }));
              const cont = {};
              dados.forEach(it => (cont[it.codigo] = it.real));
              setProdutos(produtosSalvos);
              setContagem(cont);
              setArmazem(dados[0].armazem || '');
            })
            .catch(err => { console.error(err); alert('Erro ao carregar contagem.'); });
        }}
      />

      {/* HEADER MOBILE */}
      <header className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow z-40 flex items-center px-4">
        <button
          onClick={() => setSidebarAberto(true)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <GiHamburgerMenu />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-sky-700">Contagem de Inventário</h1>
      </header>

      {/* OVERLAY MOBILE */}
      {sidebarAberto && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 sm:hidden"
          onClick={() => setSidebarAberto(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 pt-20 sm:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* HEADER + BOTÕES */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-sky-700">📦 Contagem de Inventário</h1>
              <p className="text-sm text-gray-500 mt-1">Importe um ficheiro .xlsx e faça a contagem rápida.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportarParaExcel}
                className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95 transition"
                aria-label="Exportar para Excel"
              >
                Exportar XLSX
              </button>

              <button
                onClick={salvarContagem}
                className="bg-sky-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95 transition"
                aria-label="Salvar contagem"
              >
                Salvar
              </button>
            </div>
          </div>

          {/* GRID DE CONTEÚDO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TABELA */}
            <div className="lg:col-span-2">
              <div className="bg-white p-5 rounded-2xl shadow-sm border">
                <label className="block text-sm font-medium text-gray-700">Importar ficheiro (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="mt-2 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />

                {produtos.length > 0 ? (
                  <>
                    <input
                      type="search"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="🔍 Buscar por código ou descrição"
                      className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-sky-300 mt-6"
                    />

                    <div className="mt-4 overflow-auto rounded-md border">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white sticky top-0 z-10">
                          <tr className="text-left text-gray-600">
                            <th className="px-3 py-3 border">Código</th>
                            <th className="px-3 py-3 border">Descrição</th>
                            <th className="px-3 py-3 border text-center">Sistema</th>
                            <th className="px-3 py-3 border text-center">Real</th>
                            <th className="px-3 py-3 border text-center">Diferença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtosFiltrados.map((p, i) => {
                            const real = Number(contagem[p.codigo]) || '';
                            const diff = (Number(real) || 0) - (Number(p.sistema) || 0);
                            return (
                              <tr key={p.codigo || i} className={`transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                <td className="px-3 py-3 border align-middle font-medium">{p.codigo}</td>
                                <td className="px-3 py-3 border">{p.nome}</td>
                                <td className="px-3 py-3 border text-center">{p.sistema}</td>
                                <td className="px-3 py-3 border text-center">
                                  <input
                                    type="number"
                                    value={real}
                                    onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                    className="w-20 px-2 py-1 text-center border rounded-md"
                                  />
                                </td>
                                <td className={`px-3 py-3 border text-center font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                  {diff}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 text-center text-gray-500 italic">📁 Carregue um ficheiro `.xlsx` ou selecione uma data no histórico à esquerda.</div>
                )}
              </div>
            </div>

            {/* ASIDE */}
            <aside className="space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border">
                <ArmazemSelector armazem={armazem} setArmazem={setArmazem} />
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border text-sm text-gray-600">
                <div className="font-semibold mb-2">Dicas rápidas</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use a busca para filtrar rapidamente.</li>
                  <li>Exporte para XLSX antes de fechar o dia.</li>
                  <li>As diferenças são destacadas em cores.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

}



