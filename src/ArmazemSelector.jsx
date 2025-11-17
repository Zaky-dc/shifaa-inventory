import React, { useEffect, useState } from 'react';

export default function ArmazemSelector({ armazem, setArmazem }) {
  const [armazens, setArmazens] = useState([]);
  const [novoArmazem, setNovoArmazem] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'https://shifaa-inventory-backend.onrender.com';

  useEffect(() => {
    fetch(`${API_URL}/armazens`)
      .then(r => r.json())
      .then(data => setArmazens(Array.isArray(data) ? data : []))
      .catch(err => console.error('Erro ao carregar armazéns:', err));
  }, []);

  const criarArmazem = async () => {
    const nome = novoArmazem.trim();
    if (!nome) return alert('Digite um nome válido para o armazém.');

    try {
      const res = await fetch(`${API_URL}/armazens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      const data = await res.json();
      alert(data.message || 'Armazém criado com sucesso!');
      setArmazens(prev => [...prev, nome]);
      setArmazem(nome);
      setNovoArmazem('');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar armazém.');
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700">🏬 Selecionar Armazém</label>
      <select
        value={armazem}
        onChange={e => setArmazem(e.target.value)}
        className="mt-2 w-full border px-3 py-2 rounded-md bg-white text-sm"
      >
        <option value="">Escolha um armazém</option>
        {armazens.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>

      <div className="mt-3 flex gap-2 flex-col sm:flex-row">
        <input
          type="text"
          value={novoArmazem}
          onChange={e => setNovoArmazem(e.target.value)}
          placeholder="Novo armazém..."
          className="flex-1 border px-3 py-2 rounded-md text-sm"
        />
        <button
          onClick={criarArmazem}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}

