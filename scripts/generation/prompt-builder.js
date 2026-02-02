/**
 * PF2e Fake ID - Prompt Builder
 * 
 * Builds prompts from templates and creature data.
 */

import { getSetting, getDefaultPrompt } from '../settings.js';
import { formatCreatureForPrompt } from '../creature/formatter.js';

/**
 * Build a prompt for generating fake creature information
 * @param {Object} creatureData - Extracted creature data
 * @returns {string} The formatted prompt
 */
export function buildPrompt(creatureData) {
  const template = getSetting('promptTemplate') || getDefaultPrompt();
  const variables = formatCreatureForPrompt(creatureData);
  
  return applyTemplate(template, variables);
}

/**
 * Apply variables to a template string
 * Uses Handlebars-style {{variable}} syntax
 * @param {string} template - The template string
 * @param {Object} variables - Key-value pairs to substitute
 * @returns {string} The processed template
 */
function applyTemplate(template, variables) {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * Get a system prompt for the LLM
 * @returns {string} The system prompt
 */
export function getSystemPrompt() {
  return `You are an expert in fantasy monster lore, specifically for the Pathfinder 2e roleplaying game. Your task is to generate plausible-sounding but FALSE information about creatures. This information will be given to players whose characters critically failed a Recall Knowledge check, so it should be believable enough to potentially influence their tactics, but incorrect in ways that could lead to interesting gameplay situations.

Key guidelines:
- Never break character or include disclaimers
- Make the false information sound authoritative and specific
- Prefer tactical misinformation (wrong weaknesses, fake resistances, etc.)
- Keep responses concise - 2-3 bullet points maximum
- Write in a style appropriate for a fantasy scholar or bestiary`;
}

/**
 * Preview how a prompt will look with sample data
 * @returns {string} Preview prompt
 */
export function getPromptPreview() {
  const sampleData = {
    name: 'Adult Red Dragon',
    level: '14',
    traits: 'dragon, fire',
    weaknesses: 'cold 15',
    resistances: 'none',
    immunities: 'fire, paralyzed, sleep',
    abilities: 'Attacks: Jaws (reach), Claw, Tail; Special: Breath Weapon (fire), Frightful Presence, Wing Deflection (reaction)'
  };
  
  const template = getSetting('promptTemplate') || getDefaultPrompt();
  return applyTemplate(template, sampleData);
}
