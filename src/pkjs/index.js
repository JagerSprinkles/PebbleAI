var Clay = require("pebble-clay");

// Set to true to enable console logging (e.g. in development).
var DEBUG = false;
function log() {
  if (DEBUG && typeof console !== "undefined" && console.log) {
    console.log.apply(console, arguments);
  }
}

/** Return a safe string for display; never undefined. APIs use different error shapes. */
function getErrorMessage(errorBody) {
  if (!errorBody) return "Unknown error";
  var e = errorBody.error;
  if (e) {
    if (typeof e === "string") return e;
    if (e.message) return e.message;
    if (e.code) return e.code;
  }
  if (errorBody.message) return errorBody.message;
  return "Unknown error";
}

// Configuration keys
var CONFIG_KEY = "config";
var API_KEY = "apiKey";
var MODEL = "model";
var TEMPERATURE = "temperature";
var API_PROVIDER = "apiProvider";

var DEFAULT_SYSTEM_PROMPT =
  "You are responding by text on a Pebble smart watch with a small screen. Keep your answer short and direct. Do not use markdown or other formatting. Use only spaces and new lines.";

// Cap conversation history to limit phone memory and API payload size.
var MAX_MESSAGES = 20;

// Cap API output so responses fit the 4096-byte AppMessage inbound buffer.
var MAX_OUTPUT_TOKENS = 512;

// Maintain conversation history
var messages = [];

// Cached Clay config; avoid JSON.parse(localStorage) on every API call.
var cachedConfig = null;

