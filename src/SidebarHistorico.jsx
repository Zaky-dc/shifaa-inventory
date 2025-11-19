import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";

// O API_URL é o mesmo do App.jsx (ou você pode passá-lo como prop)
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
        // O endpoint /api/datas retorna [{ data: 'YYYY-MM-DD', armazem: 'NOME_DO_FICHEIRO' }]
        const response = await fetch(`${API_URL}/datas`); 
        const data = await response.json();
        setRegistros(data);
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        alert("Não foi possível carregar o histórico.");
    } finally {
        setLoading(false);
    }
  };

  // Função chamada ao clicar num item do histórico
  const handleSelect = (data, armazem) => {
    onSelecionarData(data, armazem); // Passa ambos os identificadores para App.jsx
    setIsOpen(false); // Fecha a sidebar após a seleção
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:w-64 w-full max-w-xs bg-white shadow-xl flex flex-col`}
    >
      <div className="p-4 border-b flex justify-between items-center bg-sky-600 text-white">
        <h2 className="text-xl font-semibold">Histórico de Contagens</h2>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-sky-700 transition">
          <AiOutlineClose size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-gray-500 italic">A carregar...</p>
        ) : registros.length === 0 ? (
          <p className="text-gray-500 italic">Nenhum histórico encontrado.</p>
        ) : (
          <ul className="space-y-2">
            {registros.map((reg, index) => (
              // Usa o par (data e armazem) como chave única
              <li key={`${reg.data}-${reg.armazem}-${index}`}>
                <button
                  onClick={() => handleSelect(reg.data, reg.armazem)} // Passa ambos os valores!
                  className="w-full text-left p-3 rounded-lg bg-gray-100 hover:bg-sky-100 transition duration-150 border border-gray-200"
                >
                  <span className="block font-semibold text-gray-800">
                        {reg.armazem} 
                  </span>
                  <span className="block text-sm text-gray-500">
                        {new Date(reg.data).toLocaleDateString()}
                    </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
