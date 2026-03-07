import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { GiHamburgerMenu } from "react-icons/gi";
import SidebarHistorico from "./SidebarHistorico";
import { MdCloudUpload, MdSave, MdFileDownload, MdSearch, MdPictureAsPdf, MdLogout } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import { MOCK_ARMAZEM, MOCK_DATA, MOCK_HISTORICO, MOCK_PRODUTOS, MOCK_CONTAGEM } from "./mockData";

export default function App() {
  const { mode, logout } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [contagem, setContagem] = useState({});
  const [armazem, setArmazem] = useState("");
  const [busca, setBusca] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataSelecionada, setDataSelecionada] = useState("");

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

  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.vercel.app/api";

  if (!mode) {
    return <LoginPage />;
  }

  // Função de ordenação AZ
  const ordenarAZ = (lista) => {
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));
  };

  const handleFileUpload = (e) => {
    if (mode === "guest") return alert("Modo Convidado: Upload de ficheiros desativado.");
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
          return {
            // Mapeamento para Código
            codigo: String(
              item["Cód."] ?? item["Cod."] ?? item.Cod ?? item.Cód ?? item.Código ?? item.codigo ?? ""
            ).trim(),

            // Mapeamento para Descrição
            nome: String(
              item["Descrição"] ?? item.Descricao ?? item.Desc ?? item.desc ?? item.nome ?? item.Nome ?? ""
            ).trim(),

            // Mapeamento para Sistema (Incluindo "Existência")
            sistema: Number(
              item["Sis."] ??
              item["Existência"] ??
              item.Existencia ??
              item.Sis ??
              item.Sistema ??
              item.sistema ?? 0
            ) || 0,
          };
        });

        // Filtra apenas os que têm código preenchido e ordena de A a Z
        const filtradosEOrdenados = ordenarAZ(json.filter((p) => p.codigo !== ""));

        if (filtradosEOrdenados.length === 0) {
          alert("Aviso: Nenhum dado foi extraído. Verifique se as colunas estão corretas (Cód., Descrição, Sis./Existência).");
        }

        setProdutos(filtradosEOrdenados);
        setContagem({});
        setDataSelecionada(new Date().toISOString().split("T")[0]);
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
    if (mode === "guest") return alert("Modo Convidado: Gravação na base de dados desativada.");
    if (!armazem) return alert("Defina o nome do arquivo antes de salvar.");
    if (produtos.length === 0) return alert("Sem produtos.");
    setIsLoading(true);
    const hoje = dataSelecionada || new Date().toISOString().split("T")[0];
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

    if (payload.length === 0) {
      setIsLoading(false);
      return alert("Nenhum produto foi contado. Digite pelo menos um valor antes de salvar.");
    }
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

  const exportarParaPDFZakat = () => {
    if (!produtos.length) return alert("Sem dados para exportar.");

    const doc = new jsPDF();
    const dataFormatada = new Date().toLocaleDateString("pt-MZ");

    doc.setFontSize(16);
    doc.text(`Relatório de Zakat - Setor: ${armazem || "Geral"}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${dataFormatada}`, 14, 26);

    let totalGlobal = 0;
    const dadosTabela = produtos.map(p => {
      const v = contagem[p.codigo];
      const real = (v === "" || v === undefined) ? 0 : Number(v);

      if (real === 0) return null;

      const preco = p.preco || 0;
      const totalItem = real * preco;
      totalGlobal += totalItem;

      return [
        p.codigo,
        p.nome.substring(0, 45) + (p.nome.length > 45 ? "..." : ""),
        real,
        preco.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" }),
        totalItem.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
      ];
    }).filter(Boolean); // remove nulos (onde real === 0)

    if (dadosTabela.length === 0) {
      return alert("Nenhum item com contagem REAL maior que zero encontrado para o relatório.");
    }

    doc.autoTable({
      startY: 32,
      head: [['Cód.', 'Descrição', 'Quant. (Real)', 'Preço Unit.', 'Valor Total']],
      body: dadosTabela,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      }
    });

    const finalY = doc.lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Valor Total do Setor (Zakat): ${totalGlobal.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}`, 14, finalY + 10);

    doc.save(`Zakat_${armazem || "Geral"}_${dataFormatada.replace(/\//g, "-")}.pdf`);
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

          if (mode === "guest") {
            // Mock Data Flow
            setTimeout(() => {
              setProdutos(MOCK_PRODUTOS);
              setContagem(MOCK_CONTAGEM);
              setArmazem(a || MOCK_ARMAZEM);
              setDataSelecionada(d);
              setIsLoading(false);
            }, 600);
            return;
          }

          fetch(`${API_URL}/contagem?data=${d}&armazem=${a}`)
            .then((r) => r.json())
            .then((dados) => {
              if (!dados || dados.length === 0) return alert("Vazio.");
              const listaTratada = dados.map((it) => ({
                codigo: it.codigo,
                nome: it.nome,
                sistema: it.sistema,
                preco: it.preco || 0
              }));
              setProdutos(ordenarAZ(listaTratada));
              const cont = {};
              dados.forEach((it) => (cont[it.codigo] = it.real));
              setContagem(cont);
              setArmazem(dados[0].armazem || "");
              setDataSelecionada(d);
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
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold leading-tight">Inventário</h1>
                {mode === "guest" && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200 shadow-sm animate-pulse">
                    CONVIDADO
                  </span>
                )}
              </div>
              {dataSelecionada && (
                <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                  Edição: {dataSelecionada === new Date().toISOString().split("T")[0] ? "Hoje" : new Date(dataSelecionada).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={logout} title="Terminar Sessão" className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 w-9 h-9 md:w-auto md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition active:scale-95">
              <MdLogout size={18} /> <span className="hidden md:inline md:ml-2">Sair</span>
            </button>
            <button onClick={exportarParaPDFZakat} className="hidden sm:flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium uppercase shadow active:scale-95 transition">
              <MdPictureAsPdf size={18} /> <span>PDF Zakat</span>
            </button>
            <button onClick={exportarParaExcel} className="hidden sm:flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium uppercase shadow active:scale-95 transition">
              <MdFileDownload size={18} /> <span>Excel</span>
            </button>
            <button onClick={salvarContagem} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-medium uppercase shadow active:scale-95 transition">
              <MdSave size={18} /> <span>Salvar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 w-full">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-3 md:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Botão de Upload bloqueado no modo convidado */}
                    <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 border ${mode === 'guest' ? 'border-gray-200 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed' : 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95'} rounded-lg transition font-medium text-sm w-full md:w-auto justify-center`}>
                      <MdCloudUpload size={20} />
                      <span>{mode === 'guest' ? 'Upload Desativado' : 'Carregar Excel (.xlsx / .xls)'}</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={mode === 'guest'}
                      />
                    </label>
                  </div>
                  {armazem && <span className="w-full md:w-auto text-center px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold uppercase rounded-full truncate">{armazem}</span>}
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
                        <option value="todos">Todos (A-Z)</option>
                        <option value="pendentes">Pendentes</option>
                        <option value="diferencas">Com Diferença</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-inner relative">
                    <div className="overflow-auto max-h-[55vh] md:max-h-[600px]">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-2 md:px-3 py-3 font-bold whitespace-nowrap bg-gray-50">Cód.</th>
                            <th className="px-2 md:px-3 py-3 font-bold whitespace-nowrap bg-gray-50 max-w-[150px] md:min-w-[150px]">Descrição</th>
                            <th className="px-1 md:px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Sis.</th>
                            <th className="px-1 md:px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Real</th>
                            <th className="px-1 md:px-2 py-3 text-center font-bold whitespace-nowrap bg-gray-50">Dif.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {produtosFiltrados.map((p, i) => {
                            const valorNoInput = contagem[p.codigo] !== undefined ? contagem[p.codigo] : "";
                            const realNumerico = valorNoInput === "" ? 0 : Number(valorNoInput);
                            const diff = realNumerico - p.sistema;

                            const diffColor = valorNoInput !== "" ? (diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400") : "text-gray-400";

                            return (
                              <tr key={p.codigo} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50/40 transition duration-150`}>
                                <td className="px-3 py-2 font-medium text-gray-700 text-xs md:text-sm align-middle">{p.codigo}</td>
                                <td className="px-3 py-2 text-gray-600 text-xs md:text-sm align-middle max-w-[120px] md:max-w-none truncate md:whitespace-normal">{p.nome}</td>
                                <td className="px-2 py-2 text-center font-semibold text-gray-500 align-middle">{p.sistema}</td>
                                <td className="px-2 py-2 text-center align-middle">
                                  <input
                                    type="number"
                                    value={valorNoInput}
                                    onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                    className="w-14 md:w-16 text-center border rounded text-sm p-2 md:p-1 focus:ring-2 focus:ring-indigo-400 outline-none"
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
                <div className="p-8 md:p-12 text-center">

                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-300 mb-3">

                    <MdCloudUpload size={28} />

                  </div>

                  <h3 className="text-base font-medium text-gray-900">Nenhum ficheiro</h3>

                  <p className="text-gray-500 mt-1 text-sm">Carregue um ficheiro Excel para começar.</p>

                </div>

              )}

            </div>

            <footer className="mt-4 pb-4 border-t border-gray-200 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* ZAKAT SUMMARY PANEL */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-3 rounded-xl shadow-sm flex items-center gap-4 w-full md:w-auto">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-0.5">Valor Total Existente (Zakat)</p>
                  <p className="text-lg md:text-xl font-extrabold text-emerald-900">
                    {produtosFiltrados.reduce((total, p) => {
                      const v = contagem[p.codigo];
                      const real = (v === "" || v === undefined) ? 0 : Number(v);
                      return total + (real * (p.preco || 0));
                    }, 0).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </p>
                </div>
              </div>

              <div className="text-xs md:text-sm text-gray-500 flex flex-col items-center md:items-end justify-center gap-1">
                <span className="flex items-center gap-1 text-gray-600 font-medium">
                  {produtosFiltrados.filter(p => {
                    const v = contagem[p.codigo];
                    return (v !== "" && v !== undefined) && Number(v) > 0;
                  }).length} itens valiosos computados
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span>Desenvolvido por</span>
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Zakir Abdul Magide
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
