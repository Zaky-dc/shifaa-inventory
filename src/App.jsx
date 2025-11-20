import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { GiHamburgerMenu } from "react-icons/gi"; 
import SidebarHistorico from "./SidebarHistorico";

export default function App() {
    const [produtos, setProdutos] = useState([]);
    const [contagem, setContagem] = useState({});
    const [armazem, setArmazem] = useState(""); 
    const [busca, setBusca] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 

    // 1. NOVO ESTADO PARA O FILTRO
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
                    codigo: String(
                      item.Cod ?? item.Código ?? item.COD ?? item.codigo ?? item.Codigo ?? ""
                        ).trim(),
                    nome: String(
                      item.Desc ?? item.Descrição ?? item.desc ?? item.nome ?? item.Nome ?? ""
                        ).trim(),
                    sistema: Number(item.sis ?? item.SIS ?? item.Sistema ?? item.sistema ?? 0) || 0,
                }));

                setProdutos(json.filter((p) => p.codigo));
                setContagem({});
            } catch (err) {
                console.error("Erro ao ler ficheiro:", err);
                alert("Formato do ficheiro inválido. Verifique o .xlsx.");
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleContagemChange = (codigo, value) => {
        setContagem((prev) => ({ ...prev, [codigo]: value }));
    };

    const salvarContagem = async () => {
        if (!armazem) return alert("Carregue um ficheiro para definir o nome do arquivo antes de salvar.");
        if (produtos.length === 0) return alert("Não há produtos carregados.");
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
            alert(data.message || "Contagem registrada com sucesso!");
            setProdutos([]);
            setContagem({});
            setArmazem(""); 
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar contagem.");
        } finally{
          setIsLoading(false); 
        }
    };

    const exportarParaExcel = () => {
        if (!produtos.length) return alert("Nenhum dado para exportar.");

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
            `contagem_${armazem || "geral"}_${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // 2. LÓGICA DE FILTRAGEM ATUALIZADA
    const produtosFiltrados = produtos.filter((p) => {
        // Filtro de Texto (Busca)
        const matchTexto = `${p.codigo} ${p.nome}`.toLowerCase().includes(busca.toLowerCase());

        // Preparar valores para filtros lógicos
        const valorRealInput = contagem[p.codigo];
        const real = Number(valorRealInput) || 0;
        const diferenca = real - p.sistema;
        const foiContado = valorRealInput !== undefined && valorRealInput !== "";

        // Filtro de Status
        let matchStatus = true;
        if (filtroStatus === "diferencas") {
            matchStatus = diferenca !== 0;
        } else if (filtroStatus === "sobras") {
            matchStatus = diferenca > 0;
        } else if (filtroStatus === "perdas") {
            matchStatus = diferenca < 0;
        } else if (filtroStatus === "pendentes") {
            matchStatus = !foiContado; // Mostra o que ainda não foi digitado
        } else if (filtroStatus === "iguais") {
            matchStatus = diferenca === 0 && foiContado;
        }

        return matchTexto && matchStatus;
    });

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-800">
            {isLoading && (
                <div className="fixed inset-0 bg-gray-100/70 flex flex-col items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-blue-600 font-semibold">Carregando contagem...</p>
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
                            if (!dados || dados.length === 0)
                                return alert("Nenhuma contagem encontrada para este arquivo.");
                            const produtosSalvos = dados.map((it) => ({
                                codigo: it.codigo,
                                nome: it.nome,
                                sistema: it.sistema,
                            }));
                            const cont = {};
                            dados.forEach((it) => (cont[it.codigo] = it.real));
                            setProdutos(produtosSalvos);
                            setContagem(cont);
                            setArmazem(dados[0].armazem || "");
                        })
                        .catch((err) => {
                            console.error(err);
                            alert("Erro ao carregar contagem.");
                        }).finally(()=>{
                            setIsLoading(false);
                        });
                }}
            />

            <main className="flex-1 p-2 md:ml-64">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 rounded-lg bg-white shadow border mr-3"
                            >
                                <GiHamburgerMenu size={20} />
                            </button>

                            <div>
                                <h1 className="text-2xl font-semibold text-sky-700">Contagem Online</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Importe um ficheiro .xlsx e faça a contagem rápida.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={exportarParaExcel}
                                className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95 transition"
                            >
                                Exportar XLSX
                            </button>

                            <button
                                onClick={salvarContagem}
                                className="bg-sky-600 text-white px-4 py-2 rounded-lg shadow hover:brightness-95 transition"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border">
                                <label className="block text-sm font-medium text-gray-700">
                                    Importar ficheiro (.xlsx)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  O ficheiro deve conter os cabeçalhos <strong>Codigo</strong>, <strong>Descricao</strong> e <strong>Sistema</strong>.
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileUpload}
                                    className="mt-2 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                                />
                                
                                {armazem && (
                                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                                        Ficheiro atual: <strong>{armazem}</strong>
                                    </div>
                                )}

                                {produtos.length > 0 && (
                                    <div className="mt-6">
                                        {/* 3. ÁREA DE FILTROS VISUAIS */}
                                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                            <input
                                                type="search"
                                                value={busca}
                                                onChange={(e) => setBusca(e.target.value)}
                                                placeholder="🔍 Buscar código/nome..."
                                                className="flex-1 px-4 py-2 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-sky-300"
                                            />
                                            
                                            <select 
                                                value={filtroStatus}
                                                onChange={(e) => setFiltroStatus(e.target.value)}
                                                className="px-4 py-2 rounded-xl border bg-white focus:ring-2 focus:ring-sky-300 cursor-pointer"
                                            >
                                                <option value="todos">📋 Todos</option>
                                                <option value="pendentes">⏳ Pendentes (Não contados)</option>
                                                <option value="diferencas">⚠️ Com Diferença</option>
                                                <option value="sobras">📈 Sobras (Positivo)</option>
                                                <option value="perdas">📉 Perdas (Negativo)</option>
                                                <option value="iguais">✅ Batendo (Zero Dif.)</option>
                                            </select>
                                        </div>

                                        <div className="mt-4 overflow-auto rounded-md border max-h-[600px]">
                                            <table className="min-w-full text-sm relative">
                                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                                    <tr className="text-left text-gray-600">
                                                        <th className="px-3 py-3 border bg-gray-50">Código</th>
                                                        <th className="px-3 py-3 border bg-gray-50">Descrição</th>
                                                        <th className="px-3 py-3 border bg-gray-50 text-center w-20">Sis.</th>
                                                        <th className="px-3 py-3 border bg-gray-50 text-center w-24">Real</th>
                                                        <th className="px-3 py-3 border bg-gray-50 text-center w-20">Dif.</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produtosFiltrados.map((p, i) => {
                                                        const real = Number(contagem[p.codigo]) || '';
                                                        const diff = (Number(real) || 0) - (Number(p.sistema) || 0);
                                                        
                                                        // Cor da linha baseada na diferença
                                                        let diffClass = "text-gray-700";
                                                        if(diff > 0) diffClass = "text-green-600 font-bold bg-green-50";
                                                        if(diff < 0) diffClass = "text-red-600 font-bold bg-red-50";

                                                        return (
                                                            <tr key={p.codigo || i} className={`transition hover:bg-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                                <td className="px-3 py-2 border align-middle font-medium">{p.codigo}</td>
                                                                <td className="px-3 py-2 border">{p.nome}</td>
                                                                <td className="px-3 py-2 border text-center">{p.sistema}</td>
                                                                <td className="px-3 py-2 border text-center">
                                                                    <input
                                                                        type="number"
                                                                        value={real}
                                                                        onChange={(e) => handleContagemChange(p.codigo, e.target.value)}
                                                                        className="w-full px-2 py-1 text-center border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                                                                        placeholder="-"
                                                                    />
                                                                </td>
                                                                <td className={`px-3 py-2 border text-center ${diffClass}`}>
                                                                    {diff > 0 ? `+${diff}` : diff}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {produtosFiltrados.length === 0 && (
                                                <div className="p-8 text-center text-gray-500">
                                                    Nenhum produto encontrado com este filtro.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {produtos.length === 0 && (
                                    <div className="mt-6 text-center text-gray-500 italic">
                                        Carregue um ficheiro `.xlsx` ou selecione uma data no
                                        histórico à esquerda.
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="space-y-6">
                            <div className="bg-white p-4 rounded-xl shadow-sm border text-sm text-gray-600">
                                <div className="font-semibold mb-2">Dicas rápidas</div>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use os filtros para achar erros rápidos.</li>
                                    <li>"Pendentes" mostra o que falta contar.</li>
                                    <li>Exporte para XLSX antes de sair.</li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
