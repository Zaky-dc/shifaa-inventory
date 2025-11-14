import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import SidebarHistorico from './SidebarHistorico';
import ArmazemSelector from './ArmazemSelector';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState("");
  const [datas, setDatas] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet).map((item) => ({
        codigo: item.Cod,
        nome: item.Desc,
        sistema: Number(item.sis) || 0,
      }));
      setProdutos(json);
      setContagem({});
    };
    reader.readAsArrayBuffer(file);
  };

  const handleContagemChange = (codigo, value) => {
    setContagem({ ...contagem, [codigo]: value });
  };

  const salvarContagem = () => {
    if (!armazem) {
      alert("Selecione um armazém antes de salvar.");
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const resultado = produtos.map((p) => {
      const real = Number(contagem[p.codigo]) || 0;
      const diferenca = real - p.sistema;
      return {
        codigo: p.codigo,
        nome: p.nome,
        sistema: p.sistema,
        real,
        diferenca,
        data: hoje,
        armazem,
      };
    });

    fetch(`${API_URL}/contagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultado),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || 'Contagem registrada com sucesso!');
        setProdutos([]);
        setContagem({});
      })
      .catch((err) => {
        console.error(err);
        alert('Erro ao salvar contagem.');
      });
  };

  const carregarContagemPorData = (data) => {
    fetch(`${API_URL}/contagem/${data}`)
      .then(res => res.json())
      .then(setProdutos)
      .catch(err => console.error('Erro ao carregar contagem:', err));
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
      <SidebarHistorico datas={datas} onSelecionarData={carregarContagemPorData} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            📦 Sistema de Inventário
          </h1>

          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="mb-6 block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-100 file:text-cyan-800 hover:file:bg-cyan-200"
          />

          <ArmazemSelector armazem={armazem} setArmazem={setArmazem} />

          {produtos.length === 0 && (
            <div className="text-gray-300 mb-6 italic">
              📁 Carregue um ficheiro `.xlsx` ou selecione uma data no histórico.
            </div>
          )}

          {produtos.length > 0 && (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="min-w-full border border-gray-300 rounded-lg shadow-sm text-sm">
                <thead className="bg-gray-100 text-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border text-left">Código</th>
                    <th className="px-4 py-2 border text-left">Descrição</th>
                    <th className="px-4 py-2 border text-center">Sistema</th>
                    <th className="px-4 py-2 border text-center">Contagem</th>
                    <th className="px-4 py-2 border text-center">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => {
                    const real = Number(contagem[p.codigo]) || 0;
                    const diferenca = real - p.sistema;
                    const destaque = diferenca !== 0 ? 'bg-yellow-100 text-black' : '';

                    return (
                      <tr key={i} className={`hover:bg-gray-50 ${destaque}`}>
                        <td className="px-4 py-2 border">{p.codigo}</td>
                        <td className="px-4 py-2 border">{p.nome}</td>
                        <td className="px-4 py-2 border text-center">{p.sistema}</td>
                        <td className="px-4 py-2 border text-center">
                          <input
                            type="number"
                            value={contagem[p.codigo] || ''}
                            onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                            className="w-20 px-2 py-1 border rounded text-center text-black"
                          />
                        </td>
                        <td className="px-4 py-2 border text-center font-semibold">
                          {diferenca}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                onClick={salvarContagem}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Salvar Contagem
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;




