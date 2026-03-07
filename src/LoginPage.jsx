import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { MdAdminPanelSettings, MdLockOutline, MdOutlinePersonSearch } from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';

export default function LoginPage() {
    const { loginAdmin, loginGuest } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [guestError, setGuestError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdminSubmit = (e) => {
        e.preventDefault();
        if (!password.trim()) return;

        setLoading(true);
        setGuestError('');
        // Simulate slight network delay for premium feel
        setTimeout(() => {
            const isValid = loginAdmin(password);
            if (!isValid) {
                setError("Palavra-passe incorreta.");
            }
            setLoading(false);
        }, 600);
    };

    const handleGuestClick = () => {
        setError('');
        const result = loginGuest();
        if (!result.success && result.alreadyUsed) {
            setGuestError("Lamentamos, mas a sessão de visitante já foi utilizada neste dispositivo para evitar saturar o servidor de testes. Por favor, solicite a palavra-passe do Administrador.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">

                {/* Background decorative blob */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-indigo-50 opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-teal-50 opacity-50"></div>

                <div className="relative z-10">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
                        <MdAdminPanelSettings className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                        Gestão Shifaa
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Plataforma de Inventário e Zakat
                    </p>
                </div>

                <form className="mt-8 space-y-6 relative z-10" onSubmit={handleAdminSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="password" className="sr-only">Palavra-passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLockOutline className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                                    placeholder="Palavra-passe de Administração"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-70 shadow-md"
                        >
                            {loading ? (
                                <FaSpinner className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                "Entrar como Administrador"
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500 font-medium">Ou</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGuestClick}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg shadow-sm bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95"
                        >
                            <MdOutlinePersonSearch className="h-5 w-5 text-gray-500" />
                            Entrar como Visitante / Convidado
                        </button>

                        {guestError && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs text-center font-medium shadow-sm">
                                {guestError}
                            </div>
                        )}

                        <p className="mt-4 text-xs text-center text-gray-400 leading-relaxed max-w-xs mx-auto">
                            O modo visitante utiliza dados simulados para proteger as contagens reais do hospital. Permitido apenas um teste por dispositivo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
