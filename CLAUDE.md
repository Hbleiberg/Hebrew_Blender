# Hebrew Blender — Claude Instructions

## Git
- Always commit and push directly to `main`
- Do not create feature branches

## Preset Save/Restore
Whenever a new UI control is added to `hebrew_blend_generator.html`, it must be included in both:
- `getSettings()` — serialize the control's current value
- `applySettings()` — restore the value and call any related UI toggle functions (e.g. `toggleGematriaMode()`, `toggleCwBlendOpts()`) so dependent rows update correctly
