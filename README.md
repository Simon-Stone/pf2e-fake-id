# PF2e Fake ID

A Foundry VTT module for the Pathfinder 2e system that generates plausible but incorrect creature information using LLM integration. Perfect for handling critical failures on Recall Knowledge checks!

## Features

- **LLM-Powered Generation**: Uses OpenAI-compatible APIs (OpenAI, Ollama, OpenRouter, etc.) to generate believable misinformation
- **Automatic Triggers**: Automatically generates fake info when players critically fail Recall Knowledge checks
- **Manual Generation**: Button directly on NPC sheets in the Recall Knowledge section for easy access
- **GM Whispers**: All generated content is whispered to the GM first for review
- **Easy Sharing**: One-click buttons to share the fake info to specific players or everyone
- **Customizable Prompts**: Modify the prompt template to suit your game's tone

## Requirements

- Foundry VTT v12 or later
- PF2e System v6.0.0 or later
- An OpenAI-compatible API endpoint (OpenAI, Ollama, etc.)

## Installation

### Method 1: Manifest URL (Recommended for Cloud-Hosted Foundry)
1. Open Foundry VTT
2. Go to **Add-on Modules → Install Module**
3. Paste this manifest URL:
   ```
   https://github.com/Simon-Stone/pf2e-fake-id/releases/latest/download/module.json
   ```
4. Click **Install**
5. Enable the module in your world

### Method 2: Foundry Module Browser
1. Open Foundry VTT
2. Go to Add-on Modules → Install Module
3. Search for "PF2e Fake ID"
4. Click Install

### Method 3: Manual Installation
1. Download the latest release ZIP from [GitHub Releases](https://github.com/Simon-Stone/pf2e-fake-id/releases)
2. Extract to your `Data/modules/pf2e-fake-id` folder
3. Restart Foundry VTT
4. Enable the module in your world

## Configuration

### Setting Up the LLM

1. Go to **Game Settings → Module Settings → PF2e Fake ID**
2. Configure your API settings:

| Setting | Description |
|---------|-------------|
| **API Endpoint** | The base URL for your LLM API |
| **API Key** | Your API key (leave empty for local models) |
| **Model** | The model name to use |

### Example Configurations

#### OpenAI
```
API Endpoint: https://api.openai.com/v1
API Key: sk-your-api-key-here
Model: gpt-4o-mini
```

#### Ollama (Local)
```
API Endpoint: http://localhost:11434/v1
API Key: (leave empty)
Model: llama3.2
```

#### OpenRouter
```
API Endpoint: https://openrouter.ai/api/v1
API Key: sk-or-your-key-here
Model: anthropic/claude-3-haiku
```

## Usage

### Automatic Mode (Default)

When enabled, the module automatically detects when a player critically fails a Recall Knowledge check:

1. Player targets a creature
2. Player attempts Recall Knowledge and critically fails
3. The GM receives a whisper with generated false information
4. GM can review and share the info with the player

### Manual Mode

To manually generate fake information for any NPC:

1. Open the NPC's actor sheet
2. Look for the **Recall Knowledge** section
3. Click the "Generate Fake Recall Knowledge" button next to "Attempts"
4. The GM receives a whisper with generated false information

The button appears directly in the sheet's Recall Knowledge section header for convenient access while reviewing creature information.

### Sharing Information

When you receive a fake info whisper, you have several options:

- **Share to Player**: Sends the fake info only to the player who failed the check
- **Share to All**: Broadcasts the fake info to the entire chat
- **Copy**: Copies the text to your clipboard for manual sharing
- **Regenerate**: Generate new fake information for the same creature

## Customizing the Prompt

You can customize the prompt template in the module settings. Available placeholders:

| Placeholder | Description |
|-------------|-------------|
| `{{name}}` | Creature's name |
| `{{level}}` | Creature's level |
| `{{traits}}` | Creature's traits |
| `{{weaknesses}}` | Known weaknesses |
| `{{resistances}}` | Known resistances |
| `{{immunities}}` | Known immunities |
| `{{abilities}}` | Notable abilities and attacks |

### Example Custom Prompt

```
A scholar has critically failed to identify a {{name}}. Generate 2 false facts:
- One about its weaknesses (actual: {{weaknesses}})
- One about its abilities (actual: {{abilities}})
Make them sound believable but tactically misleading.
```

## Tips for GMs

1. **Review before sharing**: Always read the generated content first to ensure it fits your game
2. **Adjust the severity**: The default prompt generates tactically misleading info. Modify it for more or less impactful misinformation
3. **Regenerate freely**: If the first result doesn't fit, just regenerate
4. **Combine with roleplay**: Embellish the fake info with NPC delivery for extra immersion

## Troubleshooting

### "No API endpoint configured"
Make sure you've set up the API Endpoint in module settings.

### "Network error"
- Check that your API endpoint URL is correct
- For local models (Ollama), ensure the server is running
- Check for CORS issues if using a custom endpoint

### "Invalid response"
The API returned unexpected data. Check your model name is correct.

### Module doesn't detect Recall Knowledge
The detection relies on PF2e system flags. Ensure you're:
- Using the Recall Knowledge action from the compendium
- Targeting a creature before rolling

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Credits

- Created for the Foundry VTT and PF2e community
- Uses the OpenAI Chat Completions API format
