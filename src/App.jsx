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

  // 1. STATE DA SIDEBAR (Começa aberto se for tela grande, fechado se for pequena)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
      if (typeof window !== 'undefined') {
          return window.innerWidth >= 768; // 768px é o padrão 'md' do Tailwind
      }
      return false;
  });

  // Ajusta sidebar automaticamente se redimensionar a janela (opcional, mas bom para UX)
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth >= 768) {
             // Opcional: Se quiseres que force a abertura ao aumentar a tela
             // setIsSidebarOpen(true); 
          } else {
             setIsSidebarOpen(false);
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Converte para número apenas na hora de salvar/calcular
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
    
    const valorInput = contagem[p.codigo]; // Pega o valor bruto (string ou undefined)
    // Se for undefined ou vazio, conta como 0 para o cálculo da diferença
    const realNumerico = (valorInput === undefined || valorInput === "") ? 0 : Number(valorInput);
    const diferenca = realNumerico - p.sistema;
    
    // Verifica se foi contado (tem algo digitado, inclusive "0")
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
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-all">
          <FaSpinner className="animate-spin text-5xl text-indigo-600 mb-4" />
          <p className="text-indigo-800 font-bold tracking-wide animate-pulse text-lg">
            A processar dados...
          </p>
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
              // Ao carregar do banco, garantimos que o zero venha como número ou string
              dados.forEach((it) => (cont[it.codigo] = it.real));
              setContagem(cont);
              setArmazem(dados[0].armazem || "");
            })
            .catch((err) => alert("Erro ao carregar."))
            .finally(() => setIsLoading(false));
        }}
      />

      {/* Main Content - Margem dinâmica baseada na Sidebar */}
      <main 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden 
        ${isSidebarOpen ? 'md:ml-72' : 'md:ml-0'}`} 
      >
        
        <header className="bg-white shadow-md shrink-0 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Botão Toggle Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition active:scale-95"
            >
              <GiHamburgerMenu size={22} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight leading-tight">Inventário</h1>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:block">Shifaa Inventory</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportarParaExcel}
              className="hidden sm:flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 transition text-xs md:text-sm font-medium uppercase"
            >
              <MdFileDownload size={18} /> <span>Excel</span>
            </button>
            <button
              onClick={salvarContagem}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg shadow hover:bg-indigo-700 transition active:scale-95 text-xs md:text-sm font-medium uppercase"
            >
              <MdSave size={18} /> <span>Salvar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 w-full">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              
              <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                 <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium text-sm w-full md:w-auto justify-center active:scale-95">
                      <MdCloudUpload size={20} />
                      <span>Carregar .XLSX</span>
                      <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
                    </label>
                    
                    {armazem && (
                      <span className="w-full md:w-auto text-center px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold uppercase rounded-full truncate">
                        {armazem}
                      </span>
                    )}
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
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full md:w-auto px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      >
                        <option value="todos">Todos</option>
                        <option value="pendentes">Pendentes</option>
                        <option value="diferencas">Com Diferença</option>
                        <option value="sobras">Sobras (+)</option>
                        <option value="perdas">Perdas (-)</option>
                        <option value="iguais">Batendo (OK)</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-inner relative">
                    <div className="overflow-auto max-h-[55vh] md:max-h-[600px]"> 
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-3 py-3 font-bold whitespace-nowrap bg-gray-50">Cód.</th>
                            <th className="px-3 py-3 font-bold whitespace-nowrap bg-gray-50 min-w-[150px]">Descrição</th>
                            <th className="px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Sis.</th>
                            <th className="px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Real</th>
                            <th className="px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Dif.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {produtosFiltrados.map((p, i) => {
                            
                            // 2. CORREÇÃO DO ZERO:
                            // Pegamos o valor do estado. Se for undefined, retorna vazio "". 
                            // Se for "0" (string) ou 0 (número), retorna ele mesmo.
                            const valorNoInput = contagem[p.codigo] !== undefined ? contagem[p.codigo] : "";
                            
                            // Para a matemática, convertemos. Se for vazio, conta como 0.
                            const realNumerico = valorNoInput === "" ? 0 : Number(valorNoInput);
                            
                            const diff = realNumerico - (Number(p.sistema) || 0);
                            
                            let rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50/50";
                            let diffColor = "text-gray-400";
                            let diffBg = "";

                            // Só colore se tiver algo digitado (ou carregado)
                            if (valorNoInput !== "") {
                               if (diff > 0) { diffColor = "text-green-600 font-bold"; diffBg = "bg-green-50"; }
                               else if (diff < 0) { diffColor = "text-red-600 font-bold"; diffBg = "bg-red-50"; }
                               else { diffColor = "text-gray-300"; diffBg = "bg-gray-50"; }
                            }

                            return (
                              <tr key={p.codigo} className={`${rowBg} hover:bg-indigo-50/40 transition duration-150`}>
                                <td className="px-3 py-2 font-medium text-gray-700 text-xs md:text-sm align-middle">{p.codigo}</td>
                                <td className="px-3 py-2 text-gray-600 text-xs md:text-sm align-middle max-w-[120px] md:max-w-none truncate md:whitespace-normal" title={p.nome}>
                                  {p.nome}
                                </td>
                                <td className="px-2 py-2 text-center font-semibold text-gray-500 align-middle">{p.sistema}</td>
                                <td className="px-2 py-2 text-center align-middle">
                                  <input
                                    type="number"
                                    value={valorNoInput} // Aqui usa a variável tratada
                                    onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                    className="w-16 text-center p-1 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white outline-none font-medium text-sm"
                                    placeholder="-"
                                  />
                                </td>
                                <td className={`px-2 py-2 text-center align-middle ${diffBg}`}>
                                  <span className={`${diffColor} text-xs md:text-sm`}>{diff > 0 ? `+${diff}` : diff}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {produtosFiltrados.length === 0 && (
                      <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-b-lg text-sm">
                         <p>Nada encontrado.</p>
                      </div>
                  )}
                </div>
              ) : (
                <div className="p-8 md:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-300 mb-3">
                     <MdCloudUpload size={28} />
                  </div>
                  <h3 className="text-base font-medium text-gray-900">Nenhum ficheiro</h3>
                  <p className="text-gray-500 mt-1 text-sm">Carregue um ficheiro Excel para começar.</p>
                </div>
              )}
            </div>

            <footer className="mt-4 pb-4 text-center md:text-right border-t border-gray-200 pt-4">
                <div className="text-xs md:text-sm text-gray-500 flex flex-col md:flex-row items-center justify-center md:justify-end gap-1">
                    <span>Desenvolvido por</span>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Zakir Abdul Magide
                    </span>
                    <span className="hidden md:inline">-</span>
                    <span>Todos os direitos reservados.</span>
                </div>
            </footer>

          </div>
        </div>
      </main>
    </div>
  );
}
