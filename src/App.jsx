import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SidebarHistorico from './SidebarHistorico';
import ArmazemSelector from './ArmazemSelector';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState("");
  const [datas, setDatas] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  // Carregar datas do histórico
  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  // Upload de XLSX
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

  // Alterar contagem manual
  const handleContagemChange = (codigo, value) => {
    setContagem({ ...contagem, [codigo]: value });
  };

  // Salvar contagem no backend
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

  // Carregar contagem por data
  const carregarContagemPorData = (data, armazemFiltro = "") => {
    const url = armazemFiltro
      ? `${API_URL}/contagem?armazem=${encodeURIComponent(armazemFiltro)}`
      : `${API_URL}/contagem/${data}`;

    fetch(url)
      .then(res => res.json())
      .then(setProdutos)
      .catch(err => console.error('Erro ao carregar contagem:', err));
  };

  // Exportar para XLSX
  const exportarParaExcel = () => {
    if (produtos.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(produtos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `inventario_${armazem || "geral"}.xlsx`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-gray-800">
      <SidebarHistorico datas={datas} onSelecionarData={carregarContagemPorData} />

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-blue-600">📦 Sistema de Inventário</h1>

          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="mb-4 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <ArmazemSelector armazem={armazem} setArmazem={setArmazem} />

          {produtos.length === 0 && (
            <div className="text-gray-500 mb-4 italic">
              📁 Carregue um ficheiro `.xlsx` ou selecione uma data no histórico.
            </div>
          )}

          {produtos.length > 0 && (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border rounded shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 border text-left">Código</th>
                    <th className="px-2 py-1 border text-left">Descrição</th>
                    <th className="px-2 py-1 border text-center">Sistema</th>
                    <th className="px-2 py-1 border text-center">Contagem</th>
                    <th className="px-2 py-1 border text-center">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p, i) => {
                    const real = Number(contagem[p.codigo]) || 0;
                    const diferenca = real - p.sistema;
                    const destaque = diferenca !== 0 ? 'bg-yellow-100 text-red-600' : '';

                    return (
                      <tr key={i} className={`hover:bg-gray-50 ${destaque}`}>
                        <td className="px-2 py-1 border">{p.codigo}</td>
                        <td className="px-2 py-1 border">{p.nome}</td>
                        <td className="px-2 py-1 border text-center">{p.sistema}</td>
                        <td className="px-2 py-1 border text-center">
                          <input
                            type="number"
                            value={contagem[p.codigo] || ''}
                            onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-2 py-1 border text-center font-semibold">
                          {diferenca}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  onClick={salvarContagem}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Salvar Contagem
                </button>
                <button
                  onClick={exportarParaExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Exportar XLSX
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;





