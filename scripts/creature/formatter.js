/**
 * PF2e Fake ID - Creature Data Formatter
 * 
 * Formats extracted creature data for use in prompts.
 */

/**
 * Format creature data into template variables
 * @param {Object} creatureData - Data from extractor
 * @returns {Object} Formatted template variables
 */
export function formatCreatureForPrompt(creatureData) {
  if (!creatureData) {
    return {
      name: 'Unknown Creature',
      level: '?',
      traits: 'unknown',
      weaknesses: 'none known',
      resistances: 'none known',
      immunities: 'none known',
      abilities: 'none known',
      notes: 'none'
    };
  }

  return {
    name: creatureData.name,
    level: String(creatureData.level),
    traits: formatTraits(creatureData.traits, creatureData.rarity),
    weaknesses: formatWeaknesses(creatureData.defenses?.weaknesses),
    resistances: formatResistances(creatureData.defenses?.resistances),
    immunities: formatImmunities(creatureData.defenses?.immunities),
    abilities: formatAbilities(creatureData.abilities, creatureData.offenses?.attacks),
    notes: creatureData.description || 'none'
  };
}

/**
 * Format traits list
 */
function formatTraits(traits, rarity) {
  const allTraits = [];
  
  if (rarity && rarity !== 'common') {
    allTraits.push(rarity);
  }
  
  if (traits && traits.length > 0) {
    allTraits.push(...traits);
  }
  
  if (allTraits.length === 0) {
    return 'no special traits';
  }
  
  return allTraits.join(', ');
}

/**
 * Format weaknesses
 */
function formatWeaknesses(weaknesses) {
  if (!weaknesses || weaknesses.length === 0) {
    return 'none';
  }
  
  return weaknesses.map(w => {
    let str = `${w.type} ${w.value}`;
    if (w.exceptions && w.exceptions.length > 0) {
      str += ` (except ${w.exceptions.join(', ')})`;
    }
    return str;
  }).join(', ');
}

/**
 * Format resistances
 */
function formatResistances(resistances) {
  if (!resistances || resistances.length === 0) {
    return 'none';
  }
  
  return resistances.map(r => {
    let str = `${r.type} ${r.value}`;
    if (r.exceptions && r.exceptions.length > 0) {
      str += ` (except ${r.exceptions.join(', ')})`;
    }
    return str;
  }).join(', ');
}

/**
 * Format immunities
 */
function formatImmunities(immunities) {
  if (!immunities || immunities.length === 0) {
    return 'none';
  }
  
  return immunities.join(', ');
}

/**
 * Format abilities and attacks
 */
function formatAbilities(abilities, attacks) {
  const parts = [];
  
  // Add notable attacks
  if (attacks && attacks.length > 0) {
    const attackNames = attacks.slice(0, 3).map(a => {
      const traits = a.traits?.length > 0 ? ` (${a.traits.slice(0, 2).join(', ')})` : '';
      return `${a.name}${traits}`;
    });
    parts.push(`Attacks: ${attackNames.join(', ')}`);
  }
  
  // Add special abilities
  if (abilities && abilities.length > 0) {
    const abilityNames = abilities.slice(0, 5).map(a => {
      const actionType = a.actionType === 'reaction' ? ' (reaction)' : 
                         a.actionType === 'free' ? ' (free)' : '';
      return `${a.name}${actionType}`;
    });
    parts.push(`Special: ${abilityNames.join(', ')}`);
  }
  
  if (parts.length === 0) {
    return 'standard creature abilities';
  }
  
  return parts.join('; ');
}

/**
 * Create a summary string of the creature
 */
export function createCreatureSummary(creatureData) {
  if (!creatureData) {
    return 'Unknown creature';
  }
  
  const parts = [creatureData.name];
  
  if (creatureData.level) {
    parts.push(`Level ${creatureData.level}`);
  }
  
  if (creatureData.traits && creatureData.traits.length > 0) {
    parts.push(creatureData.traits.slice(0, 3).join(', '));
  }
  
  return parts.join(' - ');
}
