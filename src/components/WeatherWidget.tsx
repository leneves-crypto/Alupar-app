
import React from 'react';
import { Cloud, Sun, Thermometer } from 'lucide-react';

export const WeatherWidget = () => (
  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
    <div className="flex flex-col items-end">
      <span className="text-[8px] font-black text-gray-400 uppercase">Previsão Local</span>
      <span className="text-xs font-black text-alupar-dark">RIO NOVO DO SUL</span>
    </div>
    <div className="h-8 w-[1px] bg-gray-200" />
    <div className="flex items-center gap-2">
      <Sun className="text-safety-yellow" size={20} />
      <div className="flex flex-col">
        <span className="text-xs font-black">28°C</span>
        <span className="text-[7px] font-bold text-gray-400 uppercase">ENSOLARADO</span>
      </div>
    </div>
  </div>
);
