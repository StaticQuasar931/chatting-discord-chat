/* =====================================================================
   Static Chat — app.js
   ===================================================================== */

import { isNameBlocked, generateSafeName } from "./name-blocklist.js";
import { buildUI } from "./ui.js";
import { auth, db, provider } from "./firebase.js";
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, collection, setDoc, getDoc, getDocs, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit, startAt, endAt,
  onSnapshot, serverTimestamp, arrayUnion, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Inject all HTML before any DOM queries
buildUI();


/* =====================================================================
   EMOJI DATA
   ===================================================================== */
const STATIC_EMOJI_URL = "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png";

const EMOJI_CATS = [
  { id: "all",      label: "★"  },
  { id: "smileys",  label: "😄" },
  { id: "gestures", label: "👍" },
  { id: "hearts",   label: "❤️" },
  { id: "nature",   label: "🌿" },
  { id: "food",     label: "🍕" },
  { id: "animals",  label: "🐶" },
  { id: "objects",  label: "💻" },
  { id: "special",  label: "⭐" },
];

const EMOJI_DATA = [
  // smileys
  { name:"smile",         char:"😄", alt:["happy","grin"],           cat:"smileys" },
  { name:"grin",          char:"😀", alt:["big smile"],              cat:"smileys" },
  { name:"joy",           char:"😂", alt:["crying laughing","lol","haha"], cat:"smileys" },
  { name:"rofl",          char:"🤣", alt:["rolling","floor"],        cat:"smileys" },
  { name:"laughing",      char:"😆", alt:["lmao"],                   cat:"smileys" },
  { name:"sweat_smile",   char:"😅", alt:["nervous laugh"],          cat:"smileys" },
  { name:"wink",          char:"😉", alt:[],                         cat:"smileys" },
  { name:"blush",         char:"😊", alt:["sweet","happy"],          cat:"smileys" },
  { name:"kiss",          char:"😘", alt:["smooch","kissing"],       cat:"smileys" },
  { name:"heart_eyes",    char:"😍", alt:["love","adore"],           cat:"smileys" },
  { name:"star_struck",   char:"🤩", alt:["wow","star eyes"],        cat:"smileys" },
  { name:"yum",           char:"😋", alt:["delicious","yummy"],      cat:"smileys" },
  { name:"smirk",         char:"😏", alt:["sly","devious"],          cat:"smileys" },
  { name:"thinking",      char:"🤔", alt:["hmm","ponder"],           cat:"smileys" },
  { name:"neutral_face",  char:"😐", alt:["meh","straight"],         cat:"smileys" },
  { name:"expressionless",char:"😑", alt:["dead","blank"],           cat:"smileys" },
  { name:"roll_eyes",     char:"🙄", alt:["eyeroll","ugh"],          cat:"smileys" },
  { name:"pensive",       char:"😔", alt:["sad","dejected"],         cat:"smileys" },
  { name:"worried",       char:"😟", alt:["anxious"],                cat:"smileys" },
  { name:"confused",      char:"😕", alt:["puzzled"],                cat:"smileys" },
  { name:"flushed",       char:"😳", alt:["embarrassed","surprised"],cat:"smileys" },
  { name:"scream",        char:"😱", alt:["shocked","scared"],       cat:"smileys" },
  { name:"angry",         char:"😠", alt:["mad","upset"],            cat:"smileys" },
  { name:"rage",          char:"😡", alt:["furious","red"],          cat:"smileys" },
  { name:"sob",           char:"😭", alt:["crying","bawling","sad"], cat:"smileys" },
  { name:"cry",           char:"😢", alt:["tear","sad"],             cat:"smileys" },
  { name:"pleading",      char:"🥺", alt:["puppy eyes","please","uwu"], cat:"smileys" },
  { name:"sleeping",      char:"😴", alt:["sleep","zzz","tired"],    cat:"smileys" },
  { name:"yawn",          char:"🥱", alt:["tired","sleepy","bored"], cat:"smileys" },
  { name:"sunglasses",    char:"😎", alt:["cool","awesome"],         cat:"smileys" },
  { name:"nerd",          char:"🤓", alt:["glasses","smart"],        cat:"smileys" },
  { name:"cowboy",        char:"🤠", alt:["yeehaw","hat"],           cat:"smileys" },
  { name:"clown",         char:"🤡", alt:[],                         cat:"smileys" },
  { name:"robot",         char:"🤖", alt:["bot","machine"],          cat:"smileys" },
  { name:"skull",         char:"💀", alt:["dead","bones"],           cat:"smileys" },
  { name:"ghost",         char:"👻", alt:["boo","spooky"],           cat:"smileys" },
  { name:"alien",         char:"👽", alt:["ufo"],                    cat:"smileys" },
  { name:"poop",          char:"💩", alt:["poo"],                    cat:"smileys" },
  // gestures
  { name:"thumbsup",       char:"👍", alt:["+1","like","agree","yes"], cat:"gestures" },
  { name:"thumbsdown",     char:"👎", alt:["-1","dislike","no"],       cat:"gestures" },
  { name:"ok_hand",        char:"👌", alt:["ok","perfect"],            cat:"gestures" },
  { name:"clap",           char:"👏", alt:["applause","bravo"],        cat:"gestures" },
  { name:"wave",           char:"👋", alt:["hi","hello","bye"],        cat:"gestures" },
  { name:"muscle",         char:"💪", alt:["flex","strong","bicep"],   cat:"gestures" },
  { name:"point_right",    char:"👉", alt:["this","right"],            cat:"gestures" },
  { name:"point_left",     char:"👈", alt:["left","that"],             cat:"gestures" },
  { name:"point_up",       char:"👆", alt:["above","up"],              cat:"gestures" },
  { name:"point_down",     char:"👇", alt:["below","down"],            cat:"gestures" },
  { name:"pray",           char:"🙏", alt:["please","namaste","thanks"],cat:"gestures" },
  { name:"raised_hands",   char:"🙌", alt:["celebrate","praise","yay"],cat:"gestures" },
  { name:"handshake",      char:"🤝", alt:["deal","agreement"],        cat:"gestures" },
  { name:"fist",           char:"✊", alt:["bump","power"],            cat:"gestures" },
  { name:"crossed_fingers",char:"🤞", alt:["luck","hope"],             cat:"gestures" },
  { name:"metal",          char:"🤘", alt:["rock","rock on"],          cat:"gestures" },
  { name:"call_me",        char:"🤙", alt:["hang loose","shaka"],      cat:"gestures" },
  { name:"shrug",          char:"🤷", alt:["idk","whatever","dunno"],  cat:"gestures" },
  { name:"facepalm",       char:"🤦", alt:["smh","ugh","duh"],         cat:"gestures" },
  // hearts / symbols
  { name:"heart",           char:"❤️", alt:["love","red heart"],      cat:"hearts" },
  { name:"orange_heart",    char:"🧡", alt:["love"],                   cat:"hearts" },
  { name:"yellow_heart",    char:"💛", alt:["love","friend"],          cat:"hearts" },
  { name:"green_heart",     char:"💚", alt:["love","nature"],          cat:"hearts" },
  { name:"blue_heart",      char:"💙", alt:["love"],                   cat:"hearts" },
  { name:"purple_heart",    char:"💜", alt:["love"],                   cat:"hearts" },
  { name:"black_heart",     char:"🖤", alt:["dark","love"],            cat:"hearts" },
  { name:"white_heart",     char:"🤍", alt:["pure","love"],            cat:"hearts" },
  { name:"broken_heart",    char:"💔", alt:["sad","heartbreak"],       cat:"hearts" },
  { name:"sparkling_heart", char:"💖", alt:["love","sparkle"],         cat:"hearts" },
  { name:"two_hearts",      char:"💕", alt:["love","couple"],          cat:"hearts" },
  { name:"revolving_hearts",char:"💞", alt:["love"],                   cat:"hearts" },
  { name:"fire",            char:"🔥", alt:["hot","lit","flame"],      cat:"hearts" },
  { name:"100",             char:"💯", alt:["perfect","score"],        cat:"hearts" },
  { name:"star",            char:"⭐", alt:["rating","favorite"],      cat:"hearts" },
  { name:"sparkles",        char:"✨", alt:["glitter","magic","shine"],cat:"hearts" },
  { name:"boom",            char:"💥", alt:["explosion","blast"],      cat:"hearts" },
  { name:"zzz",             char:"💤", alt:["sleep","tired"],          cat:"hearts" },
  { name:"tada",            char:"🎉", alt:["party","celebrate"],      cat:"hearts" },
  // nature
  { name:"sun",       char:"☀️", alt:["sunny","bright","day"],   cat:"nature" },
  { name:"moon",      char:"🌙", alt:["night","crescent"],       cat:"nature" },
  { name:"cloud",     char:"☁️", alt:["cloudy","overcast"],      cat:"nature" },
  { name:"rainbow",   char:"🌈", alt:["colorful","pride"],       cat:"nature" },
  { name:"snowflake", char:"❄️", alt:["cold","ice","winter"],    cat:"nature" },
  { name:"zap",       char:"⚡", alt:["lightning","electric"],   cat:"nature" },
  { name:"umbrella",  char:"☂️", alt:["rain","wet"],             cat:"nature" },
  { name:"tornado",   char:"🌪️", alt:["twister","storm"],       cat:"nature" },
  { name:"ocean",     char:"🌊", alt:["wave","sea","water"],     cat:"nature" },
  { name:"earth",     char:"🌍", alt:["world","globe"],          cat:"nature" },
  { name:"volcano",   char:"🌋", alt:["eruption","mountain"],    cat:"nature" },
  { name:"tree",      char:"🌳", alt:["forest","nature"],        cat:"nature" },
  { name:"palm_tree", char:"🌴", alt:["tropical","beach"],       cat:"nature" },
  { name:"cactus",    char:"🌵", alt:["desert"],                 cat:"nature" },
  { name:"rose",      char:"🌹", alt:["flower","love"],          cat:"nature" },
  { name:"sunflower", char:"🌻", alt:["flower","bright"],        cat:"nature" },
  { name:"leaf",      char:"🍃", alt:["leaves","wind"],          cat:"nature" },
  // food
  { name:"pizza",      char:"🍕", alt:["pie","slice"],              cat:"food" },
  { name:"burger",     char:"🍔", alt:["hamburger","cheeseburger"],  cat:"food" },
  { name:"fries",      char:"🍟", alt:["chips","potato"],           cat:"food" },
  { name:"taco",       char:"🌮", alt:[],                           cat:"food" },
  { name:"burrito",    char:"🌯", alt:["wrap"],                     cat:"food" },
  { name:"sushi",      char:"🍣", alt:[],                           cat:"food" },
  { name:"ramen",      char:"🍜", alt:["noodles","soup"],           cat:"food" },
  { name:"coffee",     char:"☕", alt:["hot drink","cafe","morning"],cat:"food" },
  { name:"boba",       char:"🧋", alt:["bubble tea","milk tea"],    cat:"food" },
  { name:"tea",        char:"🍵", alt:["green tea","hot drink"],    cat:"food" },
  { name:"cake",       char:"🎂", alt:["birthday","dessert"],       cat:"food" },
  { name:"cupcake",    char:"🧁", alt:["dessert","sweet"],          cat:"food" },
  { name:"cookie",     char:"🍪", alt:["snack","sweet"],            cat:"food" },
  { name:"donut",      char:"🍩", alt:["doughnut"],                 cat:"food" },
  { name:"ice_cream",  char:"🍦", alt:["soft serve","dessert"],     cat:"food" },
  { name:"apple",      char:"🍎", alt:["fruit","red"],              cat:"food" },
  { name:"banana",     char:"🍌", alt:["fruit","yellow"],           cat:"food" },
  { name:"strawberry", char:"🍓", alt:["fruit","red"],              cat:"food" },
  { name:"watermelon", char:"🍉", alt:["fruit","summer"],           cat:"food" },
  { name:"grapes",     char:"🍇", alt:["fruit","purple"],           cat:"food" },
  { name:"popcorn",    char:"🍿", alt:["movie","snack"],            cat:"food" },
  { name:"avocado",    char:"🥑", alt:["toast"],                    cat:"food" },
  // animals
  { name:"dog",      char:"🐶", alt:["puppy","woof"],              cat:"animals" },
  { name:"cat",      char:"🐱", alt:["kitty","meow"],              cat:"animals" },
  { name:"fox",      char:"🦊", alt:[],                            cat:"animals" },
  { name:"bear",     char:"🐻", alt:[],                            cat:"animals" },
  { name:"panda",    char:"🐼", alt:[],                            cat:"animals" },
  { name:"lion",     char:"🦁", alt:[],                            cat:"animals" },
  { name:"tiger",    char:"🐯", alt:[],                            cat:"animals" },
  { name:"pig",      char:"🐷", alt:["oink"],                      cat:"animals" },
  { name:"monkey",   char:"🐵", alt:["ape"],                       cat:"animals" },
  { name:"penguin",  char:"🐧", alt:[],                            cat:"animals" },
  { name:"unicorn",  char:"🦄", alt:["mythical","magical"],        cat:"animals" },
  { name:"bee",      char:"🐝", alt:["honey","buzz"],              cat:"animals" },
  { name:"butterfly",char:"🦋", alt:[],                            cat:"animals" },
  { name:"dragon",   char:"🐉", alt:["fire"],                      cat:"animals" },
  { name:"shark",    char:"🦈", alt:[],                            cat:"animals" },
  { name:"whale",    char:"🐳", alt:[],                            cat:"animals" },
  { name:"octopus",  char:"🐙", alt:[],                            cat:"animals" },
  { name:"parrot",   char:"🦜", alt:["bird"],                      cat:"animals" },
  { name:"owl",      char:"🦉", alt:["wise"],                      cat:"animals" },
  { name:"wolf",     char:"🐺", alt:[],                            cat:"animals" },
  { name:"frog",     char:"🐸", alt:["kermit"],                    cat:"animals" },
  { name:"rabbit",   char:"🐰", alt:["bunny","easter"],            cat:"animals" },
  { name:"hamster",  char:"🐹", alt:["cute"],                      cat:"animals" },
  // objects
  { name:"book",       char:"📚", alt:["read","study","school"],   cat:"objects" },
  { name:"pencil",     char:"✏️", alt:["write","edit"],            cat:"objects" },
  { name:"computer",   char:"💻", alt:["laptop","pc","tech"],      cat:"objects" },
  { name:"phone",      char:"📱", alt:["mobile","cell","smartphone"],cat:"objects" },
  { name:"clock",      char:"⏰", alt:["alarm","time"],            cat:"objects" },
  { name:"music",      char:"🎵", alt:["note","song","audio"],     cat:"objects" },
  { name:"headphones", char:"🎧", alt:["headset","audio"],         cat:"objects" },
  { name:"guitar",     char:"🎸", alt:["instrument","rock"],       cat:"objects" },
  { name:"soccer",     char:"⚽", alt:["football","sport"],        cat:"objects" },
  { name:"basketball", char:"🏀", alt:["sport"],                   cat:"objects" },
  { name:"videogame",  char:"🎮", alt:["gaming","controller","game"],cat:"objects" },
  { name:"art",        char:"🎨", alt:["paint","creative"],        cat:"objects" },
  { name:"camera",     char:"📷", alt:["photo","picture"],         cat:"objects" },
  { name:"rocket",     char:"🚀", alt:["launch","space","fast"],   cat:"objects" },
  { name:"car",        char:"🚗", alt:["drive","vehicle"],         cat:"objects" },
  { name:"trophy",     char:"🏆", alt:["win","champion","award"],  cat:"objects" },
  { name:"gift",       char:"🎁", alt:["present","birthday"],      cat:"objects" },
  { name:"money",      char:"💸", alt:["cash","dollar","rich"],    cat:"objects" },
  { name:"gem",        char:"💎", alt:["diamond","jewel"],         cat:"objects" },
  { name:"crown",      char:"👑", alt:["king","queen","royalty"],  cat:"objects" },
  { name:"eyes",       char:"👀", alt:["look","see","watching"],   cat:"objects" },
  { name:"brain",      char:"🧠", alt:["smart","think","mind"],    cat:"objects" },
  { name:"lock",       char:"🔒", alt:["secure","private"],        cat:"objects" },
  { name:"key",        char:"🔑", alt:["unlock","access"],         cat:"objects" },
  { name:"check",      char:"✅", alt:["done","yes","correct","ok"],cat:"objects" },
  { name:"x",          char:"❌", alt:["no","wrong","cancel"],     cat:"objects" },
  { name:"warning",    char:"⚠️", alt:["caution","alert"],         cat:"objects" },
  { name:"question",   char:"❓", alt:["huh","what","ask"],        cat:"objects" },
  { name:"exclamation",char:"❗", alt:["important","alert"],       cat:"objects" },
  // special
  { name:"Static", char:null, alt:["logo","app","static"], cat:"special", isStatic:true },
];

