import { useEffect, useState } from 'react';

const ArmazemSelector = ({ armazem, setArmazem }) => {
  const [armazens, setArmazens] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/armazens`)
      .then(res => res.json())
      .then(setArmazens)
      .catch(err => console.error('Erro ao carregar armazéns:', err));
  }, []);

  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-gray-700">🏬 Selecionar Armazém</label>
      <select
        value={armazem}
        onChange={(e) => setArmazem(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      >
        <option value="">Escolha um armazém</option>
        {armazens.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
};

export default ArmazemSelector;
