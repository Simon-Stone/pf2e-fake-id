/**
 * PF2e Fake ID - GM Whisper Message Handling
 * 
 * Creates and manages whisper messages to the GM.
 */

import { MODULE_ID } from '../settings.js';

/**
 * Send a whisper message to the GM with fake creature information
 * @param {Object} data - Message data
 * @param {string} data.creatureName - Name of the creature
 * @param {string} data.creatureId - ID of the creature actor
 * @param {string} data.triggerType - 'manual' or 'critical-fail'
 * @param {string} [data.playerId] - ID of the triggering player
 * @param {string} [data.playerName] - Name of the triggering player
 * @param {string} [data.content] - The generated fake information
 * @param {boolean} [data.isLoading] - Whether content is still loading
 * @returns {Promise<string>} The created message ID
 */
export async function sendGMWhisper(data) {
  const {
    creatureName,
    creatureId,
    triggerType,
    playerId = null,
    playerName = null,
    content = null,
    isLoading = false
  } = data;

  const triggerLabel = triggerType === 'critical-fail' 
    ? game.i18n.localize('PF2E_FAKE_ID.Chat.TriggerType.CriticalFail')
    : game.i18n.localize('PF2E_FAKE_ID.Chat.TriggerType.Manual');

  const htmlContent = buildWhisperHTML({
    creatureName,
    creatureId,
    triggerType: triggerLabel,
    playerId,
    playerName,
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
        triggerType,
        playerId,
        playerName,
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

  const triggerLabel = flags.triggerType === 'critical-fail'
    ? game.i18n.localize('PF2E_FAKE_ID.Chat.TriggerType.CriticalFail')
    : game.i18n.localize('PF2E_FAKE_ID.Chat.TriggerType.Manual');

  const htmlContent = buildWhisperHTML({
    creatureName: flags.creatureName,
    creatureId: flags.creatureId,
    triggerType: triggerLabel,
    playerId: flags.playerId,
    playerName: flags.playerName,
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
    triggerType,
    playerId,
    playerName,
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
    // Convert markdown-style bullets to HTML list
    const formattedContent = formatContentAsHTML(content);
    contentHTML = `
      <div class="fake-info">
        ${formattedContent}
      </div>
    `;
  }

  // Build share button text
  const shareToPlayerText = playerName 
    ? game.i18n.format('PF2E_FAKE_ID.Chat.Buttons.ShareToPlayer', { name: playerName })
    : game.i18n.localize('PF2E_FAKE_ID.Chat.Buttons.ShareToAll');

  return `
    <div class="pf2e-fake-id-whisper" data-creature-id="${creatureId}" data-player-id="${playerId || ''}">
      <header>
        <h3><i class="fas fa-mask"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Title')}</h3>
        <span class="creature-name">${creatureName}</span>
        <span class="trigger-type">${triggerType}</span>
      </header>
      
      ${contentHTML}
      
      <footer>
        ${playerId ? `
          <button class="share-to-player" data-player-id="${playerId}" ${isLoading || isError ? 'disabled' : ''}>
            <i class="fas fa-share"></i> ${shareToPlayerText}
          </button>
        ` : ''}
        <button class="share-to-all" ${isLoading || isError ? 'disabled' : ''}>
          <i class="fas fa-bullhorn"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Buttons.ShareToAll')}
        </button>
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
 * Format plain text/markdown content as HTML
 */
function formatContentAsHTML(content) {
  if (!content) return '';
  
  // Split into lines and process
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check if content looks like a list
  const isList = lines.every(line => 
    line.trim().startsWith('•') || 
    line.trim().startsWith('-') || 
    line.trim().startsWith('*') ||
    line.trim().match(/^\d+\./)
  );
  
  if (isList) {
    const items = lines.map(line => {
      // Remove bullet characters
      const text = line.trim().replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
      return `<li>${text}</li>`;
    });
    return `<ul>${items.join('')}</ul>`;
  }
  
  // Otherwise, treat as paragraphs
  return lines.map(line => `<p>${line}</p>`).join('');
}

/**
 * Share fake information to chat (visible to players)
 * @param {string} content - The fake information to share
 * @param {string} creatureName - The creature name
 * @param {string[]} [whisperTo] - Array of user IDs to whisper to, or empty for public
 */
export async function shareToChat(content, creatureName, whisperTo = []) {
  const formattedContent = formatContentAsHTML(content);
  
  const htmlContent = `
    <div class="pf2e-fake-id-shared">
      <header>
        <h3><i class="fas fa-book"></i> ${game.i18n.localize('PF2E_FAKE_ID.Chat.Title')}</h3>
        <span class="creature-name">${creatureName}</span>
      </header>
      <div class="recall-info">
        ${formattedContent}
      </div>
    </div>
  `;

  await ChatMessage.create({
    content: htmlContent,
    whisper: whisperTo,
    speaker: { alias: game.i18n.localize('PF2E_FAKE_ID.Chat.Title') }
  });

  ui.notifications.info(game.i18n.localize('PF2E_FAKE_ID.Notifications.Shared'));
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

    if (button.classList.contains('share-to-player')) {
      const playerId = button.dataset.playerId;
      if (fakeContent && playerId) {
        await shareToChat(fakeContent, creatureName, [playerId]);
      }
    } else if (button.classList.contains('share-to-all')) {
      if (fakeContent) {
        await shareToChat(fakeContent, creatureName, []);
      }
    } else if (button.classList.contains('copy-to-clipboard')) {
      if (fakeContent) {
        await navigator.clipboard.writeText(fakeContent);
        ui.notifications.info(game.i18n.localize('PF2E_FAKE_ID.Notifications.Copied'));
      }
    } else if (button.classList.contains('regenerate')) {
      // Import dynamically to avoid circular dependency
      const { regenerateFakeInfo } = await import('../generation/generator.js');
      await regenerateFakeInfo(messageId, creatureId, {
        triggerType: flags.triggerType,
        playerId: flags.playerId,
        playerName: flags.playerName
      });
    }
  });
}