// Clay configuration
var clayConfig = [
  {
    type: "heading",
    defaultValue: "PebbleAI-Plus Configuration",
  },
  {
    type: "text",
    defaultValue:
      "To use PebbleAI-Plus you will need to provide your own API keys for the providers you want to use. " +
      "<br><br>" +
      "Please note that many API providers require users to add credits to their account before the API becomes usable. " +
      "Free tiers and credit availability vary by provider. " +
      "<br><br>" +
      "Voice dictation requires an active Rebble subscription. " +
      "You can subscribe at <a href='https://auth.rebble.io/account/'>auth.rebble.io</a>." +
      "<br><br>" +
      "You can get your API keys from the following links:" +
      "<ul>" +
      "<li><a href='https://platform.openai.com/account/api-keys'>OpenAI</a></li>" +
      "<li><a href='https://console.anthropic.com/settings/keys'>Claude</a></li>" +
      "<li><a href='https://aistudio.google.com/apikey'>Gemini</a></li>" +
      "<li><a href='https://platform.deepseek.com/api_keys'>DeepSeek</a></li>" +
      "<li><a href='https://console.x.ai/team/69c2fdaa-660d-4ced-ae27-ee80c8bd2e9b/api-keys'>Grok</a></li>" +
      "</ul>",
  },
  {
    type: "select",
    messageKey: "apiProvider",
    defaultValue: "openai",
    label: "API Provider",
    options: [
      {
        label: "OpenAI",
        value: "openai",
      },
      {
        label: "Claude",
        value: "claude",
      },
      {
        label: "Gemini",
        value: "gemini",
      },
      {
        label: "DeepSeek",
        value: "deepseek",
      },
      {
        label: "Grok",
        value: "grok",
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "OpenAI",
      },
      {
        type: "input",
        messageKey: "apiKey",
        label: "API key",
      },
      {
        type: "select",
        messageKey: "model",
        defaultValue: "gpt-5-nano",
        label: "Model",
        options: [
          {
            label: "GPT-5-nano",
            value: "gpt-5-nano",
          },
          {
            label: "GPT-5-mini",
            value: "gpt-5-mini",
          },
          {
            label: "GPT-4o-mini",
            value: "gpt-4o-mini",
          },
          {
            label: "GPT-4.1-mini",
            value: "gpt-4.1-mini",
          },
          {
            label: "GPT-4.1-nano",
            value: "gpt-4.1-nano",
          },
          {
            label: "GPT-3.5-turbo",
            value: "gpt-3.5-turbo",
          },
        ],
      },
      {
        type: "input",
        messageKey: "openaiSystemPrompt",
        defaultValue: DEFAULT_SYSTEM_PROMPT,
        label: "System prompt",
        description: "Context for how OpenAI should respond on the watch.",
      },
      {
        type: "slider",
        messageKey: "temperature",
        defaultValue: 1,
        label: "Temperature",
        description: "How creative the responses should be.",
        min: 0,
        max: 2,
        step: 0.1,
        attributes: {
          precision: 1,
          type: "number"
        }
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Claude",
      },
      {
        type: "input",
        messageKey: "claudeApiKey",
        label: "API key",
      },
      {
        type: "select",
        messageKey: "claudeModel",
        defaultValue: "claude-haiku-4-5",
        label: "Model",
        description: "Pick a current model. Choose \u201CCustom\u2026\u201D to type any model ID \u2014 handy when Anthropic retires a model and this list is out of date.",
        options: [
          { label: "Haiku 4.5 (cheapest, recommended)", value: "claude-haiku-4-5" },
          { label: "Sonnet 5", value: "claude-sonnet-5" },
          { label: "Custom\u2026", value: "custom" },
        ],
      },
      {
        type: "input",
        messageKey: "claudeModelCustom",
        label: "Custom model ID",
        description: "Only used when \u201CCustom\u2026\u201D is selected above. Enter the exact model ID, e.g. claude-haiku-4-5.",
        attributes: { placeholder: "claude-haiku-4-5" },
      },
      {
        type: "input",
        messageKey: "claudeSystemPrompt",
        defaultValue: DEFAULT_SYSTEM_PROMPT,
        label: "System prompt",
        description: "Context for how Claude should respond on the watch.",
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Gemini",
      },
      {
        type: "input",
        messageKey: "geminiApiKey",
        label: "API key",
      },
      {
        type: "select",
        messageKey: "geminiModel",
        defaultValue: "gemini-3.1-flash-lite",
        label: "Model",
        description: "Pick a current model. Choose \u201CCustom\u2026\u201D to type any model ID \u2014 handy when Google retires a model and this list is out of date.",
        options: [
          { label: "Gemini 3.1 Flash-Lite (cheapest, recommended)", value: "gemini-3.1-flash-lite" },
          { label: "Gemini 3.5 Flash-Lite", value: "gemini-3.5-flash-lite" },
          { label: "Gemini 3.8 Flash (balanced)", value: "gemini-3.8-flash" },
          { label: "Custom\u2026", value: "custom" },
        ],
      },
      {
        type: "input",
        messageKey: "geminiModelCustom",
        label: "Custom model ID",
        description: "Only used when \u201CCustom\u2026\u201D is selected above. Enter the exact model ID, e.g. gemini-3.1-pro.",
        attributes: { placeholder: "gemini-3.1-flash-lite" },
      },
      {
        type: "input",
        messageKey: "geminiSystemPrompt",
        defaultValue: DEFAULT_SYSTEM_PROMPT,
        label: "System prompt",
        description: "Context for how Gemini should respond on the watch.",
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "DeepSeek",
      },
      {
        type: "input",
        messageKey: "deepseekApiKey",
        label: "API key",
      },
      {
        type: "input",
        messageKey: "deepseekSystemPrompt",
        defaultValue: DEFAULT_SYSTEM_PROMPT,
        label: "System prompt",
        description: "Context for how DeepSeek should respond on the watch.",
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "Grok",
      },
      {
        type: "input",
        messageKey: "grokApiKey",
        label: "API key",
      },
      {
        type: "select",
        messageKey: "grokModel",
        defaultValue: "grok-4.3",
        label: "Model",
        options: [
          { label: "Grok 4.3 (recommended)", value: "grok-4.3" },
          { label: "Grok 4.6 (frontier)", value: "grok-4.6" },
          { label: "Grok 4.5", value: "grok-4.5" },
        ],
      },
      {
        type: "input",
        messageKey: "grokSystemPrompt",
        defaultValue: DEFAULT_SYSTEM_PROMPT,
        label: "System prompt",
        description: "Context for how Grok should respond on the watch.",
      },
    ],
  },
  {
    type: "section",
    items: [
      {
        type: "heading",
        defaultValue: "App Settings",
      },
      {
        type: "toggle",
        messageKey: "vibrate",
        label: "Vibrate on response",
        defaultValue: true
      },
      {
        type: "toggle",
        messageKey: "confirmTranscription",
        label: "Confirm transcription",
        defaultValue: false
      },
      {
        type: "toggle",
        messageKey: "invertColors",
        label: "Invert colors",
        defaultValue: false
      },
      {
        type: "toggle",
        messageKey: "showModelName",
        label: "Display Model Name at start of messages",
        defaultValue: false
      }
    ],
  },
  {
    type: "submit",
    defaultValue: "Save Settings",
  },
];

