/* =====================================================================
   Static Chat — app.js
   ===================================================================== */

import { isNameBlocked, generateSafeName } from "./name-blocklist.js";
import { buildUI } from "./ui.js";
import { getRandomTip } from "./tips.js";
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

// Populate loading-screen tips
(function() {
  const tipEl = document.getElementById("loading-tip");
  const bottomEl = document.getElementById("loading-tip-bottom");
  if (tipEl) tipEl.textContent = getRandomTip();
  if (bottomEl) bottomEl.textContent = getRandomTip();
})();


/* =====================================================================
   EMOJI DATA
   ===================================================================== */
const STATIC_EMOJI_URL = "./thumb.jpg";

const EMOJI_CATS = [
  { id: "favorites", label: "♥"  },
  { id: "all",       label: "★"  },
  { id: "smileys",   label: "😄" },
  { id: "gestures",  label: "👍" },
  { id: "hearts",    label: "❤️" },
  { id: "nature",    label: "🌿" },
  { id: "food",      label: "🍕" },
  { id: "animals",   label: "🐶" },
  { id: "objects",   label: "💻" },
  { id: "special",   label: "⭐" },
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
  { name:"skull",           char:"💀", alt:["dead","bones","rip"],       cat:"smileys" },
  { name:"skull_crossbones",char:"☠️", alt:["danger","pirate","dead"],  cat:"smileys" },
  { name:"ghost",           char:"👻", alt:["boo","spooky"],             cat:"smileys" },
  { name:"alien",           char:"👽", alt:["ufo"],                      cat:"smileys" },
  { name:"poop",            char:"💩", alt:["poo"],                      cat:"smileys" },
  { name:"imp",             char:"😈", alt:["evil","devil","mischief"],   cat:"smileys" },
  { name:"angel",           char:"😇", alt:["innocent","halo"],           cat:"smileys" },
  { name:"partying",        char:"🥳", alt:["party","birthday","hype"],   cat:"smileys" },
  { name:"monocle",         char:"🧐", alt:["fancy","examine","sus"],      cat:"smileys" },
  { name:"hot_face",        char:"🥵", alt:["hot","sweating"],             cat:"smileys" },
  { name:"cold_face",       char:"🥶", alt:["cold","freezing"],            cat:"smileys" },
  { name:"woozy",           char:"🥴", alt:["drunk","dizzy"],              cat:"smileys" },
  { name:"exploding_head",  char:"🤯", alt:["mind blown","mindblown"],     cat:"smileys" },
  { name:"zipper_mouth",    char:"🤐", alt:["shh","quiet","secret"],       cat:"smileys" },
  { name:"lying",           char:"🤥", alt:["lie","pinocchio"],            cat:"smileys" },
  { name:"money_mouth",     char:"🤑", alt:["rich","money","cash"],        cat:"smileys" },
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
  { name:"shrug",           char:"🤷", alt:["idk","whatever","dunno"],   cat:"gestures" },
  { name:"facepalm",        char:"🤦", alt:["smh","ugh","duh"],          cat:"gestures" },
  { name:"raising_hand",    char:"🙋", alt:["volunteer","me","yes"],     cat:"gestures" },
  { name:"bow",             char:"🙇", alt:["sorry","respect","worship"],cat:"gestures" },
  { name:"no_good",         char:"🙅", alt:["no","stop","nope"],         cat:"gestures" },
  { name:"ok_person",       char:"🙆", alt:["ok","yes","fine"],          cat:"gestures" },
  { name:"pinched_fingers", char:"🤌", alt:["italian","chef"],           cat:"gestures" },
  { name:"index_finger",    char:"☝️", alt:["one","point","up"],        cat:"gestures" },
  { name:"peace",           char:"✌️", alt:["victory","peace","two"],   cat:"gestures" },
  { name:"writing_hand",    char:"✍️", alt:["write","sign"],            cat:"gestures" },
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
  { name:"exclamation", char:"❗", alt:["important","alert"],        cat:"objects" },
  { name:"speech",      char:"💬", alt:["chat","message","talk"],     cat:"objects" },
  { name:"bulb",        char:"💡", alt:["idea","light"],              cat:"objects" },
  { name:"hammer",      char:"🔨", alt:["tool","build"],              cat:"objects" },
  { name:"fire_extinguisher",char:"🧯", alt:["fire","stop"],          cat:"objects" },
  { name:"ticket",      char:"🎟️", alt:["event","concert"],          cat:"objects" },
  { name:"clipboard",   char:"📋", alt:["copy","list","notes"],       cat:"objects" },
  { name:"calendar",    char:"📅", alt:["date","schedule"],           cat:"objects" },
  { name:"chart",       char:"📈", alt:["up","growth","stats"],       cat:"objects" },
  { name:"chart_down",  char:"📉", alt:["down","loss","stats"],       cat:"objects" },
  { name:"flag",        char:"🚩", alt:["red flag","warning"],        cat:"objects" },
  { name:"pin",         char:"📌", alt:["pinned","location"],         cat:"objects" },
  { name:"link",        char:"🔗", alt:["url","chain"],               cat:"objects" },
  { name:"recycle",     char:"♻️", alt:["green","environment"],       cat:"objects" },
  { name:"magnify",     char:"🔍", alt:["search","zoom","find"],      cat:"objects" },
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
  silentTyping:      localStorage.getItem("sc_silent_typing") === "true",
  autoSendGif:       localStorage.getItem("sc_autosend_gif") === "true",
  dblClickReact:     localStorage.getItem("sc_dblclick_react") === "true",
  dblClickEmoji:     localStorage.getItem("sc_dblclick_emoji") || "👍",
  compactMode:       localStorage.getItem("sc_compact") === "true",
  favGifs: {},   // gifUrl → { url, previewUrl, title }
  favEmojis: {}, // emojiName → { name, char }
};

