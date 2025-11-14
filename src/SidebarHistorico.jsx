import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoIosClose } from "react-icons/io";
import { MdDelete } from "react-icons/md";

const SidebarHistorico = ({ onSelecionarData, datas, apagarData }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`transition-all duration-300 bg-gray-50 border-r h-screen shadow-md ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-lg font-bold text-blue-600">📅 Histórico</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="text-2xl text-gray-700">
          {isOpen ? <IoIosClose /> : <GiHamburgerMenu />}
        </button>
      </div>

      <ul className="space-y-2 px-4 overflow-y-auto">
        {datas.map((data) => (
          <li key={data} className="flex justify-between items-center">
            <button
              onClick={() => onSelecionarData(data)}
              className="text-blue-600 hover:underline text-sm flex items-center gap-2"
            >
              📅 {isOpen ? data : ""}
            </button>
            {isOpen && (
              <button
                onClick={() => apagarData(data)}
                className="text-red-500 hover:text-red-700"
              >
                <MdDelete />
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SidebarHistorico;






