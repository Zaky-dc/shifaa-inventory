import { useState, useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosClose } from "react-icons/io";

const SidebarHistorico = ({ onSelecionarData }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [datas, setDatas] = useState([]);
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  const apagarData = (data) => {
    if (confirm(`Apagar todas as contagens de ${data}?`)) {
      fetch(`${API_URL}/contagem/${data}`, { method: "DELETE" })
        .then(res => res.json())
        .then(msg => {
          alert(msg.message);
          setDatas(datas.filter(d => d !== data));
        })
        .catch(err => {
          console.error("Erro ao apagar:", err);
          alert("Erro ao apagar contagem.");
        });
    }
  };

  return (
    <aside className={`transition-all duration-300 bg-gray-100 text-black border-r h-screen ${isOpen ? "w-64" : "w-20"}`}>
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-lg font-bold">📅 Histórico</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl">
          {isOpen ? <IoIosClose /> : <GiHamburgerMenu />}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 mb-4">
          <input
            type="text"
            value={armazemFiltro}
            onChange={(e) => setArmazemFiltro(e.target.value)}
            placeholder="🔍 Filtrar por armazém"
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      )}

      <ul className="space-y-2 px-4 overflow-y-auto">
        {datas.map(data => (
          <li key={data} className="flex justify-between items-center">
            <button
              onClick={() => onSelecionarData(data, armazemFiltro)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isOpen ? data : "📅"}
            </button>
            {isOpen && (
              <button
                onClick={() => apagarData(data)}
                className="text-red-500 text-xs hover:underline"
              >
                🗑️
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;




