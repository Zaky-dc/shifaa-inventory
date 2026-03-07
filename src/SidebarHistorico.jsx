import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { MdDelete, MdHistory, MdCloudUpload } from "react-icons/md";
import { useAuth } from "./AuthContext";
import { MOCK_HISTORICO } from "./mockData";

const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.vercel.app/api";

export default function SidebarHistorico({ isOpen, setIsOpen, onSelecionarData }) {
  const { mode } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrecos, setLoadingPrecos] = useState(false);
  const [buscaHistorico, setBuscaHistorico] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchHistorico();
    }
  }, [isOpen]);

  const fetchHistorico = async () => {
    setLoading(true);

    if (mode === "guest") {
      setTimeout(() => {
        setRegistros(MOCK_HISTORICO);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/datas`);
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (data, armazem) => {
    onSelecionarData(data, armazem);
    setIsOpen(false);
  };

  const handleUploadPrecos = (e) => {
    if (mode === "guest") return alert("Modo Convidado: Envio de preçário desativado.");
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingPrecos(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet).map((item) => {
          return {
            codigo: String(item["Cód."] ?? item["Cod."] ?? item.Cod ?? item.Cód ?? item.Código ?? item.codigo ?? "").trim(),
            preco: Number(item["Preço"] ?? item["Preco"] ?? item.preco ?? item.Preço_Unitario ?? 0) || 0,
          };
        }).filter(p => p.codigo !== "" && p.preco > 0);

        if (json.length === 0) {
          alert("Nenhum preço válido encontrado (verifique se as colunas são 'Código' e 'Preço').");
          return;
        }

        const res = await fetch(`${API_URL}/precos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        const dataRes = await res.json();
        if (res.ok) alert(dataRes.message + ` (${dataRes.totalInjetados} itens)`);
        else alert(dataRes.message || "Erro a atualizar preços.");

      } catch (err) {
        console.error(err);
        alert("Erro ao ler o ficheiro de preços.");
      } finally {
        setLoadingPrecos(false);
        e.target.value = null; // reset input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // FUNÇÃO PARA APAGAR
  const handleDelete = async (e, itemData, itemArmazem) => {
    // stopPropagation evita que ao clicar no lixo, o sistema "abra" a contagem ao mesmo tempo
    e.stopPropagation();
    if (mode === "guest") return alert("Modo Convidado: Remoção de dados da base de dados bloqueada.");

    if (!window.confirm(`Tem certeza que deseja APAGAR os dados de ${itemArmazem} do dia ${itemData}? Esta ação é irreversível.`)) return;

    try {
      // Chama o endpoint DELETE passando data e armazem
      const res = await fetch(`${API_URL}/contagem/${itemData}?armazem=${encodeURIComponent(itemArmazem)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove o item da lista visualmente sem precisar recarregar tudo
        setRegistros((prev) =>
          prev.filter((reg) => !(reg.data === itemData && reg.armazem === itemArmazem))
        );
        alert("Contagem apagada com sucesso.");
      } else {
        const err = await res.json();
        alert(err.message || "Erro ao apagar.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de conexão.");
    }
  };

  const registrosFiltrados = registros.filter(reg =>
    reg.armazem.toLowerCase().includes(buscaHistorico.toLowerCase()) ||
    new Date(reg.data).toLocaleDateString().includes(buscaHistorico)
  );

  return (
    <>
      {/* Overlay Escuro (para clicar fora e fechar) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header da Sidebar */}
        <div className="p-5 bg-indigo-600 text-white flex flex-col gap-4 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MdHistory size={24} />
              <h2 className="text-lg font-bold tracking-wide">Histórico</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition"
            >
              <AiOutlineClose size={20} />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar setor..."
              value={buscaHistorico}
              onChange={(e) => setBuscaHistorico(e.target.value)}
              className="w-full pl-3 pr-3 py-2 text-sm text-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Lista com Scroll */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum histórico encontrado.
            </div>
          ) : (
            <ul className="space-y-3">
              {registrosFiltrados.map((reg, index) => (
                <li key={`${reg.data}-${reg.armazem}-${index}`} className="group relative">

                  {/* Cartão do Histórico */}
                  <div
                    onClick={() => handleSelect(reg.data, reg.armazem)}
                    className="cursor-pointer bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group-hover:translate-x-1"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">
                          {reg.armazem}
                        </span>
                        <span className="block text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded inline-block">
                          📅 {new Date(reg.data).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Botão de Apagar (aparece ao passar o mouse ou sempre no mobile) */}
                      <button
                        onClick={(e) => handleDelete(e, reg.data, reg.armazem)}
                        className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors z-10"
                        title="Apagar este registo"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-2 relative">
          <label className={`cursor-pointer flex items-center justify-center gap-2 p-2 w-full text-xs font-bold text-white rounded shadow-sm transition ${mode === 'guest' ? 'bg-gray-400 opacity-60 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 active:scale-95'}`}>
            {loadingPrecos ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <MdCloudUpload size={16} />
                <span>{mode === 'guest' ? 'ZAKAT DESATIVADO' : 'ATUALIZAR TABELA ZAKAT'}</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleUploadPrecos}
              className="hidden"
              disabled={mode === 'guest'}
            />
          </label>
          <div className="text-[10px] text-center text-gray-400">
            Faz upload Excel com colunas "Cód." e "Preço"
          </div>
        </div>
      </div>
    </>
  );
}