// Apply theme + compact mode before anything renders
(function initTheme() {
  document.body.dataset.theme = state.theme;
  if (state.compactMode) document.body.classList.add("compact-mode");
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

/* =====================================================================
   CUSTOM CONFIRM DIALOG  (replaces all browser confirm() calls)
   ===================================================================== */
function showConfirm(message, onYes, opts={}) {
  // Remove any existing dialog
  document.getElementById("custom-confirm")?.remove();

  const { yesLabel="Confirm", noLabel="Cancel", danger=false } = opts;

  const overlay = document.createElement("div");
  overlay.id = "custom-confirm";
  overlay.className = "confirm-dialog";
  overlay.innerHTML = `
    <div class="confirm-dialog-card" role="dialog" aria-modal="true">
      ${opts.title?`<div class="confirm-dialog-title">${escapeHtml(opts.title)}</div>`:""}
      <div class="confirm-dialog-msg">${escapeHtml(message)}</div>
      <div class="confirm-dialog-btns">
        <button class="confirm-no">${escapeHtml(noLabel)}</button>
        <button class="confirm-yes${danger?" danger":""}">${escapeHtml(yesLabel)}</button>
      </div>
    </div>`;

  overlay.querySelector(".confirm-yes").addEventListener("click", ()=>{ overlay.remove(); onYes(); });
  overlay.querySelector(".confirm-no").addEventListener("click",  ()=>overlay.remove());
  overlay.addEventListener("click", e=>{ if (e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  // Focus the Yes button for keyboard accessibility
  setTimeout(()=>overlay.querySelector(".confirm-yes")?.focus(), 0);
}

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

function fullFormatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yest  = new Date(today - 86400000);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
  if (isToday) return `Today at ${time}`;
  if (isYest)  return `Yesterday at ${time}`;
  return d.toLocaleDateString([],{weekday:"long",year:"numeric",month:"long",day:"numeric"}) + " at " + time;
}

// Returns a relative-time string, or "" if the message is too old to be useful
function relativeTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime(); // ms
  if (diff < 10000)  return "just now";
  if (diff < 60000)  return `${Math.floor(diff/1000)} seconds ago`;
  if (diff < 3600000)return `${Math.floor(diff/60000)} minute${Math.floor(diff/60000)===1?"":"s"} ago`;
  if (diff < 86400000)return `${Math.floor(diff/3600000)} hour${Math.floor(diff/3600000)===1?"":"s"} ago`;
  // Older than 1 day — hover tooltip should show the full date (which is what fullFormatTime gives)
  return "";
}

// Build the title attribute for a message — only show relative time for recent msgs,
// full date for old ones; skip if no new info is added
function msgHoverTitle(ts) {
  if (!ts) return "";
  const rel=relativeTime(ts);
  if (rel) return rel + " · " + fullFormatTime(ts);
  // For messages older than 1 day, the visible timestamp already shows something like
  // "Jan 5" or "2 days ago" — hover shows full date + weekday which IS new info
  return fullFormatTime(ts);
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
  if (state.status === "dnd") return; // Do Not Disturb suppresses sounds
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
(function() {
  const btn = document.getElementById("google-signin-btn");
  if (!btn) return;
  let _signingIn = false;
  btn.addEventListener("click", async () => {
    if (_signingIn) return;
    _signingIn = true;
    btn.classList.add("loading");
    const errEl = document.getElementById("login-error");
    if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }
    try {
      await signInWithPopup(auth, provider);
      // On success onAuthStateChanged fires — no need to do anything here
    } catch(err) {
      _signingIn = false;
      btn.classList.remove("loading");
      const code = err.code || "";
      const msg = code === "auth/popup-blocked"
        ? "Popups are blocked. Please allow popups for this site, then try again."
        : code === "auth/popup-closed-by-user"
        ? "Sign-in was cancelled."
        : code === "auth/network-request-failed"
        ? "Network error. Check your connection and try again."
        : code === "auth/unauthorized-domain"
        ? "This domain isn't authorised for sign-in. Contact the site owner."
        : "Sign-in failed: " + (err.message || code);
      if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
      else showToast(msg, 6000);
    }
  });
})();

$("#signout-btn").addEventListener("click", async ()=>{
  showConfirm("You'll need to sign in again to use Static Chat.", async ()=>{
    cleanupAllSubscriptions();
    await signOut(auth);
  }, {title:"Sign out?", yesLabel:"Sign Out", danger:true});
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
  _hideLoadingScreen();
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
function _hideLoadingScreen() {
  const el = $("#loading-screen");
  if (!el || el.classList.contains("hidden")) return;
  el.classList.add("fade-out");
  setTimeout(() => el.classList.add("hidden"), 320);
}

function showAppUI() {
  _hideLoadingScreen();
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  updateUserPanel();
  showFriendsView();
}
function showLoginUI() {
  // Populate tip before revealing
  const tipEl = document.getElementById("login-tip-text");
  if (tipEl) tipEl.textContent = getRandomTip();
  _hideLoadingScreen();
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

  const u=state.user;
  const STATUS_META={
    online:    {label:"Online",         sub:"You are active",               color:"var(--c-online)"},
    idle:      {label:"Idle",           sub:"Away — but reachable",         color:"var(--c-idle)"},
    dnd:       {label:"Do Not Disturb", sub:"Mute all notifications",       color:"var(--c-dnd)"},
    invisible: {label:"Invisible",      sub:"Appear offline to others",     color:"var(--c-invisible)"},
  };

  picker = document.createElement("div");
  picker.id = "status-picker";
  picker.className = "status-picker-panel";

  // Mini user card at top
  const curVis=resolveStatus({...u, status:state.status});
  picker.innerHTML=`
    <div class="sp-user-card">
      <div class="sp-avatar-wrap">
        ${avatarMarkup(u.username||u.displayName,u.photoURL,"sp-avatar","sp-avatar-fallback")}
        <span class="sp-status-ring" data-status="${escapeHtml(state.status==="invisible"?"invisible":curVis)}"></span>
      </div>
      <div class="sp-user-info">
        <div class="sp-username">${escapeHtml(u.username||u.displayName||"You")}</div>
        <div class="sp-tag">${u.discriminator?`#${escapeHtml(u.discriminator)}`:""}</div>
      </div>
    </div>
    <div class="sp-divider"></div>
    <div class="sp-label">Set Status</div>
    ${Object.entries(STATUS_META).map(([s,{label,sub,color}])=>`
      <button class="sp-option${s===state.status?" active":""}" data-status="${s}">
        <span class="sp-dot" data-status="${s}" style="background:${s==="invisible"?"transparent":color}${s==="invisible"?";border:2px solid var(--c-invisible)":""}"></span>
        <div class="sp-option-text">
          <div class="sp-option-label">${escapeHtml(label)}</div>
          <div class="sp-option-sub">${escapeHtml(sub)}</div>
        </div>
        ${s===state.status?`<svg class="sp-check" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`:""}
      </button>`).join("")}
    <div class="sp-divider"></div>
    <button class="sp-option sp-settings" id="sp-open-settings">
      <svg viewBox="0 0 24 24" width="15" height="15" style="flex-shrink:0"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
      <span>User Settings</span>
    </button>`;

  // Position above the user panel
  const panelRect=anchor.closest("#user-panel")?.getBoundingClientRect()||anchor.getBoundingClientRect();
  picker.style.left  = panelRect.left+"px";
  picker.style.bottom= (window.innerHeight-panelRect.top+8)+"px";
  picker.style.width = Math.max(panelRect.width, 240)+"px";
  document.body.appendChild(picker);

  picker.addEventListener("click", async e2=>{
    if (e2.target.closest("#sp-open-settings")) { picker.remove(); openSettingsModal(); return; }
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
    document.addEventListener("click", ev=>{
      if (!document.getElementById("status-picker")) return;
      if (!ev.target.closest("#status-picker")&&!ev.target.closest("#user-panel-avatar-wrap"))
        document.getElementById("status-picker")?.remove();
    },{once:true});
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
  // Load cloud-saved favorites
  loadFavGifs();
  loadFavEmojis();

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
    state.userCache[uid] = _augmentBadges({ ...state.user, ...data });
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
          if (cur>prev && c.id!==state.activeChatId && !sentByMe && !isChatMuted(c.id)) {
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
// Inject auto-earned badges (OG etc.) client-side without requiring a write
// so display always shows correct badges even before a Firestore update occurs
function _augmentBadges(profile) {
  if (!profile) return profile;
  const badges=[...(profile.badges||[])];
  const created=profile.createdAt?.toDate?profile.createdAt.toDate():profile.createdAt?new Date(profile.createdAt):null;
  if (created&&created.getTime()<OG_CUTOFF_MS&&!badges.includes("og")) badges.push("og");
  return {...profile, badges};
}

async function fetchUserProfile(uid) {
  if (state.userCache[uid]) return state.userCache[uid];
  try {
    const d = await getDoc(doc(db,"users",uid));
    if (d.exists()) {
      state.userCache[uid]=_augmentBadges(d.data());
      return state.userCache[uid];
    }
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
  list.innerHTML=filtered.map(f=>{
    const fProfile=state.userCache[f.uid]||{};
    const fStatus=resolveStatus(fProfile);
    const fStatusLabel={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"}[fStatus]||"Offline";
    return `
    <div class="friend-row" data-uid="${escapeHtml(f.uid)}">
      <div class="friend-avatar-wrap" data-profile-uid="${escapeHtml(f.uid)}" role="button" tabindex="0" style="cursor:pointer">
        ${avatarMarkup(f.displayName,f.photoURL,"friend-row-avatar","friend-row-fallback")}
        <span class="friend-status-dot" data-status="${escapeHtml(fStatus)}"></span>
      </div>
      <div class="friend-row-info" data-profile-uid="${escapeHtml(f.uid)}" role="button" tabindex="0" style="cursor:pointer">
        <div class="friend-row-name">${escapeHtml(f.displayName)}</div>
        <div class="friend-row-tag">${f.discriminator?`#${escapeHtml(f.discriminator)} · `:""}<span style="color:${fStatus==="offline"?"var(--t-muted)":"var(--c-"+fStatus+")"}">${escapeHtml(fStatusLabel)}</span></div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle" title="Message" data-action="message" data-uid="${escapeHtml(f.uid)}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path fill="currentColor" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z"/></svg>
        </button>
        <button class="action-circle" title="View Profile" data-action="view-profile" data-uid="${escapeHtml(f.uid)}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path fill="currentColor" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z"/></svg>
        </button>
        <button class="action-circle decline" title="Remove friend" data-action="remove" data-uid="${escapeHtml(f.uid)}" data-friendship-id="${escapeHtml(f.friendshipId)}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm3-9h2v7H9v-7zm4 0h2v7h-2v-7zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>`;
  }).join("");
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

// Friends view delegation — clicking an avatar or name with data-profile-uid opens profile
$("#friends-view").addEventListener("click", async e=>{
  const profileEl=e.target.closest("[data-profile-uid]");
  if (profileEl && !e.target.closest("button[data-action]")) {
    showProfileCard(profileEl.dataset.profileUid, e); return;
  }
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action=btn.dataset.action;
  if      (action==="message")      await openOrCreateDm(btn.dataset.uid);
  else if (action==="view-profile") showProfileCard(btn.dataset.uid, e);
  else if (action==="remove") {
    showConfirm("Remove this friend?", async ()=>{
      try { await deleteDoc(doc(db,"friendships",btn.dataset.friendshipId)); showToast("Friend removed"); }
      catch(err){ showToast("Error: "+err.message); }
    }, { title:"Remove Friend", yesLabel:"Remove", danger:true });
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

  const hashMatch = raw.match(/^(.+)#(\d{4})$/);

  // Safety gate: require 3+ chars for prefix searches (prevent scraping all users by typing "a")
  if (!hashMatch) {
    if (!raw) { $("#search-hint").textContent="Enter a username to search."; return; }
    if (raw.length < 3) { $("#search-hint").textContent="Type at least 3 characters to search."; return; }
    if (/^(.)1+$/i.test(raw)) { $("#search-hint").textContent="Enter a more specific username."; return; }
  }

  $("#search-hint").textContent="Searching…";

  try {
    let found=[];

    if (hashMatch) {
      // Exact tag search — very specific, no length restriction
      const [,uname,disc]=hashMatch;
      const term=uname.toLowerCase();
      const q=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(50));
      const snap=await getDocs(q);
      snap.forEach(d=>{ const u=d.data(); if(u.uid&&u.uid!==state.user.uid&&u.displayNameLower===term&&u.discriminator===disc) found.push(u); });
    } else {
      // Prefix search — capped at 10 results to avoid enumeration attacks
      const term=raw.toLowerCase();
      const q=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(10));
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
function chatUnreadCount(c) {
  if (!c||state.activeChatId===c.id) return 0;
  if (c.lastSenderUid && c.lastSenderUid===state.user?.uid) return 0;
  const readAt=parseInt(localStorage.getItem(`sc_read_${c.id}`)||"0",10);
  const lastMsg=c.lastMessageAt?.toMillis?.()||0;
  if (!(lastMsg>readAt && readAt>0)) return 0;
  // If we have a count stored, use it; otherwise just show 1
  return c.unreadCount||1;
}
function chatHasUnread(c) { return chatUnreadCount(c)>0; }

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
    const unreadN=chatUnreadCount(c);
    const unread=unreadN>0?`<span class="side-item-unread" title="${unreadN} new message${unreadN===1?"":"s"}">${unreadN>99?"99+":unreadN}</span>`:"";
    const onlineStatus=resolveStatus(profile);
    const dmAvatar=`<div class="side-row-avatar-wrap">
      ${avatarMarkup(name,photo,"side-row-avatar","side-row-fallback")}
      <span class="side-status-dot" data-status="${escapeHtml(onlineStatus)}"></span>
    </div>`;
    return `
      <div class="side-row ${active}" data-chat-id="${escapeHtml(c.id)}" data-type="dm">
        ${dmAvatar}
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
    const unreadN2=chatUnreadCount(c);
    const unread=unreadN2>0?`<span class="side-item-unread" title="${unreadN2} new">${unreadN2>99?"99+":unreadN2}</span>`:"";
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

// Right-click on a DM row → quick actions
$("#dm-list").addEventListener("contextmenu", e=>{
  const row=e.target.closest(".side-row[data-type='dm']"); if (!row) return;
  e.preventDefault();
  const chatId=row.dataset.chatId;
  const chat=state.chats.find(c=>c.id===chatId); if (!chat) return;
  const otherUid=chat.members.find(u=>u!==state.user?.uid);
  const muted=isChatMuted(chatId);
  const items=[
    {label:"Open",         action:"ctx-open-dm",      data:{chatId}},
    {label:"View Profile", action:"ctx-view-profile",  data:{uid:otherUid||""}},
    "divider",
    {label: muted?"🔔 Unmute Notifications":"🔕 Mute Notifications",
     action:"ctx-mute-dm", data:{chatId}},
    "divider",
    {label:"Close DM",     action:"ctx-close-dm",      data:{chatId}},
  ];
  showCtxMenu(e.clientX, e.clientY, items);
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
      const hadMessages=state.chatInitialized.has(chatId);
      state.messages=snap.docs.map(d=>({id:d.id,...d.data()}));
      const isNew=hadMessages&&state.messages.length>prevLen;
      if (isNew) {
        const newest=state.messages[state.messages.length-1];
        if (newest&&newest.senderUid!==state.user.uid&&!isChatMuted(chatId)) playSound("message");
      }
      state.chatInitialized.add(chatId);
      renderMessages();
      // Animate newest message
      if (isNew) {
        const wrap=$("#messages");
        const last=wrap?.lastElementChild;
        if (last&&!last.classList.contains("empty")) {
          last.classList.add("new-msg");
          last.addEventListener("animationend",()=>last.classList.remove("new-msg"),{once:true});
        }
      }
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
  // Refresh pinned panel if it's open
  if (!$("#pins-panel")?.classList.contains("hidden")) renderPinsPanel();

  if (c.type==="dm") {
    const otherUid=c.members.find(m=>m!==state.user.uid);
    const profile=await fetchUserProfile(otherUid);
    const name=profile?.username||profile?.displayName||"Direct Message";
    const tag=profile?.discriminator?`#${profile.discriminator}`:"";
    const visStatus=resolveStatus(profile);
    const STATUS_LABEL_MAP={online:"Online",idle:"Idle",dnd:"Do Not Disturb",offline:"Offline"};
    const statusLabel=STATUS_LABEL_MAP[visStatus]||"Offline";
    const nameEl=$("#chat-header-name");
    nameEl.textContent=name;
    nameEl.classList.add("clickable");
    nameEl.style.cursor="pointer";
    $("#chat-header-sub").innerHTML=`<span class="header-status-dot" data-status="${escapeHtml(visStatus)}"></span><span>${escapeHtml(statusLabel)}</span>`;
    avatarWrap.innerHTML=`<div class="chat-header-avatar-status-wrap">${avatarMarkup(name,profile?.photoURL,"chat-header-avatar","chat-header-avatar-fallback")}<span class="chat-header-status-dot" data-status="${escapeHtml(visStatus)}"></span></div>`;
    avatarWrap.dataset.profileUid=otherUid||"";
    if(addBtn) addBtn.hidden=true; if(leaveBtn) leaveBtn.hidden=true;
    if(codeBadge) codeBadge.hidden=true;
  } else {
    const isLeader=Array.isArray(c.leaders)&&c.leaders.includes(state.user.uid);
    const nameEl2=$("#chat-header-name");
    nameEl2.textContent=c.name||"Group";
    nameEl2.classList.remove("clickable"); nameEl2.style.cursor="";
    $("#chat-header-sub").textContent=`${c.members.length} member${c.members.length===1?"":"s"}${isLeader?" · 👑 Leader":""}`;
    avatarWrap.innerHTML=`<div class="chat-header-avatar-fallback">${escapeHtml(groupInitials(c.name||"G"))}</div>`;
    delete avatarWrap.dataset.profileUid;
    if(addBtn) addBtn.hidden=false; if(leaveBtn) leaveBtn.hidden=false;
    if (codeBadge) {
      if (c.joinCode) { codeBadge.textContent=c.joinCode; codeBadge.hidden=false; codeBadge.title="Click to copy join code"; }
      else codeBadge.hidden=true;
    }
  }
  updateChatMuteBtn();
}

// Chat header avatar/name click → open profile (DMs only)
document.addEventListener("click", e=>{
  const wrap=e.target.closest("#chat-header-avatar-wrap");
  if (wrap && wrap.dataset.profileUid) { showProfileCard(wrap.dataset.profileUid, e); }
});
document.addEventListener("click", e=>{
  const nameEl=e.target.closest("#chat-header-name");
  if (nameEl) {
    const c=state.activeChat;
    if (c?.type==="dm") {
      const otherUid=c.members.find(u=>u!==state.user?.uid);
      if (otherUid) showProfileCard(otherUid, e);
    }
  }
});

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
const QUICK_REACTS = ["👍","❤️","😂","😮","😢"];

// OG cutoff — any account created before this timestamp gets an OG badge automatically
const OG_CUTOFF_MS = new Date("2026-05-04T00:00:00Z").getTime();

const BADGE_DEFS = {
  // ── Founding / Longevity ────────────────────────────────────────────
  og:           { label:"⭐ OG",          color:"#ffd700", bg:"rgba(255,215,0,.18)",   border:"rgba(255,215,0,.3)",  title:"Original member — joined before May 4th 2026" },
  og_og:        { label:"🌟 Day One",      color:"#ffaa00", bg:"rgba(255,170,0,.18)",   border:"rgba(255,170,0,.3)",  title:"Day One — one of the very first users" },
  early_tester: { label:"🧪 Early Tester", color:"#58a6ff", bg:"rgba(88,166,255,.16)", border:"rgba(88,166,255,.3)", title:"Helped test before public launch" },

  // ── Community ───────────────────────────────────────────────────────
  helper:       { label:"🤝 Helper",       color:"#23a55a", bg:"rgba(35,165,90,.16)",  border:"rgba(35,165,90,.3)",  title:"Goes out of their way to help others" },
  active:       { label:"💬 Active",        color:"#4f7cff", bg:"rgba(79,124,255,.14)", border:"rgba(79,124,255,.3)", title:"Super active member of the community" },
  friendly:     { label:"💛 Friendly",      color:"#f0b232", bg:"rgba(240,178,50,.16)", border:"rgba(240,178,50,.3)", title:"Known for being kind and welcoming" },

  // ── Contributions ──────────────────────────────────────────────────
  bug_reporter: { label:"🐛 Bug Reporter",  color:"#eb459e", bg:"rgba(235,69,158,.15)", border:"rgba(235,69,158,.3)", title:"Found and reported bugs to improve the app" },
  suggester:    { label:"💡 Suggester",     color:"#7c3aed", bg:"rgba(124,58,237,.15)", border:"rgba(124,58,237,.3)", title:"Suggested features that made it in" },

  // ── Special / Staff-adjacent ───────────────────────────────────────
  trusted:      { label:"🔵 Trusted",       color:"#5bc4fc", bg:"rgba(91,196,252,.14)", border:"rgba(91,196,252,.3)", title:"A trusted and respected community member" },
  creator:      { label:"👑 Creator",       color:"#ff8c42", bg:"rgba(255,140,66,.16)", border:"rgba(255,140,66,.3)", title:"Made Static Chat" },
  partner:      { label:"🤖 Partner",       color:"#9c84ec", bg:"rgba(156,132,236,.15)",border:"rgba(156,132,236,.3)",title:"Official partner" },

  // ── Fun / Achievement ──────────────────────────────────────────────
  gif_master:   { label:"🎭 GIF Master",   color:"#f23f43", bg:"rgba(242,63,67,.14)",  border:"rgba(242,63,67,.3)",  title:"Sent an absurd number of GIFs" },
  emoji_lord:   { label:"😄 Emoji Lord",   color:"#f0b232", bg:"rgba(240,178,50,.14)", border:"rgba(240,178,50,.3)", title:"Reaction royalty" },
  night_owl:    { label:"🦉 Night Owl",    color:"#6b7cce", bg:"rgba(107,124,206,.14)",border:"rgba(107,124,206,.3)",title:"Always online at night" },
};

function renderBadges(badges=[]) {
  if (!badges||!badges.length) return "";
  return badges.map(b=>{
    const d=BADGE_DEFS[b]; if(!d) return "";
    const borderStyle=d.border?`border-color:${d.border};`:"";
    return `<span class="badge-chip" title="${escapeHtml(d.title)}" style="color:${d.color};background:${d.bg};${borderStyle}">${escapeHtml(d.label)}</span>`;
  }).join("");
}

function buildReplyPreview(m) {
  if (!m.replyToMessageId) return "";
  const ref=state.messages.find(x=>x.id===m.replyToMessageId);
  const name=m.replyToSenderName||(ref?.senderName)||"Unknown";
  const rawPreview=m.replyToTextPreview||(ref?.text||"")||"";
  // Truncate and strip any markdown/emoji syntax for the preview snippet
  // Resolve :name: to actual emoji chars (fall back to the char itself if unknown, not 🔷)
  const preview=rawPreview
    .replace(/:[A-Za-z0-9_+\-]+:/g, m => {
      const key = m.slice(1,-1);
      return EMOJI_MAP[key] || m; // keep :name: as-is if not found rather than 🔷
    })
    .replace(/\*\*|__|~~|\*/g,"").slice(0,80);
  const photo=ref?state.userCache[ref.senderUid]?.photoURL:null;
  const initial=name.charAt(0).toUpperCase();
  const avatarHtml=photo
    ?`<img class="reply-avatar" src="${escapeHtml(photo)}" alt="" />`
    :`<span class="reply-avatar reply-avatar-fallback">${escapeHtml(initial)}</span>`;
  return `<div class="reply-preview" data-jump-to="${escapeHtml(m.replyToMessageId)}" title="Jump to original message" role="button" tabindex="0">
    <div class="reply-connector"></div>
    ${avatarHtml}
    <span class="reply-preview-name">${escapeHtml(name)}</span>
    <span class="reply-preview-text">${escapeHtml(preview)||"<em>Message unavailable</em>"}</span>
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

    const tsTitle = escapeHtml(msgHoverTitle(ts));
    const msgQuickReact=`<div class="msg-quick-react">${QUICK_REACTS.map(e=>`<button class="quick-react-btn" data-qr-emoji="${e}" data-qr-msg="${escapeHtml(m.id)}" title="${e}">${e}</button>`).join("")}</div>`;
    const msgActions=`<div class="msg-actions">
      ${msgQuickReact}
      <button class="msg-action-btn" data-action="reply-msg" data-msg-id="${escapeHtml(m.id)}" title="Reply">${SVG_REPLY}</button>
      ${isSelf
        ?`<button class="msg-action-btn" data-action="edit-msg" data-msg-id="${escapeHtml(m.id)}" title="Edit">${SVG_EDIT}</button>`
        :`<button class="msg-action-btn danger" data-action="report-msg" data-msg-id="${escapeHtml(m.id)}" data-uid="${escapeHtml(m.senderUid)}" data-name="${escapeHtml(m.senderName||"User")}" title="Report">${SVG_REPORT}</button>`
      }
    </div>`;

    // Pin system message
    if (m.type==="pin") {
      const pinnerName=escapeHtml(m.senderName||"Someone");
      const pinnedMsgId=m.pinnedMsgId||"";
      html.push(`<div class="msg-system" data-msg-id="${escapeHtml(m.id)}">
        <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0;vertical-align:-2px"><path fill="currentColor" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
        <span><strong>${pinnerName}</strong> pinned a message.
        ${pinnedMsgId?`<a class="msg-system-link" data-pin-jump="${escapeHtml(pinnedMsgId)}" href="#">View it.</a>`:""}</span>
      </div>`);
      // system messages don't affect sender grouping
      continue;
    }

    const isCommand=!!(m.commandResult||m.type==="command");
    const extraClass=isCommand?" msg-command-result":"";

    if (sameSender&&closeInTime&&lastSenderUid!==null) {
      html.push(`
        <div class="msg-followup${extraClass}" data-msg-id="${escapeHtml(m.id)}" title="${tsTitle}">
          <span class="msg-time-inline">${escapeHtml(shortTime(ts))}</span>
          ${replyHtml}
          <div class="msg-body">${formatMessage(m.text||"")}${editedLabel}</div>
          ${reactionsHtml}
          ${msgActions}
        </div>`);
    } else {
      html.push(`
        <div class="message-group${extraClass}" data-msg-id="${escapeHtml(m.id)}" title="${tsTitle}">
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
  // Capture scroll state BEFORE innerHTML wipe — innerHTML resets scrollTop to 0
  const prevScrollTop    = wrap.scrollTop;
  const prevScrollHeight = wrap.scrollHeight;
  const wasAtBottom      = prevScrollHeight - prevScrollTop - wrap.clientHeight < 120;

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
    // Subsequent renders (live updates): only auto-scroll if user was already at the bottom
    if (wasAtBottom) wrap.scrollTop=wrap.scrollHeight;
    // else: user is reading history — don't jump
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

// Double-click to react
$("#messages").addEventListener("dblclick", async e=>{
  if (!state.dblClickReact) return;
  if (e.target.closest(".msg-action-btn,.reaction-pill,.quick-react-btn,.reply-preview")) return;
  const group=e.target.closest(".message-group,.msg-followup");
  if (!group) return;
  const msgId=group.dataset.msgId; if (!msgId) return;
  const emoji=state.dblClickEmoji||"👍";
  await toggleReaction(msgId, emoji);
  // Brief visual flash
  group.classList.add("dbl-react-flash");
  setTimeout(()=>group.classList.remove("dbl-react-flash"), 400);
});

// Message area delegation
$("#messages").addEventListener("click", async e=>{
  // Click on a reply-preview → jump to the original message
  const replyJump=e.target.closest("[data-jump-to]");
  if (replyJump) {
    const targetId=replyJump.dataset.jumpTo;
    const targetEl=$("#messages").querySelector(`[data-msg-id="${targetId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({behavior:"smooth", block:"center"});
      // Flash highlight
      targetEl.classList.add("msg-jump-highlight");
      setTimeout(()=>targetEl.classList.remove("msg-jump-highlight"), 1400);
    }
    return;
  }

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
  // Quick-react buttons (hover bar)
  const qrBtn=e.target.closest(".quick-react-btn");
  if (qrBtn) { await toggleReaction(qrBtn.dataset.qrMsg, qrBtn.dataset.qrEmoji); return; }

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
  updateCmdAutocomplete();
});

composer.addEventListener("keydown", e=>{
  // Slash command autocomplete navigation (check first — takes priority)
  const cmdAc=$("#cmd-autocomplete");
  if (cmdAc&&!cmdAc.classList.contains("hidden")&&_cmdAcItems.length) {
    if (e.key==="ArrowDown") { e.preventDefault(); _cmdAcIndex=(_cmdAcIndex+1)%_cmdAcItems.length; updateCmdAcHighlight(); return; }
    if (e.key==="ArrowUp")   { e.preventDefault(); _cmdAcIndex=(_cmdAcIndex-1+_cmdAcItems.length)%_cmdAcItems.length; updateCmdAcHighlight(); return; }
    if (e.key==="Enter"||e.key==="Tab") { e.preventDefault(); insertCmdAcItem(_cmdAcIndex); return; }
    if (e.key==="Escape") { hideCmdAc(); return; }
  }
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
  "h":"help","?":"help",
  "q2":"quote","qt":"quote"
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
    case "tip":
    case "loadingtip":
      return `💡 **Tip:** ${getRandomTip()}`;
    case "quote":
      return `📖 **Quote:** ${getRandomTip()}`;
    case "help":
      return `📋 **Commands**\n/8ball [q] · /tod · /truth · /dare · /joke · /fortune · /advice · /coinflip · /roll [NdN] · /ship [a] [b] · /tip · /quote\n**Aliases:** /cf /flip (coinflip) · /r /dice (roll) · /t (truth) · /d (dare) · /j (joke) · /f (fortune) · /a (advice) · /s (ship)`;
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

$("#chat-leave-btn")?.addEventListener("click", ()=>{
  const c=state.activeChat; if (!c||c.type!=="group") return;
  showConfirm(`Leave "${c.name}"?`, async ()=>{
    try {
      const newMembers=c.members.filter(m=>m!==state.user.uid);
      await updateDoc(doc(db,"chats",c.id),{members:newMembers});
      showFriendsView(); showToast("Left group");
    } catch(err){ showToast("Error: "+err.message); }
  }, { title:"Leave Group", yesLabel:"Leave", danger:true });
});


/* =====================================================================
   MODALS
   ===================================================================== */
function openModal(id)  { const m=document.getElementById(id); if(m) m.classList.remove("hidden"); }
function closeModal(id) { const m=document.getElementById(id); if(m) m.classList.add("hidden"); }
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{ if(e.target===m) m.classList.add("hidden"); }));

// Track whether account-pane fields have unsaved changes
let _settingsDirty = false;
function _markSettingsDirty() { _settingsDirty = true; }

// Wire dirty tracking to account form fields
["settings-username-input","settings-bio-input","settings-photo-input"].forEach(id=>{
  document.addEventListener("input", e=>{ if(e.target.id===id) _markSettingsDirty(); });
});
document.addEventListener("change", e=>{
  if(e.target.id==="settings-privacy-toggle") _markSettingsDirty();
});

// Settings modal — revert theme preview on backdrop/X close
function onSettingsClose(force=false) {
  if (!force && _settingsDirty) {
    showConfirm("You have unsaved changes. Discard them?", ()=>{
      _settingsDirty=false;
      if (_pendingTheme!==null && _pendingTheme!==state.theme) applyTheme(state.theme);
      closeModal("settings-modal");
    }, {title:"Unsaved changes", yesLabel:"Discard", danger:true});
    return;
  }
  if (_pendingTheme!==null && _pendingTheme!==state.theme) applyTheme(state.theme);
}
// Intercept close attempts for settings-modal
document.addEventListener("click", e=>{
  const closer=e.target.closest("[data-close='settings-modal']");
  const isBdrop=e.target===$("#settings-modal");
  if (closer||isBdrop) {
    if (_settingsDirty) {
      e.stopImmediatePropagation();
      onSettingsClose();
    } else {
      onSettingsClose(true);
    }
  }
});


// Suggestions link is a plain <a target="_blank"> in the HTML — no JS needed.


/* =====================================================================
   SETTINGS MODAL
   ===================================================================== */
let _pendingTheme=null, _pendingStatus=null, _pendingBannerColor=undefined, _pendingPrivate=null;

$("#settings-btn").addEventListener("click", openSettingsModal);

function switchSettingsPane(paneId) {
  $$(".settings-pane").forEach(p=>p.classList.toggle("hidden",p.dataset.pane!==paneId));
  $$(".settings-discord-nav-item[data-pane]").forEach(n=>n.classList.toggle("active",n.dataset.pane===paneId));
}

function openSettingsModal(pane="account") {
  // Remap removed panes to merged ones
  if (pane==="profile")       pane="account";
  if (pane==="notifications")  pane="appearance";
  _settingsDirty = false; // reset dirty flag each open
  const u=state.user;
  _pendingTheme=state.theme;
  _pendingStatus=state.status;
  _pendingBannerColor=state.bannerColor;
  _pendingPrivate=state.isPrivate;

  if($("#settings-username-input")) $("#settings-username-input").value=u.username||u.displayName||"";
  if($("#settings-tag-display"))    $("#settings-tag-display").textContent=u.discriminator?`#${u.discriminator}`:"#????";
  if($("#settings-bio-input"))      $("#settings-bio-input").value=u.bio||"";
  if($("#settings-photo-input"))    $("#settings-photo-input").value=u.photoURL||"";
  if($("#settings-sound-toggle"))              $("#settings-sound-toggle").checked=state.soundEnabled;
  if($("#settings-hints-toggle"))              $("#settings-hints-toggle").checked=localStorage.getItem("sc_hints")!=="false";
  if($("#settings-autosend-gif-toggle"))       $("#settings-autosend-gif-toggle").checked=state.autoSendGif;
  if($("#settings-compact-toggle"))            $("#settings-compact-toggle").checked=state.compactMode;
  if($("#settings-dblclick-react-toggle"))     $("#settings-dblclick-react-toggle").checked=state.dblClickReact;
  if($("#settings-dblclick-emoji"))            $("#settings-dblclick-emoji").value=state.dblClickEmoji;
  if($("#dblclick-emoji-preview"))             $("#dblclick-emoji-preview").textContent=state.dblClickEmoji;
  if($("#settings-silent-typing-toggle"))      $("#settings-silent-typing-toggle").checked=state.silentTyping;
  // Show/hide dblclick emoji row
  const dblRow=$("#dblclick-emoji-row"); if(dblRow) dblRow.style.display=state.dblClickReact?"":"none";

  $$(".theme-swatch").forEach(sw=>sw.classList.toggle("active",sw.dataset.theme===_pendingTheme));
  $$(".status-row-option").forEach(opt=>opt.classList.toggle("active",opt.dataset.status===_pendingStatus));
  $$(".banner-swatch").forEach(sw=>sw.classList.toggle("active",(sw.dataset.color||"")===((_pendingBannerColor)||"")));
  // Init banner type toggle UI
  const isGradient=!_pendingBannerColor||_pendingBannerColor.includes(",");
  $$(".banner-type-btn").forEach(b=>b.classList.toggle("active",b.dataset.type===(isGradient?"gradient":"solid")));
  const gradSec=$("#banner-gradient-section"); const solidSec=$("#banner-solid-section");
  if (gradSec) gradSec.style.display=isGradient?"":"none";
  if (solidSec) solidSec.style.display=isGradient?"none":"";
  if (!isGradient&&_pendingBannerColor) {
    const solidPicker=$("#banner-solid-color"); const solidHex=$("#banner-solid-hex");
    if (solidPicker) solidPicker.value=_pendingBannerColor;
    if (solidHex) solidHex.value=_pendingBannerColor;
  }
  const privToggle=$("#settings-privacy-toggle");
  if (privToggle) privToggle.checked=!!_pendingPrivate;
  const sinceEl=$("#settings-created-at");
  if (sinceEl&&u.createdAt) {
    const d=u.createdAt.toDate?u.createdAt.toDate():new Date(u.createdAt);
    sinceEl.textContent=d.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
  }

  updateAvatarPreview("settings",u.username||u.displayName,u.photoURL);
  // Populate preview banner
  const previewBanner=$("#settings-preview-banner");
  if (previewBanner&&_pendingBannerColor) {
    const parts=_pendingBannerColor.split(",");
    previewBanner.style.background=parts.length>=2?`linear-gradient(135deg,${parts[0]},${parts[1]})`:parts[0];
  }
  const pName=$("#settings-preview-name"); if(pName) pName.textContent=u.username||u.displayName||"";
  const pTag=$("#settings-preview-tag"); if(pTag) pTag.textContent=u.discriminator?`#${u.discriminator}`:"";
  const pBio2=$("#settings-preview-bio"); if(pBio2) pBio2.textContent=u.bio||"No bio set yet.";
  const pBadges2=$("#settings-preview-badges"); if(pBadges2) pBadges2.innerHTML=renderBadges(state.userCache[u.uid]?.badges||[]);
  switchSettingsPane(pane);
  openModal("settings-modal");
}

// Settings Discord left-nav clicks
document.addEventListener("click", e=>{
  const navItem=e.target.closest(".settings-discord-nav-item[data-pane]");
  if (navItem) switchSettingsPane(navItem.dataset.pane);
});

// Second Save Changes button (in Profile pane) delegates to main one
document.addEventListener("click", e=>{
  if (e.target.closest("#settings-save-btn-2")) $("#settings-save-btn")?.click();
  if (e.target.closest("#settings-signout-btn")) {
    closeModal("settings-modal");
    setTimeout(()=>{
      showConfirmModal("Sign out?", "You'll need to sign in again to use Static Chat.", "Sign Out", async ()=>{
        cleanupAllSubscriptions();
        await signOut(auth).catch(()=>{});
      });
    }, 150);
  }
});

// Live preview helpers for settings
function _updateSettingsPreview() {
  const name=$("#settings-username-input")?.value.trim()||state.user?.username||"";
  const photo=$("#settings-photo-input")?.value.trim()||null;
  const bio=$("#settings-bio-input")?.value.trim()||"";
  updateAvatarPreview("settings",name,photo);
  // Update name/tag/bio in preview card
  const pName=$("#settings-preview-name"); if(pName) pName.textContent=name||"Username";
  const pTag=$("#settings-preview-tag"); if(pTag) pTag.textContent=state.user?.discriminator?`#${state.user.discriminator}`:"";
  const pBio=$("#settings-preview-bio"); if(pBio) pBio.textContent=bio||"No bio set yet.";
  const pBadges=$("#settings-preview-badges");
  if(pBadges) pBadges.innerHTML=renderBadges(state.userCache[state.user?.uid]?.badges||[]);
  // Update banner if pending
  const banner=$("#settings-preview-banner");
  if(banner&&_pendingBannerColor){
    const parts=_pendingBannerColor.split(",");
    banner.style.background=parts.length>=2?`linear-gradient(135deg,${parts[0]},${parts[1]})`:parts[0];
  }
}

// Settings live preview
["settings-photo-input","settings-username-input","settings-bio-input"].forEach(id=>{
  document.addEventListener("input",e=>{ if(e.target.id===id) _updateSettingsPreview(); });
});

// Instant-apply: sound, hints, and auto-send GIF toggles take effect immediately
$("#settings-sound-toggle")?.addEventListener("change", e => {
  state.soundEnabled = e.target.checked;
  localStorage.setItem("sc_sound", e.target.checked ? "true" : "false");
});
$("#settings-hints-toggle")?.addEventListener("change", e => {
  const on = e.target.checked;
  localStorage.setItem("sc_hints", on ? "true" : "false");
  const hintBar = $("#composer-hint");
  if (hintBar) hintBar.classList.toggle("hidden", !on);
});
$("#settings-autosend-gif-toggle")?.addEventListener("change", e => {
  state.autoSendGif = e.target.checked;
  localStorage.setItem("sc_autosend_gif", e.target.checked ? "true" : "false");
});
$("#settings-compact-toggle")?.addEventListener("change", e => {
  state.compactMode = e.target.checked;
  localStorage.setItem("sc_compact", e.target.checked ? "true" : "false");
  document.body.classList.toggle("compact-mode", e.target.checked);
});
$("#settings-dblclick-react-toggle")?.addEventListener("change", e => {
  state.dblClickReact = e.target.checked;
  localStorage.setItem("sc_dblclick_react", e.target.checked ? "true" : "false");
  const row=$("#dblclick-emoji-row"); if(row) row.style.display=e.target.checked?"":"none";
});
$("#settings-dblclick-emoji")?.addEventListener("input", e => {
  const v=e.target.value.trim()||"👍";
  state.dblClickEmoji=v;
  localStorage.setItem("sc_dblclick_emoji", v);
  const prev=$("#dblclick-emoji-preview"); if(prev) prev.textContent=v;
});
$("#settings-silent-typing-toggle")?.addEventListener("change", e => {
  state.silentTyping = e.target.checked;
  localStorage.setItem("sc_silent_typing", e.target.checked ? "true" : "false");
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
  // Banner preset swatch
  const bannerSwatch=e.target.closest(".banner-swatch:not(#banner-custom-apply)");
  if (bannerSwatch&&bannerSwatch.dataset.color) {
    _pendingBannerColor=bannerSwatch.dataset.color||null;
    $$(".banner-swatch").forEach(s=>s.classList.toggle("active",(s.dataset.color||"")===((_pendingBannerColor)||"")));
    _updateSettingsPreview();
    return;
  }
  // Banner custom gradient "Apply" button
  if (e.target.closest("#banner-custom-apply")) {
    const c1=$("#banner-custom-color1")?.value||"#4f7cff";
    const c2=$("#banner-custom-color2")?.value||"#7c3aed";
    _pendingBannerColor=`${c1},${c2}`;
    $$(".banner-swatch").forEach(s=>s.classList.remove("active"));
    _updateSettingsPreview();
    showToast("Custom gradient applied!");
    return;
  }
  // Banner type toggle (Gradient / Solid)
  const typeBtn=e.target.closest(".banner-type-btn");
  if (typeBtn) {
    $$(".banner-type-btn").forEach(b=>b.classList.toggle("active",b===typeBtn));
    const isGrad=typeBtn.dataset.type==="gradient";
    const gradSec=$("#banner-gradient-section"); const solidSec=$("#banner-solid-section");
    if (gradSec) gradSec.style.display=isGrad?"":"none";
    if (solidSec) solidSec.style.display=isGrad?"none":"";
    if (!isGrad) {
      // switch to solid — apply current solid color picker value
      const hex=$("#banner-solid-color")?.value||"#4f7cff";
      _pendingBannerColor=hex;
      _updateSettingsPreview();
    }
    return;
  }
});

// Solid color picker — live update
document.addEventListener("input", e=>{
  if (e.target.id==="banner-solid-color") {
    const hex=e.target.value;
    const hexInput=$("#banner-solid-hex");
    if (hexInput) hexInput.value=hex;
    _pendingBannerColor=hex;
    _updateSettingsPreview();
  }
  if (e.target.id==="banner-solid-hex") {
    const hex=e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      const colorPicker=$("#banner-solid-color");
      if (colorPicker) colorPicker.value=hex;
      _pendingBannerColor=hex;
      _updateSettingsPreview();
    }
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
    _settingsDirty=false;
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
  } else if (state.activeCat==="favorites") {
    // Show favorited emojis from state.favEmojis
    const favNames=Object.keys(state.favEmojis);
    items=favNames.length
      ? favNames.map(name=>EMOJI_DATA.find(e=>e.name===name)).filter(Boolean)
      : [];
  } else {
    const pool = state.activeCat==="all" ? EMOJI_DATA : EMOJI_DATA.filter(e=>e.cat===state.activeCat);
    // :Static: always first in any listing
    const staticEntry=pool.find(e=>e.isStatic);
    const rest=pool.filter(e=>!e.isStatic);
    items=staticEntry?[staticEntry,...rest]:rest;
  }
  if (!emojiGrid) return;
  if (!items.length && state.activeCat==="favorites") {
    emojiGrid.innerHTML=`<div class="emoji-empty-fav">No favourite emojis yet.<br>Hover an emoji and click ♥ to save.</div>`;
    return;
  }
  emojiGrid.innerHTML=items.map(e=>{
    if (e.isStatic) {
      return `<div class="emoji-item-wrap"><button class="emoji-cell" title=":Static:" data-insert=":Static:"><img src="${STATIC_EMOJI_URL}" class="static-emoji-square" alt=":Static:" /></button><button class="emoji-fav-btn${state.favEmojis["Static"]?" active":""}" data-fav-name="Static" title="${state.favEmojis["Static"]?"Remove fav":"Favourite"}">♥</button></div>`;
    }
    return `<div class="emoji-item-wrap"><button class="emoji-cell" title=":${escapeHtml(e.name)}:" data-insert="${escapeHtml(e.char)}">${e.char}</button><button class="emoji-fav-btn${state.favEmojis[e.name]?" active":""}" data-fav-name="${escapeHtml(e.name)}" data-fav-char="${escapeHtml(e.char)}" title="${state.favEmojis[e.name]?"Remove fav":"Favourite"}">♥</button></div>`;
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

// Category tab clicks + emoji fav + emoji insert
$("#emoji-picker")?.addEventListener("click", async e=>{
  // ── Fav button ──
  const favBtn=e.target.closest(".emoji-fav-btn");
  if (favBtn) {
    e.stopPropagation();
    const name=favBtn.dataset.favName;
    const char=favBtn.dataset.favChar||"";
    if (!name||!state.user) return;
    if (state.favEmojis[name]) {
      delete state.favEmojis[name];
      favBtn.classList.remove("active");
      favBtn.title="Favourite";
      await deleteDoc(doc(db,"users",state.user.uid,"favEmojis",name));
      showToast("💔 Removed from favourite emojis");
    } else {
      state.favEmojis[name]={name, char};
      favBtn.classList.add("active");
      favBtn.title="Remove fav";
      await setDoc(doc(db,"users",state.user.uid,"favEmojis",name),{
        name, char, addedAt:serverTimestamp()
      });
      showToast("⭐ Emoji saved!");
    }
    // If we're on the favorites tab, rebuild
    if (state.activeCat==="favorites") buildEmojiGrid(emojiSearch?.value||"");
    return;
  }

  // ── Category tab ──
  const tab=e.target.closest(".emoji-cat-btn");
  if (tab) {
    state.activeCat=tab.dataset.cat;
    $$(".emoji-cat-btn").forEach(t=>t.classList.toggle("active",t.dataset.cat===state.activeCat));
    buildEmojiGrid(emojiSearch?.value||"");
    return;
  }

  // ── Emoji insert ──
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

document.addEventListener("click",e=>{
  if (e.target.closest("#cmd-autocomplete")||e.target.closest("#composer-input")) return;
  hideCmdAc();
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
   SLASH COMMAND AUTOCOMPLETE
   ===================================================================== */
const SLASH_CMD_LIST = [
  { name:"8ball",    aliases:["8b"],                desc:"Ask the magic 8-ball a question" },
  { name:"tod",      aliases:["truthordare"],        desc:"Truth or dare!" },
  { name:"truth",    aliases:["t"],                  desc:"Get a truth question" },
  { name:"dare",     aliases:["d"],                  desc:"Get a dare" },
  { name:"joke",     aliases:["j"],                  desc:"Tell a random joke" },
  { name:"fortune",  aliases:["f"],                  desc:"Get a fortune" },
  { name:"advice",   aliases:["a"],                  desc:"Random piece of advice" },
  { name:"coinflip", aliases:["cf","flip"],          desc:"Flip a coin" },
  { name:"roll",     aliases:["r","dice"],           desc:"Roll dice — e.g. /roll 2d6" },
  { name:"ship",     aliases:["s"],                  desc:"Ship two names — /ship a b" },
  { name:"tip",      aliases:["loadingtip"],         desc:"Show a random tip" },
  { name:"quote",    aliases:["q"],                  desc:"Show a random quote" },
  { name:"shrug",    aliases:[],                     desc:"Send a shrug ¯\\_(ツ)_/¯" },
  { name:"help",     aliases:["h"],                  desc:"List all commands" },
];

let _cmdAcItems=[], _cmdAcIndex=-1;

function updateCmdAutocomplete() {
  const ac=$("#cmd-autocomplete"); if (!ac) return;
  const val=composer.value;
  const pos=composer.selectionStart;
  if (pos!==val.length) { hideCmdAc(); return; } // only show if cursor at end
  const match=val.match(/^\/([a-zA-Z0-9_]*)$/);
  if (!match) { hideCmdAc(); return; }
  const q=match[1].toLowerCase();
  _cmdAcItems=SLASH_CMD_LIST.filter(c=>
    c.name.startsWith(q)||c.aliases.some(a=>a.startsWith(q))
  ).slice(0,8);
  if (!_cmdAcItems.length) { hideCmdAc(); return; }
  _cmdAcIndex=0;
  ac.innerHTML=_cmdAcItems.map((c,i)=>`
    <div class="cmd-ac-item${i===0?" active":""}" data-cmd-index="${i}">
      <span class="cmd-ac-slash">/</span>
      <span class="cmd-ac-name">${escapeHtml(c.name)}</span>
      <span class="cmd-ac-desc">${escapeHtml(c.desc)}</span>
    </div>`).join("");
  ac.classList.remove("hidden");
}

function hideCmdAc() {
  const ac=$("#cmd-autocomplete"); if(ac) ac.classList.add("hidden");
  _cmdAcItems=[]; _cmdAcIndex=-1;
}

function insertCmdAcItem(idx) {
  if (idx<0||idx>=_cmdAcItems.length) return;
  const cmd=_cmdAcItems[idx];
  composer.value="/"+cmd.name+" ";
  composer.selectionStart=composer.selectionEnd=composer.value.length;
  hideCmdAc(); updateSendBtn(); composer.focus();
}

function updateCmdAcHighlight() {
  $$(".cmd-ac-item").forEach((el,i)=>el.classList.toggle("active",i===_cmdAcIndex));
  document.querySelector(".cmd-ac-item.active")?.scrollIntoView({block:"nearest"});
}

// Click on cmd autocomplete
document.addEventListener("click",e=>{
  const item=e.target.closest(".cmd-ac-item");
  if (!item) return;
  insertCmdAcItem(+item.dataset.cmdIndex);
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

  // Banner — for own profile always use the live state value (avoids cache desync)
  const bannerColor=isSelf ? (state.bannerColor||null) : (profile.bannerColor||null);
  const bannerEl=$("#profile-card-banner");
  if (bannerEl) {
    if (bannerColor) {
      // Single hex = solid; "c1,c2" = gradient
      bannerEl.style.background=bannerColor.includes(",")
        ?`linear-gradient(135deg,${bannerColor})`
        : bannerColor;
    } else {
      bannerEl.style.background="linear-gradient(135deg,var(--c-input-2),var(--c-rail))";
    }
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
  } else if (isPrivate) {
    // Private account: only show Add Friend (no message button until friended)
    if (!hasPendingOut)
      actionsHtml=`<button class="btn-primary" data-pc-action="add-friend" data-pc-uid="${escapeHtml(uid)}">Add Friend</button>`;
    else
      actionsHtml=`<span style="font-size:12px;color:var(--t-muted);">Request sent — profile visible once accepted</span>`;
  } else {
    if (!isFriend&&!hasPendingOut)
      actionsHtml+=`<button class="btn-primary" data-pc-action="add-friend" data-pc-uid="${escapeHtml(uid)}">Add Friend</button>`;
    else if (hasPendingOut)
      actionsHtml+=`<span style="font-size:12px;color:var(--t-muted);">Request sent</span>`;
    if (isFriend) actionsHtml+=`<button class="btn-ghost" data-pc-action="message" data-pc-uid="${escapeHtml(uid)}">Message</button>`;
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
  // Silent typing mode — don't broadcast typing indicator to others
  if (!state.silentTyping) {
    if (!_typingWritten) {
      _typingWritten=true;
      setDoc(doc(db,"chats",state.activeChatId,"typing",state.user.uid),
        {name:state.user.displayName, uid:state.user.uid, ts:serverTimestamp()}).catch(()=>{});
    }
    clearTimeout(_typingTimer);
    _typingTimer=setTimeout(clearTypingIndicator, 3000);
  }
  // Auto-dismiss the unread divider when the user starts typing
  const divider=$("#messages")?.querySelector("#unread-divider-bar");
  if (divider) {
    const cid=state.activeChatId;
    if (cid) delete state.lastReadMarker[cid];
    divider.remove();
    state._unreadDisplayCount=0;
    updateJumpBtn();
  }
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

const GIF_CATEGORIES=[
  {id:"favorites",  label:"⭐ Saved"},
  {id:"trending",   label:"Trending"},
  {id:"reactions",  label:"Reactions"},
  {id:"memes",      label:"Memes"},
  {id:"gaming",     label:"Gaming"},
  {id:"animals",    label:"Animals"},
  {id:"sports",     label:"Sports"},
  {id:"anime",      label:"Anime"},
  {id:"love",       label:"Love"},
];
let _gifActiveCat="trending";

async function fetchGifs(query, isTrending=false) {
  try {
    const base=isTrending
      ? `https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=30&contentfilter=high`
      : `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=30&contentfilter=high`;
    const r=await fetch(base);
    const d=await r.json();
    return d.results||[];
  } catch(e){ console.error("GIF:",e); return []; }
}

function _gifCellHtml(insertUrl, previewUrl, title) {
  const isFav = !!state.favGifs[insertUrl];
  return `<button class="gif-cell" data-gif-url="${escapeHtml(insertUrl)}"
    data-gif-preview="${escapeHtml(previewUrl)}" data-gif-title="${escapeHtml(title)}"
    title="${escapeHtml(title)}">
    <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(title||"GIF")}" loading="lazy" />
    <button class="gif-fav-btn${isFav?" active":""}" data-fav-url="${escapeHtml(insertUrl)}"
      title="${isFav?"Remove from saved":"Save GIF"}">♥</button>
  </button>`;
}

function renderGifGrid(results) {
  const grid=$("#gif-grid"); if (!grid) return;
  if (!results.length) { grid.innerHTML=`<p class="gif-hint">No GIFs found — try a different search.</p>`; return; }
  grid.innerHTML=results.map(r=>{
    const media=r.media?.[0];
    const previewUrl=media?.tinygif?.url||media?.gif?.url||"";
    const insertUrl =media?.gif?.url||media?.tinygif?.url||"";
    if (!previewUrl) return "";
    return _gifCellHtml(insertUrl, previewUrl, r.title||"");
  }).filter(Boolean).join("");
}

function renderFavGifGrid() {
  const grid=$("#gif-grid"); if (!grid) return;
  const favs=Object.values(state.favGifs);
  if (!favs.length) { grid.innerHTML=`<p class="gif-hint">No saved GIFs yet — hover a GIF and click ♥ to save it.</p>`; return; }
  grid.innerHTML=favs.map(f=>_gifCellHtml(f.url, f.previewUrl||f.url, f.title||"")).join("");
}

async function loadGifCategory(cat) {
  _gifActiveCat=cat;
  $$(".gif-cat-btn").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat));
  const grid=$("#gif-grid");
  if (cat==="favorites") { renderFavGifGrid(); return; }
  if (grid) grid.innerHTML=`<p class="gif-hint">Loading…</p>`;
  const q=cat==="trending"?"":cat;
  const results=await fetchGifs(q, cat==="trending");
  renderGifGrid(results);
}

// Build category tabs into the picker (called once when GIF picker opens first time)
function initGifCategoryTabs() {
  const bar=$("#gif-cats"); if (!bar||bar.dataset.init) return;
  bar.dataset.init="1";
  bar.innerHTML=GIF_CATEGORIES.map(c=>`
    <button class="gif-cat-btn${c.id===_gifActiveCat?" active":""}" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>
  `).join("");
  bar.addEventListener("click", e=>{
    const btn=e.target.closest(".gif-cat-btn"); if (!btn) return;
    const q=$("#gif-search-input"); if (q) q.value="";
    loadGifCategory(btn.dataset.cat);
  });
}

// GIF picker toggle
let gifOpen=false;
$("#gif-btn")?.addEventListener("click", async ()=>{
  const picker=$("#gif-picker");
  if (!picker) return;
  gifOpen=!gifOpen;
  if (gifOpen) {
    picker.classList.remove("hidden");
    $("#emoji-picker")?.classList.add("hidden"); emojiOpen=false;
    initGifCategoryTabs();
    // Load trending only if grid is empty / has placeholder
    const grid=$("#gif-grid");
    if (!grid||grid.querySelector(".gif-hint")||!grid.children.length) {
      await loadGifCategory("trending");
    }
    $("#gif-search-input")?.focus();
  } else {
    picker.classList.add("hidden");
  }
});

// GIF search on input (debounced) + button + Enter
let _gifSearchTimer=null;
function doGifSearch() {
  const q=$("#gif-search-input")?.value.trim();
  if (!q) { loadGifCategory(_gifActiveCat); return; }
  $$(".gif-cat-btn").forEach(b=>b.classList.remove("active"));
  const grid=$("#gif-grid");
  if (grid) grid.innerHTML=`<p class="gif-hint">Searching…</p>`;
  fetchGifs(q).then(renderGifGrid);
}
$("#gif-search-input")?.addEventListener("input", ()=>{
  clearTimeout(_gifSearchTimer);
  _gifSearchTimer=setTimeout(doGifSearch, 380);
});
$("#gif-search-input")?.addEventListener("keydown", e=>{ if(e.key==="Enter"){ clearTimeout(_gifSearchTimer); doGifSearch(); } });
$("#gif-search-btn")?.addEventListener("click", ()=>{ clearTimeout(_gifSearchTimer); doGifSearch(); });

// Click a GIF cell → insert URL or auto-send
document.addEventListener("click", e=>{
  // Ignore clicks on the favorite button
  if (e.target.closest(".gif-fav-btn")) return;
  const cell=e.target.closest(".gif-cell");
  if (!cell) return;
  const url=cell.dataset.gifUrl; if (!url) return;
  $("#gif-picker")?.classList.add("hidden"); gifOpen=false;
  if (state.autoSendGif && state.activeChatId) {
    // Auto-send immediately
    const c=$("#composer-input"); if (!c) return;
    const prev=c.value;
    c.value=url;
    sendCurrentMessage();
    c.value=prev; // restore any draft
    updateSendBtn();
  } else {
    const c=$("#composer-input"); if (!c) return;
    const start=c.selectionStart, end=c.selectionEnd;
    const sep=(c.value.trim()&&!c.value.endsWith(" "))?" ":"";
    c.value=c.value.slice(0,start)+sep+url+c.value.slice(end);
    c.focus(); updateSendBtn();
  }
});

// Close GIF picker on outside click
document.addEventListener("click", e=>{
  if (!gifOpen) return;
  if (e.target.closest("#gif-picker")||e.target.closest("#gif-btn")) return;
  $("#gif-picker")?.classList.add("hidden"); gifOpen=false;
});

// GIF Favorite button click
document.addEventListener("click", async e=>{
  const btn=e.target.closest(".gif-fav-btn"); if (!btn) return;
  e.stopPropagation();
  const url=btn.dataset.favUrl; if (!url||!state.user) return;
  const cell=btn.closest(".gif-cell");
  const previewUrl=cell?.dataset.gifPreview||url;
  const title=cell?.dataset.gifTitle||"";
  if (state.favGifs[url]) {
    // Remove
    delete state.favGifs[url];
    btn.classList.remove("active");
    btn.title="Save GIF";
    try {
      const docId=btoa(url).replace(/[^a-zA-Z0-9]/g,"").slice(0,80);
      await deleteDoc(doc(db,"users",state.user.uid,"favGifs",docId));
    } catch(_){}
    showToast("💔 Removed from saved GIFs");
    if (_gifActiveCat==="favorites") renderFavGifGrid();
  } else {
    // Add
    state.favGifs[url]={url, previewUrl, title};
    btn.classList.add("active");
    btn.title="Remove from saved";
    try {
      const docId=btoa(url).replace(/[^a-zA-Z0-9]/g,"").slice(0,80);
      await setDoc(doc(db,"users",state.user.uid,"favGifs",docId),{
        url, previewUrl, title, addedAt:serverTimestamp()
      });
    } catch(_){}
    showToast("❤️ GIF saved!");
  }
});

async function loadFavGifs() {
  if (!state.user) return;
  try {
    const snap=await getDocs(collection(db,"users",state.user.uid,"favGifs"));
    state.favGifs={};
    snap.forEach(d=>{ const data=d.data(); if(data.url) state.favGifs[data.url]=data; });
  } catch(_){}
}

async function loadFavEmojis() {
  if (!state.user) return;
  try {
    const snap=await getDocs(collection(db,"users",state.user.uid,"favEmojis"));
    state.favEmojis={};
    snap.forEach(d=>{ const data=d.data(); if(data.name) state.favEmojis[data.name]=data; });
  } catch(_){}
}


/* =====================================================================
   RIGHT-CLICK CONTEXT MENUS
   ===================================================================== */
// Convert camelCase key to data-hyphen-case so dataset.camelCase reads back correctly
function _toDataAttr(k) { return "data-"+k.replace(/[A-Z]/g,c=>"-"+c.toLowerCase()); }

function showCtxMenu(x, y, items) {
  document.getElementById("ctx-menu")?.remove();
  const menu=document.createElement("div");
  menu.id="ctx-menu";
  menu.className="ctx-menu";
  menu.innerHTML=items.map(item=>{
    if (item==="divider") return `<div class="ctx-divider"></div>`;
    const dataAttrs=Object.entries(item.data||{}).map(([k,v])=>`${_toDataAttr(k)}="${escapeHtml(String(v))}"`).join(" ");
    const keyHint=item.key?`<span class="ctx-key">${escapeHtml(item.key)}</span>`:"";
    return `<button class="ctx-item${item.danger?" danger":""}" data-ctx="${item.action}" ${dataAttrs}>${escapeHtml(item.label)}${keyHint}</button>`;
  }).join("");
  // Clamp to viewport with some breathing room
  const menuW=200, menuH=items.length*36;
  menu.style.left=Math.min(x, window.innerWidth -menuW-12)+"px";
  menu.style.top  =Math.min(y, window.innerHeight-menuH-12)+"px";
  document.body.appendChild(menu);
  setTimeout(()=>document.addEventListener("click",removeCtxMenu,{once:true}),0);
}

function removeCtxMenu() { document.getElementById("ctx-menu")?.remove(); }

// Right-click on GIF cell to favorite/unfavorite
document.addEventListener("contextmenu", async e=>{
  const gifCell=e.target.closest(".gif-cell");
  if (gifCell&&!e.target.closest(".gif-fav-btn")) {
    e.preventDefault();
    const url=gifCell.dataset.gifUrl;
    const previewUrl=gifCell.dataset.gifPreview||url;
    const title=gifCell.dataset.gifTitle||"";
    if (!url||!state.user) return;
    const isFav=!!state.favGifs[url];
    showCtxMenu(e.clientX, e.clientY, [
      {label:isFav?"💔 Remove from Saved":"❤️ Save GIF", action:"ctx-fav-gif", data:{url,previewUrl,title}},
    ]);
    return;
  }
});

// Right-click on emoji item to favorite
document.addEventListener("contextmenu", e=>{
  const emojiCell=e.target.closest(".emoji-cell");
  if (emojiCell&&!e.target.closest(".emoji-fav-btn")) {
    const name=emojiCell.title?.replace(/^:|:$/g,"")||"";
    const char=emojiCell.dataset.insert||"";
    if (!name||!state.user) return;
    e.preventDefault();
    const isFav=!!state.favEmojis[name];
    showCtxMenu(e.clientX, e.clientY, [
      {label:isFav?"💔 Remove from Favourites":"⭐ Favourite Emoji", action:"ctx-fav-emoji", data:{name,char}},
    ]);
  }
});

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
      {label:"View Profile",  action:"ctx-view-profile", data:{uid}},
    ];
    if (!isSelf) {
      items.push({label:"Message",    action:"ctx-message",    data:{uid}});
      if (!isFriend) items.push({label:"Add Friend", action:"ctx-add-friend", data:{uid}});
      items.push("divider");
      items.push({label:"Block User", action:"ctx-block", data:{uid}, danger:true});
    } else {
      items.push({label:"Edit Profile", action:"ctx-edit-profile"});
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
    const isPinned=(state.activeChat?.pinnedMessages||[]).some(p=>p.msgId===msgId);
    const items=[];
    // Own messages: reply → edit → delete first
    items.push({label:"Reply",     action:"ctx-reply",     data:{msgId}, key:"R"});
    if (isSelf) {
      items.push({label:"Edit",    action:"ctx-edit",      data:{msgId}, key:"E"});
      items.push({label:"Delete",  action:"ctx-delete",    data:{msgId}, danger:true, key:"Del"});
      items.push("divider");
    }
    items.push({label:"Copy Text", action:"ctx-copy-text", data:{msgId}, key:"C"});
    items.push({label:"Copy ID",   action:"ctx-copy-id",   data:{msgId}});
    items.push("divider");
    items.push(isPinned
      ?{label:"Unpin Message", action:"ctx-unpin", data:{msgId}}
      :{label:"Pin Message",   action:"ctx-pin",   data:{msgId}});
    if (!isSelf) {
      items.push("divider");
      items.push({label:"Report",  action:"ctx-report", data:{msgId, uid:msg.senderUid, name:msg.senderName||"User"}, danger:true});
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

  if (action==="ctx-open-dm")   { if(item.dataset.chatId) openChat(item.dataset.chatId); }
  else if (action==="ctx-close-dm") { if(item.dataset.chatId&&state.activeChatId===item.dataset.chatId) showFriendsView(); }
  else if (action==="ctx-mute-dm") {
    const cid=item.dataset.chatId; if (!cid) return;
    if (isChatMuted(cid)) {
      unmuteChat(cid);
      if (state.activeChatId===cid) updateChatMuteBtn();
      showToast("🔔 Notifications unmuted");
    } else {
      // Mute indefinitely from sidebar — user can change duration via chat header button
      muteChat(cid, -1);
      if (state.activeChatId===cid) updateChatMuteBtn();
      showToast("🔕 Muted indefinitely — open the chat to set a duration");
    }
  }
  else if (action==="ctx-view-profile") { showProfileCard(uid, e); }
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
  else if (action==="ctx-pin")    { await pinMessage(msgId); }
  else if (action==="ctx-unpin")  { await unpinMessage(msgId); }
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
  else if (action==="ctx-fav-gif") {
    const url=item.dataset.url, previewUrl=item.dataset.previewurl||item.dataset.url, title=item.dataset.title||"";
    if (!url||!state.user) return;
    if (state.favGifs[url]) {
      delete state.favGifs[url];
      const docId=btoa(url).replace(/[^a-zA-Z0-9]/g,"").slice(0,80);
      await deleteDoc(doc(db,"users",state.user.uid,"favGifs",docId)).catch(()=>{});
      showToast("💔 Removed from saved GIFs");
    } else {
      state.favGifs[url]={url, previewUrl, title};
      const docId=btoa(url).replace(/[^a-zA-Z0-9]/g,"").slice(0,80);
      await setDoc(doc(db,"users",state.user.uid,"favGifs",docId),{url,previewUrl,title,addedAt:serverTimestamp()});
      showToast("❤️ GIF saved!");
    }
  }
  else if (action==="ctx-fav-emoji") {
    const name=item.dataset.name, char=item.dataset.char||"";
    if (!name||!state.user) return;
    if (state.favEmojis[name]) {
      delete state.favEmojis[name];
      await deleteDoc(doc(db,"users",state.user.uid,"favEmojis",name)).catch(()=>{});
      showToast("💔 Removed from favourites");
    } else {
      state.favEmojis[name]={name,char};
      await setDoc(doc(db,"users",state.user.uid,"favEmojis",name),{name,char,addedAt:serverTimestamp()});
      showToast("⭐ Emoji saved!");
    }
  }
});


/* =====================================================================
   DELETE MESSAGE
   ===================================================================== */
function deleteMessage(msgId) {
  const msg=state.messages.find(m=>m.id===msgId);
  if (!msg||msg.senderUid!==state.user?.uid) return;
  showConfirm("Delete this message?", async ()=>{
    try {
      await deleteDoc(doc(db,"chats",state.activeChatId,"messages",msgId));
      showToast("Message deleted.");
    } catch(err){ showToast("Delete failed: "+err.message); }
  }, { title:"Delete Message", yesLabel:"Delete", danger:true });
}


/* =====================================================================
   BLOCKING
   ===================================================================== */
function blockUser(uid) {
  if (!uid||uid===state.user?.uid) return;
  showConfirm("Block this user? Their messages will be hidden from you.", async ()=>{
    try {
      await updateDoc(doc(db,"users",state.user.uid),{ blockedUsers:arrayUnion(uid) });
      state.blockedUsers.add(uid);
      renderMessages();
      showToast("User blocked.");
    } catch(err){ showToast("Block failed: "+err.message); }
  }, { title:"Block User", yesLabel:"Block", danger:true });
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
   IN-CHAT MESSAGE SEARCH
   ===================================================================== */
let _chatSearchMatches=[], _chatSearchIdx=0;

function openChatSearch() {
  const bar=$("#chat-search-bar"); if (!bar) return;
  bar.classList.remove("hidden");
  const inp=$("#chat-search-input");
  if (inp) { inp.focus(); inp.select(); }
}

function closeChatSearch() {
  const bar=$("#chat-search-bar"); if (!bar) return;
  bar.classList.add("hidden");
  $$(".msg-search-match").forEach(el=>el.classList.remove("msg-search-match","msg-search-focus"));
  _chatSearchMatches=[]; _chatSearchIdx=0;
  const count=$("#chat-search-count"); if (count) count.textContent="";
}

function runChatSearch(q) {
  $$(".msg-search-match").forEach(el=>el.classList.remove("msg-search-match","msg-search-focus"));
  _chatSearchMatches=[]; _chatSearchIdx=0;
  const count=$("#chat-search-count");
  if (!q.trim()) { if (count) count.textContent=""; return; }
  const ql=q.toLowerCase();
  const wrap=$("#messages"); if (!wrap) return;
  wrap.querySelectorAll(".message-group,.msg-followup").forEach(el=>{
    const body=el.querySelector(".msg-body");
    if (!body) return;
    if (body.textContent.toLowerCase().includes(ql)) {
      el.classList.add("msg-search-match");
      _chatSearchMatches.push(el);
    }
  });
  if (!_chatSearchMatches.length) { if (count) count.textContent="No results"; return; }
  focusChatSearchMatch(0);
}

function focusChatSearchMatch(idx) {
  $$(".msg-search-focus").forEach(el=>el.classList.remove("msg-search-focus"));
  if (!_chatSearchMatches.length) return;
  _chatSearchIdx=((idx%_chatSearchMatches.length)+_chatSearchMatches.length)%_chatSearchMatches.length;
  const el=_chatSearchMatches[_chatSearchIdx];
  if (el) { el.classList.add("msg-search-focus"); el.scrollIntoView({behavior:"smooth",block:"center"}); }
  const count=$("#chat-search-count");
  if (count) count.textContent=`${_chatSearchIdx+1} / ${_chatSearchMatches.length}`;
}

// Ctrl+F opens search
document.addEventListener("keydown", e=>{
  if ((e.ctrlKey||e.metaKey)&&e.key==="f"&&state.activeChatId) {
    e.preventDefault(); openChatSearch();
  }
});

$("#chat-search-btn")?.addEventListener("click", openChatSearch);
$("#chat-search-close")?.addEventListener("click", closeChatSearch);
$("#chat-search-input")?.addEventListener("input", e=>runChatSearch(e.target.value));
$("#chat-search-input")?.addEventListener("keydown", e=>{
  if (e.key==="Enter") {
    e.preventDefault();
    if (e.shiftKey) focusChatSearchMatch(_chatSearchIdx-1);
    else focusChatSearchMatch(_chatSearchIdx+1);
  }
  if (e.key==="Escape") closeChatSearch();
});
$("#chat-search-prev")?.addEventListener("click", ()=>focusChatSearchMatch(_chatSearchIdx-1));
$("#chat-search-next")?.addEventListener("click", ()=>focusChatSearchMatch(_chatSearchIdx+1));


/* =====================================================================
   MESSAGE PINNING
   ===================================================================== */
async function pinMessage(msgId) {
  const chatId=state.activeChatId; if (!chatId) return;
  const msg=state.messages.find(m=>m.id===msgId); if (!msg) return;
  const pins=[...(state.activeChat?.pinnedMessages||[])];
  if (pins.some(p=>p.msgId===msgId)) { showToast("Already pinned"); return; }
  if (pins.length>=50)               { showToast("Max 50 pinned messages"); return; }
  pins.push({
    msgId,
    text:(msg.text||"").slice(0,200),
    senderName:msg.senderName||"User",
    senderUid:msg.senderUid,
    pinnedAt:Date.now(),
    pinnedByUid:state.user.uid
  });
  try {
    await updateDoc(doc(db,"chats",chatId),{pinnedMessages:pins});
    // Send a system message like Discord — "X pinned a message."
    await addDoc(collection(db,"chats",chatId,"messages"),{
      type:"pin",
      pinnedMsgId:msgId,
      text:"pinned a message.",
      senderUid:state.user.uid,
      senderName:state.user.displayName||state.user.username||"Someone",
      senderPhoto:state.user.photoURL||null,
      createdAt:serverTimestamp()
    });
    showToast("📌 Message pinned");
  } catch(err){ showToast("Pin failed: "+err.message); }
}

async function unpinMessage(msgId) {
  const chatId=state.activeChatId; if (!chatId) return;
  const pins=(state.activeChat?.pinnedMessages||[]).filter(p=>p.msgId!==msgId);
  try {
    await updateDoc(doc(db,"chats",chatId),{pinnedMessages:pins});
    showToast("📌 Message unpinned");
    renderPinsPanel();
  } catch(err){ showToast("Unpin failed: "+err.message); }
}

function showPinsPanel() {
  const panel=$("#pins-panel"); if (!panel) return;
  panel.classList.remove("hidden");
  renderPinsPanel();
}

function hidePinsPanel() { $("#pins-panel")?.classList.add("hidden"); }

function renderPinsPanel() {
  const body=$("#pins-panel-body"); if (!body) return;
  const pins=[...(state.activeChat?.pinnedMessages||[])].reverse();
  if (!pins.length) {
    body.innerHTML=`<p class="pins-empty">No pinned messages yet.<br><span style="font-size:12px;color:var(--t-muted)">Right-click a message to pin it.</span></p>`;
    return;
  }
  body.innerHTML=pins.map(p=>{
    const preview=(p.text||"(attachment)").slice(0,120)+(p.text?.length>120?"…":"");
    return `<div class="pin-item">
      <div class="pin-item-content">
        <div class="pin-item-author">📌 ${escapeHtml(p.senderName)}</div>
        <div class="pin-item-text">${escapeHtml(preview)}</div>
      </div>
      <div class="pin-item-actions">
        <button class="icon-btn" data-pin-jump="${escapeHtml(p.msgId)}" title="Jump to message">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8l7 4-7 4z"/></svg>
        </button>
        <button class="icon-btn" style="color:var(--t-muted)" data-pin-remove="${escapeHtml(p.msgId)}" title="Unpin">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>`;
  }).join("");
}

// Pins panel toggle + delegation
$("#chat-pins-btn")?.addEventListener("click", ()=>{
  const panel=$("#pins-panel"); if (!panel) return;
  if (panel.classList.contains("hidden")) showPinsPanel(); else hidePinsPanel();
});
$("#pins-panel-close")?.addEventListener("click", hidePinsPanel);

document.addEventListener("click", e=>{
  const jumpBtn=e.target.closest("[data-pin-jump]");
  if (jumpBtn) {
    e.preventDefault();
    const msgId=jumpBtn.dataset.pinJump;
    const msgEl=$("#messages")?.querySelector(`[data-msg-id="${CSS.escape(msgId)}"]`);
    if (msgEl) {
      hidePinsPanel();
      msgEl.scrollIntoView({behavior:"smooth",block:"center"});
      msgEl.classList.add("msg-jump-highlight");
      setTimeout(()=>msgEl.classList.remove("msg-jump-highlight"),1400);
    } else { showToast("Message not found in current view"); }
    return;
  }
  const removeBtn=e.target.closest("[data-pin-remove]");
  if (removeBtn) { unpinMessage(removeBtn.dataset.pinRemove); return; }
});


/* =====================================================================
   CHAT MUTE
   ===================================================================== */
function _getMutes() {
  try { return JSON.parse(localStorage.getItem("sc_mutes")||"{}"); } catch(_){ return {}; }
}
function _saveMutes(obj) {
  localStorage.setItem("sc_mutes", JSON.stringify(obj));
}
function isChatMuted(chatId) {
  if (!chatId) return false;
  const mutes = _getMutes();
  const exp = mutes[chatId];
  if (exp === undefined) return false;
  if (exp === -1) return true; // indefinite
  if (Date.now() < exp) return true;
  // Expired — clean up
  delete mutes[chatId]; _saveMutes(mutes);
  return false;
}
function muteChat(chatId, durationMs) {
  const mutes = _getMutes();
  mutes[chatId] = durationMs === -1 ? -1 : Date.now() + durationMs;
  _saveMutes(mutes);
}
function unmuteChat(chatId) {
  const mutes = _getMutes();
  delete mutes[chatId];
  _saveMutes(mutes);
}
function updateChatMuteBtn() {
  const btn = $("#chat-mute-btn"); if (!btn) return;
  const muted = isChatMuted(state.activeChatId);
  btn.classList.toggle("muted", muted);
  btn.title = muted ? "Unmute notifications" : "Mute notifications";
}

// Mute button opens a dropdown
document.addEventListener("click", e => {
  const btn = e.target.closest("#chat-mute-btn"); if (!btn) return;
  document.getElementById("mute-menu")?.remove();
  // If already muted, one-click unmute
  if (isChatMuted(state.activeChatId)) {
    unmuteChat(state.activeChatId);
    updateChatMuteBtn();
    showToast("🔔 Notifications unmuted");
    return;
  }
  // Build dropdown
  const rect = btn.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.id = "mute-menu";
  menu.className = "mute-menu";
  menu.innerHTML = `
    <div class="mute-menu-title">Mute Notifications</div>
    <button class="mute-option" data-ms="900000">🕐 15 minutes</button>
    <button class="mute-option" data-ms="3600000">🕐 1 hour</button>
    <button class="mute-option" data-ms="28800000">🕗 8 hours</button>
    <button class="mute-option" data-ms="86400000">🌙 24 hours</button>
    <button class="mute-option" data-ms="-1">🔕 Until I turn it back on</button>
  `;
  // Position below button
  menu.style.top  = (rect.bottom + 6) + "px";
  menu.style.right = (window.innerWidth - rect.right) + "px";
  document.body.appendChild(menu);
  menu.addEventListener("click", e2 => {
    const opt = e2.target.closest(".mute-option"); if (!opt) return;
    const ms = parseInt(opt.dataset.ms, 10);
    muteChat(state.activeChatId, ms);
    updateChatMuteBtn();
    const label = opt.textContent.trim();
    showToast(`🔕 Muted: ${label}`);
    menu.remove();
  });
});
// Close mute menu on outside click
document.addEventListener("click", e => {
  if (!document.getElementById("mute-menu")) return;
  if (e.target.closest("#mute-menu") || e.target.closest("#chat-mute-btn")) return;
  document.getElementById("mute-menu")?.remove();
});


/* =====================================================================
   USER PANEL AVATAR CLICK → STATUS PICKER
   ===================================================================== */
document.addEventListener("click", e=>{
  const wrap=e.target.closest("#user-panel-avatar-wrap");
  if (wrap) { e.stopPropagation(); toggleStatusPicker(wrap); }
});


/* =====================================================================
   JUMP TO LATEST BUTTON
   ===================================================================== */
function updateJumpBtn() {
  const wrap=$("#messages");
  const btn=$("#jump-latest");
  if (!wrap||!btn) return;
  const atBottom=wrap.scrollHeight-wrap.scrollTop-wrap.clientHeight<80;
  btn.classList.toggle("hidden", atBottom);
  if (atBottom) {
    // Auto-dismiss the unread divider when the user has scrolled to the bottom
    const divider=wrap.querySelector("#unread-divider-bar");
    if (divider) {
      const cid=state.activeChatId;
      if (cid) delete state.lastReadMarker[cid];
      divider.remove();
      state._unreadDisplayCount=0;
    }
  } else {
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
   SILENT TYPING TOGGLE
   ===================================================================== */
(function() {
  const btn = $("#silent-typing-btn");
  if (!btn) return;
  // Apply initial state
  if (state.silentTyping) btn.classList.add("active");
  btn.setAttribute("aria-pressed", state.silentTyping ? "true" : "false");
  btn.title = state.silentTyping
    ? "Silent typing ON — others can't see you typing (click to turn off)"
    : "Silent typing — others won't see you typing (click to enable)";

  btn.addEventListener("click", () => {
    state.silentTyping = !state.silentTyping;
    localStorage.setItem("sc_silent_typing", state.silentTyping ? "true" : "false");
    btn.classList.toggle("active", state.silentTyping);
    btn.setAttribute("aria-pressed", state.silentTyping ? "true" : "false");
    btn.title = state.silentTyping
      ? "Silent typing ON — others can't see you typing (click to turn off)"
      : "Silent typing — others won't see you typing (click to enable)";
    // Clear any in-progress typing indicator if toggling off
    if (!state.silentTyping && _typingWritten) clearTypingIndicator();
    showToast(state.silentTyping ? "🔇 Silent typing on" : "💬 Silent typing off", 2000);
  });
})();


/* =====================================================================
   ESC KEY — close any open overlay
   ===================================================================== */
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  let closed = false;
  // Context menu
  if (document.getElementById("ctx-menu")) { removeCtxMenu(); closed = true; }
  // Emoji picker
  if (emojiOpen) {
    $("#emoji-picker")?.classList.add("hidden"); emojiOpen = false; closed = true;
  }
  // GIF picker
  if (gifOpen) {
    $("#gif-picker")?.classList.add("hidden"); gifOpen = false; closed = true;
  }
  // Status picker
  if (document.getElementById("status-picker")) {
    document.getElementById("status-picker").remove(); closed = true;
  }
  // Pins panel
  const pinsPanel = $("#pins-panel");
  if (pinsPanel && !pinsPanel.classList.contains("hidden")) {
    hidePinsPanel(); closed = true;
  }
  // Profile card
  const profileCard = $("#profile-card");
  if (profileCard && !profileCard.classList.contains("hidden")) {
    profileCard.classList.add("hidden"); closed = true;
  }
  // In-chat search
  const searchBar = $("#chat-search-bar");
  if (searchBar && !searchBar.classList.contains("hidden")) {
    closeChatSearch(); closed = true;
  }
  // Modals (close top-most open modal)
  if (!closed) {
    const openModal = document.querySelector(".modal:not(.hidden)");
    if (openModal) {
      // Don't close profile-setup modal (required flow)
      if (openModal.id !== "profile-setup-modal" && openModal.id !== "tos-overlay") {
        closeModal(openModal.id);
      }
    }
  }
});


/* =====================================================================
   AUTO-FOCUS COMPOSER ON TYPING
   Captures printable keypresses when no input/textarea/contenteditable
   is focused, and routes them to the composer.
   ===================================================================== */
document.addEventListener("keydown", e => {
  // Ignore: modifier keys, function keys, special keys
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return; // not a printable char
  // Ignore if already in an editable element
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
  // Only route if chat view is active and composer exists
  const composer = $("#composer-input");
  if (!composer || composer.closest(".hidden")) return;
  if (!state.activeChatId) return;
  composer.focus();
  // The keypress will naturally land in the now-focused composer
});


/* =====================================================================
   TERMS OF USE — show on first visit, block everything until agreed
   ===================================================================== */
(function initToS() {
  const overlay=$("#tos-overlay");
  if (!overlay) return;
  if (localStorage.getItem("sc_tos_v1")==="agreed") {
    overlay.remove(); return;
  }
  // Block interaction with the rest of the page
  overlay.classList.remove("hidden");
  overlay.style.display="grid";
  $("#tos-agree-btn")?.addEventListener("click", ()=>{
    localStorage.setItem("sc_tos_v1","agreed");
    overlay.style.animation="none";
    overlay.style.opacity="0";
    overlay.style.transition="opacity .3s";
    setTimeout(()=>overlay.remove(), 320);
  });
})();
