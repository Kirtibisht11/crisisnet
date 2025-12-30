import React, { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCcw } from "lucide-react";

const FLOWS = {
  start: {
    text: "I'm your Crisis Companion. Please select your emergency type or situation:",
    options: [
      { label: "Flood 🌊", next: "flood" },
      { label: "Fire 🔥", next: "fire" },
      { label: "Medical 🏥", next: "medical" },
      { label: "Earthquake 🏚️", next: "earthquake" },
      { label: "Landslide ⛰️", next: "landslide" },
      { label: "Anxiety / Panic 😰", next: "anxiety" }
    ]
  },
  flood: {
    text: "Flood Safety: Move to higher ground immediately. Avoid walking or driving through floodwaters.",
    options: [
      { label: "I am trapped inside", next: "flood_trapped" },
      { label: "I am outside", next: "flood_outside" },
      { label: "Back to Menu", next: "start" }
    ]
  },
  flood_trapped: {
    text: "Move to the highest level of the building. Do not climb into a closed attic as you may become trapped by rising floodwater. Signal for help from the roof.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  flood_outside: {
    text: "Do not walk through moving water. Six inches of moving water can make you fall. If you have to walk in water, walk where the water is not moving.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  fire: {
    text: "Fire Safety: Get out, stay out, and call for help. Stay low to avoid smoke.",
    options: [
      { label: "Trapped in a room", next: "fire_trapped" },
      { label: "Clothes on fire", next: "fire_clothes" },
      { label: "Back to Menu", next: "start" }
    ]
  },
  fire_trapped: {
    text: "Close doors between you and the fire. Use towels or bedding to block cracks. Signal from a window with a light or cloth.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  fire_clothes: {
    text: "STOP, DROP, and ROLL. Cover your face with your hands. Roll over and over or back and forth until the fire is out.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  medical: {
    text: "Medical Emergency: Is the person conscious and breathing?",
    options: [
      { label: "Yes", next: "medical_conscious" },
      { label: "No / Unsure", next: "medical_unconscious" },
      { label: "Bleeding heavily", next: "medical_bleeding" },
      { label: "Back to Menu", next: "start" }
    ]
  },
  medical_conscious: {
    text: "Keep them calm and comfortable. Do not give food or water if they might need surgery. Check for other injuries.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  medical_unconscious: {
    text: "Call emergency services immediately. If trained, begin CPR. Push hard and fast in the center of the chest.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  medical_bleeding: {
    text: "Apply direct pressure to the wound with a clean cloth. Keep pressure applied until help arrives. Do not remove the cloth if it soaks through, add more on top.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  earthquake: {
    text: "Earthquake: DROP, COVER, and HOLD ON. Stay away from windows.",
    options: [
      { label: "Indoors", next: "earthquake_indoors" },
      { label: "Outdoors", next: "earthquake_outdoors" },
      { label: "Back to Menu", next: "start" }
    ]
  },
  earthquake_indoors: {
    text: "Stay inside. Drop under heavy furniture such as a table, desk, bed or any solid furniture. Cover your head and torso to prevent being hit by falling objects.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  earthquake_outdoors: {
    text: "Move to a clear area if you can safely do so. Avoid buildings, power lines, trees, and other hazards.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  landslide: {
    text: "Landslide Safety: Stay alert. Listen for unusual sounds like trees cracking or boulders knocking together.",
    options: [{ label: "Back to Menu", next: "start" }]
  },
  anxiety: {
    text: "It's normal to feel scared. Let's try a breathing exercise. Inhale for 4 seconds, hold for 7, exhale for 8.",
    options: [
      { label: "I'm still panicking", next: "anxiety_more" },
      { label: "Feeling better", next: "start" }
    ]
  },
  anxiety_more: {
    text: "Focus on 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This helps ground you.",
    options: [{ label: "Back to Menu", next: "start" }]
  }
};

export default function CrisisCompanion({ type }) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState("start");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let startNode = "start";
    if (type) {
      const lowerType = type.toLowerCase();
      if (FLOWS[lowerType]) {
        startNode = lowerType;
      }
    }
    
    setCurrentStep(startNode);
    setMessages([{ role: "model", text: FLOWS[startNode].text }]);
  }, [type]);

  const handleOptionClick = (nextStep, label) => {
    const newMessages = [
      ...messages,
      { role: "user", text: label }
    ];

    const nextFlow = FLOWS[nextStep];
    if (nextFlow) {
      newMessages.push({ role: "model", text: nextFlow.text });
      setCurrentStep(nextStep);
    } else {
      newMessages.push({ role: "model", text: "Returning to main menu." });
      setCurrentStep("start");
      newMessages.push({ role: "model", text: FLOWS["start"].text });
    }

    setMessages(newMessages);
  };

  const resetChat = () => {
    setCurrentStep("start");
    setMessages([{ role: "model", text: FLOWS["start"].text }]);
  };

  const currentOptions = FLOWS[currentStep]?.options || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-[600px]">
      <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-xl text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold">Crisis Companion</h3>
        </div>
        <button onClick={resetChat} className="p-1 hover:bg-orange-500 rounded-full transition" title="Reset Chat">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
              m.role === 'user' 
                ? 'bg-orange-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-white rounded-b-xl">
        <div className="flex flex-wrap gap-2 justify-center">
          {currentOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(opt.next, opt.label)}
              className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium hover:bg-orange-100 transition"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