var clay = new Clay(clayConfig);

function loadConfigFromStorage() {
  cachedConfig = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  log("Current config:", JSON.stringify(cachedConfig));
  return cachedConfig;
}

function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  return loadConfigFromStorage();
}

function saveConfig(configValues) {
  cachedConfig = configValues;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configValues));
}

// Provider config: key name in config object, request function.
var PROVIDER_CONFIG = {
  openai:   { key: "apiKey",         fn: makeOpenAIRequest },
  claude:   { key: "claudeApiKey",    fn: makeClaudeRequest },
  gemini:   { key: "geminiApiKey",    fn: makeGeminiRequest },
  deepseek: { key: "deepseekApiKey",  fn: makeDeepSeekRequest },
  grok:     { key: "grokApiKey",      fn: makeGrokRequest }
};

// Resolve which Gemini model to call.
// `selected` = value of the "geminiModel" select
// `custom`   = value of the "geminiModelCustom" input
function resolveGeminiModel(selected, custom) {
  selected = (selected || "").trim();
  custom = (custom || "").trim();

  // "Custom…" chosen and an ID was typed → use it verbatim.
  if (selected === "custom" && custom) return custom;

  // A concrete preset was chosen.
  if (selected && selected !== "custom") return selected;

  // Nothing set yet (e.g. installs from before this change) → safe current default.
  return "gemini-3.1-flash-lite";
}

// Resolve which Claude model to call (same pattern as Gemini).
function resolveClaudeModel(selected, custom) {
  selected = (selected || "").trim();
  custom = (custom || "").trim();

  if (selected === "custom" && custom) return custom;
  if (selected && selected !== "custom") return selected;
  return "claude-haiku-4-5";
}

function trimMessages() {
  if (messages.length <= MAX_MESSAGES) {
    return;
  }

  var hasSystem = messages.length > 0 && messages[0].role === "system";
  if (hasSystem) {
    var systemMsg = messages[0];
    messages = [systemMsg].concat(messages.slice(-(MAX_MESSAGES - 1)));
  } else {
    messages = messages.slice(-MAX_MESSAGES);
  }
}

function makeApiRequest(prompt, onResponse, onError) {
  var config = getConfig();
  var provider = config[API_PROVIDER];
  var pc = PROVIDER_CONFIG[provider];

  log("Making API request with provider:", provider);

  if (!pc) {
    log("Invalid provider:", provider);
    onError("Invalid API provider");
    return;
  }
  if (!config[pc.key]) {
    log(provider, "API key not found");
    onError(provider + " API key not set");
    return;
  }
  log(provider, "API key found, making request");
  pc.fn(prompt, config, onResponse, onError);
}

// Strip-markdown regexes (module-level so PKJS does not recompile them each call).
var RE_CODE_BLOCK = /```[^\n]*\n?([\s\S]*?)```/g;
var RE_INLINE_CODE = /`([^`]+)`/g;
var RE_HEADERS = /^#{1,6}\s+/gm;
var RE_BOLD = /\*\*([^*]+)\*\*/g;
var RE_ITALIC = /\*([^*]+)\*/g;
var RE_LINK = /\[([^\]]+)\]\([^)]+\)/g;
var RE_UL = /^[\t ]*[-*+]\s+/gm;
var RE_OL = /^[\t ]*\d+\.\s+/gm;

/** Remove common Markdown marks so the watch shows plain text. */
function stripMarkdown(text) {
  if (!text) return text;
  // Skip work when no common marks exist.
  if (
    text.indexOf("*") === -1 &&
    text.indexOf("#") === -1 &&
    text.indexOf("`") === -1 &&
    text.indexOf("[") === -1
  ) {
    return text;
  }
  var s = text;
  // Code blocks: keep inner text, drop fences.
  s = s.replace(RE_CODE_BLOCK, "$1");
  s = s.replace(RE_INLINE_CODE, "$1");
  // Headers at line start.
  s = s.replace(RE_HEADERS, "");
  // Bold then italic (* only; skip _ to protect snake_case).
  s = s.replace(RE_BOLD, "$1");
  s = s.replace(RE_ITALIC, "$1");
  // Links: keep label, drop URL.
  s = s.replace(RE_LINK, "$1");
  // List markers at line start.
  s = s.replace(RE_UL, "");
  s = s.replace(RE_OL, "");
  return s;
}

