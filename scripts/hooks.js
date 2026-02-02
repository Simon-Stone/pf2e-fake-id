/**
 * PF2e Fake ID - Hooks Registration
 * 
 * Registers Foundry VTT hooks for automatic triggers.
 */

import { MODULE_ID, getSetting } from './settings.js';
import { generateFakeInfo } from './generation/generator.js';
import { registerWhisperButtonHandlers } from './chat/whisper.js';

/**
 * Register all module hooks
 */
export function registerHooks() {
  // Register button handlers for whisper messages
  registerWhisperButtonHandlers();
  
  // Hook into PF2e's check roll system for automatic triggers
  Hooks.on('createChatMessage', onCreateChatMessage);
  
  console.log(`${MODULE_ID} | Hooks registered`);
}

/**
 * Handle chat message creation to detect Recall Knowledge critical failures
 * @param {ChatMessage} message - The created chat message
 * @param {Object} options - Creation options
 * @param {string} userId - ID of the user who created the message
 */
async function onCreateChatMessage(message, options, userId) {
  // Only process if auto-trigger is enabled
  if (!getSetting('autoTrigger')) return;
  
  // Only the GM should process these
  if (!game.user.isGM) return;
  
  // Check if this is a skill check message from PF2e
  const flags = message.flags?.pf2e;
  if (!flags) return;
  
  // Look for Recall Knowledge checks
  const isRecallKnowledge = detectRecallKnowledge(message, flags);
  if (!isRecallKnowledge) return;
  
  // Check for critical failure
  const isCriticalFailure = detectCriticalFailure(message, flags);
  if (!isCriticalFailure) return;
  
  // Get the target creature
  const target = await getTargetCreature(message, flags);
  if (!target) return;
  
  // Get the player who made the check
  const player = game.users.get(userId);
  const playerName = player?.name || 'Unknown';
  
  console.log(`${MODULE_ID} | Detected Recall Knowledge critical failure on ${target.name} by ${playerName}`);
  
  // Generate fake info
  try {
    await generateFakeInfo(target, {
      triggerType: 'critical-fail',
      playerId: userId,
      playerName: playerName
    });
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to generate fake info:`, error);
  }
}

/**
 * Detect if a message is a Recall Knowledge check
 * @param {ChatMessage} message - The chat message
 * @param {Object} flags - PF2e flags from the message
 * @returns {boolean} True if this is a Recall Knowledge check
 */
function detectRecallKnowledge(message, flags) {
  // Method 1: Check for action context
  const context = flags.context;
  if (context?.type === 'skill-check') {
    const options = context.options || [];
    // Check for recall-knowledge in options or traits
    if (options.includes('action:recall-knowledge') || 
        options.includes('recall-knowledge') ||
        options.some(o => o.includes('recall-knowledge'))) {
      return true;
    }
  }
  
  // Method 2: Check modifiers for recall knowledge trait
  const modifiers = flags.modifiers || [];
  for (const mod of modifiers) {
    if (mod.slug?.includes('recall-knowledge')) {
      return true;
    }
  }
  
  // Method 3: Check the origin action
  const origin = flags.origin;
  if (origin?.type === 'action') {
    const actionSlug = origin.slug || '';
    if (actionSlug === 'recall-knowledge' || actionSlug.includes('recall-knowledge')) {
      return true;
    }
  }
  
  // Method 4: Check message content for Recall Knowledge text
  const content = message.content?.toLowerCase() || '';
  if (content.includes('recall knowledge')) {
    // Additional check: make sure it's a roll, not just a mention
    if (message.rolls && message.rolls.length > 0) {
      return true;
    }
  }
  
  // Method 5: Check for specific skill checks that are commonly used for RK
  const skillSlugs = ['arcana', 'nature', 'occultism', 'religion', 'society', 'crafting'];
  if (context?.type === 'skill-check' && skillSlugs.includes(context.skill)) {
    // This is a skill check with a RK-associated skill
    // Check if there's a target to confirm it's likely RK
    if (flags.target || context.target) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if a roll resulted in a critical failure
 * @param {ChatMessage} message - The chat message
 * @param {Object} flags - PF2e flags from the message
 * @returns {boolean} True if this is a critical failure
 */
function detectCriticalFailure(message, flags) {
  // Method 1: Check context outcome
  const context = flags.context;
  if (context?.outcome === 'criticalFailure') {
    return true;
  }
  
  // Method 2: Check the roll's degree of success
  const rolls = message.rolls || [];
  for (const roll of rolls) {
    // PF2e stores degree of success on the roll
    if (roll.degreeOfSuccess === 0) {
      return true;
    }
    // Also check options/flags on the roll
    if (roll.options?.degreeOfSuccess === 0 || roll.options?.outcome === 'criticalFailure') {
      return true;
    }
  }
  
  // Method 3: Check message flags directly
  if (flags.outcome === 'criticalFailure' || flags.degreeOfSuccess === 0) {
    return true;
  }
  
  // Method 4: Parse the message content for degree of success display
  const content = message.content?.toLowerCase() || '';
  if (content.includes('critical failure') || content.includes('criticalfailure')) {
    return true;
  }
  
  return false;
}

/**
 * Get the target creature from a Recall Knowledge check
 * @param {ChatMessage} message - The chat message
 * @param {Object} flags - PF2e flags from the message
 * @returns {Promise<Actor|null>} The target creature actor, or null
 */
async function getTargetCreature(message, flags) {
  // Method 1: Check flags for target
  const targetInfo = flags.target;
  if (targetInfo?.actor) {
    const actor = game.actors.get(targetInfo.actor);
    if (actor?.type === 'npc') {
      return actor;
    }
  }
  
  // Method 2: Check context for target
  const context = flags.context;
  if (context?.target?.actor) {
    const actor = game.actors.get(context.target.actor);
    if (actor?.type === 'npc') {
      return actor;
    }
  }
  
  // Method 3: Check for target in message data
  if (message.speaker?.token) {
    // The speaker is making the check; look for targets
    const token = canvas.tokens?.get(message.speaker.token);
    if (token) {
      // Get the user's targets at the time of the roll
      const targets = game.user.targets;
      for (const target of targets) {
        if (target.actor?.type === 'npc') {
          return target.actor;
        }
      }
    }
  }
  
  // Method 4: Check for DC from creature
  if (flags.dc?.slug && flags.dc.actor) {
    const actor = game.actors.get(flags.dc.actor);
    if (actor?.type === 'npc') {
      return actor;
    }
  }
  
  // Method 5: Try to find from origin
  const origin = flags.origin;
  if (origin?.actor) {
    // This is usually the roller, not the target
    // But check anyway
    const actor = game.actors.get(origin.actor);
    if (actor?.type === 'npc') {
      return actor;
    }
  }
  
  return null;
}
