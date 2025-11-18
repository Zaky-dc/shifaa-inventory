import React, { useEffect, useState } from 'react';

export default function ArmazemSelector({ armazem, setArmazem }) {
  const [armazens, setArmazens] = useState([]);
  const [novoArmazem, setNovoArmazem] = useState('');
  const [mensagem, setMensagem] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'https://shifaa-inventory-backend.vercel.app/api';

  useEffect(() => {
    fetch(`${API_URL}/armazens`)
      .then((r) => r.json())
      .then((data) => setArmazens(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Erro ao carregar o nome do ficheiro:', err));
  }, []);

  const criarArmazem = async () => {
    const nome = novoArmazem.trim();
    if (!nome) {
      setMensagem('Digite um nome válido para o ficheiro.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/armazens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      const data = await res.json();
      setMensagem(data.message || 'Ficheiro criado com sucesso!');
      setArmazens((prev) => [...prev, nome]);
      setArmazem(nome);
      setNovoArmazem('');
    } catch (err) {
      console.error(err);
      setMensagem('Erro ao criar ficheiro.');
    }

    // Limpa mensagem após alguns segundos
    setTimeout(() => setMensagem(''), 4000);
  };

  return (
    <div className="">
     <label className="block text-sm font-semibold text-gray-700">Atribuir Nome ao Ficheiro</label>
      <select value={armazem} onChange={(e) => setArmazem(e.target.value)} className="mt-2 w-full border px-3 py-2 rounded-md bg-white text-sm">
        <option value="">Escolher Ficheiro Anterior</option>
        {armazens.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={novoArmazem}
          onChange={(e) => setNovoArmazem(e.target.value)}
          placeholder="Novo Ficheiro..."
          className="flex-1 border px-3 py-2 rounded-md text-sm"
        />
        <button onClick={criarArmazem} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 transition">+ Adicionar</button>
      </div>

      {mensagem && (
        <div className="mt-2 text-xs sm:text-sm text-emerald-600">{mensagem}</div>
      )}

      {/* Lista opcional de armazéns */}
      {armazens.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-gray-600">
          {armazens.map((a, i) => (
            <li key={i} className="px-2 py-1 rounded bg-gray-50">{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

