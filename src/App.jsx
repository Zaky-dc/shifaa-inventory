import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { GiHamburgerMenu } from "react-icons/gi";
import SidebarHistorico from "./SidebarHistorico";
import { MdCloudUpload, MdSave, MdFileDownload, MdSearch } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState("");
  const [busca, setBusca] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const API_URL = "https://shifaa-inventory-backend.vercel.app/api";

  // Função de ordenação AZ
  const ordenarAZ = (lista) => {
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setArmazem(fileName);
    
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const json = XLSX.utils.sheet_to_json(sheet).map((item) => {
          // Log para debug (pode remover depois) - ajuda a ver como o Excel está a ler as colunas
          // console.log("Colunas lidas:", Object.keys(item));

          return {
            // Mapeamento exato para "Cód." e variações
            codigo: String(
              item["Cód."] ?? item["Cod."] ?? item.Cod ?? item.Cód ?? item.Código ?? item.codigo ?? ""
            ).trim(),

            // Mapeamento exato para "Descrição" e variações
            nome: String(
              item["Descrição"] ?? item.Descricao ?? item.Desc ?? item.desc ?? item.nome ?? ""
            ).trim(),

            // Mapeamento exato para "Sis." e variações
            sistema: Number(
              item["Sis."] ?? item.Sis ?? item.SIS ?? item.Sistema ?? item.sistema ?? 0
            ) || 0,
          };
        });

        // Filtra apenas os que têm código e ordena de A a Z
        const filtradosEOrdenados = ordenarAZ(json.filter((p) => p.codigo !== ""));
        
        if (filtradosEOrdenados.length === 0) {
          alert("Aviso: Nenhum dado foi extraído. Verifique se os cabeçalhos do Excel são: Cód., Descrição, Sis.");
        }

        setProdutos(filtradosEOrdenados);
        setContagem({});
      } catch (err) {
        console.error("Erro na leitura:", err);
        alert("Erro ao ler o ficheiro.");
      } finally {
        setIsLoading(false);
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
      const valorDigitado = contagem[p.codigo];
      const real = (valorDigitado === "" || valorDigitado === undefined) ? 0 : Number(valorDigitado);
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
    const dados = produtos.map((p) => {
        const valorDigitado = contagem[p.codigo];
        const real = (valorDigitado === "" || valorDigitado === undefined) ? 0 : Number(valorDigitado);
        return {
            Código: p.codigo,
            Descrição: p.nome,
            Sistema: p.sistema,
            Real: real,
            Diferença: real - p.sistema,
        };
    });
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
    const valorInput = contagem[p.codigo];
    const realNumerico = (valorInput === undefined || valorInput === "") ? 0 : Number(valorInput);
    const diferenca = realNumerico - p.sistema;
    const foiContado = valorInput !== undefined && valorInput !== "";

    let matchStatus = true;
    if (filtroStatus === "diferencas") matchStatus = diferenca !== 0;
    else if (filtroStatus === "sobras") matchStatus = diferenca > 0;
    else if (filtroStatus === "perdas") matchStatus = diferenca < 0;
    else if (filtroStatus === "pendentes") matchStatus = !foiContado;
    else if (filtroStatus === "iguais") matchStatus = diferenca === 0 && foiContado;

    return matchTexto && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800 overflow-x-hidden">
      {isLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
          <p className="text-indigo-800 font-bold tracking-wide animate-pulse">A processar dados...</p>
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
              const listaTratada = dados.map((it) => ({ 
                codigo: it.codigo, 
                nome: it.nome, 
                sistema: it.sistema 
              }));
              setProdutos(ordenarAZ(listaTratada));
              const cont = {};
              dados.forEach((it) => (cont[it.codigo] = it.real));
              setContagem(cont);
              setArmazem(dados[0].armazem || "");
            })
            .catch(() => alert("Erro ao carregar."))
            .finally(() => setIsLoading(false));
        }}
      />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'md:ml-0'}`}>
        <header className="bg-white shadow-md px-4 py-3 md:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
              <GiHamburgerMenu size={22} />
            </button>
            <h1 className="text-lg md:text-xl font-bold">Inventário</h1>
          </div>
          
          <div className="flex gap-2">
            <button onClick={exportarParaExcel} className="hidden sm:flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium uppercase shadow">
              <MdFileDownload size={18} /> <span>Excel</span>
            </button>
            <button onClick={salvarContagem} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium uppercase shadow">
              <MdSave size={18} /> <span>Salvar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 w-full">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 md:p-6 bg-gray-50 border-b">
                 <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* ALTERADO: accept=".xlsx, .xls" e o MIME type para Excel antigo */}
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition font-medium text-sm">
                      <MdCloudUpload size={20} />
                      <span>Carregar Excel (.xlsx / .xls)</span>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                    {armazem && <span className="text-xs font-bold uppercase bg-indigo-100 px-3 py-1 rounded-full">{armazem}</span>}
                 </div>
              </div>

              {produtos.length > 0 ? (
                <div className="p-3 md:p-6">
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border bg-white outline-none"
                    >
                        <option value="todos">Todos (A-Z)</option>
                        <option value="pendentes">Pendentes</option>
                        <option value="diferencas">Com Diferença</option>
                    </select>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-auto max-h-[60vh]"> 
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-3 font-bold">Cód.</th>
                            <th className="px-3 py-3 font-bold">Descrição</th>
                            <th className="px-2 py-3 text-center font-bold">Sis.</th>
                            <th className="px-2 py-3 text-center font-bold">Real</th>
                            <th className="px-2 py-3 text-center font-bold">Dif.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {produtosFiltrados.map((p, i) => {
                            const valorNoInput = contagem[p.codigo] !== undefined ? contagem[p.codigo] : "";
                            const realNumerico = valorNoInput === "" ? 0 : Number(valorNoInput);
                            const diff = realNumerico - p.sistema;
                            
                            const diffColor = valorNoInput !== "" ? (diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400") : "text-gray-400";

                            return (
                              <tr key={p.codigo} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50/50`}>
                                <td className="px-3 py-2 text-xs md:text-sm">{p.codigo}</td>
                                <td className="px-3 py-2 text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{p.nome}</td>
                                <td className="px-2 py-2 text-center font-semibold">{p.sistema}</td>
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    value={valorNoInput}
                                    onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                    className="w-16 text-center border rounded text-sm p-1"
                                    placeholder="-"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center font-bold">
                                  <span className={diffColor}>{diff > 0 ? `+${diff}` : diff}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <MdCloudUpload size={40} className="mx-auto mb-2 opacity-20" />
                  <p>Carregue um ficheiro .xlsx ou .xls para começar.</p>
                </div>
              )}
            </div>
            
            <footer className="mt-4 text-center text-xs text-gray-400">
               Desenvolvido por <span className="text-indigo-600 font-bold">Zakir Abdul Magide</span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
