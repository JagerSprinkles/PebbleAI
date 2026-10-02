#include <transcription.h>
#include <settings.h>
#include <ui.h>

static DictationSession *s_dictation_session;

const uint32_t MAX_DICTATION = 512;

static TranscriptionHandler transcription_handler;

static void destroy_dictation_session(void) {
  if (s_dictation_session) {
    dictation_session_destroy(s_dictation_session);
    s_dictation_session = NULL;
  }
}

static void dictation_status_handler(DictationSession *session,
                                     DictationSessionStatus status,
                                     char *transcription,
                                     void *context) {
  (void) session;
  (void) context;

  if (status != DictationSessionStatusSuccess) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Transcription failed. Error ID: %d", (int)status);
    destroy_dictation_session();
    set_text("Dictation failed, press Select to retry");
    return;
  }

  (*transcription_handler)(transcription);
  destroy_dictation_session();
}

void start_transcription(TranscriptionHandler handler) {
  destroy_dictation_session();

  transcription_handler = handler;
  s_dictation_session = dictation_session_create(MAX_DICTATION, dictation_status_handler, NULL);

  if (!s_dictation_session) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Failed to create dictation session");
    set_text("Dictation failed, press Select to retry");
    return;
  }

  dictation_session_enable_confirmation(s_dictation_session, get_settings().confirmTranscription);
  dictation_session_start(s_dictation_session);
}

void cleanup_transcription(void) {
  destroy_dictation_session();
}
