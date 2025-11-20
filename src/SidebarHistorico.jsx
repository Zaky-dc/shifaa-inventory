import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { MdDelete, MdHistory } from "react-icons/md"; // Adicionei ícones novos

const API_URL = "https://shifaa-inventory-backend.vercel.app/api";

export default function SidebarHistorico({ isOpen, setIsOpen, onSelecionarData }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistorico();
    }
  }, [isOpen]);

  const fetchHistorico = async () => {
    setLoading(true);
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

  // FUNÇÃO PARA APAGAR
  const handleDelete = async (e, itemData, itemArmazem) => {
    // stopPropagation evita que ao clicar no lixo, o sistema "abra" a contagem ao mesmo tempo
    e.stopPropagation(); 

    const confirmacao = window.confirm(
        `TEM A CERTEZA?\n\nVai apagar permanentemente a contagem:\nFicheiro: ${itemArmazem}\nData: ${itemData}`
    );

    if (!confirmacao) return;

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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header da Sidebar */}
        <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shadow-md">
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

        {/* Lista com Scroll */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
               Nenhum histórico encontrado.
            </div>
          ) : (
            <ul className="space-y-3">
              {registros.map((reg, index) => (
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
        <div className="p-4 border-t border-gray-200 bg-white text-xs text-center text-gray-400">
            Clique num item para carregar
        </div>
      </div>
    </>
  );
}
