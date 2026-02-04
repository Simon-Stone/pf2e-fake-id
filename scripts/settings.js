/**
 * PF2e Fake ID - Settings Registration
 */

export const MODULE_ID = 'pf2e-fake-id';

// Default prompt template
const DEFAULT_PROMPT = `You are a mischievous sage who enjoys spreading plausible but incorrect information about monsters. An adventurer has critically failed their attempt to recall knowledge about a creature.

CREATURE FACTS (DO NOT REVEAL THESE - USE THEM TO CREATE CONVINCING LIES):
Name: {{name}}
Level: {{level}}
Type: {{traits}}
Weaknesses: {{weaknesses}}
Resistances: {{resistances}}
Immunities: {{immunities}}
Notable Abilities: {{abilities}}
Notes/Description: {{notes}}

Generate 2-3 pieces of FALSE information that:
1. Sound believable and authoritative
2. Could lead to poor tactical decisions
3. Invert or twist the actual facts (e.g., if immune to fire, claim it's weak to fire)
4. Match the tone of Pathfinder 2e lore
5. Consider the creature's notes/description to add flavor to your misinformation

Format your response as bullet points a GM could read aloud.
Do not include any meta-commentary or disclaimers.
All information should be in keeping with the terminology of the Remaster of the Second Edition of the Pathfinder Roleplaying Game.
`;

/**
 * Register all module settings
 */
export function registerSettings() {
  // API Endpoint
  game.settings.register(MODULE_ID, 'apiEndpoint', {
    name: 'PF2E_FAKE_ID.Settings.ApiEndpoint.Name',
    hint: 'PF2E_FAKE_ID.Settings.ApiEndpoint.Hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'https://api.openai.com/v1',
  });

  // API Key
  game.settings.register(MODULE_ID, 'apiKey', {
    name: 'PF2E_FAKE_ID.Settings.ApiKey.Name',
    hint: 'PF2E_FAKE_ID.Settings.ApiKey.Hint',
    scope: 'world',
    config: true,
    type: String,
    default: '',
  });

  // Model
  game.settings.register(MODULE_ID, 'model', {
    name: 'PF2E_FAKE_ID.Settings.Model.Name',
    hint: 'PF2E_FAKE_ID.Settings.Model.Hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'gpt-4o-mini',
  });

  // Custom prompt template - hidden from default config, shown in custom menu
  game.settings.register(MODULE_ID, 'promptTemplate', {
    name: 'PF2E_FAKE_ID.Settings.PromptTemplate.Name',
    hint: 'PF2E_FAKE_ID.Settings.PromptTemplate.Hint',
    scope: 'world',
    config: false, // Hidden from default menu, will use custom menu
    type: String,
    default: DEFAULT_PROMPT,
  });

  // Register custom settings menu for prompt template
  game.settings.registerMenu(MODULE_ID, 'promptTemplateMenu', {
    name: 'PF2E_FAKE_ID.Settings.PromptTemplate.Name',
    label: 'PF2E_FAKE_ID.Settings.PromptTemplate.Button',
    hint: 'PF2E_FAKE_ID.Settings.PromptTemplate.Hint',
    icon: 'fas fa-edit',
    type: PromptTemplateConfig,
    restricted: true
  });
}

/**
 * Custom configuration form for the prompt template
 */
class PromptTemplateConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('PF2E_FAKE_ID.Settings.PromptTemplate.Name'),
      id: 'pf2e-fake-id-prompt-config',
      template: 'modules/pf2e-fake-id/templates/prompt-config.html',
      width: 720,
      height: 600,
      closeOnSubmit: true,
      resizable: true
    });
  }

  getData() {
    return {
      promptTemplate: getSetting('promptTemplate'),
      defaultPrompt: DEFAULT_PROMPT
    };
  }

  async _updateObject(event, formData) {
    await setSetting('promptTemplate', formData.promptTemplate);
    ui.notifications.info(game.i18n.localize('PF2E_FAKE_ID.Settings.PromptTemplate.Saved'));
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('button[name="reset"]').click(async (event) => {
      event.preventDefault();
      const textarea = html.find('textarea[name="promptTemplate"]');
      textarea.val(DEFAULT_PROMPT);
    });
  }
}

/**
 * Get a setting value
 * @param {string} key - The setting key
 * @returns {*} The setting value
 */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

/**
 * Set a setting value
 * @param {string} key - The setting key
 * @param {*} value - The value to set
 */
export async function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}

/**
 * Get the default prompt template
 * @returns {string} The default prompt
 */
export function getDefaultPrompt() {
  return DEFAULT_PROMPT;
}
