import React, { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoIosClose } from 'react-icons/io';

export default function SidebarHistorico({ onSelecionarData, sidebarAberto, setSidebarAberto })
 {
  const [datas, setDatas] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'https://shifaa-inventory-backend.onrender.com';

  useEffect(() => {
    fetch(`${API_URL}/datas`)
      .then((r) => r.json())
      .then(setDatas)
      .catch((err) => console.error('Erro ao carregar datas:', err));
  }, []);

  const apagarData = async (item) => {
    const ok = confirm(`Apagar contagens de ${item.data} (${item.armazem})?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/contagem/${item.data}`, { method: 'DELETE' });
      const msg = await res.json();
      alert(msg.message || 'Apagado');
      setDatas((prev) => prev.filter((d) => d.data !== item.data));
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar.');
    }
  };

  return (
   <aside
  className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 
  ${sidebarAberto ? 'w-64' : 'w-16'}
  bg-white/60 backdrop-blur-sm border-r shadow-lg`}
>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md w-10 h-10 bg-sky-600 text-white flex items-center justify-center font-bold">SI</div>
          {isOpen && <div>
            <div className="text-sm font-semibold text-sky-700">Arquivos</div>
            <div className="text-xs text-gray-500">Últimas contagens</div>
          </div>}
        </div>
       <button
  onClick={() => setSidebarAberto(!sidebarAberto)}
  className="p-2 rounded hover:bg-gray-100"
>
  {sidebarAberto ? <IoIosClose size={20} /> : <GiHamburgerMenu size={18} />}
</button>

      </div>

      <div className="px-3 pt-2 overflow-auto h-[calc(100vh-80px)]">
        {datas.length === 0 && <div className="text-sm text-gray-500 p-3">Nenhum arquivo salvo.</div>}

        <ul className="space-y-3">
          {datas.map((item, i) => (
            <li key={i} className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition">
              <button
                className="w-full text-left flex items-center justify-between gap-2"
                onClick={() => onSelecionarData(item.data, item.armazem)}
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.armazem}</div>
                  <div className="text-xs text-gray-500">{item.data}</div>
                </div>
                <div className="flex items-center gap-2">
                  <MdDelete onClick={(e) => { e.stopPropagation(); apagarData(item); }} className="text-red-500 hover:text-red-700 cursor-pointer" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}
