import { useEffect, useRef, useState } from "react";

const VoiceAssistant = ({ message, enabled = true }) => {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!enabled || !message) return;
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [message, enabled]);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">Voice Guidance</h3>
          <p className="text-xs text-slate-300">
            {speaking ? "Speaking alert instructions…" : "Ready"}
          </p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            speaking ? "bg-green-400 animate-pulse" : "bg-slate-500"
          }`}
        />
      </div>
    </div>
  );
};

export default VoiceAssistant;
