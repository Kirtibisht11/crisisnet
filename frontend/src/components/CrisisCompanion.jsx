import React, { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCcw, Mic, MicOff, Volume2, VolumeX, MapPin, Navigation } from "lucide-react";

const CRISIS_TYPES = [
  { label: "Flood 🌊", value: "flood" },
  { label: "Fire 🔥", value: "fire" },
  { label: "Medical 🏥", value: "medical" },
  { label: "Earthquake 🏚️", value: "earthquake" },
  { label: "Landslide ⛰️", value: "landslide" },
  { label: "Anxiety/Panic 😰", value: "anxiety" }
];

const SYSTEM_PROMPT = `You are an AI assistant for an emergency rescue boat system. You must roleplay as if you ARE the rescue boat/rescue team responding to the emergency.

YOUR ROLE:
- You are a rescue boat that has been dispatched to help the person
- You have their location and are navigating to them
- You provide real-time updates on your ETA and status
- You give specific instructions on what to do while waiting for rescue

RESPONSE STYLE:
1. Act as the boat/rescue team: "We're on our way to you" not "A boat will come"
2. Provide realistic ETAs (2-15 minutes based on emergency severity)
3. Ask for critical info: exact location, number of people, immediate dangers
4. Give boat-specific instructions: "Stay visible", "Move to higher ground", "Signal with light/cloth"
5. Maintain urgency but stay calm and reassuring
6. Update status: "We're 5 minutes away", "We can see your location"
7. Keep responses SHORT (2-4 sentences) - this is an emergency!

IMPORTANT DETAILS TO COLLECT:
- Exact location (address, landmarks)
- Number of people needing rescue
- Any injuries or medical conditions
- Immediate hazards (rising water, fire spread, etc.)
- If they can move safely or are trapped

RESCUE PROTOCOL:
1. Confirm emergency and location
2. Provide ETA and dispatch status
3. Give immediate safety instructions
4. Keep them engaged until "arrival"
5. Provide final rescue coordination

Remember: You ARE the boat. Be direct, professional, and focused on rescue.`;

export default function CrisisCompanion() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      synthRef.current.cancel();
    };
  }, []);

  const speak = (text) => {
    if (!autoSpeak) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(location);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      }
    );
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleAutoSpeak = () => {
    if (autoSpeak) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setAutoSpeak(!autoSpeak);
  };

  const handleCrisisSelect = async (crisis) => {
    setSelectedCrisis(crisis);
    getLocation();
    
    const locationInfo = userLocation 
      ? `Latitude: ${userLocation.lat.toFixed(4)}, Longitude: ${userLocation.lng.toFixed(4)}`
      : "Location not yet available";
    
    const initialMsg = `🚨 EMERGENCY: ${crisis.label.replace(/[^\w\s]/g, '')}! I need immediate rescue assistance! ${locationInfo}`;
    
    const userMessage = { role: "user", text: initialMsg };
    setMessages([userMessage]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: initialMsg }
          ],
        })
      });

      const data = await response.json();
      const aiText = data.content.find(c => c.type === "text")?.text || "Rescue boat dispatched. Stay calm and share your exact location.";
      
      setMessages([userMessage, { role: "assistant", text: aiText }]);
      speak(aiText);
    } catch (error) {
      const errorMsg = "Rescue boat dispatched to your location. Stay visible and safe. How many people need rescue?";
      setMessages([userMessage, { role: "assistant", text: errorMsg }]);
      speak(errorMsg);
    }
    
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const locationContext = userLocation 
      ? `[User Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]`
      : "";

    const userMessage = { role: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = updatedMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      }));

      if (locationContext && conversationHistory.length > 0) {
        conversationHistory[conversationHistory.length - 1].content += ` ${locationContext}`;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: conversationHistory,
        })
      });

      const data = await response.json();
      const aiText = data.content.find(c => c.type === "text")?.text || "We're navigating to you. Stay visible and keep us updated.";
      
      setMessages([...updatedMessages, { role: "assistant", text: aiText }]);
      speak(aiText);
    } catch (error) {
      const errorMsg = "We're still en route. Stay safe and keep signaling your position.";
      setMessages([...updatedMessages, { role: "assistant", text: errorMsg }]);
      speak(errorMsg);
    }

    setLoading(false);
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setSelectedCrisis(null);
    setUserLocation(null);
    setLocationStatus("idle");
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-[700px] max-w-2xl mx-auto">
      <div className="p-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-t-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <h3 className="font-bold">Emergency Rescue Boat</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleAutoSpeak} 
              className="p-2 hover:bg-red-500 rounded-full transition" 
              title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button 
              onClick={resetChat} 
              className="p-2 hover:bg-red-500 rounded-full transition" 
              title="Reset Chat"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {userLocation && (
          <div className="flex items-center gap-2 text-xs bg-red-500/30 px-2 py-1 rounded">
            <MapPin className="w-3 h-3" />
            <span>Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
          </div>
        )}
        
        {locationStatus === "loading" && (
          <div className="text-xs bg-yellow-500/30 px-2 py-1 rounded mt-1">
            📍 Getting your location...
          </div>
        )}
      </div>
      
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🚤 Emergency Rescue Dispatch</h2>
            <p className="text-gray-600">Select your emergency - A rescue boat will be dispatched immediately</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {CRISIS_TYPES.map((crisis) => (
              <button
                key={crisis.value}
                onClick={() => handleCrisisSelect(crisis)}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-red-400 hover:shadow-md transition font-medium text-gray-700 hover:scale-105"
              >
                {crisis.label}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>⚠️ SIMULATION MODE:</strong> This is a hackathon prototype simulating rescue boat responses. In real emergencies, call your local emergency services (911, 112, etc.)
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🎯 How it works:</strong> Once you select an emergency, the AI will act as your rescue boat, provide ETAs, ask for your location/status, and guide you until "rescue arrival."
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                m.role === 'user' 
                  ? 'bg-red-600 text-white rounded-br-none' 
                  : 'bg-white border-2 border-blue-300 text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-1 font-semibold">
                    <Navigation className="w-3 h-3" />
                    <span>RESCUE BOAT</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-blue-300 text-gray-800 p-3 rounded-lg rounded-bl-none shadow-sm">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="p-3 border-t bg-white rounded-b-xl">
          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              disabled={loading}
              className={`p-3 rounded-lg transition ${
                isListening 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "🎤 Listening..." : "Describe your situation..."}
              disabled={loading || isListening}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}