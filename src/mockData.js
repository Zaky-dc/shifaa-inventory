// Dados Fictícios para o modo de Convidado (Guest Mode)
// Estes dados são completamente inventados e não correspondem a nenhum produto real.

export const MOCK_ARMAZEM = "Demo - Farmácia Central";
export const MOCK_DATA = "2026-02-20";

export const MOCK_PRODUTOS = [
    { codigo: "MED-001", nome: "Amoxicilina 500mg (Cápsulas)", sistema: 120, preco: 85 },
    { codigo: "MED-002", nome: "Ibuprofeno 400mg (Comprimidos)", sistema: 250, preco: 45 },
    { codigo: "MED-003", nome: "Paracetamol 1g (Comprimidos)", sistema: 400, preco: 22 },
    { codigo: "MED-004", nome: "Metronidazol 500mg (Comprimidos)", sistema: 80, preco: 62 },
    { codigo: "MED-005", nome: "Ciprofloxacina 500mg (Comprimidos)", sistema: 60, preco: 130 },
    { codigo: "MED-006", nome: "Ringer Lactato 500ml (Saco)", sistema: 45, preco: 320 },
    { codigo: "MED-007", nome: "Cloreto de Sódio 0.9% 500ml", sistema: 70, preco: 280 },
    { codigo: "MED-008", nome: "Glucosada 5% 500ml (Saco)", sistema: 30, preco: 350 },
    { codigo: "MED-009", nome: "Morfina 10mg/ml Injetável", sistema: 15, preco: 980 },
    { codigo: "MED-010", nome: "Insulina Regular 100UI/ml", sistema: 25, preco: 1200 },
    { codigo: "SUR-001", nome: "Luvas Cirúrgicas (par) - Tamanho 7.5", sistema: 300, preco: 35 },
    { codigo: "SUR-002", nome: "Seringa 5ml com Agulha", sistema: 500, preco: 12 },
    { codigo: "SUR-003", nome: "Catéter IV 20G", sistema: 150, preco: 55 },
    { codigo: "SUR-004", nome: "Máscara Cirúrgica (caixa 50un)", sistema: 20, preco: 450 },
    { codigo: "SUR-005", nome: "Compressas Esterilizadas 10x10cm", sistema: 200, preco: 28 },
];

export const MOCK_CONTAGEM = {
    "MED-001": 118,
    "MED-002": 247,
    "MED-003": 405,
    "MED-004": 79,
    "MED-005": 58,
    "MED-006": 43,
    "MED-007": 72,
    "MED-008": 28,
    "MED-009": 14,
    "MED-010": 23,
    "SUR-001": 298,
    "SUR-002": 512,
    "SUR-003": 148,
    "SUR-004": 18,
    "SUR-005": 203,
};

export const MOCK_HISTORICO = [
    {
        data: "2026-02-20",
        armazem: "Demo - Farmácia Central",
        totalItens: 15,
    },
    {
        data: "2026-02-13",
        armazem: "Demo - Bloco Operatório",
        totalItens: 22,
    },
    {
        data: "2026-02-06",
        armazem: "Demo - Urgência",
        totalItens: 8,
    },
    {
        data: "2026-01-30",
        armazem: "Demo - Medicina Interna",
        totalItens: 18,
    },
    {
        data: "2026-01-23",
        armazem: "Demo - Pediatria",
        totalItens: 12,
    },
];