// Flat map for :name: → char lookups in message formatter
const EMOJI_MAP = {};
for (const e of EMOJI_DATA) {
  if (!e.isStatic) EMOJI_MAP[e.name] = e.char;
  for (const a of (e.alt || [])) { if (!EMOJI_MAP[a]) EMOJI_MAP[a] = e.char; }
}


/* =====================================================================
   FUN COMMANDS DATA
   ===================================================================== */
const EIGHT_BALL = [
  "It is certain.","It is decidedly so.","Without a doubt.","Yes, definitely.",
  "You may rely on it.","As I see it, yes.","Most likely.","Outlook good.",
  "Yes.","Signs point to yes.","Reply hazy, try again.","Ask again later.",
  "Better not tell you now.","Cannot predict now.","Concentrate and ask again.",
  "Don't count on it.","My reply is no.","My sources say no.",
  "Outlook not so good.","Very doubtful."
];
const TRUTHS = [
  "What's the most embarrassing thing you've ever done?",
  "What's your biggest fear?","Have you ever lied to get out of trouble?",
  "What's the worst gift you've ever received?",
  "What's the most childish thing you still do?",
  "Have you ever cheated on a test?","What's your most bizarre habit?",
  "What's the pettiest thing you've ever done?",
  "Have you ever blamed someone else for something you did?",
  "What's the most trouble you've ever gotten into?",
  "What's the most embarrassing song on your playlist?",
  "Have you ever faked being sick?",
  "What's the weirdest dream you've ever had?",
  "What's a secret you've never told anyone?",
  "Have you ever stood someone up?"
];
const DARES = [
  "Do your best impression of a teacher for 30 seconds.",
  "Speak in rhymes for the next 5 minutes.",
  "Do 20 jumping jacks right now.",
  "Change your status to 'I smell like cheese' for 10 minutes.",
  "Talk in an accent of the group's choosing for 3 minutes.",
  "Do your best robot dance.",
  "Give the person to your right a genuine compliment.",
  "Try to lick your elbow.",
  "Make up a short rap about this chat.",
  "Act like a cat for 1 minute.",
  "Describe a movie using only emojis.",
  "Tell an original joke you made up on the spot.",
  "Sing the next thing you want to say.",
  "Send a sincere compliment to someone random in this chat.",
  "Write a haiku about the weather right now."
];
const JOKES = [
  ["Why don't scientists trust atoms?","Because they make up everything!"],
  ["Why did the math book look sad?","It had too many problems."],
  ["What do you call a fish with no eyes?","A fsh!"],
  ["What do you call a fake noodle?","An impasta!"],
  ["Why did the scarecrow win an award?","He was outstanding in his field!"],
  ["What do you call cheese that isn't yours?","Nacho cheese!"],
  ["Why did the bicycle fall over?","Because it was two-tired!"],
  ["What do you call a sleeping dinosaur?","A dino-snore!"],
  ["How do you organize a space party?","You planet!"],
  ["Why did the golfer bring extra socks?","In case he got a hole in one!"],
  ["What did the ocean say to the beach?","Nothing, it just waved."],
  ["Why can't you give Elsa a balloon?","She'll let it go."],
  ["What do you call a nervous javelin thrower?","Shakespeare!"],
  ["Why do cows wear bells?","Because their horns don't work!"],
  ["What's a computer's favourite snack?","Microchips!"]
];
const FORTUNES = [
  "A beautiful, smart, and loving person will be coming into your life.",
  "Accept something that you cannot change, and you will feel better.",
  "Adventure can be real happiness.",
  "All the effort you are making will ultimately pay off.",
  "Be confident that things will begin to improve.",
  "Every flower blooms at a different pace.",
  "Good things come to those who hustle.",
  "Help! I'm trapped in a fortune cookie factory.",
  "Keep your feet on the ground and your thoughts at lofty heights.",
  "Luck is coming your way — be ready for it.",
  "Now is a good time to try something new.",
  "Share your happiness with others today.",
  "Something wonderful is about to happen.",
  "The best is yet to come.",
  "Change is happening. Embrace it."
];
const ADVICE = [
  "Drink more water. Seriously, you're probably dehydrated.",
  "Take a deep breath. Whatever it is, you can handle it.",
  "Go outside for at least 5 minutes today.",
  "Tell someone you appreciate them.",
  "Sleep more. Most problems look smaller after rest.",
  "Start with the small task first — momentum is everything.",
  "It's okay to say no to things that drain you.",
  "Stretch. Your future self will thank you.",
  "One step at a time is still moving forward.",
  "Don't compare your chapter 1 to someone else's chapter 20.",
  "Write down three things you're grateful for.",
  "Reach out to an old friend today.",
  "Mistakes are just data — learn and keep going.",
  "You don't need to respond to everything immediately.",
  "Celebrate small wins. They add up."
];

const BANNER_COLORS = [
  "#5865F2","#EB459E","#ED4245","#FEE75C","#57F287",
  "#00B0F4","#FF7373","#FF9B6B","#9B59B6","#2ECC71",
  "#1ABC9C","#E67E22","#3498DB","#16213E","#2C3333"
];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }


/* =====================================================================
   STATE
   ===================================================================== */
const state = {
  user: null,
  friends: [], incoming: [], outgoing: [], chats: [], messages: [],
  activeChatId: null, activeChat: null,
  userCache: {},
  unsubscribers: {
    friendships: null, incoming: null, outgoing: null,
    chats: null, messages: null, ownProfile: null, typing: null
  },
  filters: { sidebar: "" },
  groupSelections: new Set(),
  addMemberSelections: new Set(),
  soundEnabled: localStorage.getItem("sc_sound") !== "false",
  chatInitialized: new Set(),
  incomingInitialized: false,
  theme:       localStorage.getItem("sc_theme")  || "dark",
  status:      localStorage.getItem("sc_status") || "online",
  bannerColor: null,
  isPrivate:   false,
  emojiAcIndex: -1,
  emojiAcTriggerPos: -1,
  activeCat: "all",
  replyTo: null,         // { id, senderName, textPreview }
  blockedUsers: new Set(),
  typingNames: [],
  lastReadMarker: {},    // chatId → timestamp ms (from localStorage on open)
  chatScrolledInitial: new Set(), // chatIds that have had their initial scroll done
};

// Apply theme before anything renders
(function initTheme() {
  document.body.dataset.theme = state.theme;
})();

function applyTheme(t) {
  state.theme = t;
  document.body.dataset.theme = t;
  localStorage.setItem("sc_theme", t);
}


/* =====================================================================
   DOM HELPERS
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function showToast(msg, ms = 2400) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), ms);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function avatarMarkup(displayName, photoURL, sizeClass="side-row-avatar", fallbackClass="side-row-fallback") {
  if (photoURL) return `<img class="${sizeClass}" src="${escapeHtml(photoURL)}" alt="" />`;
  const initial = (displayName||"?").trim().charAt(0).toUpperCase()||"?";
  return `<div class="${fallbackClass}">${escapeHtml(initial)}</div>`;
}

function groupInitials(name) {
  if (!name) return "G";
  return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"G";
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const isToday = d.toDateString()===today.toDateString();
  const yest = new Date(today-86400000);
  const isYest = d.toDateString()===yest.toDateString();
  const time = d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
  if (isToday) return `Today at ${time}`;
  if (isYest)  return `Yesterday at ${time}`;
  return `${d.toLocaleDateString()} ${time}`;
}

function shortTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
}

function genDiscriminator() {
  return String(Math.floor(Math.random()*10000)).padStart(4,"0");
}

function genJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i=0;i<8;i++) c += chars[Math.floor(Math.random()*chars.length)];
  return c;
}


/* =====================================================================
   MESSAGE FORMATTER  (markdown-lite + emoji + URLs)
   ===================================================================== */
const IMAGE_URL_RE = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i;
const GIF_CDN_RE   = /giphy\.com|media\.tenor\.com|c\.tenor\.com|tenor\.com\/view/i;

function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") ? url : "";
  } catch { return ""; }
}

function formatMessage(raw) {
  if (!raw) return "";
  let text = escapeHtml(raw);

  // Code blocks (protect from further processing)
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (_,inner) => {
    codeBlocks.push(inner.replace(/^\n/,""));
    return `\x01CB${codeBlocks.length-1}\x01`;
  });
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_,inner) => {
    inlineCodes.push(inner);
    return `\x01IC${inlineCodes.length-1}\x01`;
  });

  // Markdown
  text = text.replace(/\*\*([^*\n][^*\n]*?)\*\*/g,"<strong>$1</strong>");
  text = text.replace(/__([^_\n][^_\n]*?)__/g,"<u>$1</u>");
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,"$1<em>$2</em>");

  // Emoji :name:  — use a placeholder so the URL regex below can't touch the
  // img tag's src attribute and corrupt it.
  const emojiBlocks = [];
  text = text.replace(/:([A-Za-z0-9_+\-]+):/g,(m,name)=>{
    let html;
    if (name==="Static") {
      html = `<img class="msg-emoji msg-emoji-static" src="${STATIC_EMOJI_URL}" alt="" />`;
    } else if (EMOJI_MAP[name]) {
      return EMOJI_MAP[name];   // plain Unicode char — safe, no URL inside
    } else {
      return m;
    }
    emojiBlocks.push(html);
    return `\x01EB${emojiBlocks.length-1}\x01`;
  });

  // Restore code blocks BEFORE URL pass so code isn't turned into a link
  text = text.replace(/\x01IC(\d+)\x01/g,(_,i)=>`<code class="inline-code">${inlineCodes[+i]}</code>`);
  text = text.replace(/\x01CB(\d+)\x01/g,(_,i)=>`<pre class="code-block"><code>${codeBlocks[+i]}</code></pre>`);

  // URLs → embeds or plain links.  Run safeUrl() so malformed strings never
  // produce broken href= attributes that GitHub Pages misroutes.
  // This runs AFTER emoji placeholders are in place, so img src attrs are safe.
  text = text.replace(/https?:\/\/[^\s<>"]+/g, rawUrl => {
    const url = safeUrl(rawUrl);
    if (!url) return escapeHtml(rawUrl);
    if (IMAGE_URL_RE.test(url) || GIF_CDN_RE.test(url)) {
      return `<a href="${url}" target="_blank" rel="noopener"><img class="msg-embed-img" src="${url}" alt="" loading="lazy" onerror="this.style.display='none'" /></a>`;
    }
    return `<a class="msg-link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // Restore emoji HTML (after URL pass — their src attrs are now safe)
  text = text.replace(/\x01EB(\d+)\x01/g,(_,i)=>emojiBlocks[+i]);

  text = text.replace(/\n/g,"<br>");
  return text;
}


/* =====================================================================
   NOTIFICATION SOUNDS
   ===================================================================== */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) try { _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(_){}
  return _audioCtx;
}
function playSound(type="message") {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type="sine";
    if (type==="message") {
      osc.frequency.setValueAtTime(700,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(980,ctx.currentTime+0.09);
      gain.gain.setValueAtTime(0.18,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.28);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.28);
    } else if (type==="ping") {
      osc.frequency.setValueAtTime(1047,ctx.currentTime);
      osc.frequency.setValueAtTime(1319,ctx.currentTime+0.12);
      gain.gain.setValueAtTime(0.14,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.35);
    }
  } catch(_){}
}


/* =====================================================================
   AUTH
   ===================================================================== */
$("#google-signin-btn").addEventListener("click", async ()=>{
  try { await signInWithPopup(auth,provider); }
  catch(e){ showToast("Sign-in failed: "+(e.message||e.code)); }
});

$("#signout-btn").addEventListener("click", async ()=>{
  cleanupAllSubscriptions();
  await signOut(auth);
});

onAuthStateChanged(auth, async firebaseUser => {
  if (firebaseUser) {
    let existing = null;
    try {
      const snap = await getDoc(doc(db,"users",firebaseUser.uid));
      if (snap.exists()) existing = snap.data();
    } catch(e){ console.error("profile fetch:",e); }

    state.user = {
      uid: firebaseUser.uid,
      username: existing?.username || null,
      discriminator: existing?.discriminator || null,
      displayName: existing?.username || firebaseUser.displayName || "User",
      bio: existing?.bio || "",
      email: firebaseUser.email || "",
      photoURL: (existing && existing.photoURL !== undefined)
        ? existing.photoURL : (firebaseUser.photoURL||null),
      googlePhotoURL: firebaseUser.photoURL||null,
      createdAt: existing?.createdAt || null
    };
    state.userCache[state.user.uid] = { ...state.user };

    if (!existing?.username) {
      showProfileSetupModal();
    } else {
      await upsertUserProfile();
      showAppUI();
      bootSubscriptions();
      bootBlocklistCheck();
    }
  } else {
    state.user = null;
    cleanupAllSubscriptions();
    showLoginUI();
  }
});

async function upsertUserProfile() {
  const u = state.user;
  await setDoc(doc(db,"users",u.uid), {
    uid: u.uid,
    displayName: u.username,
    displayNameLower: u.username.toLowerCase(),
    username: u.username,
    discriminator: u.discriminator,
    bio: u.bio||"",
    photoURL: u.photoURL||null
  }, {merge:true});
}


/* =====================================================================
   NAME BLOCKLIST BOOT CHECK
   ===================================================================== */
async function bootBlocklistCheck() {
  const u = state.user;
  if (!u?.username) return;
  if (!isNameBlocked(u.username)) return;
  const newName = generateSafeName();
  const newDisc = genDiscriminator();
  showToast(`⚠️ Your username was flagged and replaced with "${newName}".`, 5000);
  try {
    await setDoc(doc(db,"flaggedUsers",u.uid), {
      uid: u.uid,
      originalName: u.username,
      discriminator: u.discriminator,
      reason: "blocklist",
      flaggedAt: serverTimestamp()
    }, {merge:true});
    await updateDoc(doc(db,"users",u.uid), {
      displayName: newName,
      displayNameLower: newName.toLowerCase(),
      username: newName,
      discriminator: newDisc
    });
    state.user.username = newName;
    state.user.displayName = newName;
    state.user.discriminator = newDisc;
    state.userCache[u.uid] = { ...state.user };
    updateUserPanel();
  } catch(err){ console.error("bootBlocklistCheck:",err); }
}


/* =====================================================================
   PROFILE SETUP MODAL
   ===================================================================== */
function showProfileSetupModal() {
  const u = state.user;
  $("#setup-photo-input").value = u.googlePhotoURL||"";
  updateAvatarPreview("setup","",u.googlePhotoURL||null);
  openModal("profile-setup-modal");
}

$("#setup-photo-input").addEventListener("input",()=>{
  updateAvatarPreview("setup",
    $("#setup-username-input").value.trim(),
    $("#setup-photo-input").value.trim()||state.user?.googlePhotoURL||null);
});
$("#setup-username-input").addEventListener("input",()=>{
  updateAvatarPreview("setup",
    $("#setup-username-input").value.trim(),
    $("#setup-photo-input").value.trim()||state.user?.googlePhotoURL||null);
});

function updateAvatarPreview(prefix,name,photoURL) {
  const preview = $(`#${prefix}-avatar-preview`);
  const initial = $(`#${prefix}-avatar-initial`);
  if (!preview) return;
  const oldImg = preview.querySelector("img");
  if (oldImg) oldImg.remove();
  if (photoURL) {
    const img = document.createElement("img");
    img.src = photoURL;
    img.onerror = ()=>{ img.remove(); if(initial) initial.style.display=""; };
    if (initial) initial.style.display="none";
    preview.appendChild(img);
  } else {
    if (initial) {
      initial.style.display="";
      initial.textContent = name ? name.charAt(0).toUpperCase() : "?";
    }
  }
}

$("#setup-confirm-btn").addEventListener("click", async ()=>{
  const username = $("#setup-username-input").value.trim();
  const bio      = $("#setup-bio-input").value.trim();
  const photoInput = $("#setup-photo-input").value.trim();
  const errEl    = $("#setup-error");
  errEl.textContent = "";

  if (!username||username.length<3)    { errEl.textContent="Username must be at least 3 characters."; return; }
  if (username.length>32)              { errEl.textContent="Username must be 32 characters or fewer."; return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)){ errEl.textContent="Username: letters, numbers, underscores only."; return; }

  if (isNameBlocked(username)) {
    const safe = generateSafeName();
    errEl.textContent = `That username isn't allowed. Try "${safe}" instead.`;
    return;
  }

  const discriminator = genDiscriminator();
  const photoURL = photoInput||state.user.googlePhotoURL||null;

  state.user.username = username;
  state.user.discriminator = discriminator;
  state.user.displayName = username;
  state.user.bio = bio;
  state.user.photoURL = photoURL;

  const btn = $("#setup-confirm-btn");
  btn.disabled=true; btn.textContent="Saving…";

  try {
    await setDoc(doc(db,"users",state.user.uid),{
      uid: state.user.uid,
      displayName: username, displayNameLower: username.toLowerCase(),
      username, discriminator,
      bio: bio||"", email: state.user.email||"",
      photoURL: photoURL||null,
      createdAt: serverTimestamp()
    },{merge:true});
    state.userCache[state.user.uid] = { ...state.user };
    closeModal("profile-setup-modal");
    showAppUI();
    bootSubscriptions();
  } catch(err){
    errEl.textContent="Failed to save: "+err.message;
  } finally {
    btn.disabled=false; btn.textContent="Let's Go →";
  }
});


