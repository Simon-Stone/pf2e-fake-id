/**
 * PF2e Fake ID - Sheet Button Integration
 *
 * Adds button to NPC sheets for fake info generation.
 */

import { MODULE_ID } from '../settings.js';
import { generateFakeInfo } from '../generation/generator.js';

/**
 * Register the NPC sheet button
 */
export function registerSheetButton() {
  Hooks.on('renderActorSheet', onRenderActorSheet);
  console.log(`${MODULE_ID} | Sheet button registered`);
}

/**
 * Add button to NPC sheet RECALL KNOWLEDGE section
 * @param {ActorSheet} sheet - The actor sheet being rendered
 * @param {jQuery} html - The sheet's HTML
 * @param {Object} data - The sheet's data
 */
function onRenderActorSheet(sheet, html, data) {
  // Only process NPC sheets
  if (sheet.actor.type !== 'npc') return;
  
  // Only show to GMs
  if (!game.user.isGM) return;
  
  // Remove any existing button first (in case of re-render)
  html.find('.pf2e-fake-id-sheet-button').remove();
  
  // Try to find the RECALL KNOWLEDGE section
  const recallSection = findRecallKnowledgeSection(html);
  if (!recallSection) {
    console.warn(`${MODULE_ID} | Could not find RECALL KNOWLEDGE section in NPC sheet`);
    return;
  }
  
  // Create the button
  const button = createSheetButton(sheet.actor);
  
  // Insert the button into the section
  insertButton(recallSection, button);
  
  console.log(`${MODULE_ID} | Sheet button added to ${sheet.actor.name}'s sheet`);
}

/**
 * Find the RECALL KNOWLEDGE section header in the NPC sheet
 * Uses multiple selector strategies to handle different PF2e versions
 * @param {jQuery} html - The sheet's HTML
 * @returns {jQuery|null} The recall knowledge section-header element or null
 */
function findRecallKnowledgeSection(html) {
  // Strategy 1: Look for the specific .recall-knowledge.section-container structure (current PF2e)
  let section = html.find('.recall-knowledge.section-container .section-header');
  if (section.length) return section;
  
  // Strategy 2: Look for any section-container with class containing "recall-knowledge"
  section = html.find('[class*="recall-knowledge"] .section-header');
  if (section.length) return section;
  
  // Strategy 3: Look for section-header containing h4 with "Recall Knowledge" text
  const headers = html.find('.section-header');
  for (let i = 0; i < headers.length; i++) {
    const header = $(headers[i]);
    const h4 = header.find('h4');
    if (h4.length && h4.text().trim().match(/recall knowledge/i)) {
      return header;
    }
  }
  
  // Strategy 4: Look for h4 with "Recall Knowledge" text and get its parent section-header
  const h4Elements = html.find('h4');
  for (let i = 0; i < h4Elements.length; i++) {
    const h4 = $(h4Elements[i]);
    if (h4.text().trim().match(/recall knowledge/i)) {
      const parent = h4.closest('.section-header');
      if (parent.length) return parent;
      // If no .section-header parent, return the h4's direct parent
      return h4.parent();
    }
  }
  
  // Strategy 5: Look for button with "Attempts" text and get its parent section-header
  const attemptsButton = html.find('button:contains("Attempts")');
  if (attemptsButton.length) {
    const parent = attemptsButton.closest('.section-header');
    if (parent.length) return parent;
  }
  
  return null;
}

/**
 * Create the sheet button element
 * @param {Actor} actor - The NPC actor
 * @returns {jQuery} The button element
 */
function createSheetButton(actor) {
  const buttonText = game.i18n.localize('PF2E_FAKE_ID.ContextMenu.GenerateFakeInfo');
  const buttonTitle = buttonText;
  
  const button = $(`
    <button class="pf2e-fake-id-sheet-button"
            type="button"
            title="${buttonTitle}">
      <i class="fas fa-sparkles"></i>
      <span>${buttonText}</span>
    </button>
  `);
  
  // Attach click handler
  button.on('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await onGenerateFakeInfo(actor);
  });
  
  return button;
}

/**
 * Insert the button into the section-header next to the Attempts button
 * @param {jQuery} sectionHeader - The recall knowledge section-header element
 * @param {jQuery} button - The button to insert
 */
function insertButton(sectionHeader, button) {
  // The sectionHeader should be the .section-header div
  // We want to append our button after any existing content
  sectionHeader.append(button);
}

/**
 * Handler for generating fake info from the sheet button
 * @param {Actor} actor - The NPC actor
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
    await generateFakeInfo(actor);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to generate fake info:`, error);
    ui.notifications.error(error.message);
  }
}
