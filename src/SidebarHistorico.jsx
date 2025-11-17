import { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { IoIosClose, IoIosArrowForward } from 'react-icons/io';

const SidebarHistorico = ({ onSelecionarData }) => {
  const [datas, setDatas] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  const apagarData = (data) => {
    if (confirm(`Apagar contagens de ${data.data} (${data.armazem})?`)) {
      fetch(`${API_URL}/contagem/${data.data}`, { method: "DELETE" })
        .then(res => res.json())
        .then(msg => {
          alert(msg.message);
          setDatas(datas.filter(d => d.data !== data.data));
        })
        .catch(err => {
          console.error("Erro ao apagar:", err);
          alert("Erro ao apagar contagem.");
        });
    }
  };

  return (
    <aside className="w-64 bg-gray-100 p-4 border-r overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-blue-700">📅 Histórico de Contagens</h2>
      <ul className="space-y-4">
        {datas.map((item, index) => (
          <li key={index} className="border-b pb-2">
            <button
              onClick={() => onSelecionarData(item.data)}
              className="text-left w-full"
            >
              <div className="text-sm font-semibold text-gray-800">{item.armazem}</div>
              <div className="text-xs text-blue-600 hover:underline flex items-center justify-between">
                {item.data}
                <MdDelete
                  onClick={(e) => {
                    e.stopPropagation();
                    apagarData(item);
                  }}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;





