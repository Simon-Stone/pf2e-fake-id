/**
 * PF2e Fake ID - Hooks Registration
 *
 * Registers Foundry VTT hooks for the module.
 */

import { MODULE_ID } from './settings.js';
import { registerWhisperButtonHandlers } from './chat/whisper.js';

/**
 * Register all module hooks
 */
export function registerHooks() {
  // Register button handlers for whisper messages
  registerWhisperButtonHandlers();
  
  // Hook into settings config to convert API key field to password type
  Hooks.on('renderSettingsConfig', onRenderSettingsConfig);
  
  console.log(`${MODULE_ID} | Hooks registered`);
}

/**
 * Convert the API key input field to a password field when settings are rendered
 * @param {SettingsConfig} app - The settings application
 * @param {HTMLElement} html - The rendered HTML element (native DOM in v13+)
 * @param {Object} data - The template data
 */
function onRenderSettingsConfig(app, html, data) {
  // Find the API key input field using native DOM methods (Foundry v13+)
  const apiKeyInput = html.querySelector(`input[name="${MODULE_ID}.apiKey"]`);
  if (apiKeyInput) {
    apiKeyInput.type = 'password';
    console.log(`${MODULE_ID} | Converted API key field to password type`);
  }
}
