/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { TRICKS } from './skateConstants';
import { SkaterState } from './Skater';

interface SkateUIProps {
  skaterState: SkaterState | null;
  trickCount: number;
  comboCount: number;
  lastTrick: string | null;
  onJoystickMove: (x: number, y: number, active: boolean) => void;
  onButtonPress: (button: string, pressed: boolean) => void;
  onPause: () => void;
}

// Virtual joystick component
const VirtualJoystick: React.FC<{
  onMove: (x: number, y: number, active: boolean) => void;
}> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  // Use ref for isActive to avoid stale closure in handleMove
  const isActiveRef = useRef(false);

  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    touchIdRef.current = touchId ?? null;
    setIsActive(true);
    isActiveRef.current = true;

    // Calculate offset from center
    const maxRadius = rect.width / 2 - 20;
    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Clamp to radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPosition({ x: dx, y: dy });
    onMove(dx / maxRadius, dy / maxRadius, true);
  }, [onMove]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    // Use ref to check active state to avoid stale closure
    if (!containerRef.current || !isActiveRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2 - 20;
    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPosition({ x: dx, y: dy });
    onMove(dx / maxRadius, dy / maxRadius, true);
  }, [onMove]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    setKnobPosition({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove(0, 0, false);
  }, [onMove]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, touch.identifier);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
    if (touch) {
      handleEnd();
    }
  }, [handleEnd]);

  // Handle touchcancel (e.g., incoming call, system gesture)
  const onTouchCancel = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  return (
    <div
      ref={containerRef}
      className="relative w-32 h-32 rounded-full bg-black/30 border-2 border-white/30"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Knob */}
      <div
        className="absolute w-12 h-12 rounded-full bg-white/60 border-2 border-white shadow-lg"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPosition.x}px), calc(-50% + ${knobPosition.y}px))`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
      />
    </div>
  );
};

// Touch button component
const TouchButton: React.FC<{
  label: string;
  subLabel?: string;
  color: string;
  onPress: () => void;
  onRelease: () => void;
  size?: 'normal' | 'large';
}> = ({ label, subLabel, color, onPress, onRelease, size = 'normal' }) => {
  const [isPressed, setIsPressed] = useState(false);
  // Use ref to track pressed state for stale closure in mouse handlers
  const isPressedRef = useRef(false);

  const handleStart = useCallback(() => {
    setIsPressed(true);
    isPressedRef.current = true;
    onPress();
  }, [onPress]);

  const handleEnd = useCallback(() => {
    if (!isPressedRef.current) return; // Prevent double-release
    setIsPressed(false);
    isPressedRef.current = false;
    onRelease();
  }, [onRelease]);

  const sizeClasses = size === 'large' ? 'w-16 h-16' : 'w-12 h-12';

  return (
    <button
      className={`${sizeClasses} rounded-full flex flex-col items-center justify-center
        font-bold text-white shadow-lg transition-transform
        ${isPressed ? 'scale-90' : 'scale-100'}`}
      style={{ backgroundColor: color }}
      onTouchStart={(e) => { e.preventDefault(); handleStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
      onTouchCancel={(e) => { e.preventDefault(); handleEnd(); }}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <span className="text-sm">{label}</span>
      {subLabel && <span className="text-[10px] opacity-70">{subLabel}</span>}
    </button>
  );
};

const SkateUI: React.FC<SkateUIProps> = ({
  skaterState,
  trickCount,
  comboCount,
  lastTrick,
  onJoystickMove,
  onButtonPress,
  onPause,
}) => {
  const [showTrickName, setShowTrickName] = useState(false);
  const trickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show trick name when a new trick is performed
  useEffect(() => {
    if (lastTrick) {
      setShowTrickName(true);
      if (trickTimeoutRef.current) {
        clearTimeout(trickTimeoutRef.current);
      }
      trickTimeoutRef.current = setTimeout(() => {
        setShowTrickName(false);
      }, 1500);
    }
    return () => {
      if (trickTimeoutRef.current) {
        clearTimeout(trickTimeoutRef.current);
      }
    };
  }, [lastTrick]);

  const speed = skaterState ? Math.round(skaterState.velocity.length() * 10) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-center">
            <div className="text-white/60 text-xs">TRICKS</div>
            <div className="text-white font-bold text-lg">{trickCount}</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-white/60 text-xs">COMBO</div>
            <div className="text-yellow-400 font-bold text-lg">{comboCount}x</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-white/60 text-xs">SPEED</div>
            <div className="text-cyan-400 font-bold text-lg">{speed}</div>
          </div>
        </div>
      </div>

      {/* Trick name flash */}
      {showTrickName && lastTrick && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="text-4xl font-black text-white drop-shadow-lg animate-bounce"
            style={{
              textShadow: '0 0 20px rgba(255,255,0,0.8), 0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            {lastTrick}!
          </div>
        </div>
      )}

      {/* Pause button */}
      <button
        onClick={onPause}
        className="absolute top-2 right-2 pointer-events-auto w-10 h-10 bg-black/50 rounded-lg flex items-center justify-center text-white hover:bg-black/70"
      >
        ⏸
      </button>

      {/* Touch controls - bottom of screen */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 pointer-events-auto">
        {/* Left side - Joystick */}
        <VirtualJoystick onMove={onJoystickMove} />

        {/* Right side - Buttons */}
        <div className="flex flex-col items-end gap-2">
          {/* Trick buttons (2x2 grid) */}
          <div className="grid grid-cols-2 gap-2">
            {TRICKS.map((trick, index) => (
              <TouchButton
                key={trick.id}
                label={trick.key}
                subLabel={trick.name.slice(0, 4)}
                color={['#e74c3c', '#3498db', '#2ecc71', '#9b59b6'][index]}
                onPress={() => onButtonPress(`trick${index + 1}`, true)}
                onRelease={() => onButtonPress(`trick${index + 1}`, false)}
              />
            ))}
          </div>
          {/* Jump button */}
          <TouchButton
            label="JUMP"
            color="#f39c12"
            size="large"
            onPress={() => onButtonPress('jump', true)}
            onRelease={() => onButtonPress('jump', false)}
          />
        </div>
      </div>

      {/* Keyboard hints (desktop only) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden md:block pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-sm rounded px-3 py-1 text-white/60 text-xs">
          WASD/Arrows: Move • Space: Jump • 1-4: Tricks
        </div>
      </div>
    </div>
  );
};

export default SkateUI;
