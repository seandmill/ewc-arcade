/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, NewsItem, WeatherType } from '../types';
import { BUILDINGS } from '../constants';

interface UIOverlayProps {
  stats: CityStats;
  activeDragTool: BuildingType | null;
  onDragStart: (type: BuildingType) => void;
  newsFeed: NewsItem[];
  dragClientPosRef: React.MutableRefObject<{x: number, y: number}>;
  weather: WeatherType;
  onToggleWeather: () => void;
}

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

const ToolButton: React.FC<{
  type: BuildingType;
  onDragStart: () => void;
  money: number;
}> = ({ type, onDragStart, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isBulldoze = type === BuildingType.None;
  
  const bgColor = config.color;

  return (
    <button
      onPointerDown={(e) => {
        if (!isBulldoze && !canAfford) return;
        // Prevent default touch actions like scroll start if we want to drag immediately
        e.preventDefault(); 
        onDragStart();
      }}
      className={`
        relative flex flex-col items-center justify-center rounded-lg border-2 transition-all shadow-lg backdrop-blur-sm flex-shrink-0
        w-14 h-14 md:w-16 md:h-16
        border-gray-600 bg-gray-900/80 hover:bg-gray-800
        ${!isBulldoze && !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      title={config.description}
    >
      <div className="w-6 h-6 md:w-8 md:h-8 rounded mb-0.5 md:mb-1 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isBulldoze ? 'transparent' : bgColor }}>
        {isBulldoze && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-base md:text-lg">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-2 bg-gray-800 transform -rotate-45"></div>}
      </div>
      <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={`text-[8px] md:text-[10px] font-mono leading-none ${canAfford ? 'text-green-300' : 'text-red-400'}`}>${config.cost}</span>
      )}
    </button>
  );
};

// Component that follows the mouse/touch when dragging
const GhostDragIcon = ({ type, clientPosRef }: { type: BuildingType, clientPosRef: React.MutableRefObject<{x: number, y: number}> }) => {
    const ref = useRef<HTMLDivElement>(null);
    const config = BUILDINGS[type];
    const isBulldoze = type === BuildingType.None;

    useEffect(() => {
        let frameId: number;
        const updatePos = () => {
            if (ref.current) {
                const { x, y } = clientPosRef.current;
                ref.current.style.transform = `translate(${x}px, ${y}px)`;
            }
            frameId = requestAnimationFrame(updatePos);
        };
        frameId = requestAnimationFrame(updatePos);
        return () => cancelAnimationFrame(frameId);
    }, [clientPosRef]);

    return (
        <div 
            ref={ref}
            className="fixed top-0 left-0 w-16 h-16 pointer-events-none z-[100] -ml-8 -mt-16 opacity-80"
            style={{ willChange: 'transform' }}
        >
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-full border-2 border-white shadow-xl scale-110">
                 <div className="w-8 h-8 rounded border border-black/30 shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: isBulldoze ? 'transparent' : config.color }}>
                    {isBulldoze && <div className="w-full h-full bg-red-600 text-white flex justify-center items-center font-bold text-lg">✕</div>}
                    {type === BuildingType.Road && <div className="w-full h-2 bg-gray-800 transform -rotate-45"></div>}
                 </div>
                 <span className="text-[10px] font-bold text-white uppercase drop-shadow-md mt-1 bg-black/50 px-1 rounded">{config.name}</span>
            </div>
        </div>
    )
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  activeDragTool,
  onDragStart,
  newsFeed,
  dragClientPosRef,
  weather,
  onToggleWeather
}) => {
  const newsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll news
  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  const getWeatherIcon = (w: WeatherType) => {
      switch(w) {
          case WeatherType.Clear: return '☀️';
          case WeatherType.Rain: return '🌧️';
          case WeatherType.Snow: return '❄️';
          case WeatherType.Fog: return '🌫️';
          default: return '☀️';
      }
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10">
      
      {/* Ghost Icon for Dragging */}
      {activeDragTool && <GhostDragIcon type={activeDragTool} clientPosRef={dragClientPosRef} />}

      {/* Top Bar: Stats */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-2 w-full max-w-full">
        
        {/* Stats */}
        <div className="bg-gray-900/90 text-white p-2 md:p-3 rounded-xl border border-gray-700 shadow-2xl backdrop-blur-md flex gap-3 md:gap-6 items-center justify-between md:justify-start w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Treasury</span>
            <span className="text-lg md:text-2xl font-black text-green-400 font-mono drop-shadow-md">${stats.money.toLocaleString()}</span>
          </div>
          <div className="w-px h-6 md:h-8 bg-gray-700"></div>
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Citizens</span>
            <span className="text-base md:text-xl font-bold text-blue-300 font-mono drop-shadow-md">{stats.population.toLocaleString()}</span>
          </div>
          <div className="w-px h-6 md:h-8 bg-gray-700"></div>
          <div className="flex flex-col items-center">
             <span className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest">Day</span>
             <span className="text-base md:text-lg font-bold text-white font-mono">{stats.day}</span>
          </div>
           <div className="w-px h-6 md:h-8 bg-gray-700"></div>
           <button 
                onClick={onToggleWeather}
                className="flex flex-col items-center justify-center hover:bg-white/10 rounded px-2 transition-colors active:scale-95"
                title="Toggle Weather"
           >
               <span className="text-xl md:text-2xl leading-none">{getWeatherIcon(weather)}</span>
               <span className="text-[8px] uppercase font-bold text-gray-400">{weather}</span>
           </button>
        </div>
      </div>

      {/* Bottom Bar: Tools & News */}
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-2 w-full max-w-full">
        
        {/* Toolbar - "Drag to Build" Instructions */}
        <div className="relative">
             {/* Tooltip hint */}
             {!activeDragTool && (
                <div className="absolute -top-8 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur pointer-events-none animate-bounce">
                    Drag buildings to map
                </div>
             )}

            <div className="flex gap-1 md:gap-2 bg-gray-900/80 p-1 md:p-2 rounded-2xl border border-gray-600/50 backdrop-blur-xl shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-start">
            <div className="flex gap-1 md:gap-2 min-w-max px-1">
                {tools.map((type) => (
                <ToolButton
                    key={type}
                    type={type}
                    onDragStart={() => onDragStart(type)}
                    money={stats.money}
                />
                ))}
            </div>
            <div className="text-[8px] text-gray-500 uppercase writing-mode-vertical flex items-center justify-center font-bold tracking-widest border-l border-gray-700 pl-1 ml-1 select-none">Build</div>
            </div>
        </div>

        {/* News Feed */}
        <div className="w-full md:w-80 h-32 md:h-48 bg-black/80 text-white rounded-xl border border-gray-700/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
          <div className="bg-gray-800/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 border-b border-gray-600 flex justify-between items-center">
            <span>City Feed</span>
          </div>
          
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-30 z-20"></div>
          
          <div ref={newsRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 text-[10px] md:text-xs font-mono scroll-smooth mask-image-b z-10">
            {newsFeed.length === 0 && <div className="text-gray-500 italic text-center mt-10">No messages.</div>}
            {newsFeed.map((news) => (
              <div key={news.id} className={`
                border-l-2 pl-2 py-1 transition-all animate-fade-in leading-tight relative
                ${news.type === 'positive' ? 'border-green-500 text-green-200 bg-green-900/20' : ''}
                ${news.type === 'negative' ? 'border-red-500 text-red-200 bg-red-900/20' : ''}
                ${news.type === 'neutral' ? 'border-blue-400 text-blue-100 bg-blue-900/20' : ''}
              `}>
                <span className="opacity-70 text-[8px] absolute top-0.5 right-1">{new Date(Number(news.id.split('.')[0])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {news.text}
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* Credits */}
      <div className="absolute bottom-1 right-2 md:right-4 text-[8px] md:text-[9px] text-white/30 font-mono text-right pointer-events-auto hover:text-white/60 transition-colors">
        <a href="https://x.com/ammaar" target="_blank" rel="noreferrer">Created by @ammaar</a>
      </div>
    </div>
  );
};

export default UIOverlay;