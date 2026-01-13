/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Grid, TileData, BuildingType, CityStats, NewsItem, WeatherType } from '../../types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY } from '../../constants';
import IsoMap from '../IsoMap';
import UIOverlay from '../UIOverlay';
import { useArcade } from '../../context/ArcadeContext';

// Initialize empty grid with island shape generation for 3D visual interest
const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const center = GRID_SIZE / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  return grid;
};

const CityBuilderGame: React.FC = () => {
  const { updateCityProgress } = useArcade();

  // --- Game State ---
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ money: INITIAL_MONEY, population: 0, day: 1 });
  const [weather, setWeather] = useState<WeatherType>(WeatherType.Clear);

  // Drag & Drop State
  const [activeDragTool, setActiveDragTool] = useState<BuildingType | null>(null);
  const pointerPosRef = useRef(new THREE.Vector2(0, 0));
  const clientPosRef = useRef({ x: 0, y: 0 });
  const hoveredGridPosRef = useRef<{x: number, y: number} | null>(null);

  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);

  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Update arcade progress when stats change
  useEffect(() => {
    updateCityProgress({
      highestPopulation: Math.max(stats.population, 0),
      highestMoney: Math.max(stats.money, 0),
      daysPlayed: stats.day,
    });
  }, [stats.population, stats.money, stats.day, updateCityProgress]);

  // --- Global Event Listeners for Drag Tracking ---
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as PointerEvent).clientX;
        clientY = (e as PointerEvent).clientY;
      }

      clientPosRef.current = { x: clientX, y: clientY };

      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      pointerPosRef.current.set(x, y);
    };

    const handlePointerUp = () => {
      if (activeDragTool) {
        handleDrop();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeDragTool]);

  // --- Logic ---
  const handleDragStart = useCallback((tool: BuildingType) => {
    setActiveDragTool(tool);
    hoveredGridPosRef.current = null;
  }, []);

  const handleDrop = () => {
    const tool = activeDragTool;
    const hoverPos = hoveredGridPosRef.current;

    setActiveDragTool(null);
    hoveredGridPosRef.current = null;

    if (tool && hoverPos) {
      handlePlaceBuilding(hoverPos.x, hoverPos.y, tool);
    }
  };

  const handlePlaceBuilding = (x: number, y: number, tool: BuildingType) => {
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];
    const buildingConfig = BUILDINGS[tool];

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
          const newGrid = currentGrid.map(row => [...row]);
          newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
          setGrid(newGrid);
          setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
        } else {
          addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      if (currentStats.money >= buildingConfig.cost) {
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));

        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool };
        setGrid(newGrid);
      } else {
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  };

  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]);
  }, []);

  // --- Initial Setup & Game Loop ---
  useEffect(() => {
    addNewsItem({ id: Date.now().toString(), text: "Welcome to SkyMetropolis!", type: 'positive' });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      let dailyIncome = 0;
      let dailyPopGrowth = 0;
      let buildingCounts: Record<string, number> = {};

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          dailyIncome += config.incomeGen;
          dailyPopGrowth += config.popGen;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;
        }
      });

      const resCount = buildingCounts[BuildingType.Residential] || 0;
      const maxPop = resCount * 50;

      setStats(prev => {
        let newPop = prev.population + dailyPopGrowth;
        if (newPop > maxPop) newPop = maxPop;
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5);

        return {
          money: prev.money + dailyIncome,
          population: newPop,
          day: prev.day + 1,
        };
      });

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [addNewsItem]);

  const toggleWeather = () => {
    setWeather(prev => {
      const types = Object.values(WeatherType);
      const idx = types.indexOf(prev);
      return types[(idx + 1) % types.length];
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden selection:bg-transparent selection:text-transparent bg-sky-900 touch-none">
      {/* 3D Rendering Layer */}
      <IsoMap
        grid={grid}
        activeDragTool={activeDragTool}
        pointerPosRef={pointerPosRef}
        hoveredGridPosRef={hoveredGridPosRef}
        population={stats.population}
        weather={weather}
      />

      {/* UI Layer */}
      <UIOverlay
        stats={stats}
        activeDragTool={activeDragTool}
        onDragStart={handleDragStart}
        newsFeed={newsFeed}
        dragClientPosRef={clientPosRef}
        weather={weather}
        onToggleWeather={toggleWeather}
      />
    </div>
  );
};

export default CityBuilderGame;
