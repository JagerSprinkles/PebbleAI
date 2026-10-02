# Changelog

All notable changes to PebbleAI-Plus are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project starts at version 1.0.0 as a fork of [PebbleAI](https://github.com/huntboom/PebbleAI).

## [Unreleased]

### Added
- Per-provider system prompt fields for OpenAI, Claude, Gemini, DeepSeek, and Grok
- Default system prompt for short replies on a Pebble screen

### Changed
- Clay settings page groups each provider's options in one section
- Removed the shared `systemPrompt` message key
- Claude uses the top-level `system` request field
- Gemini uses the `systemInstruction` request field

## [1.0.0] - 2026-10-02

First release of the PebbleAI-Plus fork. Includes bug fixes, resource cleanup, and modernization for limited Pebble hardware.

### Added
- Claude model selector in Clay settings (Haiku 4.5 default, Sonnet 5, or custom model ID)
- `cleanup_transcription()` and `cleanup_messages()` for clean app exit
- User-visible error text when dictation fails
- Conversation history cap (20 messages) on the phone
- Config cache in PebbleKit JS to avoid repeated `localStorage` parses
- `get_settings_ptr()` for zero-copy settings access on hot UI paths
- Output token cap (512) across all API providers

### Changed
- Project renamed to **PebbleAI-Plus**
- Anthropic API version header updated to `2025-01-01`
- Default Claude model set to `claude-haiku-4-5`
- Dictation buffer size reduced from 20000 to 512
- AppMessage outbound buffer reduced from 4096 to 256 bytes
- Gemini `maxOutputTokens` reduced from 2048 to 512
- Provider switch from the watch clears conversation history

### Fixed
- Compound-literal undefined behavior in message handler registration
- Dictation session leak on failure and on repeated Select presses
- Incomplete `deinit` (AppMessage and dictation not cleaned up)
- OpenAI response handler missing HTTP status check
- Unregistered `AppKeyReady` AppMessage send
- Include guard name in `messages.h`
- Mixed tabs/spaces in Clay model list

### Performance
- Removed redundant `layer_set_frame` in `set_text()`
- Removed redundant `layer_mark_dirty` in `update_ui_colors()`
- `setting_names[]` marked `const` so strings can live in flash
- Strip-markdown regexes hoisted to module scope

[1.0.0]: https://github.com/JagerSprinkles/PebbleAI-Plus/releases/tag/v1.0.0
