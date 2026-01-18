/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface InputState {
  forward: boolean;
  backward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  jump: boolean;
  trick1: boolean;
  trick2: boolean;
  trick3: boolean;
  trick4: boolean;
}

export interface TouchState {
  joystickX: number; // -1 to 1
  joystickY: number; // -1 to 1
  isJoystickActive: boolean;
}

const initialInput: InputState = {
  forward: false,
  backward: false,
  turnLeft: false,
  turnRight: false,
  jump: false,
  trick1: false,
  trick2: false,
  trick3: false,
  trick4: false,
};

const initialTouch: TouchState = {
  joystickX: 0,
  joystickY: 0,
  isJoystickActive: false,
};

export function useSkateControls() {
  const [input, setInput] = useState<InputState>(initialInput);
  const [touch, setTouch] = useState<TouchState>(initialTouch);
  const keysPressed = useRef<Set<string>>(new Set());

  // Keyboard handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (keysPressed.current.has(key)) return;
    keysPressed.current.add(key);

    // Only update state if a matching key is pressed - return prev otherwise to avoid unnecessary re-renders
    setInput((prev) => {
      switch (key) {
        case 'w':
        case 'arrowup':
          return { ...prev, forward: true };
        case 's':
        case 'arrowdown':
          return { ...prev, backward: true };
        case 'a':
        case 'arrowleft':
          return { ...prev, turnLeft: true };
        case 'd':
        case 'arrowright':
          return { ...prev, turnRight: true };
        case ' ':
          return { ...prev, jump: true };
        case '1':
          return { ...prev, trick1: true };
        case '2':
          return { ...prev, trick2: true };
        case '3':
          return { ...prev, trick3: true };
        case '4':
          return { ...prev, trick4: true };
        default:
          return prev; // No change - prevents unnecessary re-renders
      }
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current.delete(key);

    // Only update state if a matching key is released - return prev otherwise to avoid unnecessary re-renders
    setInput((prev) => {
      switch (key) {
        case 'w':
        case 'arrowup':
          return { ...prev, forward: false };
        case 's':
        case 'arrowdown':
          return { ...prev, backward: false };
        case 'a':
        case 'arrowleft':
          return { ...prev, turnLeft: false };
        case 'd':
        case 'arrowright':
          return { ...prev, turnRight: false };
        case ' ':
          return { ...prev, jump: false };
        case '1':
          return { ...prev, trick1: false };
        case '2':
          return { ...prev, trick2: false };
        case '3':
          return { ...prev, trick3: false };
        case '4':
          return { ...prev, trick4: false };
        default:
          return prev; // No change - prevents unnecessary re-renders
      }
    });
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Touch joystick handlers
  const updateJoystick = useCallback((x: number, y: number, active: boolean) => {
    setTouch({ joystickX: x, joystickY: y, isJoystickActive: active });
  }, []);

  // Touch button handlers
  const setTouchButton = useCallback((button: keyof InputState, pressed: boolean) => {
    setInput((prev) => ({ ...prev, [button]: pressed }));
  }, []);

  // Combined input (keyboard + touch joystick) - MEMOIZED to prevent infinite re-renders
  const combinedInput: InputState = useMemo(() => ({
    forward: input.forward || touch.joystickY < -0.3,
    backward: input.backward || touch.joystickY > 0.3,
    turnLeft: input.turnLeft || touch.joystickX < -0.3,
    turnRight: input.turnRight || touch.joystickX > 0.3,
    jump: input.jump,
    trick1: input.trick1,
    trick2: input.trick2,
    trick3: input.trick3,
    trick4: input.trick4,
  }), [input, touch.joystickX, touch.joystickY]);

  // Get current active trick (0-3, or -1 if none)
  const getActiveTrick = (): number => {
    if (combinedInput.trick1) return 0;
    if (combinedInput.trick2) return 1;
    if (combinedInput.trick3) return 2;
    if (combinedInput.trick4) return 3;
    return -1;
  };

  return {
    input: combinedInput,
    touch,
    updateJoystick,
    setTouchButton,
    getActiveTrick,
  };
}
