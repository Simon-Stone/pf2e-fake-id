# Implementation Summary: Button Moved to Creature Sheet

## Changes Completed

### Files Created
1. **[`scripts/ui/sheet-button.js`](../scripts/ui/sheet-button.js:1)** - New file
   - Replaces the old `context-menu.js` functionality
   - Implements `renderActorSheet` hook for NPC sheets
   - Uses multiple selector strategies to find RECALL KNOWLEDGE section
   - Injects button with click handler for generating fake info

### Files Modified
1. **[`scripts/module.js`](../scripts/module.js:1)**
   - Changed import from `registerContextMenu` to `registerSheetButton`
   - Updated function call to use new sheet button registration

2. **[`styles/module.css`](../styles/module.css:216)**
   - Added `.pf2e-fake-id-sheet-button` styles
   - Matches PF2e's visual design (red theme, uppercase text)
   - Includes hover/active states
   - Responsive design (icon-only on small screens)

### Files Deleted
1. **`scripts/ui/context-menu.js`** - Removed
   - All context menu functionality removed
   - No more token HUD button
   - No more token right-click menu option
   - No more actor directory context menu option

## Technical Implementation Details

### Button Injection Strategy

The new implementation uses a multi-strategy approach to locate the RECALL KNOWLEDGE section:

1. **Strategy 1**: Look for `[data-tab="recall-knowledge"]`
2. **Strategy 2**: Look for section with class containing "recall-knowledge"
3. **Strategy 3**: Search headers (h2/h3) for "RECALL KNOWLEDGE" text
4. **Strategy 4**: Search for elements containing "ATTEMPTS" text
5. **Strategy 5**: Look in sidebar for recall knowledge section

This defensive approach ensures compatibility across different PF2e versions and sheet configurations.

### Button Styling

```css
.pf2e-fake-id-sheet-button {
  /* PF2e red theme */
  background: #5e0000;
  color: white;
  
  /* Compact, inline design */
  display: inline-flex;
  padding: 4px 8px;
  margin-left: 8px;
  
  /* PF2e styling conventions */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.75em;
  
  /* Smooth interactions */
  transition: all 0.2s ease;
}
```

### GM-Only Visibility

The button only appears when:
- Viewing an NPC sheet (`actor.type === 'npc'`)
- Current user is a GM (`game.user.isGM`)
- RECALL KNOWLEDGE section is found in the sheet

## Testing Instructions

### Prerequisites
1. Open Foundry VTT with PF2e system
2. Load the pf2e-fake-id module
3. Have at least one NPC actor in your world

### Test Cases

#### ✅ Test 1: Button Appears on NPC Sheet (GM)
1. Log in as GM
2. Open any NPC actor sheet
3. **Expected**: Button appears in RECALL KNOWLEDGE section header with text "GENERATE FAKE RECALL KNOWLEDGE" and mask icon
4. **Expected**: Button is styled with red background matching PF2e theme

#### ✅ Test 2: Button Does NOT Appear for Players
1. Log in as a player (non-GM)
2. Open any NPC sheet (if player has permission)
3. **Expected**: Button does NOT appear
4. **Expected**: No console errors

#### ✅ Test 3: Button Does NOT Appear on PC Sheets
1. Log in as GM
2. Open a player character sheet
3. **Expected**: Button does NOT appear
4. **Expected**: No console errors

#### ✅ Test 4: Button Functionality
1. Log in as GM
2. Open NPC sheet
3. Click the "Generate Fake Recall Knowledge" button
4. **Expected**: GM whisper message appears in chat with fake information
5. **Expected**: Button remains clickable after generation

#### ✅ Test 5: Old Locations Removed
1. Log in as GM
2. Select an NPC token on the canvas
3. **Expected**: Token HUD does NOT show fake info button
4. Right-click on NPC token
5. **Expected**: Context menu does NOT show "Generate Fake Recall Knowledge"
6. Right-click on NPC in Actors directory
7. **Expected**: Context menu does NOT show "Generate Fake Recall Knowledge"

#### ✅ Test 6: Sheet Re-render
1. Log in as GM
2. Open NPC sheet (button appears)
3. Make a change to the NPC (e.g., change HP)
4. **Expected**: Button remains present after sheet updates
5. **Expected**: No duplicate buttons appear

#### ✅ Test 7: Multiple Sheets
1. Log in as GM
2. Open multiple NPC sheets simultaneously
3. **Expected**: Each sheet shows its own button
4. **Expected**: Clicking button on one sheet only generates for that specific NPC

#### ✅ Test 8: Responsive Design
1. Log in as GM
2. Open NPC sheet at full width
3. **Expected**: Button shows icon + text
4. Resize window to narrow width (< 800px)
5. **Expected**: Button shows icon only, text hidden

### Troubleshooting

#### Issue: Button doesn't appear
**Possible causes:**
- RECALL KNOWLEDGE section not found (check console for warning)
- Not logged in as GM
- Viewing PC sheet instead of NPC sheet

**Solution:**
Check browser console for: `"Could not find RECALL KNOWLEDGE section in NPC sheet"`

#### Issue: Button appears multiple times
**Possible cause:**
- Sheet re-rendering without cleanup

**Solution:**
Button removal logic is implemented; report as bug if occurs

#### Issue: Console errors on sheet open
**Possible cause:**
- Selector incompatibility with PF2e version

**Solution:**
Check which selector strategy is being used in console logs

## File Structure After Changes

```
pf2e-fake-id/
├── scripts/
│   ├── module.js              ✓ Modified (import/call updated)
│   └── ui/
│       ├── sheet-button.js    ✓ New file (replacement)
│       └── context-menu.js    ✗ Deleted
├── styles/
│   └── module.css             ✓ Modified (new button styles)
└── plans/
    ├── architecture.md
    ├── move-button-to-sheet.md
    └── implementation-summary.md  ✓ This file
```

## Rollback Instructions

If issues arise and you need to restore the old behavior:

1. Restore `scripts/ui/context-menu.js` from git history:
   ```bash
   git checkout HEAD~1 scripts/ui/context-menu.js
   ```

2. Revert changes to `scripts/module.js`:
   ```bash
   git checkout HEAD~1 scripts/module.js
   ```

3. Delete the new file:
   ```bash
   rm scripts/ui/sheet-button.js
   ```

4. Reload Foundry

## Next Steps

After testing confirms everything works:

1. ✅ Update README.md with new button location
2. ✅ Update any screenshots/documentation
3. ✅ Commit changes to git
4. ✅ Consider adding to CHANGELOG

## Notes

- The old context menu locations have been completely removed
- Button now provides better discoverability (always visible when viewing NPC sheet)
- Implementation is defensive with multiple fallback strategies
- CSS is responsive and matches PF2e's design language
- GM-only visibility is maintained from previous implementation
