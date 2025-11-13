import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import SidebarHistorico from './SidebarHistorico';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

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
    <div className="flex h-screen">
      <SidebarHistorico onSelecionarData={carregarContagemPorData} />

      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">📦 Contagem de Inventário</h1>

        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="mb-6 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {produtos.length === 0 && (
          <div className="text-gray-500 mb-6">
            📁 Carregue um ficheiro `.xlsx` ou selecione uma data no histórico.
          </div>
        )}

        {produtos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border text-left">Código</th>
                  <th className="px-4 py-2 border text-left">Descrição</th>
                  <th className="px-4 py-2 border text-center">Sistema</th>
                  <th className="px-4 py-2 border text-center">Real</th>
                  <th className="px-4 py-2 border text-center">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => {
                  const real = Number(contagem[p.codigo]) || 0;
                  const diferenca = real - p.sistema;
                  const destaque = diferenca !== 0 ? 'bg-yellow-100' : '';

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
                          className="w-20 px-2 py-1 border rounded text-center"
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
      </main>
    </div>
  );
}

export default App;



