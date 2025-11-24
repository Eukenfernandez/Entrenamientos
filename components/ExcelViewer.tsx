
import React, { useEffect, useState } from 'react';
import { PlanFile } from '../types';
import { ChevronLeft, FileSpreadsheet, Download } from 'lucide-react';

interface ExcelViewerProps {
  plan: PlanFile;
  onBack: () => void;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ plan, onBack }) => {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExcel = async () => {
      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const ab = e.target?.result;
          // Fix: Cast window to any to access XLSX from CDN script which is not on the Window type
          const XLSX = (window as any).XLSX;
          if (XLSX) {
             const wb = XLSX.read(ab, { type: 'array' });
             const wsname = wb.SheetNames[0];
             const ws = wb.Sheets[wsname];
             const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
             setData(jsonData);
          } else {
             // Fallback if script didn't load
             console.error("SheetJS not loaded");
          }
          setLoading(false);
        };
        reader.readAsArrayBuffer(plan.file);
      } catch (error) {
        console.error("Error reading excel", error);
        setLoading(false);
      }
    };

    loadExcel();
  }, [plan]);

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
             <div className="bg-green-600/20 p-2 rounded-lg">
                <FileSpreadsheet className="text-green-500" size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">{plan.name}</h2>
                <p className="text-xs text-neutral-500 mt-1">Lectura Solamente</p>
             </div>
          </div>
        </div>
        
        {/* Fake Download/Action */}
        <button className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
           <Download size={20} />
        </button>
      </div>

      {/* Spreadsheet Content */}
      <div className="flex-1 overflow-auto bg-neutral-900/50 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
             <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white text-black text-xs font-mono overflow-hidden rounded-md shadow-xl border border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? "bg-neutral-100 font-bold border-b-2 border-neutral-300" : "bg-white hover:bg-blue-50 border-b border-neutral-200"}>
                      <td className="bg-neutral-100 border-r border-neutral-300 px-2 py-1 text-neutral-500 w-8 text-center select-none">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell: any, cellIndex: number) => (
                        <td 
                           key={cellIndex} 
                           className={`px-3 py-2 border-r border-neutral-200 whitespace-nowrap ${rowIndex === 0 ? 'text-center' : ''}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length === 0 && (
               <div className="p-10 text-center text-neutral-500">
                  No se pudieron leer datos o el archivo está vacío.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
