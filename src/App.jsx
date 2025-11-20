import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { GiHamburgerMenu } from "react-icons/gi";
import SidebarHistorico from "./SidebarHistorico";
import { MdCloudUpload, MdSave, MdFileDownload, MdSearch } from "react-icons/md"; // Adicionei ícones do Material Design

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState("");
  const [busca, setBusca] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const API_URL = "https://shifaa-inventory-backend.vercel.app/api";

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setArmazem(fileName);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet).map((item) => ({
          codigo: String(item.Cod ?? item.Código ?? item.COD ?? item.codigo ?? item.Codigo ?? "").trim(),
          nome: String(item.Desc ?? item.Descrição ?? item.desc ?? item.nome ?? item.Nome ?? "").trim(),
          sistema: Number(item.sis ?? item.SIS ?? item.Sistema ?? item.sistema ?? 0) || 0,
        }));
        setProdutos(json.filter((p) => p.codigo));
        setContagem({});
      } catch (err) {
        console.error("Erro:", err);
        alert("Formato inválido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleContagemChange = (codigo, value) => {
    setContagem((prev) => ({ ...prev, [codigo]: value }));
  };

  const salvarContagem = async () => {
    if (!armazem) return alert("Defina o nome do arquivo antes de salvar.");
    if (produtos.length === 0) return alert("Sem produtos.");
    setIsLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      alert(data.message || "Sucesso!");
      setProdutos([]);
      setContagem({});
      setArmazem("");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportarParaExcel = () => {
    if (!produtos.length) return alert("Sem dados.");
    const dados = produtos.map((p) => ({
      Código: p.codigo,
      Descrição: p.nome,
      Sistema: p.sistema,
      Real: Number(contagem[p.codigo]) || 0,
      Diferença: (Number(contagem[p.codigo]) || 0) - p.sistema,
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contagem");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `contagem_${armazem || "geral"}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const produtosFiltrados = produtos.filter((p) => {
    const matchTexto = `${p.codigo} ${p.nome}`.toLowerCase().includes(busca.toLowerCase());
    const valorRealInput = contagem[p.codigo];
    const real = Number(valorRealInput) || 0;
    const diferenca = real - p.sistema;
    const foiContado = valorRealInput !== undefined && valorRealInput !== "";

    let matchStatus = true;
    if (filtroStatus === "diferencas") matchStatus = diferenca !== 0;
    else if (filtroStatus === "sobras") matchStatus = diferenca > 0;
    else if (filtroStatus === "perdas") matchStatus = diferenca < 0;
    else if (filtroStatus === "pendentes") matchStatus = !foiContado;
    else if (filtroStatus === "iguais") matchStatus = diferenca === 0 && foiContado;

    return matchTexto && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-all">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="mt-4 text-indigo-700 font-bold tracking-wide animate-pulse">A processar dados...</p>
        </div>
      )}

      <SidebarHistorico
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelecionarData={(d, a) => {
          setIsLoading(true);
          fetch(`${API_URL}/contagem?data=${d}&armazem=${a}`)
            .then((r) => r.json())
            .then((dados) => {
              if (!dados || dados.length === 0) return alert("Vazio.");
              setProdutos(dados.map((it) => ({ codigo: it.codigo, nome: it.nome, sistema: it.sistema })));
              const cont = {};
              dados.forEach((it) => (cont[it.codigo] = it.real));
              setContagem(cont);
              setArmazem(dados[0].armazem || "");
            })
            .catch((err) => alert("Erro ao carregar."))
            .finally(() => setIsLoading(false));
        }}
      />

      {/* Main Content - Layout Flex Column para empurrar o footer */}
      <main className="flex-1 flex flex-col md:ml-64 transition-all duration-300 ease-in-out">
        
        {/* Top App Bar - Material Style */}
        <header className="bg-white shadow-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition active:scale-95 ripple"
            >
              <GiHamburgerMenu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Inventário Inteligente</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Shifaa Inventory</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportarParaExcel}
              className="hidden sm:flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all active:scale-95 text-sm font-medium uppercase tracking-wide"
            >
              <MdFileDownload size={20} /> <span>Excel</span>
            </button>
            <button
              onClick={salvarContagem}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 text-sm font-medium uppercase tracking-wide"
            >
              <MdSave size={20} /> <span>Salvar</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
          
          {/* Card Principal */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            
            {/* Header do Card (Upload e Info) */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
               <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Carregar Ficheiro de Contagem
               </label>
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <label className="cursor-pointer flex items-center gap-3 px-4 py-2 border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium text-sm w-full md:w-auto justify-center">
                    <MdCloudUpload size={22} />
                    <span>Selecionar .XLSX</span>
                    <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
                  </label>
                  
                  {armazem && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold uppercase rounded-full shadow-sm">
                      📁 {armazem}
                    </span>
                  )}
               </div>
            </div>

            {/* Filtros e Tabela */}
            {produtos.length > 0 ? (
              <div className="p-6">
                
                {/* Barra de Ferramentas (Search + Filter) */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                    <input
                      type="search"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Filtrar por código ou nome..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full md:w-auto px-4 py-3 pr-8 rounded-lg border border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none shadow-sm cursor-pointer appearance-none font-medium text-gray-700"
                    >
                      <option value="todos">📋 Todos os Itens</option>
                      <option value="pendentes">⏳ Pendentes</option>
                      <option value="diferencas">⚠️ Com Diferenças</option>
                      <option value="sobras">📈 Sobras (+)</option>
                      <option value="perdas">📉 Perdas (-)</option>
                      <option value="iguais">✅ Batendo (OK)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                  </div>
                </div>

                {/* Tabela Estilizada */}
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-inner">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 font-bold tracking-wider">Código</th>
                          <th className="px-6 py-3 font-bold tracking-wider">Descrição</th>
                          <th className="px-4 py-3 text-center font-bold">Sistema</th>
                          <th className="px-4 py-3 text-center font-bold">Contagem</th>
                          <th className="px-4 py-3 text-center font-bold">Dif.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {produtosFiltrados.map((p, i) => {
                          const real = Number(contagem[p.codigo]) || "";
                          const diff = (Number(real) || 0) - (Number(p.sistema) || 0);
                          
                          // Estilização condicional
                          let rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50/50";
                          let diffColor = "text-gray-400 font-medium";
                          let diffBg = "";

                          if (real !== "") {
                             if (diff > 0) { diffColor = "text-green-600 font-bold"; diffBg = "bg-green-50"; }
                             else if (diff < 0) { diffColor = "text-red-600 font-bold"; diffBg = "bg-red-50"; }
                             else { diffColor = "text-gray-400"; diffBg = "bg-gray-100"; } // Igual
                          }

                          return (
                            <tr key={p.codigo} className={`${rowBg} hover:bg-indigo-50/40 transition duration-150`}>
                              <td className="px-6 py-3 font-medium text-gray-700">{p.codigo}</td>
                              <td className="px-6 py-3 text-gray-600">{p.nome}</td>
                              <td className="px-4 py-3 text-center font-semibold text-gray-500">{p.sistema}</td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={real}
                                  onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                  className="w-20 text-center p-2 border-b-2 border-gray-200 focus:border-indigo-500 bg-transparent outline-none transition-colors font-medium"
                                  placeholder="0"
                                />
                              </td>
                              <td className={`px-4 py-3 text-center ${diffBg}`}>
                                <span className={`${diffColor}`}>{diff > 0 ? `+${diff}` : diff}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {produtosFiltrados.length === 0 && (
                    <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-b-lg border-t border-gray-100">
                       <p>Nenhum item encontrado com estes critérios.</p>
                    </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-300 mb-4">
                   <MdCloudUpload size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhum ficheiro carregado</h3>
                <p className="text-gray-500 mt-1 max-w-sm mx-auto">Carregue um ficheiro Excel para começar a contagem ou selecione um histórico na barra lateral.</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER SOLICITADO */}
        <footer className="mt-auto border-t border-gray-200 bg-white py-6">
            <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                <div className="text-gray-500">
                    © {new Date().getFullYear()} Shifaa Inventory System.
                </div>
                <div className="text-gray-600 font-medium flex items-center gap-1">
                    Desenvolvido por 
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        Zakir Abdul Magide
                    </span>
                    - Todos os direitos reservados.
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
}
