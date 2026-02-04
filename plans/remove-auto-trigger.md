# Remove Auto-Trigger Feature - Implementation Plan

## Overview
Remove the automatic trigger functionality that generates fake facts when a player critically fails a Recall Knowledge check. After this change, the module will only support manual generation via the sheet button, and all references to "Manual" triggering will be removed since there will be only one way to trigger generation.

## Changes Required

### 1. Settings ([`scripts/settings.js`](../scripts/settings.js))

**Remove:**
- The `autoTrigger` setting registration (lines 66-74)

**Impact:**
- Existing worlds with this setting enabled will simply ignore it (Foundry handles removed settings gracefully)
- No migration needed

### 2. Hooks ([`scripts/hooks.js`](../scripts/hooks.js))

**Remove:**
- The entire `createChatMessage` hook and its handler (line 19)
- The `onCreateChatMessage` function and all helper functions:
  - `detectRecallKnowledge()`
  - `detectCriticalFailure()`
  - `getTargetCreature()`

**Keep:**
- `registerWhisperButtonHandlers()` call
- `onRenderSettingsConfig()` hook for password field conversion

**Simplify:**
- The [`registerHooks()`](../scripts/hooks.js:14) function will only register two hooks:
  1. Whisper button handlers
  2. Settings config rendering (for password field)

### 3. Generator ([`scripts/generation/generator.js`](../scripts/generation/generator.js))

**Remove from [`generateFakeInfo()`](../scripts/generation/generator.js:22):**
- `triggerType` parameter from options object
- `playerId` parameter from options object  
- `playerName` parameter from options object
- All references to these parameters in function calls

**Remove from [`regenerateFakeInfo()`](../scripts/generation/generator.js:96):**
- The options parameter (it was only used to preserve trigger info)

**Update:**
- Simplify function signatures to only require the actor
- Remove trigger-related data from whisper message creation

### 4. Whisper Messages ([`scripts/chat/whisper.js`](../scripts/chat/whisper.js))

**Remove from [`sendGMWhisper()`](../scripts/chat/whisper.js:22):**
- `triggerType` parameter
- `playerId` parameter
- `playerName` parameter
- Logic that determines trigger label (lines 33-35)
- Trigger type display from HTML template

**Remove from [`updateWhisperContent()`](../scripts/chat/whisper.js:76):**
- Trigger label logic (lines 83-85)

**Remove from [`buildWhisperHTML()`](../scripts/chat/whisper.js:112):**
- `triggerType` parameter
- `playerId` parameter
- `playerName` parameter
- Trigger type display in header (line 160)
- "Share to Player" button logic (only keep "Share to All")

**Update:**
- Remove trigger type span from whisper message header
- Remove conditional player-specific share button
- Simplify to always show "Share to All" button
- Remove player-related data from message flags

### 5. Sheet Button ([`scripts/ui/sheet-button.js`](../scripts/ui/sheet-button.js))

**Update [`onGenerateFakeInfo()`](../scripts/ui/sheet-button.js:140):**
- Remove the options object entirely from the [`generateFakeInfo()`](../scripts/generation/generator.js:22) call
- Change from: `await generateFakeInfo(actor, { triggerType: 'manual', playerId: null, playerName: null })`
- Change to: `await generateFakeInfo(actor)`

### 6. Template ([`templates/whisper-message.hbs`](../templates/whisper-message.hbs))

**Remove:**
- `triggerType` variable reference (line 10, 22)
- `playerId` variable reference (lines 11, 18, 42)
- `playerName` variable reference (line 12)
- Trigger type display span (line 22)
- Conditional "Share to Player" button (lines 42-46)

**Keep:**
- Creature name display
- Loading/error states
- Content display
- Share to All button
- Copy button
- Regenerate button

### 7. Language File ([`lang/en.json`](../lang/en.json))

**Remove:**
- `Settings.AutoTrigger.Name` (line 19)
- `Settings.AutoTrigger.Hint` (line 20)
- `Chat.TriggerType` object (lines 41-44)
- `Chat.Buttons.ShareToPlayer` (line 46)

**Keep:**
- All other language strings
- `ShareToAll` button text

### 8. Documentation Updates

**Update comments in:**
- [`scripts/hooks.js`](../scripts/hooks.js:1) - Update file header comment
- [`scripts/ui/sheet-button.js`](../scripts/ui/sheet-button.js:1) - Remove "manual" from comment
- [`scripts/generation/generator.js`](../scripts/generation/generator.js:1) - Update function documentation

## Benefits

1. **Simplification**: Removes complex chat message detection logic
2. **Clearer UX**: Only one way to trigger = less confusion
3. **Reduced Code**: ~150 lines of detection logic removed
4. **Better Control**: GMs explicitly choose when to generate fake facts
5. **No Breaking Changes**: Existing whisper messages still render (just without trigger type)

## Migration Considerations

- **Setting Cleanup**: The `autoTrigger` setting will remain in the database but be ignored (standard Foundry behavior)
- **Existing Messages**: Old whisper messages with trigger type data will still display correctly (missing data is handled gracefully)
- **No User Action Required**: The change is transparent to users

## Testing Checklist

After implementation:
- [ ] Sheet button generates fake info successfully
- [ ] Whisper message displays without trigger type
- [ ] "Share to All" button works
- [ ] "Copy to Clipboard" button works
- [ ] "Regenerate" button works
- [ ] Settings page doesn't show auto-trigger option
- [ ] No console errors
- [ ] Old whisper messages still render