/* =====================================================================
   UI ROUTING
   ===================================================================== */
function showAppUI() {
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  updateUserPanel();
  showFriendsView();
}
function showLoginUI() {
  $("#login-screen").classList.remove("hidden");
  $("#app").classList.add("hidden");
}

function updateUserPanel() {
  const u = state.user;
  if (!u) return;
  $("#user-panel-name").textContent = u.username||u.displayName||"User";
  $("#user-panel-tag").textContent  = u.discriminator ? `#${u.discriminator}` : "";
  $("#user-panel-avatar-wrap").innerHTML = avatarMarkup(
    u.username||u.displayName, u.photoURL,
    "user-panel-avatar","user-panel-avatar-fallback"
  );
  const dot = $("#user-status-dot");
  if (dot) dot.dataset.status = state.status||"online";
}

function showFriendsView() {
  state.activeChatId = null; state.activeChat = null;
  $("#rail-home").classList.add("active");
  $$(".rail-group-avatar").forEach(el=>el.classList.remove("active"));
  $$(".side-row").forEach(el=>el.classList.remove("active"));
  $("#open-friends-btn").classList.add("active");
  $("#friends-view").classList.remove("hidden");
  $("#chat-view").classList.add("hidden");
  $("#empty-view").classList.add("hidden");
  if (state.unsubscribers.messages) { state.unsubscribers.messages(); state.unsubscribers.messages=null; }
}

function showChatView() {
  $("#friends-view").classList.add("hidden");
  $("#empty-view").classList.add("hidden");
  $("#chat-view").classList.remove("hidden");
  $("#open-friends-btn").classList.remove("active");
  $("#rail-home").classList.remove("active");
}

$("#rail-home").addEventListener("click", showFriendsView);
$("#open-friends-btn").addEventListener("click", showFriendsView);


/* =====================================================================
   STATUS PICKER  (click status dot to change)
   ===================================================================== */
const STATUS_LABELS = { online:"Online", idle:"Idle", dnd:"Do Not Disturb", invisible:"Invisible" };

document.addEventListener("click", e=>{
  const dot = e.target.closest("#user-status-dot");
  if (dot) { e.stopPropagation(); toggleStatusPicker(dot); }
});

function toggleStatusPicker(anchor) {
  let picker = $("#status-picker");
  if (picker) { picker.remove(); return; }
  picker = document.createElement("div");
  picker.id = "status-picker";
  picker.className = "status-picker";
  picker.innerHTML = Object.entries(STATUS_LABELS).map(([s,label])=>`
    <div class="status-picker-option${s===state.status?" active":""}" data-status="${s}">
      <span class="status-dot-sm" data-status="${s}"></span>${label}
    </div>`).join("");

  const rect = anchor.getBoundingClientRect();
  picker.style.left = (rect.right+8)+"px";
  picker.style.top  = (rect.top-4)+"px";
  document.body.appendChild(picker);

  picker.addEventListener("click", async e2=>{
    const opt = e2.target.closest("[data-status]");
    if (!opt) return;
    const ns = opt.dataset.status;
    state.status = ns;
    localStorage.setItem("sc_status",ns);
    updateUserPanel();
    picker.remove();
    try { await updateDoc(doc(db,"users",state.user.uid),{status:ns}); } catch(_){}
  });
  setTimeout(()=>{
    document.addEventListener("click",()=>{ document.getElementById("status-picker")?.remove(); },{once:true});
  },0);
}


/* =====================================================================
   SUBSCRIPTIONS
   ===================================================================== */
function cleanupAllSubscriptions() {
  for (const k of Object.keys(state.unsubscribers)) {
    if (state.unsubscribers[k]) { try{state.unsubscribers[k]();}catch(_){} state.unsubscribers[k]=null; }
  }
  state.friends=[]; state.incoming=[]; state.outgoing=[];
  state.chats=[]; state.messages=[];
  state.activeChatId=null; state.activeChat=null;
  state.chatInitialized.clear(); state.incomingInitialized=false;
}

function bootSubscriptions() {
  const uid = state.user.uid;

  state.unsubscribers.ownProfile = onSnapshot(doc(db,"users",uid), snap=>{
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.username) { state.user.username=data.username; state.user.displayName=data.username; }
    if (data.discriminator) state.user.discriminator=data.discriminator;
    state.user.bio = data.bio||"";
    if (data.photoURL!==undefined) state.user.photoURL=data.photoURL;
    if (data.status) { state.status=data.status; localStorage.setItem("sc_status",data.status); }
    if (data.bannerColor!==undefined) state.bannerColor=data.bannerColor||null;
    if (data.isPrivate!==undefined) state.isPrivate=!!data.isPrivate;
    if (data.createdAt) state.user.createdAt=data.createdAt;
    state.userCache[uid] = { ...state.user, ...data };
    applyBlockedFromProfile(data);
    updateUserPanel();
  }, err=>console.error("ownProfile:",err));

  // Start presence heartbeat
  startPresenceHeartbeat();

  state.unsubscribers.friendships = onSnapshot(
    query(collection(db,"friendships"),where("users","array-contains",uid)),
    async snap=>{
      const list=[];
      for (const d of snap.docs) {
        const data=d.data();
        const otherUid=data.users.find(u=>u!==uid);
        if (!otherUid) continue;
        const profile=await fetchUserProfile(otherUid);
        list.push({ friendshipId:d.id, uid:otherUid,
          displayName:profile?.username||profile?.displayName||"Unknown",
          discriminator:profile?.discriminator||null, photoURL:profile?.photoURL||null });
      }
      list.sort((a,b)=>a.displayName.localeCompare(b.displayName));
      state.friends=list;
      renderFriendsList(); renderModalFriendList();
    }, err=>console.error("friendships:",err));

  state.unsubscribers.incoming = onSnapshot(
    query(collection(db,"friendRequests"),where("toUid","==",uid)),
    snap=>{
      const prevLen=state.incoming.length;
      state.incoming=snap.docs.map(d=>({id:d.id,...d.data()}));
      if (state.incomingInitialized && state.incoming.length>prevLen) playSound("ping");
      state.incomingInitialized=true;
      renderPendingLists();
    }, err=>console.error("incoming:",err));

  state.unsubscribers.outgoing = onSnapshot(
    query(collection(db,"friendRequests"),where("fromUid","==",uid)),
    snap=>{ state.outgoing=snap.docs.map(d=>({id:d.id,...d.data()})); renderPendingLists(); },
    err=>console.error("outgoing:",err));

  let _prevChatTimes = {};   // chatId → lastMessageAt ms (for background notifications)

  state.unsubscribers.chats = onSnapshot(
    query(collection(db,"chats"),where("members","array-contains",uid)),
    async snap=>{
      const arr=[];
      for (const d of snap.docs) arr.push({id:d.id,...d.data()});
      for (const c of arr) {
        if (c.type==="dm") {
          const o=c.members.find(m=>m!==uid);
          if (o&&!state.userCache[o]) await fetchUserProfile(o);
        }
      }

      // Background notification: play sound if any non-active chat got a new message
      // from someone OTHER than the current user
      if (Object.keys(_prevChatTimes).length > 0) {
        for (const c of arr) {
          const prev=_prevChatTimes[c.id]||0;
          const cur=c.lastMessageAt?.toMillis?.()||0;
          const sentByMe=c.lastSenderUid===uid;
          if (cur>prev && c.id!==state.activeChatId && !sentByMe) {
            playSound("message"); break;
          }
        }
      }
      // Update baseline
      _prevChatTimes={};
      for (const c of arr) _prevChatTimes[c.id]=c.lastMessageAt?.toMillis?.()||0;

      arr.sort((a,b)=>{
        const at=a.lastMessageAt?.toMillis?a.lastMessageAt.toMillis():0;
        const bt=b.lastMessageAt?.toMillis?b.lastMessageAt.toMillis():0;
        return bt-at;
      });
      state.chats=arr; renderChatLists();
      if (state.activeChatId) {
        const updated=state.chats.find(c=>c.id===state.activeChatId);
        if (updated) { state.activeChat=updated; renderChatHeader(); }
      }
    }, err=>console.error("chats:",err));
}


/* =====================================================================
   USER PROFILE FETCH (cached)
   ===================================================================== */
async function fetchUserProfile(uid) {
  if (state.userCache[uid]) return state.userCache[uid];
  try {
    const d = await getDoc(doc(db,"users",uid));
    if (d.exists()) { state.userCache[uid]=d.data(); return state.userCache[uid]; }
  } catch(e){ console.error("fetchUserProfile:",e); }
  return null;
}


/* =====================================================================
   RENDER — Friends list / pending
   ===================================================================== */
