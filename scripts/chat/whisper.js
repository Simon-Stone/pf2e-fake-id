/**
 * PF2e Fake ID - GM Whisper Message Handling
 *
 * Creates and manages whisper messages to the GM.
 */

import { MODULE_ID } from '../settings.js';
import { parseMarkdown } from '../utils/markdown-parser.js';

/**
 * Send a whisper message to the GM with fake creature information
 * @param {Object} data - Message data
 * @param {string} data.creatureName - Name of the creature
 * @param {string} data.creatureId - ID of the creature actor
 * @param {string} [data.content] - The generated fake information
 * @param {boolean} [data.isLoading] - Whether content is still loading
 * @returns {Promise<string>} The created message ID
 */
export async function sendGMWhisper(data) {
  const {
    creatureName,
    creatureId,
    content = null,
    isLoading = false
  } = data;

  const htmlContent = buildWhisperHTML({
    creatureName,
    creatureId,
    content,
    isLoading,
    isError: false
  });

  // Create the chat message
  const message = await ChatMessage.create({
    content: htmlContent,
    whisper: [game.user.id], // Whisper to self (GM)
    speaker: { alias: game.i18n.localize('PF2E_FAKE_ID.Chat.Title') },
    flags: {
      [MODULE_ID]: {
        creatureId,
        creatureName,
        fakeContent: content
      }
    }
  });

  return message.id;
}

/**
 * Update an existing whisper message with new content
 * @param {string} messageId - The message ID to update
 * @param {Object} updates - Update data
 * @param {string} [updates.content] - New content
 * @param {boolean} [updates.isLoading] - Loading state
 * @param {boolean} [updates.isError] - Error state
 */
export async function updateWhisperContent(messageId, updates) {
  const message = game.messages.get(messageId);
  if (!message) return;

  const flags = message.flags[MODULE_ID] || {};
  const { content, isLoading = false, isError = false } = updates;

  const htmlContent = buildWhisperHTML({
    creatureName: flags.creatureName,
    creatureId: flags.creatureId,
    content,
    isLoading,
    isError
  });

  await message.update({
    content: htmlContent,
    flags: {
      [MODULE_ID]: {
        ...flags,
        fakeContent: isError ? null : content
      }
    }
  });
}

/**
 * Build the HTML for a whisper message
 */
function buildWhisperHTML(data) {
  const {
    creatureName,
    creatureId,
    content,
    isLoading,
    isError
  } = data;

  let contentHTML;
  
  if (isLoading) {
    contentHTML = `
      <div class="fake-info loading">
        <i class="fas fa-spinner"></i>
        ${game.i18n.format('PF2E_FAKE_ID.Chat.GeneratingFor', { name: creatureName })}
      </div>
    `;
  } else if (isError) {
    contentHTML = `
      <div class="fake-info error">
        <i class="fas fa-exclamation-triangle"></i>
        ${content}
      </div>
    `;
  } else {
    // Parse markdown content into Foundry-compatible HTML
    const formattedContent = parseMarkdown(content);
    contentHTML = `
      <div class="fake-info">
        ${formattedContent}
      </div>
    `;
  }

  return `
    <div class="pf2e-fake-id-whisper" data-creature-id="${creatureId}">
      <header>
        <h3><i class="fas fa-mask"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Title')}</h3>
        <span class="creature-name">${creatureName}</span>
      </header>
      
      ${contentHTML}
      
      <footer>
        <button class="copy-to-clipboard" ${isLoading || isError ? 'disabled' : ''}>
          <i class="fas fa-copy"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Buttons.Copy')}
        </button>
        <button class="regenerate" ${isLoading ? 'disabled' : ''}>
          <i class="fas fa-sync"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Buttons.Regenerate')}
        </button>
      </footer>
    </div>
  `;
}


/**
 * Register click handlers for whisper message buttons
 */
export function registerWhisperButtonHandlers() {
  // Use native event delegation on the document (Foundry v12+ compatibility)
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.pf2e-fake-id-whisper button');
    if (!button) return;
    
    event.preventDefault();
    const whisperEl = button.closest('.pf2e-fake-id-whisper');
    const messageEl = button.closest('.chat-message');
    
    if (!whisperEl || !messageEl) return;
    
    const messageId = messageEl.dataset.messageId;
    const message = game.messages.get(messageId);
    if (!message) return;
    
    const flags = message.flags[MODULE_ID] || {};
    const creatureId = whisperEl.dataset.creatureId;
    const fakeContent = flags.fakeContent;
    const creatureName = flags.creatureName;

    if (button.classList.contains('copy-to-clipboard')) {
      if (fakeContent) {
        await navigator.clipboard.writeText(fakeContent);
        ui.notifications.info(game.i18n.localize('PF2E_FAKE_ID.Notifications.Copied'));
      }
    } else if (button.classList.contains('regenerate')) {
      // Import dynamically to avoid circular dependency
      const { regenerateFakeInfo } = await import('../generation/generator.js');
      await regenerateFakeInfo(messageId, creatureId);
    }
  });
}
