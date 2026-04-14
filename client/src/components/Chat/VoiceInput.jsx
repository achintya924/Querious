import { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// "idle" | "recording" | "processing"
export default function VoiceInput({ onTranscript, disabled }) {
  const [state, setState]   = useState("idle");
  const recognitionRef      = useRef(null);
  const { addToast }        = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  // Browser doesn't support Web Speech API — render nothing
  if (!SpeechRecognition) return null;

  function toggle() {
    if (state === "recording") {
      stop();
    } else if (state === "idle") {
      start();
    }
  }

  function start() {
    const recognition = new SpeechRecognition();
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.lang            = "en-IN";

    recognition.onresult = (e) => {
      let interim = "";
      let final   = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      // Feed whichever text we have into the input (final wins over interim)
      onTranscript(final || interim, !!final);
    };

    recognition.onend = () => {
      // Fires when recognition stops (silence timeout, manual stop, or error).
      // If we were still recording, transition through "processing" briefly.
      setState((s) => {
        if (s === "recording") {
          setTimeout(() => setState("idle"), 300);
          return "processing";
        }
        return "idle";
      });
    };

    recognition.onerror = (e) => {
      recognitionRef.current = null;
      setState("idle");

      if (e.error === "not-allowed" || e.error === "permission-denied") {
        addToast(
          "Microphone access denied. Please allow microphone in browser settings.",
          "error",
          5000
        );
      } else if (e.error === "no-speech") {
        // Silence timeout — don't bother the user
      } else if (e.error !== "aborted") {
        addToast(`Voice input error: ${e.error}`, "error");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setState("recording");
    } catch {
      setState("idle");
      addToast("Could not start voice input", "error");
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    // onend handler will transition state → processing → idle
  }

  const isRecording  = state === "recording";
  const isProcessing = state === "processing";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || isProcessing}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
      title={isRecording ? "Listening... Click to stop" : "Click to speak"}
      className={`
        shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200
        ${isRecording
          ? "bg-red-500 text-white animate-mic-pulse"
          : isProcessing
            ? "bg-gray-200 text-gray-400"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {isProcessing ? (
        <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-1.657 0-3-1.343-3-3V6a3 3 0 116 0v6c0 1.657-1.343 3-3 3z" />
        </svg>
      )}

      {/* Recording indicator dot */}
      {isRecording && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
      )}
    </button>
  );
}