function finishChatResponse(content, providerLabel, config, onResponse) {
  var display = stripMarkdown(content);
  if (config && config.showModelName && providerLabel) {
    display = providerLabel + ": " + display;
  }
  onResponse(display);
}

function makeOpenAIRequest(prompt, config, onResponse, onError) {
  log("Starting OpenAI request");

  var method = "POST";
  var url = "https://api.openai.com/v1/chat/completions";

  var request = new XMLHttpRequest();

  request.onload = function () {
    log("OpenAI response received, status:", this.status);
    if (this.status >= 200 && this.status < 300) {
      try {
        var responseBody = JSON.parse(this.responseText);
        log("OpenAI response parsed:", JSON.stringify(responseBody));

        if (responseBody.error) {
          log("OpenAI error:", responseBody.error.message);
          onError(getErrorMessage(responseBody));
          return;
        }

        var chatCompletion = responseBody.choices[0].message.content;
        messages.push({ role: "assistant", content: chatCompletion });
        trimMessages();
        finishChatResponse(chatCompletion, "OpenAI", config, onResponse);
      } catch (err) {
        log("Failed to parse OpenAI response:", err.message);
        onError("Failed to parse response: " + (err && err.message ? err.message : "unknown"));
      }
    } else {
      try {
        var errorBody = JSON.parse(this.responseText);
        onError(getErrorMessage(errorBody));
      } catch (err) {
        onError("Failed to parse error response");
      }
    }
  };

  request.onerror = function () {
    log("Network error in OpenAI request");
    onError("Network error");
  };

  log("Opening request to OpenAI");
  request.open(method, url);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Authorization", "Bearer " + config.apiKey);

  if (messages.length === 0 && config.openaiSystemPrompt) {
    log("Adding system prompt");
    messages.push({ role: "system", content: config.openaiSystemPrompt });
  }

  messages.push({ role: "user", content: prompt });
  trimMessages();

  var requestBody = {
    model: config.model || "gpt-5-nano",
    messages: messages,
    temperature: parseFloat(config.temperature) || 1,
    max_tokens: MAX_OUTPUT_TOKENS,
  };

  log("Temperature value:", config.temperature);
  log("Parsed temperature:", parseFloat(config.temperature));
  log("Final request body:", JSON.stringify(requestBody));

  request.send(JSON.stringify(requestBody));
}

function makeClaudeRequest(prompt, config, onResponse, onError) {
  if (!config.claudeApiKey) {
    onError("Claude API key not set");
    return;
  }

  var model = resolveClaudeModel(config.claudeModel, config.claudeModelCustom);
  var request = new XMLHttpRequest();
  var url = "https://api.anthropic.com/v1/messages";

  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      try {
        var responseBody = JSON.parse(this.responseText);
        var chatCompletion = responseBody.content[0].text;
        messages.push({ role: "assistant", content: chatCompletion });
        trimMessages();
        finishChatResponse(chatCompletion, "Claude", config, onResponse);
      } catch (err) {
        onError("Failed to parse response");
      }
    } else {
      try {
        var errorBody = JSON.parse(this.responseText);
        onError(getErrorMessage(errorBody));
      } catch (err) {
        onError("Failed to parse error response");
      }
    }
  };

  request.onerror = function () {
    onError("Network error");
  };

  request.open("POST", url);
  request.setRequestHeader("x-api-key", config.claudeApiKey);
  request.setRequestHeader("anthropic-version", "2025-01-01");
  request.setRequestHeader("content-type", "application/json");

  // Build messages for Claude: include prior conversation, then current user prompt.
  var claudeMessages = [];
  if (messages.length === 0 || messages[0].role !== "user") {
    claudeMessages.push({ role: "user", content: prompt });
  } else {
    claudeMessages = messages.slice();
    claudeMessages.push({ role: "user", content: prompt });
  }

  messages.push({ role: "user", content: prompt });
  trimMessages();

  var requestBody = {
    model: model,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: claudeMessages
  };
  if (config.claudeSystemPrompt) {
    requestBody.system = config.claudeSystemPrompt;
  }

  request.send(JSON.stringify(requestBody));
}

