/**
 * emotionTone Utility
 * Maps crisis type to calm emotional language tone.
 */

export function getTone(crisisType) {
  switch (crisisType) {
    case "flood":
      return "Stay calm. Move to higher ground and follow official guidance.";
    case "fire":
      return "Take slow breaths. Evacuate safely and avoid smoke.";
    case "earthquake":
      return "It's okay to feel scared. Protect yourself and stay safe.";
    case "medical":
      return "Help is coming. Stay with the patient and keep them comfortable.";
    default:
      return "Stay calm and follow safety instructions.";
  }
}
