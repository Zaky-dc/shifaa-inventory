import { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoIosClose } from 'react-icons/io';

const SidebarHistorico = ({ onSelecionarData }) => {
  const [datas, setDatas] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  const apagarData = (item) => {
    if (confirm(`Apagar contagens de ${item.data} (${item.armazem})?`)) {
      fetch(`${API_URL}/contagem/${item.data}`, { method: "DELETE" })
        .then(res => res.json())
        .then(msg => {
          alert(msg.message);
          setDatas(datas.filter(d => d.data !== item.data));
        })
        .catch(err => {
          console.error("Erro ao apagar:", err);
          alert("Erro ao apagar contagem.");
        });
    }
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen z-10 transition-all duration-300 ${isOpen ? "w-64" : "w-16"} bg-white/80 backdrop-blur-md border-r shadow-md`}>
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-lg font-bold text-blue-700">📁 Arquivos Recentes</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl text-gray-700">
          {isOpen ? <IoIosClose /> : <GiHamburgerMenu />}
        </button>
      </div>

      <ul className="space-y-4 px-4 overflow-y-auto">
        {datas.map((item, index) => (
          <li key={index} className="border-b pb-2">
            <button
              onClick={() => onSelecionarData(item.data)}
              className="text-left w-full"
            >
              <div className="text-sm font-semibold text-gray-800">
                {isOpen ? item.armazem : "🏬"}
              </div>
              <div className="text-xs text-blue-600 hover:underline flex items-center justify-between">
                {isOpen ? item.data : "📅"}
                {isOpen && (
                  <MdDelete
                    onClick={(e) => {
                      e.stopPropagation();
                      apagarData(item);
                    }}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                  />
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;





