Original prompt: The skate mini game is terrible, jittery, and unplayable. the character can get launched dozens of feet into the air, it has a frame rate of about 15 fps, the layout of the game assets is not cohesive, the list goes on.

- 2026-02-03: Implemented fixed-step physics loop, ramp launch clamp, and airborne time tracking; added advanceTime hook.
- 2026-02-03: Simplified park layout, resized park, repositioned stars, and introduced instanced floor rendering with lighter shadows/DPR.
- 2026-02-03: Added render_game_to_text output for deterministic testing and gameplay state inspection.
- 2026-02-03: Attempted to start Vite dev server for Playwright testing; sandbox blocked port binding (EPERM), so automated runs are pending.
