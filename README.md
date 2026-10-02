# PebbleAI-Plus

AI-powered voice assistant for Pebble smartwatches. Speak a query on the watch, send it to an AI provider (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, or Grok), and read the response on the watch.

This project is a fork of [PebbleAI](https://github.com/huntboom/PebbleAI) by huntboom.

## Rebble Store

A Rebble Store listing will be added after the first upload. Until then, install from [Rebble Store](https://apps.rebble.io/en_US/application/6ac019ae4412b300094eb9ac) or build from source.

## Getting Started

You need a [Rebble subscription](https://auth.rebble.io/account/) for voice dictation and an API key for your chosen provider.

### Installation

1. **GitHub Releases (recommended until the store listing is live)**
   - Download the latest `.pbw` from [Releases](https://github.com/JagerSprinkles/PebbleAI-Plus/releases).
   - Install it with the Pebble / Rebble app on your phone.

2. **Manual build**
   - Clone [PebbleAI-Plus](https://github.com/JagerSprinkles/PebbleAI-Plus).
   - Import the project into the Pebble SDK.
   - Build the project and install the `.pbw` on your watch.

   See the [Pebble development docs](https://developer.rebble.io/developer.pebble.com/tutorials/watchface-tutorial/part1/index.html) for setup help.

### Usage

1. Open PebbleAI-Plus on your watch.
2. Press **Select** to start dictation (or tap on touch-capable watches).
3. Speak your query.
4. Wait for the AI response on the watch.

Long-press **Select** to open the on-watch settings menu.

### Configuration

Configure the app in two places:

- **Phone** (Pebble / Rebble app → PebbleAI-Plus → Settings): API provider, API keys, model choices, system prompt, temperature, vibrate, confirm transcription, invert colors, show model name. Stored on the phone and used for API calls.
- **Watch** (long-press Select → Save Settings): vibrate, confirm transcription, invert colors, and API provider. Stored on the watch.

Settings:

1. API provider (OpenAI, Claude, Gemini, DeepSeek, or Grok)
2. API key for the selected provider
3. Model selection (OpenAI, Claude, Gemini, Grok; Claude and Gemini also support a custom model ID)
4. System prompt (OpenAI-compatible providers)
5. Temperature
6. Vibration on response
7. Confirm transcription before sending
8. Invert colors (light / dark)
9. Display model name at the start of messages

Set the correct API key for your provider before you use the app.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Contributing

Contributions are welcome. Open a pull request against [PebbleAI-Plus](https://github.com/JagerSprinkles/PebbleAI-Plus).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