function makeGeminiRequest(prompt, config, onResponse, onError) {
  if (!config.geminiApiKey) {
    onError("Gemini API key not set");
    return;
  }

  var model = resolveGeminiModel(config.geminiModel, config.geminiModelCustom);
  var request = new XMLHttpRequest();
  var url = "https://generativelanguage.googleapis.com/v1beta/models/"
          + encodeURIComponent(model)
          + ":generateContent?key=" + config.geminiApiKey;

  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      try {
        var responseBody = JSON.parse(this.responseText);
        var chatCompletion = responseBody.candidates[0].content.parts[0].text;
        messages.push({ role: "model", content: chatCompletion });
        trimMessages();
        finishChatResponse(chatCompletion, "Gemini", config, onResponse);
      } catch (err) {
        onError("Failed to parse response");
      }
    } else {
      try {
        var errorBody = JSON.parse(this.responseText);
        onError(getErrorMessage(errorBody));
      } catch (err) {
        onError("Failed to parse error response");
      }
    }
  };

  request.onerror = function () {
    onError("Network error");
  };

  request.open("POST", url);
  request.setRequestHeader("Content-Type", "application/json");

  messages.push({ role: "user", content: prompt });
  trimMessages();

  // Build contents from conversation history (Gemini format: alternating user/model parts).
  var contents = [];
  var i;
  for (i = 0; i < messages.length; i++) {
    var m = messages[i];
    var role = m.role === "user" ? "user" : "model";
    contents.push({
      role: role,
      parts: [{ text: m.content }]
    });
  }

  var requestBody = {
    contents: contents,
    generationConfig: {
      temperature: config[TEMPERATURE] || 1,
      topK: 1,
      topP: 1,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    }
  };
  if (config.geminiSystemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: config.geminiSystemPrompt }]
    };
  }

  request.send(JSON.stringify(requestBody));
}

function makeDeepSeekRequest(prompt, config, onResponse, onError) {
  var request = new XMLHttpRequest();
  var url = "https://api.deepseek.com/chat/completions";

  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      try {
        var responseBody = JSON.parse(this.responseText);
        var chatCompletion = responseBody.choices[0].message.content;
        messages.push({ role: "assistant", content: chatCompletion });
        trimMessages();
        finishChatResponse(chatCompletion, "DeepSeek", config, onResponse);
      } catch (err) {
        onError("Failed to parse response");
      }
    } else {
      try {
        var errorBody = JSON.parse(this.responseText);
        onError(getErrorMessage(errorBody));
      } catch (err) {
        onError("Failed to parse error response");
      }
    }
  };

  request.onerror = function () {
    onError("Network error");
  };

  request.open("POST", url);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Authorization", "Bearer " + config.deepseekApiKey);

  if (messages.length === 0 && config.deepseekSystemPrompt) {
    messages.push({ role: "system", content: config.deepseekSystemPrompt });
  }

  messages.push({ role: "user", content: prompt });
  trimMessages();

  var requestBody = {
    model: "deepseek-chat",
    messages: messages,
    temperature: parseFloat(config.temperature) || 1,
    max_tokens: MAX_OUTPUT_TOKENS,
    stream: false
  };

  request.send(JSON.stringify(requestBody));
}

