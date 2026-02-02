/**
 * PF2e Fake ID - Unified LLM Client
 * 
 * Supports any OpenAI-compatible API endpoint (OpenAI, Ollama, OpenRouter, etc.)
 */

import { getSetting, MODULE_ID } from './settings.js';

/**
 * LLM Client for making chat completion requests
 */
export class LLMClient {
  /**
   * Generate a completion from the LLM
   * @param {string} prompt - The user prompt to send
   * @param {string} [systemPrompt] - Optional system prompt
   * @returns {Promise<string>} The generated text
   */
  static async generate(prompt, systemPrompt = null) {
    const endpoint = getSetting('apiEndpoint');
    const apiKey = getSetting('apiKey');
    const model = getSetting('model');

    if (!endpoint) {
      throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NoApiEndpoint'));
    }

    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: model,
      messages: messages,
      temperature: 0.8,
      max_tokens: 500
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if API key is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(game.i18n.format('PF2E_FAKE_ID.Errors.ApiError', { error: errorMessage }));
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.InvalidResponse'));
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(game.i18n.localize('PF2E_FAKE_ID.Errors.NetworkError'));
      }
      throw error;
    }
  }

  /**
   * Check if the LLM client is properly configured
   * @returns {boolean} True if configured
   */
  static isConfigured() {
    const endpoint = getSetting('apiEndpoint');
    return Boolean(endpoint);
  }

  /**
   * Test the connection to the LLM API
   * @returns {Promise<boolean>} True if connection successful
   */
  static async testConnection() {
    try {
      const response = await this.generate('Say "Connection successful" in exactly those words.');
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error(`${MODULE_ID} | Connection test failed:`, error);
      return false;
    }
  }
}
