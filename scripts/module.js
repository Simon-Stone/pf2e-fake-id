/**
 * PF2e Fake ID - Main Module Entry Point
 * 
 * Generates plausible but incorrect creature information for 
 * critical failures on Recall Knowledge checks.
 */

import { registerSettings, MODULE_ID } from './settings.js';
import { registerHooks } from './hooks.js';
import { registerContextMenu } from './ui/context-menu.js';

// Initialize module
Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing PF2e Fake ID`);
  
  // Register module settings
  registerSettings();
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | PF2e Fake ID Ready`);
  
  // Check if PF2e system is active
  if (game.system.id !== 'pf2e') {
    ui.notifications.error(game.i18n.localize('PF2E_FAKE_ID.Errors.WrongSystem'));
    return;
  }
  
  // Register hooks for automatic triggers
  registerHooks();
  
  // Register context menu for manual triggers
  registerContextMenu();
});