function makeGrokRequest(prompt, config, onResponse, onError) {
  var request = new XMLHttpRequest();
  var url = "https://api.x.ai/v1/chat/completions";

  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      try {
        var responseBody = JSON.parse(this.responseText);
        if (responseBody.error) {
          onError(getErrorMessage(responseBody));
          return;
        }
        var message = responseBody.choices && responseBody.choices[0] && responseBody.choices[0].message;
        var chatCompletion = message && (message.content || message.reasoning_content);
        if (!chatCompletion) {
          onError("Grok returned an empty response");
          return;
        }
        messages.push({ role: "assistant", content: chatCompletion });
        trimMessages();
        finishChatResponse(chatCompletion, "Grok", config, onResponse);
      } catch (err) {
        onError("Failed to parse response");
      }
    } else {
      try {
        var errorBody = JSON.parse(this.responseText);
        onError(getErrorMessage(errorBody));
      } catch (err) {
        onError("Failed to parse error response");
      }
    }
  };

  request.onerror = function () {
    onError("Network error");
  };

  request.open("POST", url);
  request.setRequestHeader("Content-Type", "application/json");
  request.setRequestHeader("Authorization", "Bearer " + config.grokApiKey);

  if (messages.length === 0 && config.grokSystemPrompt) {
    messages.push({ role: "system", content: config.grokSystemPrompt });
  }

  messages.push({ role: "user", content: prompt });
  trimMessages();

  var requestBody = {
    model: config.grokModel || "grok-4.3",
    messages: messages,
    temperature: parseFloat(config.temperature) || 1,
    max_completion_tokens: MAX_OUTPUT_TOKENS
  };

  request.send(JSON.stringify(requestBody));
}

function resetMessages() {
  messages = [];
}

// Pebble Event Listeners
Pebble.addEventListener("ready", function (e) {
  log("PebbleKit JS ready!");
  resetMessages();
  loadConfigFromStorage();
});

// Config message keys in same order as package.json pebble.messageKeys (keys 3–24).
var CONFIG_MESSAGE_KEYS = [
  "apiKey", "model", "temperature", "vibrate", "apiProvider",
  "claudeApiKey", "geminiApiKey", "confirmTranscription", "invertColors",
  "deepseekApiKey", "showModelName", "grokApiKey", "grokModel",
  "geminiModel", "geminiModelCustom", "claudeModel", "claudeModelCustom",
  "openaiSystemPrompt", "claudeSystemPrompt", "geminiSystemPrompt",
  "deepseekSystemPrompt", "grokSystemPrompt"
];

function buildKeyMapping() {
  var map = {};
  CONFIG_MESSAGE_KEYS.forEach(function (name, i) {
    map[String(i + 3)] = name;
  });
  return map;
}

Pebble.addEventListener("webviewclosed", function (e) {
  if (e && !e.response) {
    log("Webview closed without response");
    return;
  }

  log("Raw webview response:", e.response);
  var configData = clay.getSettings(e.response);
  log("Clay settings:", JSON.stringify(configData));

  var keyMapping = buildKeyMapping();
  var configValues = {};
  Object.keys(configData).forEach(function (key) {
    var mappedKey = keyMapping[key] || key;
    if (mappedKey === "temperature") {
      configValues[mappedKey] = parseFloat(configData[key]) / 10;
    } else {
      configValues[mappedKey] = configData[key];
    }
  });

  log("Saving config:", JSON.stringify(configValues));
  saveConfig(configValues);
  resetMessages();
  log("Config saved successfully");
});

Pebble.addEventListener("appmessage", function (e) {
  log("Received app message:", JSON.stringify(e.payload));

  function onError(errorText) {
    var msg = (errorText !== undefined && errorText !== null && String(errorText)) ? String(errorText) : "Unknown error";
    log("Error occurred:", msg);
    Pebble.sendAppMessage({ AppKeyResponse: "Error: " + msg });
  }

  function onResponse(responseText) {
    log("Received API response");
    Pebble.sendAppMessage({ AppKeyResponse: responseText });
  }

  var providerFromWatch = e.payload.AppKeyApiProvider || e.payload.apiProvider || e.payload[7];
  if (providerFromWatch) {
    var config = getConfig();
    if (config.apiProvider !== providerFromWatch) {
      config.apiProvider = providerFromWatch;
      saveConfig(config);
      resetMessages();
      log("Provider updated from watch:", config.apiProvider);
    }
  }

  if (e.payload.AppKeyTranscription) {
    log("Received transcription:", e.payload.AppKeyTranscription);
    makeApiRequest(e.payload.AppKeyTranscription, onResponse, onError);
  }
});
