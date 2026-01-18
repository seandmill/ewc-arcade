/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback, useRef } from 'react';

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

    setInput((prev) => {
      const next = { ...prev };
      switch (key) {
        case 'w':
        case 'arrowup':
          next.forward = true;
          break;
        case 's':
        case 'arrowdown':
          next.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          next.turnLeft = true;
          break;
        case 'd':
        case 'arrowright':
          next.turnRight = true;
          break;
        case ' ':
          next.jump = true;
          break;
        case '1':
          next.trick1 = true;
          break;
        case '2':
          next.trick2 = true;
          break;
        case '3':
          next.trick3 = true;
          break;
        case '4':
          next.trick4 = true;
          break;
      }
      return next;
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current.delete(key);

    setInput((prev) => {
      const next = { ...prev };
      switch (key) {
        case 'w':
        case 'arrowup':
          next.forward = false;
          break;
        case 's':
        case 'arrowdown':
          next.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          next.turnLeft = false;
          break;
        case 'd':
        case 'arrowright':
          next.turnRight = false;
          break;
        case ' ':
          next.jump = false;
          break;
        case '1':
          next.trick1 = false;
          break;
        case '2':
          next.trick2 = false;
          break;
        case '3':
          next.trick3 = false;
          break;
        case '4':
          next.trick4 = false;
          break;
      }
      return next;
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

  // Combined input (keyboard + touch joystick)
  const combinedInput: InputState = {
    forward: input.forward || touch.joystickY < -0.3,
    backward: input.backward || touch.joystickY > 0.3,
    turnLeft: input.turnLeft || touch.joystickX < -0.3,
    turnRight: input.turnRight || touch.joystickX > 0.3,
    jump: input.jump,
    trick1: input.trick1,
    trick2: input.trick2,
    trick3: input.trick3,
    trick4: input.trick4,
  };

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
