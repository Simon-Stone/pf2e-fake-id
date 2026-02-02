/**
 * PF2e Fake ID - Context Menu Integration
 * 
 * Adds context menu options to tokens for manual fake info generation.
 */

import { MODULE_ID } from '../settings.js';
import { generateFakeInfo } from '../generation/generator.js';

/**
 * Register the token context menu option
 */
export function registerContextMenu() {
  // Hook into the token HUD context menu
  Hooks.on('getTokenActionBar', onGetTokenActionBar);
  
  // Hook into the token right-click context menu
  Hooks.on('getActorDirectoryEntryContext', onGetActorDirectoryContext);
  
  // Also add to the token layer context menu
  Hooks.on('getSceneControlButtons', onGetSceneControlButtons);
  
  console.log(`${MODULE_ID} | Context menu registered`);
}

/**
 * Add option to token action bar (if using a module that provides one)
 */
function onGetTokenActionBar(tokenActionBar, buttons) {
  // This hook is for modules like Token Action HUD
  // We'll add our button if the token is an NPC
  const token = tokenActionBar?.token;
  if (!token?.actor || token.actor.type !== 'npc') return;
  if (!game.user.isGM) return;
  
  buttons.push({
    name: game.i18n.localize('PF2E_FAKE_ID.ContextMenu.GenerateFakeInfo'),
    icon: 'fas fa-mask',
    callback: () => onGenerateFakeInfo(token.actor)
  });
}

/**
 * Add option to actor directory context menu
 */
function onGetActorDirectoryContext(html, options) {
  options.push({
    name: game.i18n.localize('PF2E_FAKE_ID.ContextMenu.GenerateFakeInfo'),
    icon: '<i class="fas fa-mask"></i>',
    condition: (li) => {
      if (!game.user.isGM) return false;
      const actorId = li.data('documentId');
      const actor = game.actors.get(actorId);
      return actor?.type === 'npc';
    },
    callback: async (li) => {
      const actorId = li.data('documentId');
      const actor = game.actors.get(actorId);
      if (actor) {
        await onGenerateFakeInfo(actor);
      }
    }
  });
}

/**
 * We can also hook into scene controls to add a tool
 * But for now, the main interaction will be through token right-click
 */
function onGetSceneControlButtons(controls) {
  // Not adding scene controls for now
  // Could be added in future for bulk generation
}

/**
 * Handler for generating fake info from context menu
 */
async function onGenerateFakeInfo(actor) {
  if (!actor || actor.type !== 'npc') {
    ui.notifications.warn(game.i18n.localize('PF2E_FAKE_ID.Errors.NoCreature'));
    return;
  }
  
  if (!game.user.isGM) {
    ui.notifications.error(game.i18n.localize('PF2E_FAKE_ID.Errors.NotGM'));
    return;
  }
  
  try {
    await generateFakeInfo(actor, {
      triggerType: 'manual',
      playerId: null,
      playerName: null
    });
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to generate fake info:`, error);
    ui.notifications.error(error.message);
  }
}

/**
 * Initialize token context menu (right-click on token)
 * This uses Foundry's built-in context menu system
 */
Hooks.on('getTokenContextOptions', (html, options) => {
  options.push({
    name: game.i18n.localize('PF2E_FAKE_ID.ContextMenu.GenerateFakeInfo'),
    icon: '<i class="fas fa-mask"></i>',
    condition: (li) => {
      if (!game.user.isGM) return false;
      const tokenId = li.data('tokenId') || li[0]?.dataset?.tokenId;
      const token = canvas.tokens?.get(tokenId);
      return token?.actor?.type === 'npc';
    },
    callback: async (li) => {
      const tokenId = li.data('tokenId') || li[0]?.dataset?.tokenId;
      const token = canvas.tokens?.get(tokenId);
      if (token?.actor) {
        await onGenerateFakeInfo(token.actor);
      }
    }
  });
});

/**
 * Alternative: Add to the token HUD (the buttons that appear when you select a token)
 */
Hooks.on('renderTokenHUD', (hud, html, data) => {
  if (!game.user.isGM) return;
  
  const token = hud.object;
  if (!token?.actor || token.actor.type !== 'npc') return;
  
  // Create a button for the right column using native DOM (Foundry v12+ compatibility)
  const button = document.createElement('div');
  button.className = 'control-icon pf2e-fake-id-hud';
  button.title = game.i18n.localize('PF2E_FAKE_ID.ContextMenu.GenerateFakeInfo');
  button.innerHTML = '<i class="fas fa-mask"></i>';
  
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await onGenerateFakeInfo(token.actor);
  });
  
  // Add to the right column (html is a native HTMLElement in Foundry v12+)
  const rightColumn = html.querySelector('.col.right');
  if (rightColumn) {
    rightColumn.appendChild(button);
  }
});
