import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosClose } from "react-icons/io";

const SidebarHistorico = ({ onSelecionarData, datas }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`transition-all duration-300 bg-gray-100 border-r h-screen ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-lg font-bold">📅 Histórico</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl">
          {isOpen ? <IoIosClose /> : <GiHamburgerMenu />}
        </button>
      </div>

      <ul className="space-y-2 px-4 overflow-y-auto">
        {datas.map((data) => (
          <li key={data}>
            <button
              onClick={() => onSelecionarData(data)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isOpen ? data : "📅"}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;