function renderFriendsList() {
  const filterText = ($("#friends-filter")?.value||"").trim().toLowerCase();
  const list=$("#friends-list"), empty=$("#friends-empty");
  const filtered=state.friends.filter(f=>!filterText||f.displayName.toLowerCase().includes(filterText));
  $("#all-count").textContent=`All Friends — ${state.friends.length}`;
  if (!state.friends.length) { list.innerHTML=""; empty.hidden=false; return; }
  empty.hidden=true;
  list.innerHTML=filtered.map(f=>`
    <div class="friend-row" data-uid="${escapeHtml(f.uid)}">
      ${avatarMarkup(f.displayName,f.photoURL,"friend-row-avatar","friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(f.displayName)}</div>
        <div class="friend-row-tag">${f.discriminator?`#${escapeHtml(f.discriminator)}`:""}</div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle" title="Message" data-action="message" data-uid="${escapeHtml(f.uid)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <button class="action-circle" title="View Profile" data-action="view-profile" data-uid="${escapeHtml(f.uid)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg>
        </button>
        <button class="action-circle decline" title="Remove friend" data-action="remove" data-uid="${escapeHtml(f.uid)}" data-friendship-id="${escapeHtml(f.friendshipId)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>
        </button>
      </div>
    </div>`).join("");
}

function renderPendingLists() {
  const incomingList=$("#incoming-list"), outgoingList=$("#outgoing-list");
  $("#incoming-empty").hidden=state.incoming.length>0;
  $("#outgoing-empty").hidden=state.outgoing.length>0;
  incomingList.innerHTML=state.incoming.map(r=>`
    <div class="friend-row">
      ${avatarMarkup(r.fromName,r.fromPhoto,"friend-row-avatar","friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(r.fromName||"Unknown")}</div>
        <div class="friend-row-meta">Incoming friend request</div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle accept" title="Accept" data-action="accept" data-id="${escapeHtml(r.id)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </button>
        <button class="action-circle decline" title="Decline" data-action="decline" data-id="${escapeHtml(r.id)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>`).join("");
  outgoingList.innerHTML=state.outgoing.map(r=>`
    <div class="friend-row">
      ${avatarMarkup(r.toName,r.toPhoto,"friend-row-avatar","friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(r.toName||"Unknown")}</div>
        <div class="friend-row-meta">Pending — waiting for them to accept</div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle decline" title="Cancel" data-action="cancel-out" data-id="${escapeHtml(r.id)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>`).join("");
}

// Friends view delegation
$("#friends-view").addEventListener("click", async e=>{
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action=btn.dataset.action;
  if      (action==="message")      await openOrCreateDm(btn.dataset.uid);
  else if (action==="view-profile") showProfileCard(btn.dataset.uid, e);
  else if (action==="remove") {
    if (!confirm("Remove this friend?")) return;
    try { await deleteDoc(doc(db,"friendships",btn.dataset.friendshipId)); showToast("Friend removed"); }
    catch(err){ showToast("Error: "+err.message); }
  }
  else if (action==="accept")     await acceptRequest(btn.dataset.id);
  else if (action==="decline"||action==="cancel-out") {
    try { await deleteDoc(doc(db,"friendRequests",btn.dataset.id)); }
    catch(err){ showToast("Error: "+err.message); }
  }
});


/* =====================================================================
   FRIENDS PANEL — tabs, search, add-friend
   ===================================================================== */
$$(".tab").forEach(t=>t.addEventListener("click",()=>{
  $$(".tab").forEach(x=>x.classList.remove("active")); t.classList.add("active");
  $$(".tab-panel").forEach(p=>p.classList.add("hidden"));
  $(`.tab-panel[data-panel="${t.dataset.tab}"]`).classList.remove("hidden");
}));

$("#friends-filter").addEventListener("input", renderFriendsList);
$("#add-friend-search-btn").addEventListener("click", searchUsers);
$("#add-friend-input").addEventListener("keydown", e=>{ if(e.key==="Enter") searchUsers(); });

async function searchUsers() {
  const raw = $("#add-friend-input").value.trim();
  const results = $("#search-results");
  results.innerHTML="";
  if (!raw) { $("#search-hint").textContent="Enter a username to search."; return; }
  $("#search-hint").textContent="Searching…";

  try {
    let found=[];
    const hashMatch = raw.match(/^(.+)#(\d{4})$/);

    if (hashMatch) {
      const [,uname,disc]=hashMatch;
      const term=uname.toLowerCase();
      const q=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(50));
      const snap=await getDocs(q);
      snap.forEach(d=>{ const u=d.data(); if(u.uid&&u.uid!==state.user.uid&&u.displayNameLower===term&&u.discriminator===disc) found.push(u); });
    } else {
      const term=raw.toLowerCase();
      const q=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(20));
      const snap=await getDocs(q);
      snap.forEach(d=>{ const u=d.data(); if(u.uid&&u.uid!==state.user.uid) found.push(u); });
    }

    if (!found.length) { $("#search-hint").textContent="No users found."; return; }
    $("#search-hint").textContent=`Found ${found.length} user(s).`;

    const friendUids=new Set(state.friends.map(f=>f.uid));
    const incomingFromUids=new Set(state.incoming.map(r=>r.fromUid));
    const outgoingToUids=new Set(state.outgoing.map(r=>r.toUid));

    results.innerHTML=found.map(u=>{
      const tag=u.discriminator?`#${escapeHtml(u.discriminator)}`:"";
      const isPrivate=u.isPrivate&&!friendUids.has(u.uid);
      const displayBio=isPrivate?"🔒 Private profile":(u.bio||"");
      let actionHtml=`<button class="btn-primary" data-action="send-request" data-uid="${escapeHtml(u.uid)}" data-name="${escapeHtml(u.username||u.displayName||"")}" data-photo="${escapeHtml(u.photoURL||"")}">Add Friend</button>`;
      if (friendUids.has(u.uid)) actionHtml=`<span class="friend-row-meta">Already friends</span>`;
      else if (outgoingToUids.has(u.uid)) actionHtml=`<span class="friend-row-meta">Request sent</span>`;
      else if (incomingFromUids.has(u.uid)) actionHtml=`<span class="friend-row-meta">Accept their request instead</span>`;
      return `
        <div class="friend-row">
          ${isPrivate?`<div class="friend-row-fallback" style="background:var(--t-muted)">?</div>`:avatarMarkup(u.username||u.displayName,u.photoURL,"friend-row-avatar","friend-row-fallback")}
          <div class="friend-row-info">
            <div class="friend-row-name">${escapeHtml(u.username||u.displayName||"Unknown")}</div>
            <div class="friend-row-tag">${tag}</div>
            ${displayBio?`<div class="friend-row-meta" style="font-size:11px;">${escapeHtml(displayBio.slice(0,60))}</div>`:""}
          </div>
          <div class="friend-row-actions">
            <button class="btn-ghost" style="font-size:12px;padding:4px 8px;" data-action="view-profile-search" data-uid="${escapeHtml(u.uid)}">Profile</button>
            ${actionHtml}
          </div>
        </div>`;
    }).join("");
  } catch(err){ console.error(err); $("#search-hint").textContent="Search failed: "+err.message; }
}

$("#search-results").addEventListener("click", async e=>{
  // View profile from search
  const vpBtn=e.target.closest("[data-action='view-profile-search']");
  if (vpBtn) { showProfileCard(vpBtn.dataset.uid, e); return; }

  const btn=e.target.closest("button[data-action='send-request']");
  if (!btn) return;
  const toUid=btn.dataset.uid, toName=btn.dataset.name, toPhoto=btn.dataset.photo||null;
  btn.disabled=true; btn.textContent="Sending…";
  try {
    if (state.friends.find(f=>f.uid===toUid)) throw new Error("Already friends");
    if (state.outgoing.find(r=>r.toUid===toUid)) throw new Error("Already sent");
    if (state.incoming.find(r=>r.fromUid===toUid)) throw new Error("Accept their request instead");
    const reqId=`${state.user.uid}_${toUid}`;
    await setDoc(doc(db,"friendRequests",reqId),{
      fromUid:state.user.uid, toUid,
      fromName:state.user.displayName, fromPhoto:state.user.photoURL||null,
      toName, toPhoto, createdAt:serverTimestamp()
    });
    btn.textContent="Sent ✓"; showToast("Friend request sent");
  } catch(err){ btn.disabled=false; btn.textContent="Add Friend"; showToast("Error: "+err.message); }
});


/* =====================================================================
   ACCEPT REQUEST  (auto-opens DM)
   ===================================================================== */
async function acceptRequest(requestId) {
  const req=state.incoming.find(r=>r.id===requestId);
  if (!req) return;
  const me=state.user.uid, them=req.fromUid;
  const sorted=[me,them].sort();
  const friendshipId=sorted.join("_");
  try {
    const batch=writeBatch(db);
    batch.set(doc(db,"friendships",friendshipId),{users:sorted,createdAt:serverTimestamp()});
    batch.delete(doc(db,"friendRequests",requestId));
    await batch.commit();
    showToast("Friend added! Opening DM…");
    setTimeout(()=>openOrCreateDm(them),500);
  } catch(err){ showToast("Error: "+err.message); }
}


/* =====================================================================
   RENDER — Sidebar lists + rail
   ===================================================================== */
function chatHasUnread(c) {
  if (!c||state.activeChatId===c.id) return false;
  // If the current user sent the last message, it can't be "unread" for them
  if (c.lastSenderUid && c.lastSenderUid===state.user?.uid) return false;
  const readAt=parseInt(localStorage.getItem(`sc_read_${c.id}`)||"0",10);
  const lastMsg=c.lastMessageAt?.toMillis?.()||0;
  return lastMsg>readAt && readAt>0;
}

function renderChatLists() {
  const filterText=state.filters.sidebar.toLowerCase();
  const dms=state.chats.filter(c=>c.type==="dm");
  const groups=state.chats.filter(c=>c.type==="group");

  $("#dm-list").innerHTML=dms.map(c=>{
    const otherUid=c.members.find(m=>m!==state.user.uid);
    const profile=state.userCache[otherUid];
    const name=profile?.username||profile?.displayName||"Direct Message";
    const photo=profile?.photoURL||null;
    if (filterText&&!name.toLowerCase().includes(filterText)) return "";
    const active=state.activeChatId===c.id?"active":"";
    const unread=chatHasUnread(c)?`<span class="side-item-unread" title="New messages">●</span>`:"";
    return `
      <div class="side-row ${active}" data-chat-id="${escapeHtml(c.id)}" data-type="dm">
        ${avatarMarkup(name,photo,"side-row-avatar","side-row-fallback")}
        <div class="side-row-name">${escapeHtml(name)}</div>
        ${unread}
        <button class="icon-btn side-row-close" title="Close" data-action="close-dm" data-chat-id="${escapeHtml(c.id)}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>`;
  }).join("");

  $("#group-list").innerHTML=groups.map(c=>{
    const name=c.name||"Group";
    if (filterText&&!name.toLowerCase().includes(filterText)) return "";
    const active=state.activeChatId===c.id?"active":"";
    const unread=chatHasUnread(c)?`<span class="side-item-unread" title="New messages">●</span>`:"";
    return `
      <div class="side-row ${active}" data-chat-id="${escapeHtml(c.id)}" data-type="group">
        <div class="side-row-fallback">${escapeHtml(groupInitials(name))}</div>
        <div class="side-row-name">${escapeHtml(name)}</div>
        ${unread}
      </div>`;
  }).join("");

  $("#rail-groups").innerHTML=groups.map(c=>{
    const active=state.activeChatId===c.id?"active":"";
    return `<div class="rail-group-avatar ${active}" data-chat-id="${escapeHtml(c.id)}" title="${escapeHtml(c.name||"Group")}">${escapeHtml(groupInitials(c.name||"G"))}</div>`;
  }).join("");
}

$("#dm-list").addEventListener("click", e=>{
  const close=e.target.closest("button[data-action='close-dm']");
  if (close) { e.stopPropagation(); if(state.activeChatId===close.dataset.chatId) showFriendsView(); return; }
  const row=e.target.closest(".side-row"); if(row) openChat(row.dataset.chatId);
});
$("#group-list").addEventListener("click", e=>{ const row=e.target.closest(".side-row"); if(row) openChat(row.dataset.chatId); });
$("#rail-groups").addEventListener("click", e=>{ const av=e.target.closest(".rail-group-avatar"); if(av) openChat(av.dataset.chatId); });
$("#sidebar-search").addEventListener("input", e=>{ state.filters.sidebar=e.target.value; renderChatLists(); });
$("#new-dm-btn").addEventListener("click", ()=>{
  showFriendsView();
  $$(".tab").forEach(x=>x.classList.remove("active")); $(".tab[data-tab='all']").classList.add("active");
  $$(".tab-panel").forEach(p=>p.classList.add("hidden")); $(".tab-panel[data-panel='all']").classList.remove("hidden");
  showToast("Click any friend's message icon to start a DM.");
});


/* =====================================================================
   DM open / create
   ===================================================================== */
async function openOrCreateDm(otherUid) {
  const me=state.user.uid;
  const sorted=[me,otherUid].sort();
  const chatId=`dm_${sorted[0]}_${sorted[1]}`;
  // Don't use getDoc — Firestore rules reject reads on non-existent docs when
  // resource is null.  Just setDoc (idempotent) and let it fail only on real
  // permission errors.
  if (!state.chats.find(c=>c.id===chatId)) {
    try {
      await setDoc(doc(db,"chats",chatId),{
        type:"dm", members:sorted, name:"",
        createdBy:me, createdAt:serverTimestamp(),
        lastMessage:"", lastMessageAt:serverTimestamp()
      });
    } catch(err){
      if (err.code==="permission-denied") {
        showToast("Could not create DM — check Firestore rules."); return;
      }
      // Any other error (e.g. already-exists) is fine — just open the chat
    }
  }
  openChat(chatId);
}


/* =====================================================================
   OPEN CHAT
   ===================================================================== */
async function openChat(chatId) {
  // Save draft for the chat we're leaving
  const prevId=state.activeChatId;
  if (prevId && prevId!==chatId) {
    const draftVal=$("#composer-input")?.value||"";
    localStorage.setItem(`sc_draft_${prevId}`, draftVal);
    // Mark previous chat as fully read
    localStorage.setItem(`sc_read_${prevId}`, String(Date.now()));
  }

  state.activeChatId=chatId;
  state.activeChat=state.chats.find(c=>c.id===chatId)||null;
  if (!state.activeChat) {
    try { const d=await getDoc(doc(db,"chats",chatId)); if(d.exists()) state.activeChat={id:d.id,...d.data()}; } catch(_){}
  }
  if (!state.activeChat) return;

  // Load last-read marker for this chat (so unread divider shows correctly)
  const savedRead=parseInt(localStorage.getItem(`sc_read_${chatId}`)||"0",10);
  state.lastReadMarker[chatId]=savedRead;
  // Reset initial-scroll flag so divider scroll fires once on open
  state.chatScrolledInitial.delete(chatId);
  // Mark this chat as read from this moment forward
  localStorage.setItem(`sc_read_${chatId}`, String(Date.now()));

  showChatView(); renderChatHeader(); renderChatLists();
  clearReplyTo();
  renderTypingIndicator([]);

  // Restore draft for this chat
  const draftEl=$("#composer-input");
  if (draftEl) {
    draftEl.value=localStorage.getItem(`sc_draft_${chatId}`)||"";
    draftEl.style.height="auto";
    updateSendBtn();
  }

  // Start typing listener for this chat
  startTypingListener(chatId);
  if (state.unsubscribers.messages) { state.unsubscribers.messages(); state.unsubscribers.messages=null; }
  state.messages=[];
  $("#messages").innerHTML=`<div class="empty" style="margin:24px;">Loading messages…</div>`;

  state.unsubscribers.messages=onSnapshot(
    query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"),limit(200)),
    snap=>{
      const prevLen=state.messages.length;
      state.messages=snap.docs.map(d=>({id:d.id,...d.data()}));
      if (state.chatInitialized.has(chatId)&&state.messages.length>prevLen) {
        const newest=state.messages[state.messages.length-1];
        if (newest&&newest.senderUid!==state.user.uid) playSound("message");
      }
      state.chatInitialized.add(chatId);
      renderMessages();
    },
    err=>{ console.error(err); $("#messages").innerHTML=`<div class="empty" style="color:var(--c-danger);margin:24px;">Could not load: ${escapeHtml(err.message)}</div>`; }
  );
}


/* =====================================================================
   RENDER CHAT HEADER
   ===================================================================== */
async function renderChatHeader() {
  const c=state.activeChat; if (!c) return;
  const avatarWrap=$("#chat-header-avatar-wrap");
  const addBtn=$("#chat-add-member-btn"), leaveBtn=$("#chat-leave-btn");
  const codeBadge=$("#chat-join-code-badge");

  if (c.type==="dm") {
    const otherUid=c.members.find(m=>m!==state.user.uid);
    const profile=await fetchUserProfile(otherUid);
    const name=profile?.username||profile?.displayName||"Direct Message";
    const tag=profile?.discriminator?`#${profile.discriminator}`:"";
    const status=profile?.status||"online";
    $("#chat-header-name").textContent=name;
    $("#chat-header-sub").textContent=tag?`${tag} · Direct Message`:"Direct Message";
    avatarWrap.innerHTML=avatarMarkup(name,profile?.photoURL,"chat-header-avatar","chat-header-avatar-fallback");
    if(addBtn) addBtn.hidden=true; if(leaveBtn) leaveBtn.hidden=true;
    if(codeBadge) codeBadge.hidden=true;
  } else {
    const isLeader=Array.isArray(c.leaders)&&c.leaders.includes(state.user.uid);
    $("#chat-header-name").textContent=c.name||"Group";
    $("#chat-header-sub").textContent=`${c.members.length} member${c.members.length===1?"":"s"}${isLeader?" · 👑 You're a leader":""}`;
    avatarWrap.innerHTML=`<div class="chat-header-avatar-fallback">${escapeHtml(groupInitials(c.name||"G"))}</div>`;
    if(addBtn) addBtn.hidden=false; if(leaveBtn) leaveBtn.hidden=false;
    if (codeBadge) {
      if (c.joinCode) { codeBadge.textContent=c.joinCode; codeBadge.hidden=false; codeBadge.title="Click to copy join code"; }
      else codeBadge.hidden=true;
    }
  }
}

// Copy join code on badge click
document.addEventListener("click", e=>{
  if (e.target.closest("#chat-join-code-badge")) {
    const c=state.activeChat;
    if (!c?.joinCode) return;
    navigator.clipboard.writeText(c.joinCode)
      .then(()=>showToast("Join code copied!"))
      .catch(()=>showToast("Code: "+c.joinCode));
  }
});


/* =====================================================================
   RENDER MESSAGES
   ===================================================================== */
/* SVG icon strings reused in message actions */
const SVG_EDIT   = `<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const SVG_REPORT = `<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>`;
const SVG_REPLY  = `<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>`;

const BADGE_DEFS = {
  og:           { label:"OG",           color:"#ffd700", bg:"rgba(255,215,0,.15)",  title:"Original member" },
  helper:       { label:"Helper",       color:"#23a55a", bg:"rgba(35,165,90,.15)",  title:"Community helper" },
  bug_reporter: { label:"Bug Reporter", color:"#eb459e", bg:"rgba(235,69,158,.15)", title:"Reported a bug" },
  early_tester: { label:"Early Tester", color:"#58a6ff", bg:"rgba(88,166,255,.15)", title:"Early tester" },
};

function renderBadges(badges=[]) {
  return badges.map(b=>{
    const d=BADGE_DEFS[b]; if(!d) return "";
    return `<span class="badge-chip" title="${escapeHtml(d.title)}" style="color:${d.color};background:${d.bg};">${escapeHtml(d.label)}</span>`;
  }).join("");
}

function buildReplyPreview(m) {
  if (!m.replyToMessageId) return "";
  const ref=state.messages.find(x=>x.id===m.replyToMessageId);
  const name=m.replyToSenderName||(ref?.senderName)||"Unknown";
  const preview=m.replyToTextPreview||(ref?.text||"").slice(0,80)||"";
  return `<div class="reply-preview">
    <span class="reply-preview-name">${escapeHtml(name)}</span>
    <span class="reply-preview-text">${escapeHtml(preview)}</span>
  </div>`;
}

function buildReactionBar(reactions={}, msgId) {
  const entries=Object.entries(reactions).filter(([,uids])=>uids.length>0);
  if (!entries.length) return "";
  const pills=entries.map(([emoji,uids])=>{
    const mine=uids.includes(state.user?.uid);
    return `<button class="reaction-pill${mine?" active":""}" data-react-emoji="${escapeHtml(emoji)}" data-react-msg="${escapeHtml(msgId)}">${emoji} <span>${uids.length}</span></button>`;
  }).join("");
  return `<div class="reactions-row">${pills}</div>`;
}

function renderMessages() {
  const wrap=$("#messages");
  if (!state.messages.length) {
    wrap.innerHTML=`<div class="empty" style="margin:24px;">No messages yet — say hi!</div>`;
    return;
  }
  const html=[];
  let lastSenderUid=null, lastTime=0;
  const c=state.activeChat;
  const leaders=Array.isArray(c?.leaders)?c.leaders:[];
  const lastRead=state.lastReadMarker[state.activeChatId]||0;
  let unreadDividerInserted=false;
  // Pre-count unread messages for the divider label — only count messages from OTHERS
  const myUid=state.user?.uid;
  const unreadCount=lastRead>0
    ? state.messages.filter(m=>
        !state.blockedUsers.has(m.senderUid) &&
        m.senderUid!==myUid &&
        (m.createdAt?.toMillis?.()??0)>lastRead
      ).length
    : 0;

  for (const m of state.messages) {
    // Hide messages from blocked users (except own)
    if (state.blockedUsers.has(m.senderUid)&&m.senderUid!==state.user?.uid) continue;

    const ts=m.createdAt;
    const tms=ts?.toMillis?ts.toMillis():0;

    // Insert unread divider before first NEW message from someone else
    // (skip own messages — you can't have "unread" messages you sent yourself)
    if (!unreadDividerInserted && unreadCount>0 && lastRead>0 && tms>lastRead && m.senderUid!==myUid && html.length>0) {
      const label=unreadCount===1?"1 New Message":`${unreadCount} New Messages`;
      html.push(`<div class="unread-divider" role="separator" id="unread-divider-bar" title="Click to dismiss"><span>${label}</span></div>`);
      unreadDividerInserted=true;
    }
    const sameSender=m.senderUid===lastSenderUid;
    const closeInTime=tms-lastTime<5*60*1000;
    const isSelf=m.senderUid===state.user?.uid;
    const isLeader=leaders.includes(m.senderUid);
    const profile=state.userCache[m.senderUid]||{};
    const badges=profile.badges||[];

    const editedLabel=m.edited?`<span class="msg-edited">(edited)</span>`:"";
    const replyHtml=buildReplyPreview(m);
    const reactionsHtml=buildReactionBar(m.reactions||{}, m.id);

    const msgActions=`<div class="msg-actions">
      <button class="msg-action-btn" data-action="reply-msg" data-msg-id="${escapeHtml(m.id)}" title="Reply">${SVG_REPLY}</button>
      ${isSelf
        ?`<button class="msg-action-btn" data-action="edit-msg" data-msg-id="${escapeHtml(m.id)}" title="Edit">${SVG_EDIT}</button>`
        :`<button class="msg-action-btn danger" data-action="report-msg" data-msg-id="${escapeHtml(m.id)}" data-uid="${escapeHtml(m.senderUid)}" data-name="${escapeHtml(m.senderName||"User")}" title="Report">${SVG_REPORT}</button>`
      }
    </div>`;

    if (m.commandResult||m.type==="command") {
      html.push(`
        <div class="message-group msg-command-result" data-msg-id="${escapeHtml(m.id)}">
          <div class="msg-content" style="padding-left:0">
            <div class="msg-head">
              <span class="msg-author">${escapeHtml(m.senderName||"User")}</span>
              <span class="msg-time">${escapeHtml(formatTime(ts))}</span>
            </div>
            <div class="msg-body">${formatMessage(m.text||"")}</div>
          </div>
        </div>`);
    } else if (sameSender&&closeInTime&&lastSenderUid!==null) {
      html.push(`
        <div class="msg-followup" data-msg-id="${escapeHtml(m.id)}">
          <span class="msg-time-inline">${escapeHtml(shortTime(ts))}</span>
          ${replyHtml}
          <div class="msg-body">${formatMessage(m.text||"")}${editedLabel}</div>
          ${reactionsHtml}
          ${msgActions}
        </div>`);
    } else {
      html.push(`
        <div class="message-group" data-msg-id="${escapeHtml(m.id)}">
          <div class="msg-avatar-btn" data-profile-uid="${escapeHtml(m.senderUid)}" role="button" tabindex="0">
            ${avatarMarkup(m.senderName,m.senderPhoto,"msg-avatar","msg-avatar-fallback")}
          </div>
          <div class="msg-content">
            <div class="msg-head">
              <span class="msg-author" data-profile-uid="${escapeHtml(m.senderUid)}">${escapeHtml(m.senderName||"User")}</span>
              ${isLeader?`<span class="leader-badge">👑</span>`:""}
              ${renderBadges(badges)}
              <span class="msg-time">${escapeHtml(formatTime(ts))}</span>
            </div>
            ${replyHtml}
            <div class="msg-body">${formatMessage(m.text||"")}${editedLabel}</div>
            ${reactionsHtml}
            ${msgActions}
          </div>
        </div>`);
    }
    lastSenderUid=m.senderUid; lastTime=tms;
  }
  wrap.innerHTML=html.join("");
  const cid=state.activeChatId;
  const alreadyScrolled=state.chatScrolledInitial.has(cid);
  if (!alreadyScrolled) {
    state.chatScrolledInitial.add(cid);
    // First render: scroll to unread divider if present, otherwise scroll to bottom
    if (unreadDividerInserted) {
      const divider=wrap.querySelector(".unread-divider");
      if (divider) { divider.scrollIntoView({block:"start"}); wrap.scrollTop-=12; }
    } else {
      wrap.scrollTop=wrap.scrollHeight;
    }
  } else {
    // Subsequent renders (live updates): only auto-scroll if user was near the bottom
    const atBottom=wrap.scrollHeight-wrap.scrollTop-wrap.clientHeight<120;
    if (atBottom) wrap.scrollTop=wrap.scrollHeight;
  }
  // Store unread count so jump button can show it
  state._unreadDisplayCount = unreadCount;
  updateJumpBtn();
}

// Unread divider dismiss — click to clear the marker and hide the bar
$("#messages").addEventListener("click", e=>{
  if (e.target.closest("#unread-divider-bar")) {
    const cid=state.activeChatId;
    if (cid) {
      delete state.lastReadMarker[cid];
      state.chatScrolledInitial.delete(cid);  // allow re-scroll next time
    }
    e.target.closest("#unread-divider-bar").remove();
  }
});

// Message area delegation
$("#messages").addEventListener("click", async e=>{
  const profileTrigger=e.target.closest("[data-profile-uid]");
  if (profileTrigger&&!e.target.closest(".msg-action-btn")) { showProfileCard(profileTrigger.dataset.profileUid,e); return; }

  const actionBtn=e.target.closest(".msg-action-btn");
  if (actionBtn) {
    const { action, msgId, uid, name } = actionBtn.dataset;
    if (action==="edit-msg")   startEditMessage(msgId);
    if (action==="report-msg") openReportModal(uid, name, msgId);
    if (action==="reply-msg") {
      const msg=state.messages.find(m=>m.id===msgId);
      if (msg) setReplyTo(msg);
    }
    return;
  }
  // Reaction pills
  const reactPill=e.target.closest(".reaction-pill");
  if (reactPill) { await toggleReaction(reactPill.dataset.reactMsg, reactPill.dataset.reactEmoji); return; }

  const saveBtn=e.target.closest(".msg-edit-save");
  if (saveBtn) {
    const ta=saveBtn.closest(".msg-edit-area")?.querySelector("textarea");
    if (ta) await editMessage(saveBtn.dataset.msgId,ta.value.trim());
    return;
  }
  if (e.target.closest(".msg-edit-cancel")) { renderMessages(); return; }
});


/* =====================================================================
   SEND MESSAGE
   ===================================================================== */
const composer=$("#composer-input");

composer.addEventListener("input",()=>{
  composer.style.height="auto";
  composer.style.height=Math.min(composer.scrollHeight,200)+"px";
  updateSendBtn();
  updateEmojiAutocomplete();
});

composer.addEventListener("keydown", e=>{
  // Emoji autocomplete navigation
  const ac=$("#emoji-autocomplete");
  if (ac&&!ac.classList.contains("hidden")&&acItems.length) {
    if (e.key==="ArrowDown") { e.preventDefault(); state.emojiAcIndex=(state.emojiAcIndex+1)%acItems.length; updateAcHighlight(); return; }
    if (e.key==="ArrowUp")   { e.preventDefault(); state.emojiAcIndex=(state.emojiAcIndex-1+acItems.length)%acItems.length; updateAcHighlight(); return; }
    if (e.key==="Enter"||e.key==="Tab") { e.preventDefault(); insertAcItem(state.emojiAcIndex); return; }
    if (e.key==="Escape") { hideEmojiAc(); return; }
  }
  if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendCurrentMessage(); }
});

function updateSendBtn() {
  const btn=$("#send-btn");
  if (!btn) return;
  btn.dataset.active = composer.value.trim().length>0 ? "true" : "false";
}

$("#send-btn").addEventListener("click", sendCurrentMessage);

/* Command aliases (resolved before handleCommand) */
const CMD_ALIASES = {
  "cf":"coinflip","flip":"coinflip","c":"coinflip",
  "8":"8ball","ball":"8ball","q":"8ball",
  "r":"roll","dice":"roll",
  "f":"fortune","a":"advice","j":"joke",
  "t":"truth","d":"dare","s":"ship",
  "tod":"tod","truth":"truth","dare":"dare",
  "h":"help","?":"help"
};

async function sendCurrentMessage() {
  const raw=composer.value;
  const text=raw.trim();
  if (!text||!state.activeChatId) return;
  if (text.length>2000) { showToast("Message too long (2000 char max)"); return; }

  const baseMsg = {
    senderUid:state.user.uid, senderName:state.user.displayName,
    senderPhoto:state.user.photoURL||null, createdAt:serverTimestamp(),
    type:"text", edited:false, editedAt:null, reactions:{},
    replyToMessageId:state.replyTo?.id||null,
    replyToSenderName:state.replyTo?.senderName||null,
    replyToTextPreview:state.replyTo?.textPreview||null,
    // Future-proof scoring fields
    xpValue:1, activityType:"message", rewardFlags:[]
  };

  // Check for /command
  if (text.startsWith("/")) {
    const parts=text.slice(1).split(/\s+/);
    const rawCmd=parts[0].toLowerCase();
    const cmd=CMD_ALIASES[rawCmd]||rawCmd;
    const args=parts.slice(1);
    const result=handleCommand(cmd,args);
    if (result!==null) {
      composer.value=""; composer.style.height="auto"; updateSendBtn(); clearReplyTo();
      const chatId=state.activeChatId;
      localStorage.removeItem(`sc_draft_${chatId}`);
      try {
        await addDoc(collection(db,"chats",chatId,"messages"),{
          ...baseMsg, text:result, type:"command", commandResult:true, xpValue:0
        });
        await updateDoc(doc(db,"chats",chatId),{ lastMessage:result.slice(0,200), lastMessageAt:serverTimestamp(), lastSenderUid:state.user.uid });
      } catch(err){ showToast("Send failed: "+err.message); composer.value=raw; }
      return;
    }
  }

  composer.value=""; composer.style.height="auto"; updateSendBtn(); clearReplyTo();
  clearTypingIndicator();
  const chatId=state.activeChatId;
  localStorage.removeItem(`sc_draft_${chatId}`);
  try {
    await addDoc(collection(db,"chats",chatId,"messages"),{ ...baseMsg, text });
    await updateDoc(doc(db,"chats",chatId),{ lastMessage:text.slice(0,200), lastMessageAt:serverTimestamp(), lastSenderUid:state.user.uid });
  } catch(err){ showToast("Send failed: "+err.message); composer.value=raw; updateSendBtn(); }
}


/* =====================================================================
   FUN COMMANDS HANDLER
   ===================================================================== */
function handleCommand(cmd, args) {
  switch(cmd) {
    case "8ball": {
      const q=args.join(" ").trim();
      return q ? `🎱 *${q}*\n> ${rnd(EIGHT_BALL)}` : `🎱 > ${rnd(EIGHT_BALL)}`;
    }
    case "tod":
      return Math.random()<0.5
        ? `❓ **Truth:** ${rnd(TRUTHS)}`
        : `🎯 **Dare:** ${rnd(DARES)}`;
    case "truth":  return `❓ **Truth:** ${rnd(TRUTHS)}`;
    case "dare":   return `🎯 **Dare:** ${rnd(DARES)}`;
    case "joke": {
      const [setup,punchline]=rnd(JOKES);
      return `😄 ${setup}\n> ${punchline}`;
    }
    case "fortune":  return `🔮 ${rnd(FORTUNES)}`;
    case "advice":   return `💡 ${rnd(ADVICE)}`;
    case "coinflip": return `🪙 ${Math.random()<0.5?"**Heads!**":"**Tails!**"}`;
    case "roll": {
      const spec=(args[0]||"1d6").toLowerCase();
      const m=spec.match(/^(\d+)d(\d+)$/);
      if (!m) return `🎲 Rolled: **${Math.floor(Math.random()*6)+1}** (1d6)`;
      const [,nd,ns]=[+m[1],+m[1],+m[2]];
      const dice=+m[1], sides=+m[2];
      if (dice<1||dice>20||sides<2||sides>100) return `🎲 Try something like /roll 2d6`;
      const rolls=Array.from({length:dice},()=>Math.floor(Math.random()*sides)+1);
      const total=rolls.reduce((a,b)=>a+b,0);
      return `🎲 Rolled **${spec}**: [${rolls.join(", ")}] = **${total}**`;
    }
    case "ship": {
      const name1=args[0]||state.user.displayName;
      const name2=args[1]||"Unknown";
      const pct=Math.floor(Math.random()*101);
      const bar="█".repeat(Math.round(pct/10))+"░".repeat(10-Math.round(pct/10));
      const label=pct>=80?"💕 Soulmates!":pct>=60?"💖 Great match!":pct>=40?"💛 Friends first.":pct>=20?"🤔 Maybe not…":"💔 Nope.";
      return `💘 **${escapeHtml(name1)} + ${escapeHtml(name2)}**\n${bar} **${pct}%** — ${label}`;
    }
    case "help":
      return `📋 **Commands**\n/8ball [q] · /tod · /truth · /dare · /joke · /fortune · /advice · /coinflip · /roll [NdN] · /ship [a] [b]\n**Aliases:** /cf /flip (coinflip) · /r /dice (roll) · /t (truth) · /d (dare) · /j (joke) · /f (fortune) · /a (advice) · /s (ship)`;
    default: return null; // unknown command — send as plain text
  }
}


/* =====================================================================
   EDIT MESSAGE
   ===================================================================== */
function startEditMessage(msgId) {
  const msg=state.messages.find(m=>m.id===msgId);
  if (!msg||msg.senderUid!==state.user.uid) return;
  const msgEl=document.querySelector(`[data-msg-id="${CSS.escape(msgId)}"]`);
  if (!msgEl) return;
  const bodyEl=msgEl.querySelector(".msg-body");
  if (!bodyEl) return;
  const original=msg.text||"";
  bodyEl.outerHTML=`<div class="msg-edit-area">
    <textarea class="msg-edit-input">${escapeHtml(original)}</textarea>
    <div class="msg-edit-btns">
      <button class="btn-primary msg-edit-save" data-msg-id="${escapeHtml(msgId)}">Save</button>
      <button class="btn-ghost msg-edit-cancel">Cancel</button>
      <span style="font-size:11px;color:var(--t-muted);margin-left:6px;">esc to cancel · enter to save</span>
    </div>
  </div>`;
  const newMsgEl=document.querySelector(`[data-msg-id="${CSS.escape(msgId)}"]`);
  const ta=newMsgEl?.querySelector("textarea");
  if (ta) { ta.focus(); ta.selectionStart=ta.selectionEnd=ta.value.length; }

  // Enter to save, esc to cancel inside textarea
  ta?.addEventListener("keydown", async e=>{
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); await editMessage(msgId,ta.value.trim()); }
    if (e.key==="Escape") { e.preventDefault(); renderMessages(); }
  });
}

async function editMessage(msgId, newText) {
  if (!newText) { showToast("Message can't be empty"); renderMessages(); return; }
  const chatId=state.activeChatId; if (!chatId) return;
  try {
    await updateDoc(doc(db,"chats",chatId,"messages",msgId),{ text:newText, edited:true });
  } catch(err){ showToast("Edit failed: "+err.message); renderMessages(); }
}


/* =====================================================================
   REPORT FEATURE
   ===================================================================== */
function openReportModal(reportedUid, reportedName, messageId) {
  const nameEl=$("#report-target-info");
  if (nameEl) nameEl.textContent="Reporting: "+(reportedName||reportedUid||"this user");
  const modal=$("#report-modal");
  if (!modal) return;
  modal.dataset.reportedUid=reportedUid||"";
  modal.dataset.messageId=messageId||"";
  openModal("report-modal");
}

document.addEventListener("click", async e=>{
  if (e.target.id==="report-submit-btn"||e.target.closest("#report-submit-btn")) {
    const modal=$("#report-modal"); if (!modal) return;
    const reason=$("#report-reason")?.value||"other";
    const details=$("#report-details")?.value?.trim()||"";
    const reportedUid=modal.dataset.reportedUid;
    const messageId=modal.dataset.messageId;
    if (!reportedUid) { showToast("Nothing to report"); closeModal("report-modal"); return; }
    try {
      await addDoc(collection(db,"reports"),{
        reportedUid, messageId:messageId||null, reason, details,
        reportedBy:state.user.uid, reportedByName:state.user.displayName,
        createdAt:serverTimestamp()
      });
      showToast("Report submitted. Thank you.");
      closeModal("report-modal");
    } catch(err){ showToast("Failed to submit: "+err.message); }
  }
});


/* =====================================================================
   CREATE GROUP CHAT  (with join code + leaders)
   ===================================================================== */
$("#rail-create-group").addEventListener("click", ()=>{
  state.groupSelections.clear();
  $("#group-name-input").value="";
  renderModalFriendList();
  openModal("create-group-modal");
});

function renderModalFriendList() {
  const wrap=$("#modal-friend-list"); if (!wrap) return;
  if (!state.friends.length) { wrap.innerHTML=`<div class="empty" style="padding:12px;">Add some friends first!</div>`; return; }
  wrap.innerHTML=state.friends.map(f=>`
    <label class="modal-friend-row">
      <input type="checkbox" data-uid="${escapeHtml(f.uid)}" ${state.groupSelections.has(f.uid)?"checked":""}>
      ${avatarMarkup(f.displayName,f.photoURL,"side-row-avatar","side-row-fallback")}
      <div style="flex:1;">${escapeHtml(f.displayName)}${f.discriminator?`<span style="color:var(--t-muted);font-size:11px;margin-left:2px;">#${escapeHtml(f.discriminator)}</span>`:""}</div>
    </label>`).join("");
  wrap.querySelectorAll("input[type='checkbox']").forEach(cb=>{
    cb.addEventListener("change", e=>{
      const uid=e.target.dataset.uid;
      if (e.target.checked) state.groupSelections.add(uid); else state.groupSelections.delete(uid);
    });
  });
}

$("#create-group-confirm-btn").addEventListener("click", async ()=>{
  const name=$("#group-name-input").value.trim();
  if (!name) { showToast("Enter a group name"); return; }
  if (state.groupSelections.size===0) { showToast("Pick at least one friend"); return; }
  const members=[state.user.uid,...state.groupSelections];
  const joinCode=genJoinCode();
  try {
    const ref=await addDoc(collection(db,"chats"),{
      type:"group", members, name,
      createdBy:state.user.uid, createdAt:serverTimestamp(),
      lastMessage:"", lastMessageAt:serverTimestamp(),
      joinCode, leaders:[state.user.uid]
    });
    closeModal("create-group-modal");
    // Show join code modal
    const codeDisplay=$("#group-code-display");
    if (codeDisplay) codeDisplay.textContent=joinCode;
    openModal("group-code-modal");
    setTimeout(()=>openChat(ref.id),200);
  } catch(err){ showToast("Error: "+err.message); }
});

// Click join code display to copy it
document.addEventListener("click", e=>{
  if (e.target.id==="group-code-display"||e.target.closest("#group-code-display")) {
    const code=$("#group-code-display")?.textContent?.trim();
    if (!code||code==="——————") return;
    navigator.clipboard.writeText(code)
      .then(()=>showToast("Join code copied!"))
      .catch(()=>showToast("Code: "+code));
  }
  if (e.target.id==="group-code-ok-btn") closeModal("group-code-modal");
});


/* =====================================================================
   JOIN BY CODE
   ===================================================================== */
$("#rail-join-code")?.addEventListener("click", ()=>openModal("join-code-modal"));

document.addEventListener("click", async e=>{
  if (e.target.id==="join-code-confirm-btn"||e.target.closest("#join-code-confirm-btn")) {
    const input=$("#join-code-input");
    const code=(input?.value||"").toUpperCase().trim();
    if (!code||code.length!==8) { showToast("Enter an 8-character join code"); return; }
    await joinByCode(code);
    closeModal("join-code-modal");
    if (input) input.value="";
  }
});

async function joinByCode(code) {
  try {
    const q=query(collection(db,"chats"),where("joinCode","==",code));
    const snap=await getDocs(q);
    if (snap.empty) { showToast("Invalid join code — no group found"); return; }
    const chatDoc=snap.docs[0];
    const chatId=chatDoc.id;
    const chatData=chatDoc.data();
    if (chatData.members.includes(state.user.uid)) {
      showToast("You're already in that group"); openChat(chatId); return;
    }
    await updateDoc(doc(db,"chats",chatId),{ members:arrayUnion(state.user.uid) });
    showToast(`Joined "${chatData.name}"!`);
    openChat(chatId);
  } catch(err){ showToast("Error: "+err.message); }
}


/* =====================================================================
   ADD MEMBERS / LEAVE GROUP
   ===================================================================== */
$("#chat-add-member-btn")?.addEventListener("click", ()=>{
  const c=state.activeChat; if (!c||c.type!=="group") return;
  state.addMemberSelections.clear();
  const candidates=state.friends.filter(f=>!c.members.includes(f.uid));
  const wrap=$("#add-member-list");
  if (!candidates.length) { wrap.innerHTML=`<div class="empty" style="padding:12px;">All your friends are already in this group.</div>`; }
  else {
    wrap.innerHTML=candidates.map(f=>`
      <label class="modal-friend-row">
        <input type="checkbox" data-uid="${escapeHtml(f.uid)}">
        ${avatarMarkup(f.displayName,f.photoURL,"side-row-avatar","side-row-fallback")}
        <div style="flex:1;">${escapeHtml(f.displayName)}</div>
      </label>`).join("");
    wrap.querySelectorAll("input[type='checkbox']").forEach(cb=>{
      cb.addEventListener("change",e=>{ const uid=e.target.dataset.uid; if(e.target.checked) state.addMemberSelections.add(uid); else state.addMemberSelections.delete(uid); });
    });
  }
  openModal("add-member-modal");
});

$("#add-member-confirm-btn")?.addEventListener("click", async ()=>{
  if (!state.activeChatId||!state.addMemberSelections.size) { closeModal("add-member-modal"); return; }
  try {
    await updateDoc(doc(db,"chats",state.activeChatId),{ members:arrayUnion(...state.addMemberSelections) });
    closeModal("add-member-modal"); showToast("Members added");
  } catch(err){ showToast("Error: "+err.message); }
});

$("#chat-leave-btn")?.addEventListener("click", async ()=>{
  const c=state.activeChat; if (!c||c.type!=="group") return;
  if (!confirm(`Leave "${c.name}"?`)) return;
  try {
    const newMembers=c.members.filter(m=>m!==state.user.uid);
    await updateDoc(doc(db,"chats",c.id),{members:newMembers});
    showFriendsView(); showToast("Left group");
  } catch(err){ showToast("Error: "+err.message); }
});


/* =====================================================================
   MODALS
   ===================================================================== */
function openModal(id)  { const m=document.getElementById(id); if(m) m.classList.remove("hidden"); }
function closeModal(id) { const m=document.getElementById(id); if(m) m.classList.add("hidden"); }
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{ if(e.target===m) m.classList.add("hidden"); }));

// Settings modal — revert theme preview on backdrop/X close
function onSettingsClose() {
  if (_pendingTheme!==null && _pendingTheme!==state.theme) applyTheme(state.theme);
}
document.querySelector("[data-close='settings-modal']")?.addEventListener("click", onSettingsClose);
$("#settings-modal")?.addEventListener("click", e=>{ if(e.target===$("#settings-modal")) onSettingsClose(); });


// Suggestions link is a plain <a target="_blank"> in the HTML — no JS needed.


/* =====================================================================
   SETTINGS MODAL
   ===================================================================== */
let _pendingTheme=null, _pendingStatus=null, _pendingBannerColor=undefined, _pendingPrivate=null;

$("#settings-btn").addEventListener("click", openSettingsModal);

function openSettingsModal() {
  const u=state.user;
  _pendingTheme=state.theme;
  _pendingStatus=state.status;
  _pendingBannerColor=state.bannerColor;
  _pendingPrivate=state.isPrivate;

  if($("#settings-username-input")) $("#settings-username-input").value=u.username||u.displayName||"";
  if($("#settings-tag-display"))    $("#settings-tag-display").textContent=u.discriminator?`#${u.discriminator}`:"#????";
  if($("#settings-bio-input"))      $("#settings-bio-input").value=u.bio||"";
  if($("#settings-photo-input"))    $("#settings-photo-input").value=u.photoURL||"";
  if($("#settings-sound-toggle"))   $("#settings-sound-toggle").checked=state.soundEnabled;
  if($("#settings-hints-toggle"))   $("#settings-hints-toggle").checked=localStorage.getItem("sc_hints")!=="false";

  // Theme swatches
  $$(".theme-swatch").forEach(sw=>sw.classList.toggle("active",sw.dataset.theme===_pendingTheme));
  // Status options
  $$(".status-row-option").forEach(opt=>opt.classList.toggle("active",opt.dataset.status===_pendingStatus));
  // Banner swatches
  $$(".banner-swatch").forEach(sw=>sw.classList.toggle("active",(sw.dataset.color||"")===((_pendingBannerColor)||"")));
  // Privacy
  const privToggle=$("#settings-privacy-toggle");
  if (privToggle) privToggle.checked=!!_pendingPrivate;
  // Member since
  const sinceEl=$("#settings-created-at");
  if (sinceEl&&u.createdAt) {
    const d=u.createdAt.toDate?u.createdAt.toDate():new Date(u.createdAt);
    sinceEl.textContent=d.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
  }

  updateAvatarPreview("settings",u.username||u.displayName,u.photoURL);
  openModal("settings-modal");
}

// Settings live preview
$("#settings-photo-input")?.addEventListener("input",()=>{
  updateAvatarPreview("settings",$("#settings-username-input")?.value.trim(),$("#settings-photo-input")?.value.trim()||null);
});
$("#settings-username-input")?.addEventListener("input",()=>{
  updateAvatarPreview("settings",$("#settings-username-input")?.value.trim(),$("#settings-photo-input")?.value.trim()||null);
});

// Settings modal interactions (theme/status/banner)
$("#settings-modal")?.addEventListener("click", e=>{
  const themeSwatch=e.target.closest(".theme-swatch");
  if (themeSwatch) {
    _pendingTheme=themeSwatch.dataset.theme;
    $$(".theme-swatch").forEach(s=>s.classList.toggle("active",s.dataset.theme===_pendingTheme));
    applyTheme(_pendingTheme); // live preview
    return;
  }
  const statusOpt=e.target.closest(".status-row-option");
  if (statusOpt) {
    _pendingStatus=statusOpt.dataset.status;
    $$(".status-row-option").forEach(o=>o.classList.toggle("active",o.dataset.status===_pendingStatus));
    return;
  }
  const bannerSwatch=e.target.closest(".banner-swatch");
  if (bannerSwatch) {
    _pendingBannerColor=bannerSwatch.dataset.color||null;
    $$(".banner-swatch").forEach(s=>s.classList.toggle("active",(s.dataset.color||"")===((_pendingBannerColor)||"")));
    return;
  }
});

$("#settings-save-btn")?.addEventListener("click", async ()=>{
  const username=$("#settings-username-input")?.value.trim();
  const bio=$("#settings-bio-input")?.value.trim();
  const photoInput=$("#settings-photo-input")?.value.trim();
  const soundOn=$("#settings-sound-toggle")?.checked??state.soundEnabled;
  const hintsOn=$("#settings-hints-toggle")?.checked??true;
  const privOn=$("#settings-privacy-toggle")?.checked??false;

  if (!username||username.length<3) { showToast("Username must be at least 3 characters."); return; }
  if (username.length>32)           { showToast("Username must be 32 characters or fewer."); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { showToast("Username: letters, numbers, underscores only."); return; }
  if (isNameBlocked(username)) {
    const safe=generateSafeName();
    showToast(`That username isn't allowed. Try "${safe}" instead.`); return;
  }

  const photoURL=photoInput||null;
  state.soundEnabled=soundOn;
  localStorage.setItem("sc_sound",soundOn?"true":"false");
  // Hints toggle
  localStorage.setItem("sc_hints",hintsOn?"true":"false");
  const hintBar=$("#composer-hint");
  if (hintBar) hintBar.classList.toggle("hidden",!hintsOn);
  // Apply theme (already previewed)
  if (_pendingTheme&&_pendingTheme!==state.theme) applyTheme(_pendingTheme);
  // Apply status
  if (_pendingStatus&&_pendingStatus!==state.status) {
    state.status=_pendingStatus;
    localStorage.setItem("sc_status",_pendingStatus);
    updateUserPanel();
  }
  state.isPrivate=privOn;
  state.bannerColor=_pendingBannerColor!==undefined?_pendingBannerColor:state.bannerColor;

  const btn=$("#settings-save-btn");
  btn.disabled=true; btn.textContent="Saving…";
  try {
    await updateDoc(doc(db,"users",state.user.uid),{
      displayName:username, displayNameLower:username.toLowerCase(),
      username, bio:bio||"", photoURL:photoURL||null,
      status:state.status, bannerColor:state.bannerColor||null,
      isPrivate:privOn
    });
    state.user.username=username; state.user.displayName=username;
    state.user.bio=bio; state.user.photoURL=photoURL;
    // Include all profile fields so profile card shows updated banner color immediately
    state.userCache[state.user.uid]={
      ...state.user,
      bannerColor:state.bannerColor||null,
      status:state.status,
      isPrivate:privOn,
      badges:state.userCache[state.user.uid]?.badges||[]
    };
    updateUserPanel();
    closeModal("settings-modal"); showToast("Settings saved ✓");
  } catch(err){ showToast("Save failed: "+err.message); }
  finally { btn.disabled=false; btn.textContent="Save Changes"; }
});


/* =====================================================================
   EMOJI PICKER  (with category tabs)
   ===================================================================== */
let emojiOpen=false;
const emojiBtn=$("#emoji-btn");
const emojiPicker=$("#emoji-picker");
const emojiGrid=$("#emoji-grid");
const emojiSearch=$("#emoji-search");

// Render category tabs
function buildEmojiCatTabs() {
  const catsWrap=$("#emoji-picker-cats"); if (!catsWrap) return;
  catsWrap.innerHTML=EMOJI_CATS.map(c=>`
    <button class="emoji-cat-btn${state.activeCat===c.id?" active":""}" data-cat="${c.id}" title="${c.id}">${c.label}</button>
  `).join("");
}

function buildEmojiGrid(filter="") {
  const f=filter.trim().toLowerCase();
  let items;
  if (f) {
    items=EMOJI_DATA.filter(e=>{
      const nameMatch=e.name.includes(f);
      const altMatch=e.alt&&e.alt.some(a=>a.toLowerCase().includes(f));
      return nameMatch||altMatch;
    });
  } else {
    items=state.activeCat==="all" ? EMOJI_DATA : EMOJI_DATA.filter(e=>e.cat===state.activeCat);
  }
  if (!emojiGrid) return;
  emojiGrid.innerHTML=items.map(e=>{
    if (e.isStatic) return `<button class="emoji-cell" title=":Static:" data-insert=":Static:"><img src="${STATIC_EMOJI_URL}" class="static-emoji-square" alt=":Static:" /></button>`;
    return `<button class="emoji-cell" title=":${escapeHtml(e.name)}:" data-insert="${escapeHtml(e.char)}">${e.char}</button>`;
  }).join("");
}

emojiBtn?.addEventListener("click",()=>{
  emojiOpen=!emojiOpen;
  if (emojiOpen) {
    emojiPicker.classList.remove("hidden");
    buildEmojiCatTabs(); buildEmojiGrid(); emojiSearch.value=""; emojiSearch.focus();
  } else {
    emojiPicker.classList.add("hidden");
  }
});

emojiSearch?.addEventListener("input",()=>buildEmojiGrid(emojiSearch.value));

// Category tab clicks
$("#emoji-picker")?.addEventListener("click", e=>{
  const tab=e.target.closest(".emoji-cat-btn");
  if (tab) {
    state.activeCat=tab.dataset.cat;
    $$(".emoji-cat-btn").forEach(t=>t.classList.toggle("active",t.dataset.cat===state.activeCat));
    buildEmojiGrid(emojiSearch?.value||"");
    return;
  }
  const cell=e.target.closest(".emoji-cell");
  if (!cell) return;
  const insert=cell.dataset.insert;
  const start=composer.selectionStart, end=composer.selectionEnd;
  composer.value=composer.value.slice(0,start)+insert+composer.value.slice(end);
  composer.focus(); composer.selectionStart=composer.selectionEnd=start+insert.length;
  updateSendBtn();
});

document.addEventListener("click",e=>{
  if (!emojiOpen) return;
  if (e.target.closest("#emoji-picker")||e.target.closest("#emoji-btn")) return;
  emojiPicker?.classList.add("hidden"); emojiOpen=false;
});


/* =====================================================================
   EMOJI AUTOCOMPLETE  (inline :word: dropdown)
   ===================================================================== */
let acItems=[], acTriggerStart=-1;

function updateEmojiAutocomplete() {
  const ac=$("#emoji-autocomplete"); if (!ac) return;
  const val=composer.value;
  const pos=composer.selectionStart;
  const before=val.slice(0,pos);
  const match=before.match(/:([a-zA-Z0-9_+\-]{1,})$/);
  if (!match) { hideEmojiAc(); return; }
  const q=match[1].toLowerCase();
  acTriggerStart=pos-match[0].length;

  acItems=EMOJI_DATA.filter(e=>{
    if (e.isStatic) return "static".startsWith(q)||q==="sta";
    return e.name.startsWith(q)||e.name.includes(q)||(e.alt&&e.alt.some(a=>a.toLowerCase().replace(/\s/g,"").includes(q)));
  }).slice(0,8);

  if (!acItems.length) { hideEmojiAc(); return; }
  state.emojiAcIndex=0;
  ac.innerHTML=acItems.map((e,i)=>{
    const display=e.isStatic?`<img src="${STATIC_EMOJI_URL}" style="width:18px;height:18px;border-radius:3px;" alt=":Static:">`:e.char;
    return `<div class="emoji-ac-item${i===0?" active":""}" data-index="${i}">
      <span class="emoji-ac-char">${display}</span>
      <span class="emoji-ac-name">:${escapeHtml(e.name)}:</span>
    </div>`;
  }).join("");
  ac.classList.remove("hidden");
}

function hideEmojiAc() {
  const ac=$("#emoji-autocomplete"); if(ac) ac.classList.add("hidden");
  acItems=[]; state.emojiAcIndex=-1; acTriggerStart=-1;
}

function updateAcHighlight() {
  $$(".emoji-ac-item").forEach((el,i)=>el.classList.toggle("active",i===state.emojiAcIndex));
  const active=document.querySelector(".emoji-ac-item.active");
  active?.scrollIntoView({block:"nearest"});
}

function insertAcItem(index) {
  if (index<0||index>=acItems.length) return;
  const item=acItems[index];
  const insert=item.isStatic?":Static:":item.char;
  const val=composer.value, pos=composer.selectionStart;
  composer.value=val.slice(0,acTriggerStart)+insert+val.slice(pos);
  composer.selectionStart=composer.selectionEnd=acTriggerStart+insert.length;
  hideEmojiAc(); updateSendBtn(); composer.focus();
}

// Click on autocomplete item
document.addEventListener("click",e=>{
  const item=e.target.closest(".emoji-ac-item");
  if (!item) return;
  const idx=+item.dataset.index;
  insertAcItem(idx);
});


/* =====================================================================
   PROFILE CARD
   ===================================================================== */
async function showProfileCard(uid, event) {
  const profile=await fetchUserProfile(uid); if (!profile) return;
  const card=$("#profile-card"); if (!card) return;

  const isSelf=uid===state.user.uid;
  const isFriend=state.friends.some(f=>f.uid===uid);
  const hasPendingOut=state.outgoing.some(r=>r.toUid===uid);

  // Privacy check
  const isPrivate=profile.isPrivate&&!isFriend&&!isSelf;

  // Banner
  const bannerEl=$("#profile-card-banner");
  if (bannerEl) {
    bannerEl.style.background=profile.bannerColor||"var(--sidebar-bg)";
    bannerEl.style.display="";
  }

  // Avatar
  const avatarEl=$("#profile-card-avatar-inner");
  if (isPrivate) {
    avatarEl.innerHTML=""; avatarEl.textContent="?";
  } else if (profile.photoURL) {
    avatarEl.innerHTML=`<img src="${escapeHtml(profile.photoURL)}" alt="" />`;
  } else {
    avatarEl.innerHTML="";
    avatarEl.textContent=(profile.username||profile.displayName||"?").charAt(0).toUpperCase();
  }

  // Status dot — use resolveStatus so invisible shows as offline
  const statusDot=$("#profile-card-status-dot");
  if (statusDot) {
    if (!isSelf&&!isFriend) { statusDot.style.display="none"; }
    else {
      statusDot.style.display="";
      statusDot.dataset.status = resolveStatus(profile);
    }
  }

  // Badges
  const badgesEl=$("#profile-card-badges");
  if (badgesEl) badgesEl.innerHTML=renderBadges(profile.badges||[]);

  // Name / bio
  $("#profile-card-name").textContent=profile.username||profile.displayName||"User";
  $("#profile-card-tag").textContent=profile.discriminator?`#${profile.discriminator}`:"";
  $("#profile-card-bio").textContent=isPrivate?"🔒 This profile is private.":(profile.bio||"No bio set yet.");

  // Member since
  const sinceEl=$("#profile-card-since");
  if (sinceEl) {
    if (profile.createdAt&&!isPrivate) {
      const d=profile.createdAt.toDate?profile.createdAt.toDate():new Date(profile.createdAt);
      sinceEl.textContent="Member since "+d.toLocaleDateString(undefined,{year:"numeric",month:"long"});
      sinceEl.style.display="";
    } else { sinceEl.style.display="none"; }
  }

  // Actions
  let actionsHtml="";
  if (isSelf) {
    actionsHtml=`<button class="btn-ghost" data-pc-action="edit-profile">Edit Profile</button>`;
  } else {
    if (!isFriend&&!hasPendingOut)
      actionsHtml+=`<button class="btn-primary" data-pc-action="add-friend" data-pc-uid="${escapeHtml(uid)}">Add Friend</button>`;
    else if (hasPendingOut)
      actionsHtml+=`<span style="font-size:12px;color:var(--t-muted);">Request sent</span>`;
    actionsHtml+=`<button class="btn-ghost" data-pc-action="message" data-pc-uid="${escapeHtml(uid)}">Message</button>`;
  }
  $("#profile-card-actions").innerHTML=actionsHtml;

  // Position
  const W=290, H=360;
  let x=event.clientX+12, y=event.clientY-20;
  if (x+W>window.innerWidth-8) x=event.clientX-W-12;
  if (y+H>window.innerHeight-8) y=window.innerHeight-H-8;
  if (y<8) y=8; if (x<8) x=8;
  card.style.left=x+"px"; card.style.top=y+"px";
  card.classList.remove("hidden");
}

$("#profile-card-close")?.addEventListener("click",()=>$("#profile-card")?.classList.add("hidden"));

$("#profile-card")?.addEventListener("click", async e=>{
  const btn=e.target.closest("[data-pc-action]"); if (!btn) return;
  const action=btn.dataset.pcAction, uid=btn.dataset.pcUid;
  if (action==="message") {
    $("#profile-card").classList.add("hidden");
    await openOrCreateDm(uid);
  } else if (action==="add-friend") {
    btn.disabled=true; btn.textContent="Sending…";
    try {
      const p=state.userCache[uid]||{};
      const reqId=`${state.user.uid}_${uid}`;
      await setDoc(doc(db,"friendRequests",reqId),{
        fromUid:state.user.uid, toUid:uid,
        fromName:state.user.displayName, fromPhoto:state.user.photoURL||null,
        toName:p.username||p.displayName||"User", toPhoto:p.photoURL||null,
        createdAt:serverTimestamp()
      });
      btn.textContent="Sent ✓"; showToast("Friend request sent");
    } catch(err){ btn.disabled=false; btn.textContent="Add Friend"; showToast("Error: "+err.message); }
  } else if (action==="edit-profile") {
    $("#profile-card").classList.add("hidden");
    openSettingsModal();
  }
});

document.addEventListener("click",e=>{
  const card=$("#profile-card");
  if (!card||card.classList.contains("hidden")) return;
  if (card.contains(e.target)) return;
  if (e.target.closest("[data-profile-uid]")||e.target.closest(".friend-row")) return;
  card.classList.add("hidden");
});


/* =====================================================================
   MOBILE
   ===================================================================== */
function maybeToggleSidebar(open) {
  const appEl=$("#app");
  if (window.matchMedia("(max-width: 768px)").matches) {
    if (open) appEl.classList.add("show-sidebar"); else appEl.classList.remove("show-sidebar");
  }
}
["#dm-list","#group-list","#rail-groups"].forEach(sel=>{
  $(sel)?.addEventListener("click",()=>maybeToggleSidebar(false));
});
$("#rail-home")?.addEventListener("click",()=>maybeToggleSidebar(true));
$("#open-friends-btn")?.addEventListener("click",()=>maybeToggleSidebar(false));


/* =====================================================================
   REPLY SYSTEM
   ===================================================================== */
function setReplyTo(msg) {
  state.replyTo = { id:msg.id, senderName:msg.senderName||"User", textPreview:(msg.text||"").slice(0,80) };
  const bar=$("#reply-bar");
  if (!bar) return;
  bar.classList.remove("hidden");
  const nameEl=bar.querySelector("#reply-bar-name");
  const prevEl=bar.querySelector("#reply-bar-preview");
  if (nameEl) nameEl.textContent=state.replyTo.senderName;
  if (prevEl) prevEl.textContent=state.replyTo.textPreview;
  $("#composer-input")?.focus();
}

function clearReplyTo() {
  state.replyTo=null;
  $("#reply-bar")?.classList.add("hidden");
}

$("#reply-bar-cancel")?.addEventListener("click", clearReplyTo);


/* =====================================================================
   MESSAGE REACTIONS
   ===================================================================== */
async function toggleReaction(msgId, emoji) {
  const chatId=state.activeChatId;
  if (!chatId||!state.user) return;
  const msg=state.messages.find(m=>m.id===msgId);
  if (!msg) return;
  const reactions={...(msg.reactions||{})};
  const uids=reactions[emoji]?[...reactions[emoji]]:[];
  const idx=uids.indexOf(state.user.uid);
  if (idx>=0) { uids.splice(idx,1); if (!uids.length) delete reactions[emoji]; else reactions[emoji]=uids; }
  else { uids.push(state.user.uid); reactions[emoji]=uids; }
  try { await updateDoc(doc(db,"chats",chatId,"messages",msgId),{reactions}); }
  catch(err){ showToast("Reaction failed: "+err.message); }
}


/* =====================================================================
   TYPING INDICATORS
   ===================================================================== */
let _typingTimer=null, _typingWritten=false;

function onComposerTyping() {
  if (!state.activeChatId||!state.user) return;
  if (!_typingWritten) {
    _typingWritten=true;
    setDoc(doc(db,"chats",state.activeChatId,"typing",state.user.uid),
      {name:state.user.displayName, uid:state.user.uid, ts:serverTimestamp()}).catch(()=>{});
  }
  clearTimeout(_typingTimer);
  _typingTimer=setTimeout(clearTypingIndicator, 3000);
}

function clearTypingIndicator() {
  _typingWritten=false;
  clearTimeout(_typingTimer);
  if (!state.activeChatId||!state.user) return;
  deleteDoc(doc(db,"chats",state.activeChatId,"typing",state.user.uid)).catch(()=>{});
}

function renderTypingIndicator(names=[]) {
  const el=$("#typing-indicator"); if (!el) return;
  if (!names.length) { el.classList.add("hidden"); el.textContent=""; return; }
  const text=names.length===1?`${names[0]} is typing…`
    :names.length===2?`${names[0]} and ${names[1]} are typing…`
    :"Several people are typing…";
  el.textContent=text;
  el.classList.remove("hidden");
}

// Wire up typing listener when a chat is opened (called from openChat)
function startTypingListener(chatId) {
  if (state.unsubscribers.typing) { state.unsubscribers.typing(); state.unsubscribers.typing=null; }
  state.unsubscribers.typing = onSnapshot(
    collection(db,"chats",chatId,"typing"),
    snap=>{
      const names=snap.docs.filter(d=>d.id!==state.user?.uid).map(d=>d.data().name||"Someone");
      renderTypingIndicator(names);
    }
  );
}

// Hook composer input to send typing events
const _composerEl=$("#composer-input");
if (_composerEl) {
  const origInput=_composerEl.oninput;
  _composerEl.addEventListener("input", ()=>{ onComposerTyping(); });
}


/* =====================================================================
   PRESENCE TRACKING
   ===================================================================== */
let _presenceTimer=null;

function resolveStatus(profile) {
  if (!profile) return "offline";
  const manual=profile.status||"online";
  if (manual==="invisible") return "offline";
  if (profile.isOnline) {
    const last=profile.lastSeen?.toDate?profile.lastSeen.toDate():null;
    if (!last||(Date.now()-last.getTime())<5*60*1000) return manual;
  }
  return "offline";
}

async function updatePresence() {
  if (!state.user) return;
  try {
    await updateDoc(doc(db,"users",state.user.uid),{
      isOnline:true, lastSeen:serverTimestamp(), status:state.status
    });
  } catch(_){}
}

function startPresenceHeartbeat() {
  updatePresence();
  clearInterval(_presenceTimer);
  _presenceTimer=setInterval(updatePresence, 90000);
}

async function setOfflinePresence() {
  if (!state.user) return;
  try { await updateDoc(doc(db,"users",state.user.uid),{isOnline:false, lastSeen:serverTimestamp()}); } catch(_){}
}

window.addEventListener("beforeunload", ()=>{ setOfflinePresence(); });
document.addEventListener("visibilitychange", ()=>{ if (!document.hidden) updatePresence(); });


/* =====================================================================
   GIF SEARCH  (Tenor API v1)
   ===================================================================== */
const TENOR_KEY = "LIVDSRZULELA";

async function searchGifs(query) {
  try {
    const url=`https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=20&contentfilter=high&media_filter=minimal`;
    const r=await fetch(url);
    const d=await r.json();
    return d.results||[];
  } catch(e){ console.error("GIF search:",e); return []; }
}

async function loadTrendingGifs() {
  try {
    const url=`https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=20&contentfilter=high&media_filter=minimal`;
    const r=await fetch(url);
    const d=await r.json();
    return d.results||[];
  } catch(e){ return []; }
}

function renderGifGrid(results) {
  const grid=$("#gif-grid"); if (!grid) return;
  if (!results.length) {
    grid.innerHTML=`<p class="gif-hint">No GIFs found.</p>`; return;
  }
  grid.innerHTML=results.map(r=>{
    const media=r.media?.[0];
    const url=media?.tinygif?.url||media?.gif?.url||"";
    if (!url) return "";
    return `<button class="gif-cell" data-gif-url="${escapeHtml(url)}" title="${escapeHtml(r.title||"")}">
      <img src="${escapeHtml(url)}" alt="" loading="lazy" />
    </button>`;
  }).filter(Boolean).join("");
}

// GIF picker toggle
let gifOpen=false;
$("#gif-btn")?.addEventListener("click", async ()=>{
  const picker=$("#gif-picker");
  if (!picker) return;
  gifOpen=!gifOpen;
  if (gifOpen) {
    picker.classList.remove("hidden");
    // Close emoji picker
    $("#emoji-picker")?.classList.add("hidden"); emojiOpen=false;
    const grid=$("#gif-grid");
    if (grid&&grid.innerHTML.includes("gif-hint")) {
      grid.innerHTML=`<p class="gif-hint">Loading trending GIFs…</p>`;
      const results=await loadTrendingGifs();
      renderGifGrid(results);
    }
    $("#gif-search-input")?.focus();
  } else {
    picker.classList.add("hidden");
  }
});

// GIF search button
$("#gif-search-btn")?.addEventListener("click", async ()=>{
  const q=$("#gif-search-input")?.value.trim();
  if (!q) return;
  const grid=$("#gif-grid");
  if (grid) grid.innerHTML=`<p class="gif-hint">Searching…</p>`;
  const results=await searchGifs(q);
  renderGifGrid(results);
});

// GIF search on Enter
$("#gif-search-input")?.addEventListener("keydown", async e=>{
  if (e.key!=="Enter") return;
  const q=e.target.value.trim(); if (!q) return;
  const grid=$("#gif-grid");
  if (grid) grid.innerHTML=`<p class="gif-hint">Searching…</p>`;
  const results=await searchGifs(q);
  renderGifGrid(results);
});

// Click a GIF cell → insert URL into composer
document.addEventListener("click", e=>{
  const cell=e.target.closest(".gif-cell");
  if (!cell) return;
  const url=cell.dataset.gifUrl; if (!url) return;
  const c=$("#composer-input"); if (!c) return;
  const start=c.selectionStart, end=c.selectionEnd;
  const sep=(c.value.trim()&&!c.value.endsWith(" "))?" ":"";
  c.value=c.value.slice(0,start)+sep+url+c.value.slice(end);
  c.focus(); updateSendBtn();
  $("#gif-picker")?.classList.add("hidden"); gifOpen=false;
});

// Close GIF picker on outside click
document.addEventListener("click", e=>{
  if (!gifOpen) return;
  if (e.target.closest("#gif-picker")||e.target.closest("#gif-btn")) return;
  $("#gif-picker")?.classList.add("hidden"); gifOpen=false;
});


/* =====================================================================
   RIGHT-CLICK CONTEXT MENUS
   ===================================================================== */
function showCtxMenu(x, y, items) {
  document.getElementById("ctx-menu")?.remove();
  const menu=document.createElement("div");
  menu.id="ctx-menu";
  menu.className="ctx-menu";
  menu.innerHTML=items.map(item=>{
    if (item==="divider") return `<div class="ctx-divider"></div>`;
    const dataAttrs=Object.entries(item.data||{}).map(([k,v])=>`data-${k}="${escapeHtml(String(v))}"`).join(" ");
    return `<button class="ctx-item${item.danger?" danger":""}" data-ctx="${item.action}" ${dataAttrs}>${item.icon||""} ${item.label}</button>`;
  }).join("");
  menu.style.left=Math.min(x,window.innerWidth-210)+"px";
  menu.style.top =Math.min(y,window.innerHeight-200)+"px";
  document.body.appendChild(menu);
  setTimeout(()=>document.addEventListener("click",removeCtxMenu,{once:true}),0);
}

function removeCtxMenu() { document.getElementById("ctx-menu")?.remove(); }

document.addEventListener("contextmenu", e=>{
  // User right-click (avatar or name)
  const userEl=e.target.closest("[data-profile-uid]");
  const msgEl=e.target.closest(".message-group,.msg-followup");

  if (userEl&&!e.target.closest(".msg-action-btn")) {
    const uid=userEl.dataset.profileUid;
    if (!uid) return;
    e.preventDefault();
    const isSelf=uid===state.user?.uid;
    const isFriend=state.friends.some(f=>f.uid===uid);
    const items=[
      {label:"👤 View Profile", action:"ctx-view-profile", data:{uid}},
    ];
    if (!isSelf) {
      items.push({label:"💬 Message", action:"ctx-message", data:{uid}});
      if (!isFriend) items.push({label:"➕ Add Friend", action:"ctx-add-friend", data:{uid}});
      items.push("divider");
      items.push({label:"🚫 Block", action:"ctx-block", data:{uid}, danger:true});
    } else {
      items.push({label:"⚙️ Edit Profile", action:"ctx-edit-profile"});
    }
    showCtxMenu(e.clientX, e.clientY, items);
    return;
  }

  if (msgEl) {
    const msgId=msgEl.dataset.msgId;
    const msg=state.messages.find(m=>m.id===msgId);
    if (!msg) return;
    e.preventDefault();
    const isSelf=msg.senderUid===state.user?.uid;
    const items=[
      {label:"↩️ Reply",          action:"ctx-reply",    data:{msgId}},
      {label:"📋 Copy Text",      action:"ctx-copy-text",data:{msgId}},
      {label:"🆔 Copy Msg ID",    action:"ctx-copy-id",  data:{msgId}},
      "divider",
    ];
    if (isSelf) {
      items.push({label:"✏️ Edit",   action:"ctx-edit",   data:{msgId}});
      items.push({label:"🗑️ Delete", action:"ctx-delete", data:{msgId}, danger:true});
    } else {
      items.push({label:"🚩 Report", action:"ctx-report", data:{msgId, uid:msg.senderUid, name:msg.senderName||"User"}, danger:true});
    }
    showCtxMenu(e.clientX, e.clientY, items);
  }
});

document.addEventListener("click", async e=>{
  const item=e.target.closest(".ctx-item");
  if (!item) return;
  const action=item.dataset.ctx;
  const { uid, msgId, name } = item.dataset;
  removeCtxMenu();

  if (action==="ctx-view-profile") { showProfileCard(uid, e); }
  else if (action==="ctx-message")  { await openOrCreateDm(uid); }
  else if (action==="ctx-edit-profile") { openSettingsModal(); }
  else if (action==="ctx-add-friend") {
    const p=state.userCache[uid]||{};
    try {
      await setDoc(doc(db,"friendRequests",`${state.user.uid}_${uid}`),{
        fromUid:state.user.uid, toUid:uid,
        fromName:state.user.displayName, fromPhoto:state.user.photoURL||null,
        toName:p.username||p.displayName||"User", toPhoto:p.photoURL||null,
        createdAt:serverTimestamp()
      });
      showToast("Friend request sent!");
    } catch(err){ showToast("Error: "+err.message); }
  }
  else if (action==="ctx-block")  { await blockUser(uid); }
  else if (action==="ctx-reply")  { const m=state.messages.find(x=>x.id===msgId); if(m) setReplyTo(m); }
  else if (action==="ctx-copy-text") {
    const m=state.messages.find(x=>x.id===msgId);
    if (m) navigator.clipboard.writeText(m.text||"").then(()=>showToast("Copied!"));
  }
  else if (action==="ctx-copy-id") {
    navigator.clipboard.writeText(msgId||"").then(()=>showToast("Message ID copied!"));
  }
  else if (action==="ctx-edit")   { startEditMessage(msgId); }
  else if (action==="ctx-delete") { await deleteMessage(msgId); }
  else if (action==="ctx-report") { openReportModal(uid, name, msgId); }
});


/* =====================================================================
   DELETE MESSAGE
   ===================================================================== */
async function deleteMessage(msgId) {
  const msg=state.messages.find(m=>m.id===msgId);
  if (!msg||msg.senderUid!==state.user?.uid) return;
  if (!confirm("Delete this message?")) return;
  try {
    await deleteDoc(doc(db,"chats",state.activeChatId,"messages",msgId));
    showToast("Message deleted.");
  } catch(err){ showToast("Delete failed: "+err.message); }
}


/* =====================================================================
   BLOCKING
   ===================================================================== */
async function blockUser(uid) {
  if (!uid||uid===state.user?.uid) return;
  if (!confirm("Block this user? Their messages will be hidden from you.")) return;
  try {
    await updateDoc(doc(db,"users",state.user.uid),{ blockedUsers:arrayUnion(uid) });
    state.blockedUsers.add(uid);
    renderMessages();
    showToast("User blocked.");
  } catch(err){ showToast("Block failed: "+err.message); }
}

// Load blocked list on sign-in (wired in bootSubscriptions ownProfile listener)
function applyBlockedFromProfile(data) {
  if (Array.isArray(data.blockedUsers)) {
    state.blockedUsers=new Set(data.blockedUsers);
  }
}


// Badge rendering and resolved status are wired directly inside showProfileCard
// (see the existing function above — edits applied inline)


/* =====================================================================
   JUMP TO LATEST BUTTON
   ===================================================================== */
function updateJumpBtn() {
  const wrap=$("#messages");
  const btn=$("#jump-latest");
  if (!wrap||!btn) return;
  const atBottom=wrap.scrollHeight-wrap.scrollTop-wrap.clientHeight<80;
  btn.classList.toggle("hidden", atBottom);
  if (!atBottom) {
    const n=state._unreadDisplayCount||0;
    btn.textContent=n>0?`↓  +${n} new messages`:"↓  Jump to Latest";
  }
}

// Wire up the scroll listener once — it's fine to attach to the #messages element
// which persists across chat switches (innerHTML changes, element stays)
(function wireJumpBtn() {
  const wrap=$("#messages");
  const btn=$("#jump-latest");
  if (!wrap||!btn) return;
  wrap.addEventListener("scroll", updateJumpBtn, {passive:true});
  btn.addEventListener("click", ()=>{
    wrap.scrollTo({top:wrap.scrollHeight, behavior:"smooth"});
  });
})();


/* =====================================================================
   SAVE DRAFT ON PAGE CLOSE
   ===================================================================== */
window.addEventListener("beforeunload", ()=>{
  // Persist draft for current chat
  const chatId=state.activeChatId;
  if (chatId) {
    const draftVal=$("#composer-input")?.value||"";
    localStorage.setItem(`sc_draft_${chatId}`, draftVal);
  }
});


/* =====================================================================
   COMPOSER HINTS BAR — init + dismiss
   ===================================================================== */
(function initHintsBar() {
  const bar=$("#composer-hint");
  if (!bar) return;
  // Apply saved preference
  if (localStorage.getItem("sc_hints")==="false") bar.classList.add("hidden");
  // Dismiss button
  $("#hint-dismiss-btn")?.addEventListener("click", ()=>{
    bar.classList.add("hidden");
    localStorage.setItem("sc_hints","false");
  });
})();


/* =====================================================================
   LOGIN BUTTON — loading state
   ===================================================================== */
$("#google-signin-btn")?.addEventListener("mousedown", function() {
  this.classList.add("loading");
}, {once:false});
// Reset if sign-in fails (handled in auth listener — just add class removal on any click that resolves)
document.addEventListener("click", e=>{
  if (!e.target.closest("#google-signin-btn")) {
    $("#google-signin-btn")?.classList.remove("loading");
  }
});
