import { useEffect, useState } from 'react';

const ArmazemSelector = ({ armazem, setArmazem }) => {
  const [armazens, setArmazens] = useState([]);
  const [novoArmazem, setNovoArmazem] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "https://shifaa-inventory-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/armazens`)
      .then(res => res.json())
      .then(setArmazens)
      .catch(err => console.error('Erro ao carregar armazéns:', err));
  }, []);

  const criarArmazem = () => {
    if (!novoArmazem.trim()) {
      alert("Digite um nome válido para o armazém.");
      return;
    }

    fetch(`${API_URL}/armazens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoArmazem.trim() }),
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        setArmazens([...armazens, novoArmazem.trim()]);
        setArmazem(novoArmazem.trim());
        setNovoArmazem("");
      })
      .catch(err => {
        console.error("Erro ao criar armazém:", err);
        alert("Erro ao criar armazém.");
      });
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 font-semibold text-gray-700">🏬 Selecionar Armazém</label>
      <select
        value={armazem}
        onChange={(e) => setArmazem(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-2"
      >
        <option value="">Escolha um armazém</option>
        {armazens.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>

      <div className="flex space-x-2">
        <input
          type="text"
          value={novoArmazem}
          onChange={(e) => setNovoArmazem(e.target.value)}
          placeholder="Novo armazém..."
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={criarArmazem}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
};

export default ArmazemSelector;
