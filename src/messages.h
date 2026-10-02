#ifndef MESSAGES_H
#define MESSAGES_H

typedef enum {
  AppKeyTranscription = 1,
  AppKeyResponse = 2,
  AppKeyApiKey = 3,
  AppKeyVibrate = 6,
  AppKeyApiProvider = 7,
  AppKeyClaudeApiKey = 8,
  AppKeyGeminiApiKey = 9,
  AppKeyConfirmTranscription = 10,
  AppKeyInvertColors = 11,
  AppKeyDeepseekApiKey = 12,
  AppKeyShowModelName = 13,
  AppKeyGrokApiKey = 14
} AppKey;

/// Function which handles messages (could be passed to `app_message_register_inbox_received`)
typedef void (*MessageHandler)(DictionaryIterator*);

/// Set the handlers which will process messages received from the phone
#define init_messages(array) (_init_messages((array), ARRAY_LENGTH((array))))
void _init_messages(MessageHandler[], int);
void cleanup_messages(void);

/// Send a message to PebbleKit on the phone
void send_to_phone(AppKey key, char* value);

#endif
