import React, { useState, useEffect, useRef } from "react";
import { RefreshCcw, Mic, MicOff, Volume2, VolumeX, MapPin, Navigation, Plus, X, AlertTriangle, Shield, Wifi, Battery, Globe } from "lucide-react";

// Crisis Types for Disaster Assistance - BILINGUAL
const CRISIS_TYPES = [
  { 
    label: "Flood Emergency 🌊", 
    value: "flood", 
    description: "Rising waters, flooding, water rescue",
    hindiLabel: "बाढ़ आपातकाल 🌊",
    hindiDescription: "बढ़ता पानी, बाढ़, जल बचाव"
  },
  { 
    label: "Fire Emergency 🔥", 
    value: "fire", 
    description: "Fire incidents, smoke, burns",
    hindiLabel: "आग आपातकाल 🔥",
    hindiDescription: "आग की घटनाएं, धुआं, जलन"
  },
  { 
    label: "Earthquake 🏚️", 
    value: "earthquake", 
    description: "Ground shaking, building damage",
    hindiLabel: "भूकंप 🏚️",
    hindiDescription: "जमीन हिलना, इमारत क्षति"
  },
  { 
    label: "Landslide ⛰️", 
    value: "landslide", 
    description: "Mudslides, falling debris",
    hindiLabel: "भूस्खलन ⛰️",
    hindiDescription: "चट्टान गिरना, मलबा गिरना"
  },
  { 
    label: "Cyclone/Hurricane 🌀", 
    value: "storm", 
    description: "Strong winds, heavy rain",
    hindiLabel: "तूफान/चक्रवात 🌀",
    hindiDescription: "तेज हवाएं, भारी बारिश"
  },
  { 
    label: "Medical Emergency 🏥", 
    value: "medical", 
    description: "Injuries, health crises",
    hindiLabel: "चिकित्सा आपातकाल 🏥",
    hindiDescription: "चोट, स्वास्थ्य संकट"
  },
  { 
    label: "Power Outage ⚡", 
    value: "power", 
    description: "Blackout, electricity failure",
    hindiLabel: "बिजली कटौती ⚡",
    hindiDescription: "अंधेरा, बिजली खराब"
  },
  { 
    label: "Communication Loss 📡", 
    value: "communication", 
    description: "No signal, network down",
    hindiLabel: "संचार खोना 📡",
    hindiDescription: "कोई सिग्नल नहीं, नेटवर्क डाउन"
  },
  { 
    label: "Food/Water Shortage 🍞", 
    value: "supplies", 
    description: "Lack of basic necessities",
    hindiLabel: "खाना/पानी की कमी 🍞",
    hindiDescription: "बुनियादी जरूरतों की कमी"
  },
  { 
    label: "Evacuation Need 🚨", 
    value: "evacuation", 
    description: "Need to leave area immediately",
    hindiLabel: "सुरक्षित स्थान जाना 🚨",
    hindiDescription: "तुरंत इलाका छोड़ने की जरूरत"
  },
  { 
    label: "Shelter Needed 🏠", 
    value: "shelter", 
    description: "Nowhere to stay, homeless",
    hindiLabel: "आश्रय जरूरी 🏠",
    hindiDescription: "रहने की जगह नहीं, बेघर"
  },
  { 
    label: "Trapped/Stuck 🚧", 
    value: "trapped", 
    description: "Can't move, blocked path",
    hindiLabel: "फंस गए/अटक गए 🚧",
    hindiDescription: "हिल नहीं सकते, रास्ता बंद"
  }
];

