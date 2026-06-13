/* config/templates.js — DATA only. No logic, no DOM.
   The single source of truth for the emoji palette and starter templates. */

export const EMOJIS = [
  "✅", "📝", "🚀", "🎯", "📚", "🛒", "✈️", "🎨", "💡", "🏠",
  "💪", "🎬", "🍳", "🌱", "⭐", "🔥", "🧩", "🎁", "☕", "🐢",
];

export const TEMPLATES = [
  { emoji: "🚀", name: "New project setup", items: ["Create the repo", "Set up README", "Add license", "Configure CI", "Write first test", "Deploy a hello world"] },
  { emoji: "🎯", name: "Projects to pick up", items: ["Idea A — sketch the scope", "Idea B — research feasibility", "Idea C — draft a landing page"] },
  { emoji: "✈️", name: "Trip packing", items: ["Passport / ID", "Chargers & adapters", "Toiletries", "Meds", "Headphones", "Reusable water bottle"] },
  { emoji: "🛒", name: "Groceries", items: ["Milk", "Eggs", "Bread", "Coffee", "Fruit", "Veggies"] },
  { emoji: "📚", name: "Reading list", items: ["Book one", "Book two", "That article I saved"] },
  { emoji: "💪", name: "Weekly habits", items: ["Move 30 min", "Read a chapter", "Inbox to zero", "Plan the week", "Call a friend"] },
];
