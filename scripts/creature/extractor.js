/**
 * PF2e Fake ID - Creature Data Extractor
 * 
 * Extracts relevant data from PF2e creature actors for prompt context.
 */

import { MODULE_ID } from '../settings.js';

/**
 * Extract creature data from a PF2e actor
 * @param {Actor} actor - The PF2e actor (must be an NPC)
 * @returns {Object} Extracted creature data
 */
export function extractCreatureData(actor) {
  if (!actor || actor.type !== 'npc') {
    console.warn(`${MODULE_ID} | Invalid actor for extraction:`, actor);
    return null;
  }

  const system = actor.system;
  
  return {
    name: actor.name,
    level: system.details?.level?.value ?? 0,
    traits: extractTraits(actor),
    rarity: system.traits?.rarity ?? 'common',
    
    defenses: {
      ac: system.attributes?.ac?.value ?? 0,
      hp: system.attributes?.hp?.max ?? 0,
      immunities: extractImmunities(actor),
      resistances: extractResistances(actor),
      weaknesses: extractWeaknesses(actor),
      saves: extractSaves(actor)
    },
    
    offenses: {
      attacks: extractAttacks(actor),
      speeds: extractSpeeds(actor)
    },
    
    abilities: extractAbilities(actor),
    spells: extractSpells(actor),
    
    description: extractDescription(actor)
  };
}

/**
 * Extract traits from an actor
 */
function extractTraits(actor) {
  const traits = actor.system?.traits?.value ?? [];
  return traits.map(t => typeof t === 'string' ? t : t.value || String(t));
}

/**
 * Extract immunities
 */
function extractImmunities(actor) {
  const immunities = actor.system?.attributes?.immunities ?? [];
  return immunities.map(i => i.type || String(i));
}

/**
 * Extract resistances
 */
function extractResistances(actor) {
  const resistances = actor.system?.attributes?.resistances ?? [];
  return resistances.map(r => ({
    type: r.type || String(r),
    value: r.value ?? 0,
    exceptions: r.exceptions ?? []
  }));
}

/**
 * Extract weaknesses
 */
function extractWeaknesses(actor) {
  const weaknesses = actor.system?.attributes?.weaknesses ?? [];
  return weaknesses.map(w => ({
    type: w.type || String(w),
    value: w.value ?? 0,
    exceptions: w.exceptions ?? []
  }));
}

/**
 * Extract saving throws
 */
function extractSaves(actor) {
  const saves = actor.system?.saves ?? {};
  return {
    fortitude: saves.fortitude?.value ?? 0,
    reflex: saves.reflex?.value ?? 0,
    will: saves.will?.value ?? 0
  };
}

/**
 * Extract attacks from items
 */
function extractAttacks(actor) {
  const attacks = [];
  
  for (const item of actor.items) {
    if (item.type === 'melee' || item.type === 'ranged') {
      const attackData = {
        name: item.name,
        type: item.type,
        bonus: item.system?.bonus?.value ?? 0,
        damage: formatDamage(item.system?.damageRolls ?? {}),
        traits: item.system?.traits?.value ?? []
      };
      attacks.push(attackData);
    }
  }
  
  return attacks;
}

/**
 * Format damage rolls into a readable string
 */
function formatDamage(damageRolls) {
  const parts = [];
  
  for (const [key, roll] of Object.entries(damageRolls)) {
    if (roll.damage && roll.damageType) {
      parts.push(`${roll.damage} ${roll.damageType}`);
    }
  }
  
  return parts.join(' plus ') || 'unknown';
}

/**
 * Extract movement speeds
 */
function extractSpeeds(actor) {
  const speeds = actor.system?.attributes?.speed ?? {};
  const result = [];
  
  if (speeds.value) {
    result.push({ type: 'land', value: speeds.value });
  }
  
  for (const [type, data] of Object.entries(speeds.otherSpeeds ?? [])) {
    if (data.value) {
      result.push({ type: data.type || type, value: data.value });
    }
  }
  
  return result;
}

/**
 * Extract special abilities (actions, reactions, passives)
 */
function extractAbilities(actor) {
  const abilities = [];
  
  for (const item of actor.items) {
    if (item.type === 'action') {
      abilities.push({
        name: item.name,
        actionType: item.system?.actionType?.value ?? 'passive',
        actions: item.system?.actions?.value ?? null,
        description: stripHtml(item.system?.description?.value ?? '')
      });
    }
  }
  
  return abilities;
}

/**
 * Extract spells
 */
function extractSpells(actor) {
  const spells = [];
  
  for (const item of actor.items) {
    if (item.type === 'spell') {
      spells.push({
        name: item.name,
        level: item.system?.level?.value ?? 0,
        traditions: item.system?.traditions?.value ?? [],
        traits: item.system?.traits?.value ?? []
      });
    }
  }
  
  return spells;
}

/**
 * Extract description/lore text
 */
function extractDescription(actor) {
  const publicNotes = actor.system?.details?.publicNotes ?? '';
  const privateNotes = actor.system?.details?.privateNotes ?? '';
  const blurb = actor.system?.details?.blurb ?? '';
  
  // Prioritize the full narrative (publicNotes) over the brief tagline (blurb)
  const strippedNotes = stripHtml(publicNotes);
  let description = strippedNotes || blurb;
  
  return description;
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