export default function CrisisCompanion() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [customCrisis, setCustomCrisis] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [boatStatus, setBoatStatus] = useState({ battery: 85, signal: "strong", online: true });
  const [voiceError, setVoiceError] = useState("");
  const [isHindi, setIsHindi] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [hindiVoice, setHindiVoice] = useState(null);
  const [englishVoice, setEnglishVoice] = useState(null);
  
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const conversationStageRef = useRef(0);

  // Detect if text contains Hindi characters
  const isHindiText = (text) => {
    return /[\u0900-\u097F]/.test(text);
  };

  // Load and check available voices
  useEffect(() => {
    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        console.log("Total voices available:", voices.length);
        setAvailableVoices(voices);
        
        // Find Hindi voice
        const hindiVoices = voices.filter(v => 
          v.lang.includes('hi') || 
          v.lang.includes('IN') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('india')
        );
        
        if (hindiVoices.length > 0) {
          setHindiVoice(hindiVoices[0]);
          console.log("Hindi voice found:", hindiVoices[0].name, hindiVoices[0].lang);
        } else {
          console.log("No Hindi voice found");
          setVoiceError("Hindi voice not available. Will use English TTS for Hindi text.");
        }
        
        // Find English voice
        const englishVoices = voices.filter(v => 
          v.lang.includes('en-US') || 
          v.lang.includes('en-GB') ||
          (v.lang.includes('en') && !v.lang.includes('en-IN'))
        );
        
        if (englishVoices.length > 0) {
          setEnglishVoice(englishVoices[0]);
        }
        
      } catch (error) {
        console.error("Error loading voices:", error);
      }
    };
    
    // Load voices immediately
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Mock location for demo (New Delhi)
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      );
    }
    
    // Initialize Voice Recognition
    const initVoiceRecognition = () => {
      try {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = isHindi ? 'hi-IN' : 'en-US';
          
          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setVoiceError("");
          };
          
          recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            
            if (finalTranscript) {
              setInput(finalTranscript);
              setIsListening(false);
              
              if (isHindiText(finalTranscript)) {
                setIsHindi(true);
              }
              
              // Auto-send for crisis keywords
              const crisisKeywords = isHindiText(finalTranscript)
                ? ['मदद', 'बचाव', 'बाढ़', 'आग', 'भूकंप', 'चोट', 'खतरा', 'सहायता']
                : ['help', 'emergency', 'flood', 'fire', 'earthquake', 'trapped'];
              
              if (crisisKeywords.some(keyword => finalTranscript.toLowerCase().includes(keyword))) {
                setTimeout(() => {
                  if (finalTranscript.trim() && !loading) {
                    handleSend();
                  }
                }, 500);
              }
            }
          };
          
          recognitionRef.current.onerror = (event) => {
            setIsListening(false);
            setVoiceError("Voice recognition error. Please type instead.");
          };
          
          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      } catch (error) {
        console.error("Voice init error:", error);
      }
    };
    
    initVoiceRecognition();
    
    // Simulate boat status updates
    const statusInterval = setInterval(() => {
      setBoatStatus(prev => ({
        ...prev,
        battery: Math.max(10, prev.battery - 0.1)
      }));
    }, 30000);
    
    return () => {
      clearInterval(statusInterval);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isHindi]);

  // Text to Speech with Hindi support
  const speak = (text) => {
    if (!autoSpeak || !text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Detect language
    const isHindiTextDetected = text.includes('क्राइसिस नेट') || isHindiText(text);
    
    if (isHindiTextDetected && hindiVoice) {
      // Use Hindi voice if available
      utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.7; // Slower for Hindi
      console.log("Speaking in Hindi");
    } else if (isHindiTextDetected && !hindiVoice) {
      // Hindi text but no Hindi voice - use English with Hindi lang setting
      utterance.lang = 'hi-IN';
      utterance.rate = 0.6; // Very slow
      console.log("Hindi text with English voice (fallback)");
    } else {
      // English text
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      console.log("Speaking in English");
    }
    
    utterance.volume = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  // Smart Crisis Response (same as before, but simplified for brevity)
  const getSmartCrisisResponse = (userMessage, crisisType = null) => {
    conversationStageRef.current++;
    const userMessageIsHindi = isHindiText(userMessage);
    
    if (userMessageIsHindi) {
      const hindiResponses = [
        "🛟 क्राइसिस नेट: मैं समझता हूं आप मुश्किल में हैं। पहले सुरक्षित जगह पर जाएं।",
        "🛟 क्राइसिस नेट: शांत रहें। आपातकालीन नंबर 112 पर कॉल करें।",
        "🛟 क्राइसिस नेट: मैं यहां मदद के लिए हूं। कृपया अपनी स्थिति बताएं।"
      ];
      return hindiResponses[Math.min(conversationStageRef.current - 1, hindiResponses.length - 1)];
    } else {
      const englishResponses = [
        "🛟 CRISIS NET: I understand you're in trouble. First move to safe location.",
        "🛟 CRISIS NET: Stay calm. Call emergency number 112.",
        "🛟 CRISIS NET: I'm here to help. Please describe your situation."
      ];
      return englishResponses[Math.min(conversationStageRef.current - 1, englishResponses.length - 1)];
    }
  };

  // Handle Crisis Selection
  const handleCrisisSelect = (crisis) => {
    setSelectedCrisis(crisis);
    conversationStageRef.current = 0;
    
    const userMsg = isHindi 
      ? `${crisis.hindiLabel || crisis.label} का संकट है। मदद चाहिए।`
      : `Crisis: ${crisis.label}. Need immediate guidance.`;
    
    const userMessage = { role: "user", text: userMsg };
    setMessages([userMessage]);
    setLoading(true);
    
    setTimeout(() => {
      const response = getSmartCrisisResponse(userMsg, crisis.value);
      setMessages([userMessage, { role: "assistant", text: response }]);
      speak(response);
      setLoading(false);
    }, 800);
  };

  // Handle Send Message
  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    
    if (isHindiText(text)) {
      setIsHindi(true);
    }
    
    const userMessage = { role: "user", text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    setTimeout(() => {
      const response = getSmartCrisisResponse(text, selectedCrisis?.value);
      setMessages(prev => [...prev, { role: "assistant", text: response }]);
      speak(response);
      setLoading(false);
    }, 800);
  };

  // Reset Chat
  const resetChat = () => {
    setMessages([]);
    setInput("");
    setSelectedCrisis(null);
    setVoiceError("");
    conversationStageRef.current = 0;
    
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    
    setIsSpeaking(false);
    setIsListening(false);
  };

  // Toggle Voice Listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input requires Chrome or Edge browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      
      recognitionRef.current.lang = isHindi ? 'hi-IN' : 'en-US';
      recognitionRef.current.start();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-[700px] max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="p-4 bg-gradient-to-r from-orange-600 to-amber-600 rounded-t-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <h3 className="font-bold">Crisis Net - Support Boat</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHindi(!isHindi)}
              className={`p-2 rounded-full ${isHindi ? 'bg-green-500' : 'bg-blue-500'}`}
            >
              <Globe className="w-4 h-4" />
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-2 rounded-full ${autoSpeak ? 'bg-orange-500' : 'bg-gray-700'}`}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={resetChat}
                className="p-2 hover:bg-orange-500 rounded-full"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-xs mt-1 flex gap-2 flex-wrap">
          {isListening && <span className="bg-white/20 px-2 py-1 rounded">🎤 Listening...</span>}
          {isSpeaking && <span className="bg-white/20 px-2 py-1 rounded">🔊 Speaking...</span>}
          <span className="bg-green-500/30 px-2 py-1 rounded">🛟 Support Active</span>
          <span className="bg-purple-500/30 px-2 py-1 rounded">द्विभाषी / Bilingual</span>
          {hindiVoice ? (
            <span className="bg-green-500/30 px-2 py-1 rounded">✅ Hindi TTS</span>
          ) : (
            <span className="bg-yellow-500/30 px-2 py-1 rounded">⚠️ English TTS Only</span>
          )}
        </div>
      </div>
      
      {/* VOICE ERROR */}
      {voiceError && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {voiceError}
          </p>
        </div>
      )}
      
      {/* MAIN CONTENT */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-orange-50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <div className="text-white text-2xl">🛟</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Crisis Net Support</h2>
                <p className="text-gray-600">Multipurpose emergency assistance</p>
              </div>
            </div>
          </div>
          
          {/* Crisis Type Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {CRISIS_TYPES.map((crisis) => (
              <button
                key={crisis.value}
                onClick={() => handleCrisisSelect(crisis)}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg text-left hover:border-orange-400 hover:shadow-lg transition"
              >
                <div className="font-medium text-gray-800 mb-1">
                  {isHindi ? crisis.hindiLabel || crisis.label : crisis.label}
                </div>
                <div className="text-xs text-gray-600">
                  {isHindi ? crisis.hindiDescription || crisis.description : crisis.description}
                </div>
              </button>
            ))}
          </div>
          
          {/* Voice Instructions */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <div className="flex justify-center mb-3">
              <button
                onClick={toggleListening}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                }`}
              >
                {isListening ? "⏹️ Stop" : "🎤 Speak with Voice"}
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Speak in Hindi or English. Use Chrome/Edge for best Hindi voice support.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* CHAT INTERFACE */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-orange-50" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-br-none' 
                    : 'bg-white border-2 border-orange-200 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-orange-200 text-gray-800 p-3 rounded-lg rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-orange-600">
                      {isHindi ? "विश्लेषण..." : "Analyzing..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* INPUT AREA */}
          <div className="p-3 border-t bg-white rounded-b-xl">
            <div className="flex gap-2">
              <button
                onClick={toggleListening}
                className={`p-3 rounded-lg ${isListening ? 'bg-orange-600 text-white' : 'bg-gray-100'}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Type your crisis details..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}