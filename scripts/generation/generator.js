/**
 * PF2e Fake ID - Fake Info Generator
 * 
 * Orchestrates the generation of fake creature information.
 */

import { MODULE_ID } from '../settings.js';
import { LLMClient } from '../llm-client.js';
import { extractCreatureData } from '../creature/extractor.js';
import { buildPrompt, getSystemPrompt } from './prompt-builder.js';
import { sendGMWhisper, updateWhisperContent } from '../chat/whisper.js';

/**
 * Generate fake information for a creature
 * @param {Actor} actor - The PF2e creature actor
 * @returns {Promise<string>} The generated fake information
 */
export async function generateFakeInfo(actor) {
  if (!actor || actor.type !== 'npc') {
    throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NoCreature'));
  }

  // Check if user is GM
  if (!game.user.isGM) {
    throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NotGM'));
  }

  // Check if LLM is configured
  if (!LLMClient.isConfigured()) {
    throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NoApiEndpoint'));
  }

  // Send initial whisper with loading state
  const messageId = await sendGMWhisper({
    creatureName: actor.name,
    creatureId: actor.id,
    content: null, // null indicates loading state
    isLoading: true
  });

  try {
    // Extract creature data
    const creatureData = extractCreatureData(actor);
    
    // Build prompt
    const prompt = buildPrompt(creatureData);
    const systemPrompt = getSystemPrompt();
    
    console.log(`${MODULE_ID} | Generating fake info for ${actor.name}`);
    
    // Generate fake info
    const fakeInfo = await LLMClient.generate(prompt, systemPrompt);
    
    // Update the whisper message with the result
    await updateWhisperContent(messageId, {
      content: fakeInfo,
      isLoading: false,
      isError: false
    });
    
    return fakeInfo;
  } catch (error) {
    console.error(`${MODULE_ID} | Generation failed:`, error);
    
    // Update the whisper message with the error
    await updateWhisperContent(messageId, {
      content: error.message,
      isLoading: false,
      isError: true
    });
    
    throw error;
  }
}

/**
 * Regenerate fake information for an existing whisper message
 * @param {string} messageId - The chat message ID
 * @param {string} actorId - The creature actor ID
 * @returns {Promise<string>} The new fake information
 */
export async function regenerateFakeInfo(messageId, actorId) {
  const actor = game.actors.get(actorId);
  
  if (!actor) {
    throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NoCreature'));
  }

  // Update to loading state
  await updateWhisperContent(messageId, {
    content: null,
    isLoading: true,
    isError: false
  });

  try {
    // Extract creature data
    const creatureData = extractCreatureData(actor);
    
    // Build prompt
    const prompt = buildPrompt(creatureData);
    const systemPrompt = getSystemPrompt();
    
    console.log(`${MODULE_ID} | Regenerating fake info for ${actor.name}`);
    
    // Generate new fake info
    const fakeInfo = await LLMClient.generate(prompt, systemPrompt);
    
    // Update the whisper message
    await updateWhisperContent(messageId, {
      content: fakeInfo,
      isLoading: false,
      isError: false
    });
    
    ui.notifications.info(game.i18n.localize('PF2E_FAKE_ID.Notifications.Regenerating'));
    
    return fakeInfo;
  } catch (error) {
    console.error(`${MODULE_ID} | Regeneration failed:`, error);
    
    // Update with error
    await updateWhisperContent(messageId, {
      content: error.message,
      isLoading: false,
      isError: true
    });
    
    throw error;
  }
}
