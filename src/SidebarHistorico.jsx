import { useEffect, useState } from 'react';

const SidebarHistorico = ({ onSelecionarData }) => {
  const [datas, setDatas] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/datas`)
      .then(res => res.json())
      .then(setDatas)
      .catch(err => console.error('Erro ao carregar datas:', err));
  }, []);

  return (
    <aside className="w-64 bg-gray-100 p-4 border-r">
      <h2 className="text-lg font-bold mb-4">📅 Histórico de Contagens</h2>
      <ul className="space-y-2">
        {datas.map(data => (
          <li key={data}>
            <button
              onClick={() => onSelecionarData(data)}
              className="text-blue-600 hover:underline"
            >
              {data}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;
