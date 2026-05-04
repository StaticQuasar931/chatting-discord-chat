/* =====================================================================
   Static Chat — tips.js
   Fun tips shown on the loading / splash screen.
   ===================================================================== */

export const LOADING_TIPS = [
  "💬 Right-click any message to reply, edit, pin, or report it.",
  "⌨️ Type :smile: or :heart: and it auto-converts to an emoji.",
  "🔍 Press Ctrl+F to search messages in the current chat.",
  "📌 Pin important messages so the whole chat can find them later.",
  "🎱 Try /8ball followed by a question for a mystic answer.",
  "🪙 /coinflip decides tough choices. /roll for a random number.",
  "🤫 Silent typing hides your typing indicator from others.",
  "🌙 Set your status to Idle, DND, or Invisible from the bottom left.",
  "👆 Click on someone's name or avatar to view their profile.",
  "🎭 The GIF picker is powered by Tenor — search anything you want.",
  "🎨 Try Dark, OLED, Midnight, Warm, or Daylight themes in settings.",
  "📋 Right-click a DM in the sidebar for quick options.",
  "🚀 Your drafts are saved automatically when you switch chats.",
  "😂 React to messages by hovering over them — quick reactions!",
  "🛳️ /ship <user1> <user2> tests compatibility. Results may vary.",
  "📝 Your bio shows on your profile card. Make it memorable.",
  "🔒 Group chats have a shareable join code under the chat header.",
  "🏆 Leader badges show who runs each group chat.",
  "✨ Use **bold** and *italic* formatting in your messages.",
  "🎮 Type /joke for a random joke to share with friends.",
  "🔔 Mute a chat to stop notifications for that conversation.",
  "📊 Static Chat is in beta — report bugs in the Suggestions tab!",
  "🌐 Your status is visible to your friends in their sidebar.",
  "🎯 /tod gives you a random truth or dare. Use responsibly.",
  "🖼️ Use a direct image URL as your profile photo — any size works.",
  "⏰ Hover over a message timestamp to see exactly when it was sent.",
  "🤝 Mutual friends are shown on profile cards.",
  "📱 Static Chat works great on mobile browsers too.",
  "🧠 Your settings sync across devices automatically.",
  "🌈 Banner colors on profiles are fully customizable in settings.",
];

/** Returns a random tip string. */
export function getRandomTip() {
  return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
}
