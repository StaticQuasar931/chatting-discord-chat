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
  { id: "special",   label: "⭐" },  // moved next to favorites
  { id: "all",       label: "★"  },
  { id: "smileys",   label: "😄" },
  { id: "gestures",  label: "👍" },
  { id: "hearts",    label: "❤️" },
  { id: "nature",    label: "🌿" },
  { id: "food",      label: "🍕" },
  { id: "animals",   label: "🐶" },
  { id: "objects",   label: "💻" },
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
  messageCache: {},      // chatId → messages array (keeps messages loaded between clicks)
  unreadCounts: {},      // chatId → number of unread messages since last open
  sidebarTyping: {},     // chatId → array of typing names (for live "typing…" in sidebar)
  sidebarTypingUnsubs: {}, // chatId → onSnapshot unsubscribe
  chatScrolledInitial: new Set(), // chatIds that have had their initial scroll done
  silentTyping:      localStorage.getItem("sc_silent_typing") === "true",
  showLastActive:    localStorage.getItem("sc_show_last_active") === "true",
  pfpAnimate:        (function(){
    const v = localStorage.getItem("sc_pfp_animate");
    // Migrate legacy "messages-only" → "sidebar-only" (semantics flipped to reduce spam)
    if (v === "messages-only") { localStorage.setItem("sc_pfp_animate","sidebar-only"); return "sidebar-only"; }
    return v || "always";
  })(), // "always"|"sidebar-only"|"never"
  anonInSchoolChat:  localStorage.getItem("sc_anon_school") === "true",
  autoScrollNew:     localStorage.getItem("sc_auto_scroll") !== "false", // default ON
  snoozedUsers:      new Set(JSON.parse(localStorage.getItem("sc_snoozed_users")||"[]")),
  autoSendGif:       localStorage.getItem("sc_autosend_gif") === "true",
  dblClickReact:     localStorage.getItem("sc_dblclick_react") === "true",
  dblClickEmoji:     localStorage.getItem("sc_dblclick_emoji") || "👍",
  dblClickMode:      localStorage.getItem("sc_dblclick_mode") || "emoji", // "emoji" | "picker"
  compactMode:       localStorage.getItem("sc_compact") === "true",
  textSize:          parseFloat(localStorage.getItem("sc_text_size")) || 15,
  customStatus:      localStorage.getItem("sc_custom_status")||"",
  gifFreezeDefault:  localStorage.getItem("sc_gif_freeze_default") === "true",
  gifKeepFrozen:     localStorage.getItem("sc_gif_keep_frozen") === "true",
  gifAutoFreeze:     localStorage.getItem("sc_gif_autofreeze") === "true",
  // Set of GIF src URLs that the user has frozen (persists when gifKeepFrozen is on)
  frozenGifs: new Set(JSON.parse(localStorage.getItem("sc_frozen_gifs")||"[]")),
  avatarPosition:    localStorage.getItem("sc_avatar_pos") || "center center",
  favGifs: {},   // gifUrl → { url, previewUrl, title }
  favEmojis: {}, // emojiName → { name, char }
};

// Apply theme, compact mode, and text size before anything renders
(function initTheme() {
  document.body.dataset.theme = state.theme;
  if (state.compactMode) document.body.classList.add("compact-mode");
  if (state.textSize !== 15) document.body.style.setProperty("--msg-font-size", state.textSize + "px");
})();

// CSS custom properties set by the custom theme (must be cleared when switching away)
const _CUSTOM_THEME_PROPS = [
  "--c-rail","--c-sidebar","--c-main","--c-input","--c-input-2",
  "--c-overlay","--c-border","--c-border-2",
  "--c-accent","--c-accent-hover","--c-accent-soft","--shadow-accent"
];

function applyTheme(t) {
  // Clear inline CSS vars from the previous custom theme before switching
  if (t !== "custom") {
    _CUSTOM_THEME_PROPS.forEach(p => document.body.style.removeProperty(p));
  }
  state.theme = t;
  document.body.dataset.theme = t;
  localStorage.setItem("sc_theme", t);
  if (t==="custom") _applyCustomThemeColors();
}

// Apply custom theme from stored/picker colors
function _applyCustomThemeColors() {
  const bg      = localStorage.getItem("sc_custom_bg")      || ($("#tc-bg")?.value)      || "#1a1b1e";
  const sidebar = localStorage.getItem("sc_custom_sidebar") || ($("#tc-sidebar")?.value) || "#131416";
  const accent  = localStorage.getItem("sc_custom_accent")  || ($("#tc-accent")?.value)  || "#4f7cff";
  const root = document.body;
  // Derive related shades from the main bg
  root.style.setProperty("--c-rail",    _darken(bg, 8));
  root.style.setProperty("--c-sidebar", sidebar);
  root.style.setProperty("--c-main",    bg);
  root.style.setProperty("--c-input",   _lighten(bg, 6));
  root.style.setProperty("--c-input-2", _darken(bg, 4));
  root.style.setProperty("--c-overlay", _darken(bg, 12));
  root.style.setProperty("--c-border",  _lighten(bg, 12));
  root.style.setProperty("--c-border-2",_lighten(bg, 6));
  root.style.setProperty("--c-accent",        accent);
  root.style.setProperty("--c-accent-hover",  _darken(accent, 12));
  root.style.setProperty("--c-accent-soft",   accent+"28");
  root.style.setProperty("--shadow-accent",   `0 4px 16px ${accent}44`);
}

// Simple hex color manipulators
function _hexToRgb(h) {
  h=h.replace("#","");
  if (h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
}
function _rgbToHex(r,g,b){return"#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
function _lighten(hex,amt){ const [r,g,b]=_hexToRgb(hex); return _rgbToHex(r+amt,g+amt,b+amt); }
function _darken(hex,amt) { return _lighten(hex,-amt); }

// Wire custom theme color pickers (live update via hidden inputs)
document.addEventListener("input", e=>{
  if (!["tc-bg","tc-sidebar","tc-accent"].includes(e.target.id)) return;
  if (state.theme!=="custom") return;
  localStorage.setItem("sc_custom_"+e.target.id.slice(3), e.target.value);
  _applyCustomThemeColors();
});
/* =====================================================================
   DOM HELPERS
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);


/* ---------- Per-chat color picker ---------- */
function _showChatColorPicker(chatId, x, y) {
  document.getElementById("chat-color-popover")?.remove();
  const presets = ["#4f7cff","#06b6d4","#10b981","#84cc16","#eab308","#f97316","#ef4444","#ec4899","#a855f7","#8b5cf6","#6b7280","#475569"];
  const cur = localStorage.getItem(`sc_chat_color_${chatId}`)||"";
  const pop = document.createElement("div");
  pop.id = "chat-color-popover";
  pop.className = "ic-color-popover";
  pop.style.left = Math.min(window.innerWidth-260, x) + "px";
  pop.style.top  = Math.min(window.innerHeight-200, y) + "px";
  pop.innerHTML = `
    <div style="font-size:11px;color:var(--t-muted);font-weight:700;margin-bottom:6px;">Chat color</div>
    <div class="ic-color-grid" style="grid-template-columns:repeat(6,1fr);">
      ${presets.map(c=>`<div class="ic-color-cell" style="background:${c}" data-cc="${c}"></div>`).join("")}
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button class="btn-secondary" data-cc-clear style="flex:1;font-size:12px;">Reset to default</button>
    </div>
  `;
  document.body.appendChild(pop);
  pop.addEventListener("click", e=>{
    const cell=e.target.closest("[data-cc]");
    if (cell) {
      const c=cell.dataset.cc;
      localStorage.setItem(`sc_chat_color_${chatId}`, c);
      if (state.activeChatId===chatId) {
        document.body.style.setProperty("--c-chat-accent", c);
        document.body.classList.add("has-chat-accent");
      }
      showToast("Chat color set ✓");
      pop.remove(); return;
    }
    if (e.target.closest("[data-cc-clear]")) {
      localStorage.removeItem(`sc_chat_color_${chatId}`);
      if (state.activeChatId===chatId) {
        document.body.style.removeProperty("--c-chat-accent");
        document.body.classList.remove("has-chat-accent");
      }
      showToast("Chat color reset");
      pop.remove();
    }
  });
  // Close on outside click
  setTimeout(()=>document.addEventListener("click", function _close(e){
    if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener("click", _close); }
  }), 0);
}

/* ---------- In-app color picker ---------- */
const IC_PRESET_COLORS = [
  // Reds / pinks
  "#ef4444","#f43f5e","#ec4899","#d946ef","#a855f7","#8b5cf6","#6366f1","#3b82f6",
  // Blues / cyans / greens
  "#0ea5e9","#06b6d4","#14b8a6","#10b981","#22c55e","#84cc16","#eab308","#f59e0b",
  // Oranges / browns / grays
  "#f97316","#ea580c","#7c2d12","#1f2937","#374151","#6b7280","#9ca3af","#e5e7eb",
  // Special
  "#000000","#1a1b1e","#131416","#23252a","#4f7cff","#9333ea","#fbbf24","#ffffff"
];

let _icCurrentTarget = null; // id suffix: bg|sidebar|accent

function _icRenderGrid() {
  const grid = document.getElementById("ic-color-grid"); if (!grid) return;
  if (grid.dataset.populated==="1") return;
  grid.innerHTML = IC_PRESET_COLORS.map(c=>`<div class="ic-color-cell" style="background:${c}" data-ic-color="${c}" title="${c}"></div>`).join("");
  grid.dataset.populated="1";
}
// Render lazily on first popover open (avoid running before $ is defined)
document.addEventListener("DOMContentLoaded", _icRenderGrid);

function _icApplyColor(target, color) {
  // target = "bg" | "sidebar" | "accent"
  const hex = color.toLowerCase();
  const inp = $(`#tc-${target}`);
  const sw  = $(`#tc-${target}-swatch`);
  const txt = $(`#tc-${target}-text`);
  if (inp) inp.value = hex;
  if (sw)  sw.style.background = hex;
  if (txt) txt.textContent = hex;
  localStorage.setItem("sc_custom_"+target, hex);
  if (state.theme === "custom") _applyCustomThemeColors();
  _markSettingsDirty?.();
}

// Open popover when clicking a color button
document.addEventListener("click", e=>{
  const btn = e.target.closest(".ic-color-btn");
  if (btn) {
    e.stopPropagation();
    _icCurrentTarget = btn.dataset.icTarget;
    _icRenderGrid(); // ensure populated
    const pop = $("#ic-color-popover");
    const cur = $(`#tc-${_icCurrentTarget}`)?.value || "#000000";
    $("#ic-color-hex").value = cur;
    // Position popover near the button
    const rect = btn.getBoundingClientRect();
    pop.style.left = Math.min(window.innerWidth-260, rect.left) + "px";
    pop.style.top  = (rect.bottom + 6) + "px";
    pop.classList.remove("hidden");
    return;
  }
  // Click on a preset cell
  const cell = e.target.closest(".ic-color-cell");
  if (cell && _icCurrentTarget) {
    _icApplyColor(_icCurrentTarget, cell.dataset.icColor);
    $("#ic-color-popover").classList.add("hidden");
    return;
  }
  // Apply hex
  if (e.target.id === "ic-color-apply") {
    let hex = $("#ic-color-hex").value.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (/^#[0-9a-f]{6}$/i.test(hex) && _icCurrentTarget) {
      _icApplyColor(_icCurrentTarget, hex);
      $("#ic-color-popover").classList.add("hidden");
    } else {
      showToast("Enter a valid hex like #4f7cff");
    }
    return;
  }
  // Click outside the popover → close
  const pop = $("#ic-color-popover");
  if (pop && !pop.classList.contains("hidden") && !pop.contains(e.target) && !e.target.closest(".ic-color-btn")) {
    pop.classList.add("hidden");
  }
});

// Hex input: live update on Enter
$("#ic-color-hex")?.addEventListener("keydown", e=>{
  if (e.key === "Enter") { e.preventDefault(); $("#ic-color-apply")?.click(); }
});


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

// Resolve a @mention username → uid by scanning known users (self, friends, userCache).
// Returns uid string, or null if no match found.
function _resolveUsername(name) {
  const lc = name.toLowerCase();
  // Check self
  if (state.user && (state.user.username||"").toLowerCase() === lc) return state.user.uid;
  // Check friends list (displayName stores the username)
  const friend = state.friends.find(f=>(f.displayName||"").toLowerCase()===lc);
  if (friend) return friend.uid;
  // Check userCache (for group-chat participants not in friends list)
  for (const [uid, profile] of Object.entries(state.userCache)) {
    if ((profile.username||profile.displayName||"").toLowerCase()===lc) return uid;
  }
  return null;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* =====================================================================
   AUTOFLAG SYSTEM
   Silently logs messages containing concerning phrases to Firestore.
   ===================================================================== */
const _AUTOFLAG_PATTERNS = [
  // Threats / violence
  { pattern: /\b(i(?:'?ll|m going to|'m gonna))\s+(kill|hurt|stab|shoot|beat up|fight)\s+(you|u|him|her|them)\b/i, category: "threat" },
  { pattern: /\bkill\s+your(self|selves)\b/i, category: "threat" },
  { pattern: /\bi\s+(want|will|gonna|going to)\s+(hurt|kill|end)\s+(my|myself|me|him|her|them)\b/i, category: "threat_self" },
  // Self-harm / crisis
  { pattern: /\b(kms|kys)\b/i, category: "self_harm" },
  { pattern: /\b(want to die|wanna die|going to (kill|end) myself|suicide|suicidal)\b/i, category: "self_harm" },
  { pattern: /\b(cutting myself|self.?harm|self.?hurt)\b/i, category: "self_harm" },
  // Doxxing / contact exchange
  { pattern: /\b(my (phone|cell|number|address|snapchat|instagram) is|text me at|dm me (on|at)|add me on)\b/i, category: "contact_share" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, category: "phone_number" },
  // Bullying / harassment
  { pattern: /\b(nobody likes you|you should (die|leave|quit)|go (kill|hurt) yourself|worthless|you're (nothing|pathetic|disgusting))\b/i, category: "bullying" },
  // Slurs — placeholder pattern (extend as needed)
  { pattern: /\b(n[i1]gg[ae3]r|f[a4]gg[o0]t)\b/i, category: "slur" },
  // Links to inappropriate sites
  { pattern: /\b(pornhub|xvideos|xnxx|chaturbate|onlyfans)\b/i, category: "nsfw_link" },
];

async function _autoFlagCheck(text, msgId, chatId, senderUid, senderName) {
  if (!text || !state.user) return;
  const lc = text.toLowerCase();
  for (const { pattern, category } of _AUTOFLAG_PATTERNS) {
    if (pattern.test(lc)) {
      try {
        await addDoc(collection(db, "Autoflag"), {
          messageId: msgId || null,
          chatId: chatId || null,
          senderUid: senderUid || state.user.uid,
          senderName: senderName || state.user.displayName || null,
          flaggedBy: state.user.uid,   // always the observer creating the document
          text,
          matchedCategory: category,
          flaggedAt: serverTimestamp(),
          reviewed: false,
        });
      } catch (_) { /* fail silently */ }
      return; // one flag per message
    }
  }
}

/* Should an animated PFP be allowed in this context?
   state.pfpAnimate: "always" | "sidebar-only" | "never"
   "sidebar-only" = animate in sidebar/headers/cards but NOT in individual messages
                    (reduces spam/movement from many message avatars).
   Backward-compat: legacy "messages-only" maps to "sidebar-only" with flipped meaning.
*/
function _shouldAnimatePfp(context) {
  const mode = state.pfpAnimate || "always";
  if (mode === "always") return true;
  if (mode === "never") return false;
  // "sidebar-only" — animate everywhere EXCEPT inside chat messages
  if (mode === "sidebar-only" || mode === "messages-only") {
    return context !== "message";
  }
  return true;
}

function avatarMarkup(displayName, photoURL, sizeClass="side-row-avatar", fallbackClass="side-row-fallback", context) {
  const initial = (displayName||"?").trim().charAt(0).toUpperCase()||"?";
  if (photoURL) {
    const isGif = /\.(gif|webp)(\?|$)/i.test(photoURL) || /tenor\.com|giphy\.com/i.test(photoURL);
    if (isGif && !_shouldAnimatePfp(context)) {
      return `<div class="${fallbackClass}" title="Animated avatar (paused)">${escapeHtml(initial)}</div>`;
    }
    // onerror fallback: swap broken image for initials so Tenor/CORS failures don't show broken icons
    const safeInitial = escapeHtml(initial).replace(/"/g, "&quot;");
    const safeFallback = escapeHtml(fallbackClass).replace(/"/g, "&quot;");
    return `<img class="${sizeClass}" src="${escapeHtml(photoURL)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='&lt;div class=&quot;${safeFallback}&quot; title=&quot;Could not load image&quot;&gt;${safeInitial}&lt;/div&gt;'" />`;
  }
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
  const personalEmoji = _getPersonalEmoji?.() || {};
  text = text.replace(/:([A-Za-z0-9_+\-]+):/g,(m,name)=>{
    let html;
    if (name==="Static") {
      html = `<img class="msg-emoji msg-emoji-static" src="${STATIC_EMOJI_URL}" alt="" />`;
    } else if (EMOJI_MAP[name]) {
      return EMOJI_MAP[name];   // plain Unicode char — safe, no URL inside
    } else if (personalEmoji[name.toLowerCase()]) {
      // Personal custom emoji — only this user has it stored, but anyone viewing the msg sees the image
      const safeUrl = personalEmoji[name.toLowerCase()].replace(/"/g,"&quot;");
      html = `<img class="msg-emoji msg-emoji-personal" src="${safeUrl}" alt=":${escapeHtml(name)}:" title=":${escapeHtml(name)}:" onerror="this.outerHTML=':${escapeHtml(name)}:'" />`;
    } else {
      return m;
    }
    emojiBlocks.push(html);
    return `\x01EB${emojiBlocks.length-1}\x01`;
  });

  // Restore code blocks BEFORE URL pass so code isn't turned into a link
  text = text.replace(/\x01IC(\d+)\x01/g,(_,i)=>`<code class="inline-code">${inlineCodes[+i]}</code>`);
  text = text.replace(/\x01CB(\d+)\x01/g,(_,i)=>`<pre class="code-block"><code>${codeBlocks[+i]}</code></pre>`);

  // @mentions — MUST run before URL pass so @ inside href attributes is never touched
  // Only wrap in a span if the username maps to a real known user.
  // @silent is a command prefix, never rendered as a highlight.
  text = text.replace(/@(\w+)/g, (match, name) => {
    if (name.toLowerCase()==="silent") return `<span class="msg-silent-badge">@silent</span>`;
    const uid = _resolveUsername(name);
    if (!uid) return `@${escapeHtml(name)}`; // not a known user — plain text
    const isMe = uid === state.user?.uid;
    return `<span class="msg-mention${isMe?" msg-mention-me":""}" data-mention="${escapeHtml(name)}" data-mention-uid="${escapeHtml(uid)}">@${escapeHtml(name)}</span>`;
  });

  // URLs → embeds or plain links.  Run safeUrl() so malformed strings never
  // produce broken href= attributes that GitHub Pages misroutes.
  // This runs AFTER emoji placeholders are in place, so img src attrs are safe.
  text = text.replace(/https?:\/\/[^\s<>"]+/g, rawUrl => {
    const url = safeUrl(rawUrl);
    if (!url) return escapeHtml(rawUrl);
    if (IMAGE_URL_RE.test(url) || GIF_CDN_RE.test(url)) {
      const isGif = /\.gif(\?|$)/i.test(url) || GIF_CDN_RE.test(url);
      if (isGif) {
        // data-gif-src stores original URL so freeze/unfreeze logic can always find it
        const freezeAttrs = state.gifFreezeDefault || state.frozenGifs.has(url)
          ? `data-autofreeze="true"` : ``;
        return `<div class="gif-embed-wrap"><img class="msg-embed-img gif-embed-live" src="${url}" alt="" ${freezeAttrs} data-gif-src="${url}" onerror="this.style.display='none'" title="Click to freeze" /><span class="gif-embed-tag">GIF</span></div>`;
      }
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
    } else if (type==="update") {
      // Rising three-note chime: warm, noticeable, not annoying
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523, ctx.currentTime);        // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime+0.12);   // E5
      osc.frequency.setValueAtTime(784, ctx.currentTime+0.24);   // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.55);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.55);
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
      _syncAutoEarnedBadges(); // write OG badge to Firestore if earned
      _updateSchoolRailVisibility(); // show "School" rail btn if eligible domain
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
   AUTO-EARNED BADGE SYNC
   Writes any auto-earned badges (OG etc.) to Firestore on every sign-in
   so they're always persisted and visible to other users.
   ===================================================================== */
async function _syncAutoEarnedBadges() {
  if (!state.user?.uid || !state.user.createdAt) return;
  try {
    const created = state.user.createdAt?.toDate
      ? state.user.createdAt.toDate()
      : new Date(state.user.createdAt);
    const autoEarned = [];
    if (created.getTime() < OG_CUTOFF_MS) autoEarned.push("og");
    if (!autoEarned.length) return;

    // Read current badges to avoid unnecessary writes
    const snap = await getDoc(doc(db,"users",state.user.uid));
    if (!snap.exists()) return;
    const cur = snap.data().badges||[];
    const missing = autoEarned.filter(b=>!cur.includes(b));
    if (!missing.length) return;

    await updateDoc(doc(db,"users",state.user.uid),{ badges: arrayUnion(...missing) });
    console.log("[badges] auto-wrote:", missing);
  } catch(e){ console.warn("[badges] sync failed:", e); }
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
  const tagEl = $("#user-panel-tag");
  if (tagEl) {
    if (state.customStatus) {
      tagEl.innerHTML = `<span class="user-panel-custom-status">${escapeHtml(state.customStatus)}</span>`;
    } else {
      tagEl.textContent = u.discriminator ? `#${u.discriminator}` : "";
    }
  }
  $("#user-panel-avatar-wrap").innerHTML = avatarMarkup(
    u.username||u.displayName, u.photoURL,
    "user-panel-avatar","user-panel-avatar-fallback"
  );
  // Apply saved avatar crop position to the user's own panel avatar
  const panelImg = $("#user-panel-avatar-wrap img");
  if (panelImg && state.avatarPosition) panelImg.style.objectPosition = state.avatarPosition;
  // Append edit overlay (camera icon) so clicking it opens avatar settings
  const existingOverlay = $("#user-panel-avatar-wrap .user-panel-avatar-edit");
  if (!existingOverlay) {
    const editBtn = document.createElement("div");
    editBtn.className = "user-panel-avatar-edit";
    editBtn.title = "Edit avatar";
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/><circle cx="18" cy="18" r="5" fill="var(--c-accent)"/><path fill="#fff" d="M17 17v-1.5h-1.5v-1H17V13h1v1.5h1.5v1H18V17z"/></svg>`;
    editBtn.addEventListener("click", e => {
      e.stopPropagation();
      openSettingsModal("account");
    });
    $("#user-panel-avatar-wrap")?.appendChild(editBtn);
  }
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
    <div class="sp-custom-status-wrap">
      <input type="text" id="sp-custom-status-input" class="sp-custom-status-input"
        placeholder="Set a custom status…" maxlength="60"
        value="${escapeHtml(state.customStatus||"")}"/>
    </div>
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
    if (e2.target.closest("#sp-custom-status-input")) return; // don't close on input click
    const opt = e2.target.closest("[data-status]");
    if (!opt) return;
    const ns = opt.dataset.status;
    state.status = ns;
    localStorage.setItem("sc_status",ns);
    updateUserPanel();
    picker.remove();
    try { await updateDoc(doc(db,"users",state.user.uid),{status:ns}); } catch(_){}
  });

  const csInput=picker.querySelector("#sp-custom-status-input");
  if (csInput) {
    csInput.addEventListener("keydown", async e=>{
      if (e.key==="Enter") {
        e.preventDefault();
        const val=csInput.value.trim();
        state.customStatus=val;
        localStorage.setItem("sc_custom_status",val);
        try { await updateDoc(doc(db,"users",state.user.uid),{customStatus:val}); } catch(_){}
        showToast(val?"Status set":"Status cleared");
        picker.remove();
        updateUserPanel();
      }
    });
    csInput.addEventListener("blur", async ()=>{
      const val=csInput.value.trim();
      if (val !== (state.customStatus||"")) {
        state.customStatus=val;
        localStorage.setItem("sc_custom_status",val);
        try { await updateDoc(doc(db,"users",state.user.uid),{customStatus:val}); } catch(_){}
        updateUserPanel();
      }
    });
  }

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
  state.messageCache={}; state.unreadCounts={};
  for (const fn of Object.values(state.sidebarTypingUnsubs)) { try { fn(); } catch(_){} }
  state.sidebarTypingUnsubs={}; state.sidebarTyping={};
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
    if (data.customStatus!==undefined) { state.customStatus=data.customStatus||""; localStorage.setItem("sc_custom_status",state.customStatus); }
    if (data.bannerColor!==undefined) state.bannerColor=data.bannerColor||null;
    if (data.isPrivate!==undefined) state.isPrivate=!!data.isPrivate;
    if (data.createdAt) state.user.createdAt=data.createdAt;
    if (data.avatarPosition) {
      state.avatarPosition=data.avatarPosition;
      localStorage.setItem("sc_avatar_pos",data.avatarPosition);
    }
    state.userCache[uid] = _augmentBadges({ ...state.user, ...data });
    applyBlockedFromProfile(data);
    updateUserPanel();
  }, err=>console.error("ownProfile:",err));

  // Start presence heartbeat
  startPresenceHeartbeat();

  // Live profile listeners for friends — key = uid, value = unsubscribe fn
  const _friendProfileUnsubs = {};
  // Register cleanup with main unsubscribers so sign-out tears them down
  state.unsubscribers.friendProfiles = ()=>{
    for (const fn of Object.values(_friendProfileUnsubs)) { try{fn();}catch(_){} }
    Object.keys(_friendProfileUnsubs).forEach(k=>delete _friendProfileUnsubs[k]);
  };

  state.unsubscribers.friendships = onSnapshot(
    query(collection(db,"friendships"),where("users","array-contains",uid)),
    async snap=>{
      const list=[];
      const seenUids=new Set();
      for (const d of snap.docs) {
        const data=d.data();
        const otherUid=data.users.find(u=>u!==uid);
        if (!otherUid) continue;
        seenUids.add(otherUid);
        // Fresh fetch (bypass cache) so status is always current
        delete state.userCache[otherUid];
        const profile=await fetchUserProfile(otherUid);
        list.push({ friendshipId:d.id, uid:otherUid,
          displayName:profile?.username||profile?.displayName||"Unknown",
          discriminator:profile?.discriminator||null, photoURL:profile?.photoURL||null });
        // Set up live listener for this friend's profile if not already listening
        if (!_friendProfileUnsubs[otherUid]) {
          _friendProfileUnsubs[otherUid] = onSnapshot(doc(db,"users",otherUid), pSnap=>{
            if (!pSnap.exists()) return;
            state.userCache[otherUid]=_augmentBadges({...pSnap.data(), uid:otherUid});
            renderFriendsList();
            renderChatLists(); // update sidebar status dots live
            if (state.activeChat?.type==="dm" &&
                state.activeChat.members?.includes(otherUid)) renderChatHeader();
          }, ()=>{});
        }
      }
      // Remove listeners for removed friends
      for (const fid of Object.keys(_friendProfileUnsubs)) {
        if (!seenUids.has(fid)) { _friendProfileUnsubs[fid](); delete _friendProfileUnsubs[fid]; }
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

      // Background notification: play sound + track unread count for inactive chats
      if (Object.keys(_prevChatTimes).length > 0) {
        let soundPlayed=false;
        for (const c of arr) {
          const prev=_prevChatTimes[c.id]||0;
          const cur=c.lastMessageAt?.toMillis?.()||0;
          const sentByMe=c.lastSenderUid===uid;
          if (cur>prev && c.id!==state.activeChatId && !sentByMe && !isChatMuted(c.id) && !c.lastMessageSilent) {
            // Increment unread count for this chat
            state.unreadCounts[c.id]=(state.unreadCounts[c.id]||0)+1;
            if (!soundPlayed) { playSound("message"); soundPlayed=true; }
          }
        }
      }
      // Update baseline
      // When a chat doc is updated with serverTimestamp(), the local cache
      // briefly returns null until the server confirms — that would yank
      // the chat to the bottom of the list and snap it back when the
      // server resolves. Keep the LAST known timestamp as a stand-in.
      const oldTimes = _prevChatTimes;
      _prevChatTimes = {};
      const _now = Date.now();
      const justSent = state._justSentByMeAt && (_now - state._justSentByMeAt) < 5000;
      for (const c of arr) {
        const cur = c.lastMessageAt?.toMillis?.();
        if (cur) _prevChatTimes[c.id] = cur;
        else if (c.id === state.activeChatId && justSent) _prevChatTimes[c.id] = _now;
        else _prevChatTimes[c.id] = oldTimes[c.id] || 0;
      }
      arr.sort((a,b) => (_prevChatTimes[b.id]||0) - (_prevChatTimes[a.id]||0));
      state.chats=arr; renderChatLists();
      _updateSidebarTypingListeners();
      if (state.activeChatId) {
        const updated=state.chats.find(c=>c.id===state.activeChatId);
        if (updated) { state.activeChat=updated; renderChatHeader(); }
      }
    }, err=>console.error("chats:",err));

  // ── Update notification banner ──────────────────────────────────────
  // sessionStorage is per-tab and clears when the tab closes.
  // First snapshot (page load) → record version as baseline silently.
  // Subsequent snapshots (real-time change while open) → show banner.
  // Opening a new tab always re-records baseline → never false-positive.
  state.unsubscribers.updateBanner = onSnapshot(
    doc(db, "appConfig", "update"),
    snap => {
      const banner = $("#update-banner");
      if (!banner) return;
      if (!snap.exists() || !snap.data().enabled) {
        banner.classList.add("hidden");
        if (!sessionStorage.getItem("sc_update_boot_ver"))
          sessionStorage.setItem("sc_update_boot_ver", "__none__");
        return;
      }
      const data = snap.data();
      const version = String(data.version || data.updatedAt?.toMillis?.() || "1");
      const bootVer = sessionStorage.getItem("sc_update_boot_ver");

      // First fire this tab session → record baseline, never show
      if (bootVer === null) {
        sessionStorage.setItem("sc_update_boot_ver", version);
        banner.dataset.version = version;
        return;
      }
      // Same as what was there when tab opened → already on this version
      if (version === bootVer) return;
      // User already dismissed this exact version
      if (localStorage.getItem("sc_seen_update") === version) return;

      // A new version appeared while the app was open → show banner
      sessionStorage.setItem("sc_update_boot_ver", version);
      const msgEl = $("#update-banner-msg");
      if (msgEl) msgEl.textContent = data.message ||
        "Static Chat has been updated! Refresh for the latest version.";
      banner.dataset.version = version;
      banner.classList.remove("hidden");
      playSound("update");
    },
    err => console.warn("updateBanner:", err)
  );
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

  // Update friend-request badges on sidebar button + tab
  const reqCount = state.incoming.length;
  const reqLabel = reqCount > 9 ? "9+" : String(reqCount);
  const sideBadge = $("#friend-req-badge");
  const tabBadge  = $("#pending-tab-badge");
  if (sideBadge) { sideBadge.textContent = reqLabel; sideBadge.classList.toggle("hidden", reqCount === 0); }
  if (tabBadge)  { tabBadge.textContent  = reqLabel; tabBadge.classList.toggle("hidden",  reqCount === 0); }
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

/* Levenshtein distance — bails early if difference exceeds maxDist */
function levenshtein(a, b, maxDist=5) {
  if (a===b) return 0;
  if (Math.abs(a.length-b.length) > maxDist) return maxDist+1;
  const m=a.length, n=b.length;
  let prev=Array.from({length:n+1},(_,i)=>i);
  for (let i=1;i<=m;i++) {
    const curr=[i];
    for (let j=1;j<=n;j++) {
      curr[j]=a[i-1]===b[j-1] ? prev[j-1] : 1+Math.min(prev[j],curr[j-1],prev[j-1]);
    }
    prev=curr;
  }
  return prev[n];
}

async function searchUsers() {
  const raw = $("#add-friend-input").value.trim();
  const results = $("#search-results");
  results.innerHTML="";

  // Support partial discriminator: #27 matches #2706
  const hashMatch = raw.match(/^(.+)#(\d{1,4})$/);

  // Safety gate: require 3+ chars for prefix searches (prevent scraping all users by typing "a")
  if (!hashMatch) {
    if (!raw) { $("#search-hint").textContent="Enter a username to search."; return; }
    if (raw.length < 3) { $("#search-hint").textContent="Type at least 3 characters to search."; return; }
    if (/^(.)\1+$/i.test(raw)) { $("#search-hint").textContent="Enter a more specific username."; return; }
  }

  $("#search-hint").textContent="Searching…";

  try {
    let found=[];

    if (hashMatch) {
      // Tag search — partial discriminator supported (#27 matches #2706)
      const [,uname,disc]=hashMatch;
      const term=uname.toLowerCase();
      const q=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(50));
      const snap=await getDocs(q);
      snap.forEach(d=>{
        const u=d.data();
        if (u.uid && u.uid!==state.user.uid && u.displayNameLower===term
            && u.discriminator?.startsWith(disc))
          found.push(u);
      });
    } else {
      const term=raw.toLowerCase();
      const seenUids=new Set();

      // ① Exact-prefix query: names starting with exactly what was typed
      const q1=query(collection(db,"users"),orderBy("displayNameLower"),startAt(term),endAt(term+""),limit(25));
      const snap1=await getDocs(q1);
      snap1.forEach(d=>{ const u=d.data(); if(u.uid&&u.uid!==state.user.uid&&!seenUids.has(u.uid)){ seenUids.add(u.uid); found.push(u); } });

      // ② Fuzzy query: broader 4-char prefix pool, filtered client-side by Levenshtein <= 3
      // Only fires when the term is long enough to be meaningful (>=6 chars)
      if (term.length>=6) {
        const fuzzyPrefix=term.slice(0,4);
        const q2=query(collection(db,"users"),orderBy("displayNameLower"),startAt(fuzzyPrefix),endAt(fuzzyPrefix+""),limit(35));
        const snap2=await getDocs(q2);
        snap2.forEach(d=>{
          const u=d.data();
          if (!u.uid||u.uid===state.user.uid||seenUids.has(u.uid)) return;
          const name=u.displayNameLower||"";
          // Keep only if within 3 edits — compare term against equal-length window of the name
          const window=name.slice(0,term.length+2);
          if (levenshtein(term,window)<=3) { seenUids.add(u.uid); found.push(u); }
        });
      }

      // Sort: exact/prefix matches first, then by fuzzy score
      found.sort((a,b)=>{
        const an=a.displayNameLower||"", bn=b.displayNameLower||"";
        const aExact=an.startsWith(term)?0:1, bExact=bn.startsWith(term)?0:1;
        if (aExact!==bExact) return aExact-bExact;
        return levenshtein(term,an.slice(0,term.length+2))-levenshtein(term,bn.slice(0,term.length+2));
      });
      found=found.slice(0,10); // cap display at 10
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
  // Use in-memory count if we've been tracking this session, otherwise show 1
  return state.unreadCounts[c.id]||1;
}
function chatHasUnread(c) { return chatUnreadCount(c)>0; }

/* ---------- Snooze users (local UI hide, not Firestore block) ---------- */
function _saveSnoozed() {
  localStorage.setItem("sc_snoozed_users", JSON.stringify([...state.snoozedUsers]));
}
function isUserSnoozed(uid) { return state.snoozedUsers.has(uid); }
function toggleSnoozeUser(uid) {
  if (!uid) return;
  if (state.snoozedUsers.has(uid)) state.snoozedUsers.delete(uid);
  else state.snoozedUsers.add(uid);
  _saveSnoozed();
  renderMessages?.();
  showToast(state.snoozedUsers.has(uid) ? "😴 User snoozed (their messages will be hidden)" : "User unsnoozed");
}

/* ---------- Pinned chats ---------- */
function _getPinnedChats() {
  try { return new Set(JSON.parse(localStorage.getItem("sc_pinned_chats")||"[]")); }
  catch(_){ return new Set(); }
}
function _isChatPinned(id) { return _getPinnedChats().has(id); }
function _togglePinChat(id) {
  const set = _getPinnedChats();
  if (set.has(id)) set.delete(id); else set.add(id);
  localStorage.setItem("sc_pinned_chats", JSON.stringify([...set]));
  renderChatLists();
  showToast(set.has(id) ? "📌 Pinned" : "Unpinned");
}

/* ---------- Folders ---------- */
function _getFolders() {
  try { return JSON.parse(localStorage.getItem("sc_chat_folders")||"{}"); }
  catch(_){ return {}; }
}
function _saveFolders(f) { localStorage.setItem("sc_chat_folders", JSON.stringify(f)); }
function _chatFolder(chatId) {
  const f = _getFolders();
  for (const [name, ids] of Object.entries(f)) if (ids.includes(chatId)) return name;
  return null;
}
function _moveChatToFolder(chatId, folderName) {
  const f = _getFolders();
  for (const name of Object.keys(f)) {
    f[name] = f[name].filter(id => id !== chatId);
    if (!f[name].length) delete f[name];
  }
  if (folderName) {
    if (!f[folderName]) f[folderName] = [];
    f[folderName].push(chatId);
  }
  _saveFolders(f);
  renderChatLists();
}

function _showFolderPicker(chatId, x, y) {
  document.getElementById("folder-picker")?.remove();
  const folders = Object.keys(_getFolders());
  const cur = _chatFolder(chatId);
  const pop = document.createElement("div");
  pop.id = "folder-picker";
  pop.className = "ic-color-popover";
  pop.style.cssText = `position:fixed;left:${Math.min(window.innerWidth-260, x)}px;top:${Math.min(window.innerHeight-200, y)}px;width:240px;`;
  pop.innerHTML = `
    <div style="font-size:11px;color:var(--t-muted);font-weight:700;margin-bottom:6px;text-transform:uppercase;">Move to folder</div>
    <div style="display:flex;flex-direction:column;gap:2px;max-height:240px;overflow-y:auto;">
      ${folders.map(f=>`<button class="folder-pick-row ${f===cur?"active":""}" data-folder="${escapeHtml(f)}">📁 ${escapeHtml(f)}${f===cur?" ✓":""}</button>`).join("")}
      ${cur ? `<button class="folder-pick-row" data-folder=""><span style="color:var(--t-muted);">⊘ Remove from folder</span></button>` : ""}
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid var(--c-border-2);">
      <input type="text" class="ic-color-hex" id="folder-new-name" placeholder="New folder…" maxlength="24" />
      <button class="btn-secondary" id="folder-create-btn" style="font-size:12px;">Create</button>
    </div>
  `;
  document.body.appendChild(pop);
  pop.addEventListener("click", e => {
    const row = e.target.closest("[data-folder]");
    if (row) { _moveChatToFolder(chatId, row.dataset.folder); pop.remove(); return; }
    if (e.target.id === "folder-create-btn") {
      const name = $("#folder-new-name").value.trim();
      if (!name) { showToast("Enter a folder name"); return; }
      _moveChatToFolder(chatId, name); pop.remove();
    }
  });
  $("#folder-new-name")?.addEventListener("keydown", e => {
    if (e.key === "Enter") $("#folder-create-btn")?.click();
  });
  setTimeout(() => document.addEventListener("click", function _close(e2) {
    if (!pop.contains(e2.target)) { pop.remove(); document.removeEventListener("click", _close); }
  }), 0);
}

function renderChatLists() {
  const filterText=state.filters.sidebar.toLowerCase();
  // Filter out fully-muted chats unless searching
  const visibleChats = state.chats.filter(c=>{
    if (filterText) return true; // search overrides hide
    return chatMuteLevel(c.id) !== "all";
  });
  const pinned = _getPinnedChats();
  // Sort: pinned first
  visibleChats.sort((a,b) => {
    const ap = pinned.has(a.id) ? 0 : 1;
    const bp = pinned.has(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const at = a.lastMessageAt?.toMillis?.() || 0;
    const bt = b.lastMessageAt?.toMillis?.() || 0;
    return bt - at;
  });
  const dms=visibleChats.filter(c=>c.type==="dm");
  // Regular groups (no school domain)
  const groups=visibleChats.filter(c=>c.type==="group" && !c.schoolDomain);
  // School chats — shown in their own section ABOVE the regular groups
  const schoolChats=visibleChats.filter(c=>c.type==="group" && c.schoolDomain);
  // Folders: split groups by folder for rendering
  const folders = _getFolders();
  const collapsed = new Set(JSON.parse(localStorage.getItem("sc_folders_collapsed")||"[]"));

  // Helper: does a chat have any cached message matching the filter?
  const _msgMatches = (cId) => {
    if (!filterText || filterText.length<2) return false;
    const msgs = state.messageCache[cId]||[];
    return msgs.some(m=>(m.text||"").toLowerCase().includes(filterText));
  };
  $("#dm-list").innerHTML=dms.map(c=>{
    const otherUid=c.members.find(m=>m!==state.user.uid);
    const profile=state.userCache[otherUid];
    const name=profile?.username||profile?.displayName||"Direct Message";
    const photo=profile?.photoURL||null;
    const lastMsgMatches = (c.lastMessage||"").toLowerCase().includes(filterText||"");
    const cacheMatches = _msgMatches(c.id);
    if (filterText && !name.toLowerCase().includes(filterText) && !lastMsgMatches && !cacheMatches) return "";
    const matchHint = filterText && (lastMsgMatches||cacheMatches) && !name.toLowerCase().includes(filterText)
      ? `<span class="side-row-match-hint" title="Message match">💬</span>` : "";
    const active=state.activeChatId===c.id?"active":"";
    const muteLevel=chatMuteLevel(c.id);
    const mutedDot=muteLevel?`<span class="side-row-mute-dot" title="Muted (${muteLevel})">🔕</span>`:"";
    const unreadN=muteLevel?0:chatUnreadCount(c);
    const unread=unreadN>0?`<span class="side-item-unread" title="${unreadN} new message${unreadN===1?"":"s"}">${unreadN>99?"99+":unreadN}</span>`:"";
    const onlineStatus=resolveStatus(profile);
    const dmAvatar=`<div class="side-row-avatar-wrap">
      ${avatarMarkup(name,photo,"side-row-avatar","side-row-fallback")}
      <span class="side-status-dot" data-status="${escapeHtml(onlineStatus)}"></span>
    </div>`;
    const pinDot = pinned.has(c.id) ? `<span class="side-row-pin-dot" title="Pinned">📌</span>` : "";
    const typingHere = state.sidebarTyping[c.id]?.length;
    const typingHint = typingHere ? `<span class="side-row-typing" title="${escapeHtml(state.sidebarTyping[c.id].join(", "))} typing"><span></span><span></span><span></span></span>` : "";
    return `
      <div class="side-row ${active} ${muteLevel?"muted-row":""}" data-chat-id="${escapeHtml(c.id)}" data-type="dm">
        ${dmAvatar}
        <div class="side-row-name">${escapeHtml(name)}</div>
        ${typingHint}${pinDot}${matchHint}${mutedDot}${unread}
        <button class="icon-btn side-row-close" title="Close" data-action="close-dm" data-chat-id="${escapeHtml(c.id)}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>`;
  }).join("");

  // Separate folder-grouped vs unfolderd
  const renderRow = (c) => {
    const name=c.name||"Group";
    const lastMsgMatches = (c.lastMessage||"").toLowerCase().includes(filterText||"");
    const cacheMatches = _msgMatches(c.id);
    if (filterText && !name.toLowerCase().includes(filterText) && !lastMsgMatches && !cacheMatches) return "";
    const matchHint = filterText && (lastMsgMatches||cacheMatches) && !name.toLowerCase().includes(filterText)
      ? `<span class="side-row-match-hint" title="Message match">💬</span>` : "";
    const active=state.activeChatId===c.id?"active":"";
    const muteLevel=chatMuteLevel(c.id);
    const mutedDot=muteLevel?`<span class="side-row-mute-dot" title="Muted (${muteLevel})">🔕</span>`:"";
    const unreadN2=muteLevel?0:chatUnreadCount(c);
    const unread=unreadN2>0?`<span class="side-item-unread" title="${unreadN2} new">${unreadN2>99?"99+":unreadN2}</span>`:"";
    const groupAvatar = c.photoURL
      ? `<img class="side-row-avatar" src="${escapeHtml(c.photoURL)}" alt="" />`
      : `<div class="side-row-fallback">${escapeHtml(groupInitials(name))}</div>`;
    const pinDot = pinned.has(c.id) ? `<span class="side-row-pin-dot" title="Pinned">📌</span>` : "";
    const typingHere = state.sidebarTyping[c.id]?.length;
    const typingHint = typingHere ? `<span class="side-row-typing" title="${escapeHtml(state.sidebarTyping[c.id].join(", "))} typing"><span></span><span></span><span></span></span>` : "";
    return `
      <div class="side-row ${active} ${muteLevel?"muted-row":""}" data-chat-id="${escapeHtml(c.id)}" data-type="group">
        ${groupAvatar}
        <div class="side-row-name">${escapeHtml(name)}</div>
        ${typingHint}${pinDot}${matchHint}${mutedDot}${unread}
      </div>`;
  };
  // School chats section (separate from regular groups)
  const schoolHtml = schoolChats.length ? `
    <div class="folder-section school-section">
      <div class="folder-header" style="color:#a78bfa;">
        <span class="folder-arrow">🎓</span>
        <span class="folder-name">School Chats</span>
        <span class="folder-count">${schoolChats.length}</span>
      </div>
      <div class="folder-rows">${schoolChats.map(renderRow).join("")}</div>
    </div>` : "";
  // Folder sections first
  const foldersHtml = Object.keys(folders).map(fname => {
    const ids = folders[fname] || [];
    const inFolder = groups.filter(c => ids.includes(c.id));
    if (!inFolder.length) return "";
    const isOpen = !collapsed.has(fname);
    return `
      <div class="folder-section">
        <div class="folder-header" data-folder-toggle="${escapeHtml(fname)}">
          <span class="folder-arrow">${isOpen?"▾":"▸"}</span>
          <span class="folder-name">📁 ${escapeHtml(fname)}</span>
          <span class="folder-count">${inFolder.length}</span>
        </div>
        ${isOpen ? `<div class="folder-rows">${inFolder.map(renderRow).join("")}</div>` : ""}
      </div>`;
  }).join("");
  // Unfoldered groups list
  const unfolderedGroups = groups.filter(c => !_chatFolder(c.id));
  $("#group-list").innerHTML = schoolHtml + foldersHtml + unfolderedGroups.map(renderRow).join("");

  // Rail: folders as avatar-like items, then ungrouped group chats
  const railFoldersHtml = Object.keys(folders).map(fname => {
    const ids = folders[fname] || [];
    const inFolder = groups.filter(c => ids.includes(c.id));
    if (!inFolder.length) return "";
    // Active if any chat in this folder is the active chat
    const active = inFolder.some(c => c.id === state.activeChatId) ? "active" : "";
    // Show first 2 chat photos as a stacked thumbnail
    const thumbs = inFolder.slice(0, 4).map(c => {
      return c.photoURL
        ? `<img src="${escapeHtml(c.photoURL)}" alt="" />`
        : `<span>${escapeHtml(groupInitials(c.name||"G"))}</span>`;
    }).join("");
    return `<div class="rail-folder-avatar ${active}" data-rail-folder="${escapeHtml(fname)}" title="${escapeHtml(fname)} — ${inFolder.length} chat${inFolder.length===1?"":"s"}">
      <div class="rail-folder-thumbs rail-folder-thumbs-${Math.min(4, inFolder.length)}">${thumbs}</div>
      <span class="rail-folder-count">${inFolder.length}</span>
    </div>`;
  }).join("");
  const railUnfoldered = unfolderedGroups.map(c => {
    const active=state.activeChatId===c.id?"active":"";
    const inner = c.photoURL
      ? `<img class="rail-group-img" src="${escapeHtml(c.photoURL)}" alt="" />`
      : escapeHtml(groupInitials(c.name||"G"));
    return `<div class="rail-group-avatar ${active}" data-chat-id="${escapeHtml(c.id)}" title="${escapeHtml(c.name||"Group")}">${inner}</div>`;
  }).join("");
  $("#rail-groups").innerHTML = railFoldersHtml + railUnfoldered;
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
    {label: _isChatPinned(chatId)?"📌 Unpin chat":"📌 Pin chat", action:"ctx-pin-chat", data:{chatId}},
    {label:"📁 Move to folder…", action:"ctx-move-folder", data:{chatId}},
    {label:"🎨 Set chat color", action:"ctx-set-color", data:{chatId}},
    {label: muted?"🔔 Unmute Notifications":"🔕 Mute Notifications",
     action:"ctx-mute-dm", data:{chatId}},
    "divider",
    {label:"Close DM",     action:"ctx-close-dm",      data:{chatId}},
  ];
  showCtxMenu(e.clientX, e.clientY, items);
});
$("#group-list").addEventListener("click", e=>{
  // Folder header toggle
  const fh = e.target.closest("[data-folder-toggle]");
  if (fh) {
    const fname = fh.dataset.folderToggle;
    const collapsed = new Set(JSON.parse(localStorage.getItem("sc_folders_collapsed")||"[]"));
    if (collapsed.has(fname)) collapsed.delete(fname); else collapsed.add(fname);
    localStorage.setItem("sc_folders_collapsed", JSON.stringify([...collapsed]));
    renderChatLists();
    return;
  }
  const row=e.target.closest(".side-row"); if(row) openChat(row.dataset.chatId);
});
$("#rail-groups").addEventListener("click", e=>{
  const av=e.target.closest(".rail-group-avatar");
  if (av) { openChat(av.dataset.chatId); return; }
  const fav=e.target.closest("[data-rail-folder]");
  if (fav) { _showRailFolderPopup(fav); return; }
});

function _showRailFolderPopup(anchorEl) {
  document.getElementById("rail-folder-popup")?.remove();
  const fname = anchorEl.dataset.railFolder;
  const folders = _getFolders();
  const ids = folders[fname] || [];
  const chats = state.chats.filter(c => ids.includes(c.id));
  if (!chats.length) return;
  const rect = anchorEl.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.id = "rail-folder-popup";
  pop.className = "rail-folder-popup";
  pop.style.left = (rect.right + 8) + "px";
  pop.style.top = Math.max(10, Math.min(window.innerHeight - 280, rect.top)) + "px";
  pop.innerHTML = `
    <div class="rail-folder-popup-head">📁 ${escapeHtml(fname)}</div>
    ${chats.map(c => {
      const name = c.name || "Group";
      const inner = c.photoURL
        ? `<img class="side-row-avatar" src="${escapeHtml(c.photoURL)}" alt="" />`
        : `<div class="side-row-fallback">${escapeHtml(groupInitials(name))}</div>`;
      return `<div class="rail-folder-popup-row" data-chat-id="${escapeHtml(c.id)}">
        ${inner}<span>${escapeHtml(name)}</span>
      </div>`;
    }).join("")}`;
  document.body.appendChild(pop);
  pop.addEventListener("click", e2 => {
    const row = e2.target.closest("[data-chat-id]");
    if (row) { openChat(row.dataset.chatId); pop.remove(); }
  });
  setTimeout(() => document.addEventListener("click", function _close(e3) {
    if (!pop.contains(e3.target) && !e3.target.closest("[data-rail-folder]")) {
      pop.remove(); document.removeEventListener("click", _close);
    }
  }), 0);
}

// Right-click on a group row → quick actions
function _showGroupCtxMenu(e, chatId) {
  const chat=state.chats.find(c=>c.id===chatId); if (!chat||chat.type!=="group") return;
  const muted=isChatMuted(chatId);
  const items=[
    {label:"Open",                action:"ctx-open-dm",       data:{chatId}},
    {label:"Group Info & Settings", action:"ctx-group-info",  data:{chatId}},
    "divider",
    {label: _isChatPinned(chatId)?"📌 Unpin chat":"📌 Pin chat", action:"ctx-pin-chat", data:{chatId}},
    {label:"📁 Move to folder…", action:"ctx-move-folder", data:{chatId}},
    {label:"Add Members",         action:"ctx-add-members",   data:{chatId}},
    {label:"Copy Invite Code",    action:"ctx-copy-invite",   data:{chatId}},
    {label:"🎨 Set chat color",   action:"ctx-set-color",     data:{chatId}},
    "divider",
    {label: muted?"🔔 Unmute Notifications":"🔕 Mute Notifications",
     action:"ctx-mute-dm", data:{chatId}},
    "divider",
    {label:"Leave Group",         action:"ctx-leave-group",   data:{chatId}, danger:true},
  ];
  showCtxMenu(e.clientX, e.clientY, items);
}
$("#group-list").addEventListener("contextmenu", e=>{
  const row=e.target.closest(".side-row"); if (!row) return;
  e.preventDefault();
  _showGroupCtxMenu(e, row.dataset.chatId);
});
$("#rail-groups").addEventListener("contextmenu", e=>{
  const av=e.target.closest(".rail-group-avatar"); if (!av) return;
  e.preventDefault();
  _showGroupCtxMenu(e, av.dataset.chatId);
});
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
  state._lastRenderedMsgCount = 0; // reset so first render of new chat doesn't think msgs are "new"
  // Mark this chat as read from this moment forward, clear unread counter
  localStorage.setItem(`sc_read_${chatId}`, String(Date.now()));
  delete state.unreadCounts[chatId];

  showChatView(); renderChatHeader(); renderChatLists();
  clearReplyTo();
  renderTypingIndicator([]);

  // Apply per-chat custom accent color (if set)
  const customAccent = localStorage.getItem(`sc_chat_color_${chatId}`);
  if (customAccent) {
    document.body.style.setProperty("--c-chat-accent", customAccent);
    document.body.classList.add("has-chat-accent");
  } else {
    document.body.style.removeProperty("--c-chat-accent");
    document.body.classList.remove("has-chat-accent");
  }

  // Restore draft for this chat
  const draftEl=$("#composer-input");
  if (draftEl) {
    draftEl.value=localStorage.getItem(`sc_draft_${chatId}`)||"";
    draftEl.style.height="auto";
    updateSendBtn();
  }

  // Start typing listener for this chat
  startTypingListener(chatId);

  // Live profile listener for DM partner — keeps status/avatar/name fresh
  if (state.unsubscribers.dmPartnerProfile) { state.unsubscribers.dmPartnerProfile(); state.unsubscribers.dmPartnerProfile=null; }
  if (state.activeChat?.type==="dm") {
    const partnerUid=state.activeChat.members?.find(m=>m!==state.user?.uid);
    if (partnerUid) {
      state.unsubscribers.dmPartnerProfile = onSnapshot(doc(db,"users",partnerUid), snap=>{
        if (!snap.exists()) return;
        state.userCache[partnerUid]=_augmentBadges({...snap.data(), uid:partnerUid});
        renderChatHeader();
        renderFriendsList();
      }, ()=>{});
    }
  }

  if (state.unsubscribers.messages) { state.unsubscribers.messages(); state.unsubscribers.messages=null; }

  // Use cached messages immediately if available — no blank/loading flash on re-open
  const cachedMsgs = state.messageCache[chatId];
  if (cachedMsgs && cachedMsgs.length > 0) {
    state.messages = cachedMsgs;
    renderMessages();
  } else {
    state.messages = [];
    $("#messages").innerHTML=`<div class="empty" style="margin:24px;">Loading messages…</div>`;
  }

  state.unsubscribers.messages=onSnapshot(
    query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"),limit(200)),
    snap=>{
      const prevLen=state.messages.length;
      const hadMessages=state.chatInitialized.has(chatId);
      state.messages=snap.docs.map(d=>({id:d.id,...d.data()}));
      state.messageCache[chatId]=state.messages; // keep in cache for instant re-open
      const isNew=hadMessages&&state.messages.length>prevLen;
      if (isNew) {
        const newest=state.messages[state.messages.length-1];
        if (newest&&newest.senderUid!==state.user.uid&&!isChatMuted(chatId)&&!newest.silent) playSound("message");
        // Autoflag incoming messages from others (silent, no UX impact)
        if (newest&&newest.senderUid!==state.user.uid&&newest.text) {
          _autoFlagCheck(newest.text, newest.id, chatId, newest.senderUid, newest.senderName);
        }
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
  const addBtn=$("#chat-add-member-btn"), leaveBtn=$("#chat-leave-btn"), gearBtn=$("#chat-group-info-btn");
  const anonBtn=$("#chat-anon-toggle-btn");
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
    if(gearBtn) gearBtn.hidden=true;
    if(anonBtn) anonBtn.hidden=true;
    if(codeBadge) codeBadge.hidden=true;
    const si=$("#chat-search-input"); if(si) si.placeholder=`Search ${name}`;
  } else {
    const isLeader=Array.isArray(c.leaders)&&c.leaders.includes(state.user.uid);
    const nameEl2=$("#chat-header-name");
    // For school chats, display "domain · nickname" if a nickname is set
    if (c.schoolDomain) {
      nameEl2.textContent = c.chatNickname ? `🎓 ${c.schoolDomain} · ${c.chatNickname}` : (c.name || `🎓 ${c.schoolDomain}`);
    } else {
      nameEl2.textContent = c.name || "Group";
    }
    nameEl2.classList.remove("clickable"); nameEl2.style.cursor="";
    // Show member avatars inline when there's room (≤5 members)
    let memberAvatarsHtml = "";
    if (c.members.length<=5) {
      const items = await Promise.all(c.members.slice(0,5).map(async uid=>{
        const p = state.userCache[uid] || await fetchUserProfile(uid) || {};
        const name = p.username || p.displayName || "U";
        const initial = (name[0]||"U").toUpperCase();
        return p.photoURL
          ? `<img class="gc-member-avatar" src="${escapeHtml(p.photoURL)}" alt="" title="${escapeHtml(name)}" />`
          : `<span class="gc-member-avatar gc-member-fallback" title="${escapeHtml(name)}">${escapeHtml(initial)}</span>`;
      }));
      memberAvatarsHtml = `<span class="gc-member-avatars">${items.join("")}</span>`;
    }
    $("#chat-header-sub").innerHTML=`${memberAvatarsHtml}<span>${c.members.length} member${c.members.length===1?"":"s"}${isLeader?" · 👑 Leader":""}</span>`;
    if (c.photoURL) {
      avatarWrap.innerHTML=`<img class="chat-header-avatar" src="${escapeHtml(c.photoURL)}" alt="" />`;
    } else {
      avatarWrap.innerHTML=`<div class="chat-header-avatar-fallback">${escapeHtml(groupInitials(c.name||"G"))}</div>`;
    }
    avatarWrap.style.cursor="pointer";
    avatarWrap.title="Group info";
    delete avatarWrap.dataset.profileUid;
    if(addBtn) addBtn.hidden=false; if(leaveBtn) leaveBtn.hidden=false;
    if(gearBtn) gearBtn.hidden=false;
    // Anon toggle visible only in school chats
    if (anonBtn) {
      anonBtn.hidden = !c.schoolDomain;
      anonBtn.classList.toggle("active", !!state.anonInSchoolChat);
      anonBtn.title = state.anonInSchoolChat
        ? "Anonymous mode ON — your messages hide your identity"
        : "Anonymous mode OFF — click to send messages anonymously";
    }
    if (codeBadge) {
      if (c.joinCode) { codeBadge.textContent=c.joinCode; codeBadge.hidden=false; codeBadge.title="Click to copy join code"; }
      else codeBadge.hidden=true;
    }
    const si2=$("#chat-search-input"); if(si2) si2.placeholder=`Search ${c.name||"Group"}`;
  }
  updateChatMuteBtn();
}

// Chat header avatar click → open profile (DMs) or group info modal (groups)
document.addEventListener("click", e=>{
  const wrap=e.target.closest("#chat-header-avatar-wrap");
  if (!wrap) return;
  if (wrap.dataset.profileUid) { showProfileCard(wrap.dataset.profileUid, e); }
  else if (state.activeChat?.type==="group") { openGroupInfoModal(); }
});
document.addEventListener("click", e=>{
  const nameEl=e.target.closest("#chat-header-name");
  if (nameEl) {
    const c=state.activeChat;
    if (c?.type==="dm") {
      const otherUid=c.members.find(u=>u!==state.user?.uid);
      if (otherUid) showProfileCard(otherUid, e);
    } else if (c?.type==="group") {
      openGroupInfoModal();
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
const QUICK_REACTS_DEFAULT = ["👍","❤️","😂","😮","😢"];
// Track recent reactions (most-recently-used first, capped at 5)
function _getRecentReacts() {
  try {
    const raw = localStorage.getItem("sc_recent_reacts");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr) && arr.length) return arr;
  } catch(_){}
  return QUICK_REACTS_DEFAULT.slice();
}
function _pushRecentReact(emoji) {
  if (!emoji) return;
  let arr = _getRecentReacts().filter(e=>e!==emoji);
  arr.unshift(emoji);
  arr = arr.slice(0, 5);
  try { localStorage.setItem("sc_recent_reacts", JSON.stringify(arr)); } catch(_){}
}
// Replace static array with dynamic getter
const QUICK_REACTS = new Proxy([], { get: (_, p) => {
  const arr = _getRecentReacts();
  if (p === "map") return arr.map.bind(arr);
  if (p === "length") return arr.length;
  return arr[p];
}});

// OG cutoff — any account created before this timestamp gets an OG badge automatically
const OG_CUTOFF_MS = new Date("2026-05-04T00:00:00Z").getTime();

/* Badge tiers: 1=Official/Rare, 2=Notable, 3=Achievement, 4=Activity
   how: shown as subtitle in tooltip; grant: how to give it (for admin reference) */
const BADGE_DEFS = {
  // ── Tier 1 — Official (admin-granted, rarest) ──────────────────────
  creator: {
    tier:1, bg:"#ff6b35",
    title:"Creator",
    desc:"Built Static Chat from the ground up. Only one person has this.",
    icon:`<path fill="currentColor" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>`
  },
  staff: {
    tier:1, bg:"#e91e8c",
    title:"Staff",
    desc:"Official Static Chat team member.",
    icon:`<path fill="currentColor" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>`
  },
  dev: {
    tier:1, bg:"#00bcd4",
    title:"Developer",
    desc:"Contributed code to Static Chat.",
    icon:`<path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>`
  },
  og_og: {
    tier:1, bg:"#f97316",
    title:"Day One",
    desc:"One of the very first 5 users ever. A true original.",
    icon:`<path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/><path fill="none" stroke="currentColor" stroke-width="1" d="M12 6 l1.5 3 3.5.5-2.5 2.5.6 3.5L12 14l-3.1 1.5.6-3.5L7 9.5l3.5-.5z"/>`
  },

  // ── Tier 2 — Notable ────────────────────────────────────────────────
  og: {
    tier:2, bg:"#f59e0b",
    title:"OG",
    desc:"Joined before May 4th, 2026. One of the early ones.",
    icon:`<path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`
  },
  early_tester: {
    tier:2, bg:"#3b82f6",
    title:"Early Tester",
    desc:"Helped test Static Chat before public launch.",
    icon:`<path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 8 0V4h1V2H7zm6 14a2 2 0 0 1-4 0v-5h4v5zm0-7H9V4h4v5z"/>`
  },
  mod: {
    tier:2, bg:"#10b981",
    title:"Moderator",
    desc:"Keeps Static Chat safe and welcoming.",
    icon:`<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/>`
  },
  verified: {
    tier:2, bg:"#1d9bf0",
    title:"Verified",
    desc:"Verified notable person.",
    icon:`<path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>`
  },

  // ── Tier 3 — Achievement ─────────────────────────────────────────────
  bug_reporter: {
    tier:3, bg:"#ec4899",
    title:"Bug Reporter",
    desc:"Found and reported a real bug that got fixed.",
    icon:`<path fill="currentColor" d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17a6.003 6.003 0 0 0-2.83 0L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>`
  },
  suggester: {
    tier:3, bg:"#8b5cf6",
    title:"Suggester",
    desc:"Suggested a feature that actually made it into the app.",
    icon:`<path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm3 10.5l-1 .67V16h-4v-2.83l-1-.67C7.72 11.67 7 10.39 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.39-.72 2.67-2 3.5z"/>`
  },
  gif_master: {
    tier:3, bg:"#ef4444",
    title:"GIF Master",
    desc:"Sent an absolutely absurd number of GIFs.",
    icon:`<path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>`
  },
  emoji_lord: {
    tier:3, bg:"#f59e0b",
    title:"Emoji Lord",
    desc:"Reaction royalty. Uses emojis more than words.",
    icon:`<path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>`
  },
  night_owl: {
    tier:3, bg:"#6366f1",
    title:"Night Owl",
    desc:"Always chatting way too late at night.",
    icon:`<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>`
  },

  // ── Tier 4 — Activity (more achievable) ─────────────────────────────
  helper: {
    tier:4, bg:"#059669",
    title:"Helper",
    desc:"Goes out of their way to help other users.",
    icon:`<path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 1.64-.79 3.1-2 4.03V16h-6v-2.97C7.79 12.1 7 10.64 7 9c0-2.76 2.24-5 5-5zm-1 14h2v2h-2z"/>`
  },
  active: {
    tier:4, bg:"#4f7cff",
    title:"Active",
    desc:"Consistently one of the most active members.",
    icon:`<path fill="currentColor" d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17v5l5-3-1.22-1.22C19.91 16.03 22 13.07 22 12c0-5.18-3.94-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.07 2.09 6.03 5.22 7.78L6 21l5 3v-5l-2.28 2.28C6.81 18 5 15.21 5 12c0-4.08 3.05-7.44 7-7.93V2.05z"/>`
  },
};

// Render a row of compact icon-only badges for profile display
function renderBadges(badges=[]) {
  if (!badges||!badges.length) return "";
  // Sort by tier (lowest tier number = most prestigious = show first)
  const sorted=[...badges].sort((a,b)=>{
    const ta=(BADGE_DEFS[a]?.tier||9), tb=(BADGE_DEFS[b]?.tier||9);
    return ta-tb;
  });
  return sorted.map(b=>{
    const d=BADGE_DEFS[b]; if(!d) return "";
    const tierClass=`badge-t${d.tier||4}`;
    const tooltipTitle=`${d.title}${d.desc?" — "+d.desc:""}`;
    return `<span class="badge-icon-wrap ${tierClass}" title="${escapeHtml(tooltipTitle)}" style="background:${d.bg}">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="color:#fff">${d.icon}</svg>
    </span>`;
  }).join("");
}

// Render text-label badges for search/admin use only (not displayed to users normally)
function renderBadgeLabels(badges=[]) {
  if (!badges||!badges.length) return "";
  return badges.map(b=>{
    const d=BADGE_DEFS[b]; if(!d) return "";
    return `<span class="badge-chip" title="${escapeHtml(d.title)}" style="background:${d.bg};color:#fff;">${escapeHtml(b.replace(/_/g," "))}</span>`;
  }).join("");
}

function buildReplyPreview(m) {
  // Show for normal replies AND for slash-command result messages
  const isCmd = m.type === "command" && m.replyToTextPreview;
  if (!m.replyToMessageId && !isCmd) return "";
  const ref = m.replyToMessageId ? state.messages.find(x=>x.id===m.replyToMessageId) : null;
  const name = m.replyToSenderName||(ref?.senderName)||"Unknown";
  const rawPreview = m.replyToTextPreview||(ref?.text||"")||"";
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
  // Command messages: no jump target, just show the prompt context
  if (isCmd) {
    return `<div class="reply-preview reply-preview-cmd" title="Slash command by ${escapeHtml(name)}">
      <div class="reply-connector"></div>
      ${avatarHtml}
      <span class="reply-preview-name">${escapeHtml(name)}</span>
      <span class="reply-preview-text">${escapeHtml(preview)||"<em>command</em>"}</span>
    </div>`;
  }
  return `<div class="reply-preview" data-jump-to="${escapeHtml(m.replyToMessageId)}" title="Jump to original message" role="button" tabindex="0">
    <div class="reply-connector"></div>
    ${avatarHtml}
    <span class="reply-preview-name">${escapeHtml(name)}</span>
    <span class="reply-preview-text">${escapeHtml(preview)||"<em>Message unavailable</em>"}</span>
  </div>`;
}

/* ---------- Link previews (OpenGraph via microlink.io free tier) ---------- */
const _linkPreviewCache = {}; // url -> {title, description, image, ogResolved} or null
const _linkPreviewPending = {}; // url -> Promise

/* Find the first URL that ISN'T already auto-embedded by formatMessage().
   formatMessage embeds image URLs (jpg/png/gif/etc.) and GIF CDN URLs (Tenor/Giphy)
   inline as <img>, so we skip those — no need to also show a microlink card. */
function _extractFirstUrl(text) {
  if (!text) return null;
  const matches = text.match(/https?:\/\/[^\s<]+/gi);
  if (!matches) return null;
  for (const url of matches) {
    if (IMAGE_URL_RE.test(url)) continue; // already shown as <img>
    if (GIF_CDN_RE.test(url))   continue; // already shown as GIF embed
    return url;
  }
  return null;
}

/* Build a simple favicon-based preview that never requires a network call.
   This is the reliable fallback shown for every link — no CORS, no rate limits. */
function _buildBasicPreview(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname && u.pathname !== "/" ? u.pathname : "";
    return {
      title: host,
      description: path.length > 1 ? path.slice(0, 80) : "",
      image: `https://www.google.com/s2/favicons?sz=128&domain=${u.hostname}`,
      site: host,
      basic: true,
    };
  } catch(_) { return null; }
}

async function _fetchLinkPreview(url) {
  // Use the basic favicon-based card. (External preview APIs all CORS-block
  // or rate-limit on a static site like ours, so we skip them and just show
  // a clean card built from the URL itself — never fails, never logs errors.)
  if (_linkPreviewCache[url] !== undefined) return _linkPreviewCache[url];
  const result = _buildBasicPreview(url);
  _linkPreviewCache[url] = result;
  return result;
}

function buildLinkPreviewPlaceholder(msgId, url) {
  if (!url) return "";
  return `<div class="link-preview" data-link-msg-id="${escapeHtml(msgId)}" data-link-url="${escapeHtml(url)}">
    <div class="link-preview-loading">Loading preview…</div>
  </div>`;
}

// After messages render, hydrate link previews lazily
function hydrateLinkPreviews() {
  const placeholders = document.querySelectorAll(".link-preview[data-link-url]:not([data-link-loaded])");
  placeholders.forEach(async el => {
    el.setAttribute("data-link-loaded", "1");
    const url = el.dataset.linkUrl;
    // Render the basic favicon card immediately so user sees SOMETHING
    const basic = _buildBasicPreview(url);
    if (basic) _renderLinkPreview(el, url, basic);
    // Then try to fetch a richer preview and replace if it succeeded
    const data = await _fetchLinkPreview(url);
    if (data && !data.basic) {
      _renderLinkPreview(el, url, data);
    }
    return;
  });
}

function _renderLinkPreview(el, url, data) {
  const img = data.image
    ? `<img class="link-preview-img" src="${escapeHtml(data.image)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" />`
    : "";
  el.innerHTML = `
    <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-preview-card${data.basic?' link-preview-basic':''}">
      ${img}
      <div class="link-preview-body">
        <div class="link-preview-site">${escapeHtml(data.site||"")}</div>
        <div class="link-preview-title">${escapeHtml(data.title||url)}</div>
        ${data.description ? `<div class="link-preview-desc">${escapeHtml(data.description.slice(0,160))}</div>` : ""}
      </div>
    </a>`;
}

// Old function kept as no-op for backward references
function _legacyLinkPreviewHydrate() {
  const placeholders = document.querySelectorAll(".link-preview[data-link-url]:not([data-link-loaded])");
  placeholders.forEach(async el => {
    el.setAttribute("data-link-loaded", "1");
    const url = el.dataset.linkUrl;
    const data = await _fetchLinkPreview(url);
    if (!data) {
      el.remove();
      return;
    }
    const img = data.image
      ? `<img class="link-preview-img" src="${escapeHtml(data.image)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()" />`
      : "";
    el.innerHTML = `
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-preview-card">
        ${img}
        <div class="link-preview-body">
          <div class="link-preview-site">${escapeHtml(data.site||"")}</div>
          <div class="link-preview-title">${escapeHtml(data.title||url)}</div>
          ${data.description ? `<div class="link-preview-desc">${escapeHtml(data.description.slice(0,160))}</div>` : ""}
        </div>
      </a>`;
  });
}

function buildReactionBar(reactions={}, msgId) {
  const entries=Object.entries(reactions).filter(([,uids])=>uids.length>0);
  if (!entries.length) return "";
  const pills=entries.map(([emoji,uids])=>{
    const mine=uids.includes(state.user?.uid);
    const countHtml=uids.length>1?` <span>${uids.length}</span>`:"";
    return `<button class="reaction-pill${mine?" active":""}" data-react-emoji="${escapeHtml(emoji)}" data-react-msg="${escapeHtml(msgId)}">${emoji}${countHtml}</button>`;
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
  let lastSenderUid=null, lastTime=0, lastWasAnon=false, lastAnonId=null;
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
    // Hide messages from snoozed users (local-only UI hide)
    if (state.snoozedUsers.has(m.senderUid)&&m.senderUid!==state.user?.uid) continue;

    const ts=m.createdAt;
    const tms=ts?.toMillis?ts.toMillis():0;

    // Insert unread divider before first NEW message from someone else
    // (skip own messages — you can't have "unread" messages you sent yourself)
    if (!unreadDividerInserted && unreadCount>0 && lastRead>0 && tms>lastRead && m.senderUid!==myUid && html.length>0) {
      const label=unreadCount===1?"1 New Message":`${unreadCount} New Messages`;
      html.push(`<div class="unread-divider" role="separator" id="unread-divider-bar" title="Click to dismiss"><span>${label}</span></div>`);
      unreadDividerInserted=true;
    }
    // Group consecutive messages — but break the group whenever:
    //   1) sender uid changes
    //   2) anonymous state changes (anon→named or named→anon)
    //   3) anon message uses a different anonId than the previous anon message
    const isAnon = !!m.anonymous;
    const anonStateChanged = lastWasAnon !== isAnon;
    const anonIdChanged = isAnon && lastAnonId && (m.anonMsgId !== lastAnonId);
    const sameSender = (m.senderUid===lastSenderUid) && !anonStateChanged && !anonIdChanged;
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
        ${pinnedMsgId?`<span class="msg-system-link" data-pin-jump="${escapeHtml(pinnedMsgId)}" role="button" tabindex="0">View it.</span>`:""}
      </div>`);
      // system messages don't affect sender grouping
      continue;
    }

    // Poll message
    if (m.type==="poll" && m.pollData) {
      const pd = m.pollData || {};
      const opts = pd.options || [];
      const votes = pd.votes || {};
      const myVote = votes[state.user?.uid];
      const counts = opts.map((_, i) => Object.values(votes).filter(v => v === i).length);
      const total = counts.reduce((a, b) => a + b, 0);
      const ended = pd.endsAt && Date.now() > pd.endsAt;
      const remainMs = pd.endsAt ? Math.max(0, pd.endsAt - Date.now()) : 0;
      const remainText = ended ? "Ended" : (remainMs < 60000 ? "ending soon"
        : remainMs < 3600000 ? `${Math.ceil(remainMs/60000)}m left`
        : remainMs < 86400000 ? `${Math.ceil(remainMs/3600000)}h left`
        : `${Math.ceil(remainMs/86400000)}d left`);
      const optsHtml = opts.map((opt, i) => {
        const c = counts[i];
        const pct = total ? Math.round((c / total) * 100) : 0;
        const selected = myVote === i;
        return `<button class="poll-option ${selected?'selected':''}" data-poll-vote="${i}" data-msg-id="${escapeHtml(m.id)}" ${ended?'disabled':''}>
          <span class="poll-option-bar" style="width:${pct}%"></span>
          <span class="poll-option-text">${selected?'✓ ':''}${escapeHtml(opt)}</span>
          <span class="poll-option-count">${c} · ${pct}%</span>
        </button>`;
      }).join("");
      html.push(`<div class="message-group msg-poll" data-msg-id="${escapeHtml(m.id)}" title="${tsTitle}">
        <div class="msg-avatar-btn" data-profile-uid="${escapeHtml(m.senderUid)}" role="button" tabindex="0">
          ${avatarMarkup(m.senderName,m.senderPhoto,"msg-avatar","msg-avatar-fallback","message")}
        </div>
        <div class="msg-content">
          <div class="msg-head">
            <span class="msg-author" data-profile-uid="${escapeHtml(m.senderUid)}">${escapeHtml(m.senderName||"User")}</span>
            <span class="msg-time">${escapeHtml(formatTime(ts))}</span>
          </div>
          <div class="poll-card">
            <div class="poll-question">📊 ${escapeHtml(pd.question||"Poll")}</div>
            <div class="poll-options">${optsHtml}</div>
            <div class="poll-meta">
              <span>${total} vote${total===1?"":"s"}</span>
              <span class="poll-time ${ended?'ended':''}">${remainText}</span>
            </div>
          </div>
        </div>
      </div>`);
      lastSenderUid = m.senderUid; lastTime = tms;
      lastWasAnon = !!m.anonymous; lastAnonId = m.anonymous ? (m.anonMsgId || null) : null;
      continue;
    }

    const isCommand=!!(m.commandResult||m.type==="command");
    const extraClass=isCommand?" msg-command-result":"";

    const linkUrl = _extractFirstUrl(m.text || "");
    const linkPreview = linkUrl ? buildLinkPreviewPlaceholder(m.id, linkUrl) : "";
    if (sameSender&&closeInTime&&lastSenderUid!==null) {
      html.push(`
        <div class="msg-followup${extraClass}" data-msg-id="${escapeHtml(m.id)}" title="${tsTitle}">
          <span class="msg-time-inline">${escapeHtml(shortTime(ts))}</span>
          ${replyHtml}
          <div class="msg-body">${formatMessage(m.text||"")}${editedLabel}</div>
          ${linkPreview}
          ${reactionsHtml}
          ${msgActions}
        </div>`);
    } else {
      // Anonymous messages: don't link to real profile
      const profileUidAttr = m.anonymous ? "" : `data-profile-uid="${escapeHtml(m.senderUid)}"`;
      html.push(`
        <div class="message-group${extraClass}${m.anonymous?' msg-anonymous':''}" data-msg-id="${escapeHtml(m.id)}" title="${tsTitle}">
          <div class="msg-avatar-btn" ${profileUidAttr} ${m.anonymous?'':'role="button" tabindex="0"'}>
            ${m.anonymous
              ? `<div class="msg-avatar-fallback" style="background:#475569;">?</div>`
              : avatarMarkup(m.senderName,m.senderPhoto,"msg-avatar","msg-avatar-fallback","message")}
          </div>
          <div class="msg-content">
            <div class="msg-head">
              <span class="msg-author" ${profileUidAttr}>${escapeHtml(m.senderName||"User")}</span>
              ${isLeader?`<span class="leader-badge" title="Group leader"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg></span>`:""}
              <span class="msg-time">${escapeHtml(formatTime(ts))}</span>
            </div>
            ${replyHtml}
            <div class="msg-body">${formatMessage(m.text||"")}${editedLabel}</div>
            ${linkPreview}
            ${reactionsHtml}
            ${msgActions}
          </div>
        </div>`);
    }
    lastSenderUid=m.senderUid; lastTime=tms;
    lastWasAnon = !!m.anonymous; lastAnonId = m.anonymous ? (m.anonMsgId || null) : null;
  }
  // Capture scroll state BEFORE innerHTML wipe — innerHTML resets scrollTop to 0
  const prevScrollTop    = wrap.scrollTop;
  const prevScrollHeight = wrap.scrollHeight;
  // Threshold: ~400px (≈ 5-10 messages depending on density). Within this distance from
  // the bottom, a new incoming message will smoothly auto-scroll the user down.
  const wasAtBottom      = prevScrollHeight - prevScrollTop - wrap.clientHeight < 400;
  // Only consider auto-scroll when actual NEW messages arrived in this render —
  // not on every re-render (poll votes, reactions, edits, typing, etc. shouldn't scroll).
  const prevMsgCount     = state._lastRenderedMsgCount || 0;
  const newMsgCount      = state.messages.length;
  const hadNewMessages   = newMsgCount > prevMsgCount;
  state._lastRenderedMsgCount = newMsgCount;
  // Did the user just send a message? `state._justSentByMeAt` is a timestamp set
  // in sendCurrentMessage. We keep it active for ~1.5s to handle Firestore's
  // double-fire (local cache snapshot + server-confirmed snapshot).
  const sentByMe = !!state._justSentByMeAt && (Date.now() - state._justSentByMeAt) < 1500;

  wrap.innerHTML=html.join("");

  // Highlight messages that mention the current user
  const myName=state.user?.username||"";
  if (myName) {
    wrap.querySelectorAll("[data-msg-id]").forEach(el=>{
      const body=el.querySelector(".msg-body");
      if (body?.querySelector(`.msg-mention[data-mention="${myName}"]`)) {
        el.classList.add("mentioned-me");
      }
    });
  }

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
    const autoScroll = state.autoScrollNew !== false; // default ON
    if (sentByMe) {
      // User just sent a message — instant hard-scroll to bottom, no animation.
      // (Animating would visibly jiggle on the second snapshot fire.)
      wrap.scrollTop = wrap.scrollHeight;
    } else if (autoScroll && wasAtBottom && hadNewMessages) {
      // NEW incoming message and user was near the bottom — smooth-scroll down
      try { wrap.scrollTo({ top: wrap.scrollHeight, behavior: "smooth" }); }
      catch(_) { wrap.scrollTop = wrap.scrollHeight; }
    } else {
      // No new messages OR user was scrolled up — preserve exact scroll position.
      // Adjust for any height change (new content / images / link previews).
      wrap.scrollTop = prevScrollTop + (wrap.scrollHeight - prevScrollHeight);
    }
  }
  // Store unread count so jump button can show it
  state._unreadDisplayCount = unreadCount;
  updateJumpBtn();
  // Lazy-hydrate any link previews in the just-rendered batch
  hydrateLinkPreviews();
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

  if (state.dblClickMode === "picker") {
    // Open emoji picker for custom react
    _openReactionPicker(msgId, e.clientX, e.clientY);
    return;
  }
  const emoji=state.dblClickEmoji||"👍";
  await toggleReaction(msgId, emoji);
  // Brief visual flash
  group.classList.add("dbl-react-flash");
  setTimeout(()=>group.classList.remove("dbl-react-flash"), 400);
});

/* Open emoji picker in "select-emoji" mode for double-click react setting.
   The next emoji click is captured and stored as the user's preferred dblclick emoji. */
function _openDblclickEmojiPicker(anchorEl) {
  const picker = $("#emoji-picker");
  if (!picker) return;
  // Ensure the picker contents are built (only built lazily on first open)
  try { buildEmojiCatTabs?.(); buildEmojiGrid?.(); } catch(_){}
  const rect = anchorEl.getBoundingClientRect();
  // Use position: fixed-style overrides; the picker normally lives near the
  // composer but for setting we anchor it to the dblclick button.
  picker.style.position = "fixed";
  picker.style.left = Math.max(10, Math.min(window.innerWidth-360, rect.left)) + "px";
  picker.style.right = "auto";
  picker.style.bottom = "auto";
  picker.style.top = Math.max(10, Math.min(window.innerHeight-420, rect.bottom + 8)) + "px";
  picker.classList.remove("hidden");
  emojiOpen = true;
  picker.dataset.dblclickPickMode = "1";
  const search = $("#emoji-search"); if (search) { search.value = ""; setTimeout(()=>search.focus(), 50); }
}

// Wire up the chooser button
document.addEventListener("click", e => {
  const btn = e.target.closest("#dblclick-emoji-pick-btn");
  if (btn) { e.stopPropagation(); _openDblclickEmojiPicker(btn); }
});
// Capture next emoji click while in dblclick-pick mode
document.addEventListener("click", e => {
  const picker = $("#emoji-picker");
  if (!picker || picker.classList.contains("hidden")) return;
  if (!picker.dataset.dblclickPickMode) return;
  const cell = e.target.closest(".emoji-cell");
  if (!cell) return;
  e.stopImmediatePropagation();
  const emoji = cell.dataset.emoji || cell.textContent.trim();
  if (emoji) {
    state.dblClickEmoji = emoji;
    localStorage.setItem("sc_dblclick_emoji", emoji);
    if ($("#dblclick-emoji-preview")) $("#dblclick-emoji-preview").textContent = emoji;
    if ($("#settings-dblclick-emoji")) $("#settings-dblclick-emoji").value = emoji;
    showToast(`Reaction emoji set to ${emoji}`);
  }
  picker.classList.add("hidden");
  emojiOpen = false;
  delete picker.dataset.dblclickPickMode;
  // Restore default positioning (CSS) so the picker pops in the right place next time
  picker.style.position = ""; picker.style.left = ""; picker.style.right = "";
  picker.style.top = ""; picker.style.bottom = "";
}, true);

/* Open the emoji picker positioned near a message and apply chosen emoji as reaction */
function _openReactionPicker(msgId, x, y) {
  const picker = $("#emoji-picker");
  if (!picker) return;
  // Position near the cursor
  picker.style.left = Math.max(10, Math.min(window.innerWidth-360, x-180)) + "px";
  picker.style.bottom = "auto";
  picker.style.top = Math.max(10, y - 360) + "px";
  picker.classList.remove("hidden");
  emojiOpen = true;
  // Mark mode so the next emoji click reacts instead of inserting
  picker.dataset.reactMsgId = msgId;
}

// When in react-mode, intercept emoji clicks to react instead of inserting
document.addEventListener("click", async e=>{
  const picker = $("#emoji-picker");
  if (!picker || picker.classList.contains("hidden")) return;
  if (!picker.dataset.reactMsgId) return;
  const cell = e.target.closest(".emoji-cell");
  if (!cell) return;
  e.stopImmediatePropagation();
  const emoji = cell.dataset.emoji || cell.textContent.trim();
  const msgId = picker.dataset.reactMsgId;
  await toggleReaction(msgId, emoji);
  picker.classList.add("hidden");
  emojiOpen = false;
  delete picker.dataset.reactMsgId;
}, true);

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

  // GIF replay button (check BEFORE profile trigger)
  const replayBtnA = e.target.closest(".gif-replay-btn");
  if (replayBtnA) {
    const wrap = replayBtnA.closest(".gif-embed-wrap");
    if (!wrap) return;
    const gifImg = wrap.querySelector(".gif-embed-live");
    if (!gifImg) return;
    const origSrc = gifImg.dataset.origSrc || gifImg.dataset.gifSrc;
    if (!origSrc) return;

    // Cancel any pending auto-freeze timer
    if (gifImg._autoFreezeTimer) { clearTimeout(gifImg._autoFreezeTimer); gifImg._autoFreezeTimer = null; }

    // IMPORTANT: remove data-autofreeze so _onGifImgLoad won't instantly re-freeze (120ms)
    // when the img's load event fires after src is reset.
    const wasAutoFrozen = gifImg.dataset.autofreeze === "true";
    delete gifImg.dataset.autofreeze;

    gifImg.dataset.frozen = "false";
    gifImg.title = "Click to freeze";

    // Remove from persistent frozen set
    if (state.gifKeepFrozen && origSrc) {
      state.frozenGifs.delete(origSrc); _saveFrozenGifs();
    }

    // Keep canvas visible until the GIF has fully loaded → no size flash
    const frozenCanvas  = wrap.querySelector(".gif-freeze-canvas");
    const frozenOverlay = wrap.querySelector(".gif-freeze-overlay");

    gifImg.addEventListener("load", () => {
      // Swap: show live GIF, remove the frozen frame canvas
      frozenCanvas?.remove();
      frozenOverlay?.remove();
      gifImg.style.display = "";
      // Restart auto-freeze timer if applicable
      if (state.gifAutoFreeze || wasAutoFrozen) {
        _startAutoFreezeTimer(gifImg);
      }
      // Restore data-autofreeze attr for future freeze-by-default checks
      if (wasAutoFrozen && !state.gifAutoFreeze) {
        gifImg.dataset.autofreeze = "true";
      }
    }, { once: true });

    // Hide the img while loading (canvas still shown → no blank flash)
    gifImg.style.display = "none";
    // Reset GIF animation: empty → rAF → real src (forces restart from frame 1)
    gifImg.src = "";
    requestAnimationFrame(() => { gifImg.src = origSrc; });
    return;
  }
  // GIF freeze click (check BEFORE profile trigger)
  const gifEmbedA = e.target.closest(".gif-embed-live");
  if (gifEmbedA && gifEmbedA.dataset.frozen !== "true") {
    _freezeGifImg(gifEmbedA, /*manual=*/true);
    return;
  }

  const mentionEl=e.target.closest(".msg-mention");
  if (mentionEl) {
    const uid=mentionEl.dataset.mentionUid;
    if (uid) { showProfileCard(uid, e); return; }
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
  updateMentionAutocomplete();
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
  // Mention autocomplete navigation
  if (_mentionAcOpen && _mentionAcItems.length) {
    if (e.key==="ArrowDown") { e.preventDefault(); _mentionAcIndex=(_mentionAcIndex+1)%_mentionAcItems.length; updateMentionAcHighlight(); return; }
    if (e.key==="ArrowUp")   { e.preventDefault(); _mentionAcIndex=(_mentionAcIndex-1+_mentionAcItems.length)%_mentionAcItems.length; updateMentionAcHighlight(); return; }
    if (e.key==="Enter"||e.key==="Tab") { e.preventDefault(); insertMentionAcItem(_mentionAcIndex); return; }
    if (e.key==="Escape") { hideMentionAc(); return; }
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
  // Up arrow with empty composer → edit last own message (Discord behaviour)
  if (e.key==="ArrowUp" && composer.value==="") {
    e.preventDefault();
    const myMsgs=state.messages.filter(m=>m.senderUid===state.user?.uid&&!m.deleted);
    const last=myMsgs[myMsgs.length-1];
    if (last) startEditMessage(last.id, last.text||"");
  }
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
  let text=raw.trim();
  if (!text||!state.activeChatId) return;
  // Mark that the user is sending — the next ~1.5s of renderMessages() calls will
  // force-scroll to bottom (handles Firestore's local-cache + server double-fire).
  state._justSentByMeAt = Date.now();

  // @silent prefix — send without triggering notification sound for recipients
  let silent=false;
  if (/^@silent\b/i.test(text)) {
    silent=true;
    text=text.replace(/^@silent\s*/i,"").trim();
    if (!text) return; // don't send empty silent message
  }

  if (text.length>2000) { showToast("Message too long (2000 char max)"); return; }

  // Anonymous mode for school chats: replace name/photo per-message with a
  // fresh random ID. The real senderUid is still stored for moderation/admin.
  const isSchoolChat = state.activeChat?.schoolDomain;
  const useAnon = isSchoolChat && state.anonInSchoolChat;
  let anonName = null, anonId = null;
  if (useAnon) {
    anonId = "anon_" + Math.random().toString(36).slice(2, 10);
    anonName = "Anonymous Student #" + anonId.slice(5, 11);
  }
  const baseMsg = {
    senderUid: state.user.uid,                 // real uid (admin sees this)
    senderName: useAnon ? anonName : state.user.displayName,
    senderPhoto: useAnon ? null : (state.user.photoURL||null),
    anonymous: useAnon || false,
    anonMsgId: useAnon ? anonId : null,        // unique-per-message anonymous ID
    createdAt: serverTimestamp(),
    type:"text", edited:false, editedAt:null, reactions:{},
    replyToMessageId:state.replyTo?.id||null,
    replyToSenderName:state.replyTo?.senderName||null,
    replyToTextPreview:state.replyTo?.textPreview||null,
    // Future-proof scoring fields
    xpValue:1, activityType:"message", rewardFlags:[],
    ...(silent ? {silent:true} : {})
  };

  // /poll Question? | Opt A | Opt B [| Opt C ...] [duration:1h|30m|1d]
  if (/^\/poll\s+/i.test(text)) {
    const body = text.replace(/^\/poll\s+/i, "");
    // Optional trailing duration:Xh/Xm/Xd (default 24h)
    let durMs = 24 * 60 * 60 * 1000;
    const durMatch = body.match(/\bduration:(\d+)([smhd])\b/i);
    let pollBody = body;
    if (durMatch) {
      const n = parseInt(durMatch[1], 10);
      const unit = durMatch[2].toLowerCase();
      const mul = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] || 3600000;
      durMs = Math.max(60000, Math.min(7 * 86400000, n * mul));
      pollBody = body.replace(durMatch[0], "").trim();
    }
    const parts = pollBody.split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) {
      showToast("Format: /poll Question? | Opt A | Opt B [| Opt C…]");
      return;
    }
    const question = parts[0];
    const options = parts.slice(1, 11); // max 10
    composer.value = ""; composer.style.height = "auto"; updateSendBtn(); clearReplyTo();
    const chatId = state.activeChatId;
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        ...baseMsg, type: "poll", text: question,
        pollData: {
          question, options, votes: {},
          durationMs: durMs, endsAt: Date.now() + durMs,
          createdAt: Date.now(), createdBy: state.user.uid
        }
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: `📊 Poll: ${question.slice(0, 100)}`, lastMessageAt: serverTimestamp(), lastSenderUid: state.user.uid
      });
    } catch(err) { showToast("Send failed: " + err.message); composer.value = raw; }
    return;
  }

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
        // Reply-style: result message shows the original slash command as a reply preview
        const cmdRef = await addDoc(collection(db,"chats",chatId,"messages"),{
          ...baseMsg, text:result, type:"command", commandResult:true, xpValue:0,
          // Override reply fields to point back at the typed command (Discord-style)
          replyToMessageId: null,
          replyToSenderName: state.user.displayName,
          replyToTextPreview: text,  // e.g. "/8ball will I win?"
        });
        await updateDoc(doc(db,"chats",chatId),{ lastMessage:result.slice(0,200), lastMessageAt:serverTimestamp(), lastSenderUid:state.user.uid });
        _autoFlagCheck(text, cmdRef.id, chatId);
      } catch(err){ showToast("Send failed: "+err.message); composer.value=raw; }
      return;
    }
  }

  composer.value=""; composer.style.height="auto"; updateSendBtn(); clearReplyTo();
  clearTypingIndicator();
  const chatId=state.activeChatId;
  localStorage.removeItem(`sc_draft_${chatId}`);
  try {
    const msgRef = await addDoc(collection(db,"chats",chatId,"messages"),{ ...baseMsg, text });
    await updateDoc(doc(db,"chats",chatId),{ lastMessage:text.slice(0,200), lastMessageAt:serverTimestamp(), lastSenderUid:state.user.uid, lastMessageSilent:silent||false });
    // Autoflag check — silent, does not affect message delivery
    _autoFlagCheck(text, msgRef.id, chatId);
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
      return `📋 **Commands**\n/8ball [q] · /tod · /truth · /dare · /joke · /fortune · /advice · /coinflip · /roll [NdN] · /ship [a] [b] · /tip · /quote\n**Polls**: /poll Question? | Opt A | Opt B [| Opt C…] [duration:1h]\n**Aliases:** /cf /flip (coinflip) · /r /dice (roll) · /t (truth) · /d (dare) · /j (joke) · /f (fortune) · /a (advice) · /s (ship)`;
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
  if (ta) {
    ta.focus(); ta.selectionStart=ta.selectionEnd=ta.value.length;
    // Scroll the edit area into view so it's not hidden below the fold
    newMsgEl?.scrollIntoView({block:"nearest", behavior:"smooth"});
  }

  // Enter to save, esc to cancel inside textarea
  ta?.addEventListener("keydown", async e=>{
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); await editMessage(msgId,ta.value.trim()); }
    if (e.key==="Escape") { e.preventDefault(); renderMessages(); }
  });
}

async function editMessage(msgId, newText) {
  const chatId=state.activeChatId; if (!chatId) return;
  // If nothing actually changed, silently cancel — don't mark as edited
  const existing=state.messages.find(m=>m.id===msgId);
  if (existing && newText === (existing.text||"")) { renderMessages(); return; }
  if (!newText) {
    // Empty edit = offer to delete — call deleteDoc directly to avoid a second showConfirm from deleteMessage()
    renderMessages(); // restore normal view first
    showConfirm("Saving an empty message will delete it permanently.", async ()=>{
      try {
        await deleteDoc(doc(db,"chats",chatId,"messages",msgId));
        showToast("Message deleted.");
      } catch(err){ showToast("Delete failed: "+err.message); }
    }, {title:"Delete this message?", yesLabel:"Delete", danger:true});
    return;
  }
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
    // SCHOOL CHAT GUARD: only allow if email domain matches
    if (chatData.schoolDomain) {
      const myDom = _userSchoolDomain();
      if (myDom !== chatData.schoolDomain) {
        showToast("This is a school chat. You need a matching email domain to join.");
        return;
      }
    }
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
   GROUP INFO MODAL — edit name/pic/desc, invite code, members, leave
   ===================================================================== */
function _generateInviteCode(len=6) {
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,1,0
  let s=""; for (let i=0;i<len;i++) s+=chars.charAt(Math.floor(Math.random()*chars.length));
  return s;
}

async function openGroupInfoModal(chatId) {
  const c = chatId ? state.chats.find(x=>x.id===chatId) || state.activeChat : state.activeChat;
  if (!c || c.type!=="group") { showToast("Not a group chat"); return; }
  state._groupInfoChatId = c.id;

  const isSchoolChat = !!c.schoolDomain;
  const isFirstMember = isSchoolChat && c.firstMember === state.user.uid;

  // For school chats: Title shows domain + nickname; name is locked
  if (isSchoolChat) {
    const display = c.chatNickname ? `🎓 ${c.schoolDomain} · ${c.chatNickname}` : (c.name || `🎓 ${c.schoolDomain}`);
    $("#group-info-title").textContent = display;
  } else {
    $("#group-info-title").textContent = c.name || "Group";
  }
  $("#group-info-name-input").value = isSchoolChat ? (c.chatNickname || "") : (c.name || "");
  $("#group-info-photo-input").value = c.photoURL || "";
  $("#group-info-desc-input").value = c.description || "";
  const code = c.joinCode || (isSchoolChat ? "(domain-only)" : "—");
  $("#group-info-code").textContent = code;

  // Toggle UI for school chats
  // - Name input becomes "Chat Nickname" (only firstMember can edit, no one for non-firstMember)
  // - Description is read-only for non-firstMember
  // - Invite code section hidden (school chats don't use codes)
  // - Show governance notice
  const nameLabel = $("#group-info-modal").querySelector('label[for="group-info-name-input"]') ||
                    $("#group-info-modal").querySelectorAll(".modal-label")[0];
  if (nameLabel) nameLabel.textContent = isSchoolChat ? "Chat Nickname (semi-leader only)" : "Group Name";
  $("#group-info-name-input").placeholder = isSchoolChat ? "e.g. Cool Crew" : "Group name";
  $("#group-info-name-input").disabled = isSchoolChat && !isFirstMember;
  $("#group-info-save-name-btn").disabled = isSchoolChat && !isFirstMember;
  $("#group-info-photo-input").disabled = isSchoolChat && !isFirstMember;
  $("#group-info-save-photo-btn").disabled = isSchoolChat && !isFirstMember;
  // Description: school chats are democratic — for now, lock description from edits
  $("#group-info-desc-input").disabled = isSchoolChat;
  $("#group-info-save-desc-btn").style.display = isSchoolChat ? "none" : "";
  // Hide invite code regen for school chats
  const codeSection = $("#group-info-modal").querySelectorAll(".group-info-section")[0];
  if (codeSection) codeSection.style.display = isSchoolChat ? "none" : "";

  // School governance notice + propose-vote button
  let notice = $("#group-info-school-notice");
  if (isSchoolChat) {
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "group-info-school-notice";
      notice.className = "school-warning";
      notice.style.cssText = "margin:10px 0;font-size:12.5px;";
      $("#group-info-modal").querySelector(".modal-body").prepend(notice);
    }
    notice.innerHTML = `<strong>🎓 Democratic school chat.</strong> ${isFirstMember ? "As the first member, you can set the chat photo and nickname directly." : "Anyone can propose a change with a poll — if 50%+ of voters vote yes within the time window, it'll auto-apply."}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn-secondary" data-school-propose="nickname" style="font-size:12px;">📝 Propose nickname change</button>
        <button class="btn-secondary" data-school-propose="photoURL" style="font-size:12px;">🖼️ Propose photo change</button>
        <button class="btn-secondary" data-school-propose="description" style="font-size:12px;">📄 Propose description change</button>
      </div>`;
  } else if (notice) {
    notice.remove();
  }

  // Render avatar
  const avEl = $("#group-info-avatar");
  if (c.photoURL) avEl.innerHTML = `<img src="${escapeHtml(c.photoURL)}" alt="" />`;
  else avEl.innerHTML = `<span>${escapeHtml(groupInitials(c.name||"G"))}</span>`;

  // Render members with crowns + actions
  const myUid = state.user.uid;
  const isLeader = Array.isArray(c.leaders) && c.leaders.includes(myUid);
  const leaders = Array.isArray(c.leaders) ? c.leaders : [];
  $("#group-info-member-count").textContent = c.members.length;
  const list = $("#group-info-members-list");

  const memberHtml = await Promise.all(c.members.map(async uid=>{
    const p = state.userCache[uid] || await fetchUserProfile(uid) || {};
    const name = p.username || p.displayName || "User";
    const isThemLeader = leaders.includes(uid);
    const isSelf = uid===myUid;
    const crown = isThemLeader ? `<svg viewBox="0 0 24 24" width="12" height="12" style="color:#f59e0b;flex-shrink:0;"><path fill="currentColor" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>` : "";

    // Action buttons (only leaders see them, and not for themselves)
    let actions = "";
    if (isLeader && !isSelf) {
      if (!isThemLeader) {
        actions += `<button class="icon-btn" data-gm-action="promote" data-gm-uid="${escapeHtml(uid)}" title="Promote to leader" style="padding:2px;"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg></button>`;
      } else {
        actions += `<button class="icon-btn" data-gm-action="demote" data-gm-uid="${escapeHtml(uid)}" title="Remove leader" style="padding:2px;color:var(--t-muted);"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg></button>`;
      }
      actions += `<button class="icon-btn" data-gm-action="kick" data-gm-uid="${escapeHtml(uid)}" title="Kick from group" style="padding:2px;color:var(--c-danger);"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;
    }

    return `<div class="group-info-member" data-profile-uid="${escapeHtml(uid)}">
      ${avatarMarkup(name, p.photoURL, "group-info-member-avatar", "group-info-member-fallback")}
      <span class="group-info-member-name">${escapeHtml(name)}${isSelf?" (you)":""}</span>
      ${crown}
      <span class="group-info-member-actions">${actions}</span>
    </div>`;
  }));
  list.innerHTML = memberHtml.join("");

  openModal("group-info-modal");
}

// Header gear button → open modal
$("#chat-group-info-btn")?.addEventListener("click", ()=>openGroupInfoModal());

// Anonymous toggle
$("#chat-anon-toggle-btn")?.addEventListener("click", () => {
  state.anonInSchoolChat = !state.anonInSchoolChat;
  localStorage.setItem("sc_anon_school", state.anonInSchoolChat ? "true" : "false");
  showToast(state.anonInSchoolChat
    ? "🎭 Anonymous mode ON — admins can still see your real identity for safety reasons"
    : "Anonymous mode OFF");
  renderChatHeader();
});

// Save name (or chatNickname for school chats)
$("#group-info-save-name-btn")?.addEventListener("click", async ()=>{
  const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
  const newName = $("#group-info-name-input").value.trim();
  if (newName.length>50) { showToast("Too long (50 max)"); return; }

  if (c.schoolDomain) {
    // School chat: only firstMember can update chatNickname (chat name is locked)
    if (c.firstMember !== state.user.uid) { showToast("Only the first member can change the nickname."); return; }
    try {
      await updateDoc(doc(db,"chats",c.id), { chatNickname: newName });
      showToast(newName ? "Nickname updated" : "Nickname cleared");
      const display = newName ? `🎓 ${c.schoolDomain} · ${newName}` : `🎓 ${c.schoolDomain}`;
      $("#group-info-title").textContent = display;
    } catch(err){ showToast("Error: "+err.message); }
    return;
  }

  if (!newName) { showToast("Name can't be empty"); return; }
  try {
    await updateDoc(doc(db,"chats",c.id), { name: newName });
    showToast("Group name updated");
    $("#group-info-title").textContent = newName;
  } catch(err){ showToast("Error: "+err.message); }
});

// Save photo URL
$("#group-info-save-photo-btn")?.addEventListener("click", async ()=>{
  const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
  if (c.schoolDomain && c.firstMember !== state.user.uid) {
    showToast("Only the first member can change the chat photo.");
    return;
  }
  const url = $("#group-info-photo-input").value.trim();
  try {
    await updateDoc(doc(db,"chats",c.id), { photoURL: url || null });
    showToast(url ? "Group picture updated" : "Group picture cleared");
    const avEl = $("#group-info-avatar");
    if (url) avEl.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
    else avEl.innerHTML = `<span>${escapeHtml(groupInitials(c.name||"G"))}</span>`;
  } catch(err){ showToast("Error: "+err.message); }
});

// Save description
$("#group-info-save-desc-btn")?.addEventListener("click", async ()=>{
  const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
  const desc = $("#group-info-desc-input").value.trim();
  try {
    await updateDoc(doc(db,"chats",c.id), { description: desc });
    showToast("Description saved");
  } catch(err){ showToast("Error: "+err.message); }
});

// Regenerate invite code
$("#group-info-regen-code")?.addEventListener("click", ()=>{
  const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
  showConfirm("Regenerate invite code? The old code will stop working.", async ()=>{
    try {
      const code = _generateInviteCode();
      await updateDoc(doc(db,"chats",c.id), { joinCode: code });
      $("#group-info-code").textContent = code;
      showToast("New code: "+code);
    } catch(err){ showToast("Error: "+err.message); }
  }, {title:"Regenerate Code", yesLabel:"Regenerate", danger:true});
});

// Click invite code → copy
$("#group-info-code")?.addEventListener("click", e=>{
  const code = e.target.textContent.trim();
  if (code && code!=="—") { navigator.clipboard.writeText(code).catch(()=>{}); showToast("Code copied!"); }
});

// Leave group
$("#group-info-leave-btn")?.addEventListener("click", ()=>{
  const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
  showConfirm(`Leave "${c.name}"?`, async ()=>{
    try {
      const newMembers=c.members.filter(m=>m!==state.user.uid);
      const newLeaders=(c.leaders||[]).filter(m=>m!==state.user.uid);
      await updateDoc(doc(db,"chats",c.id),{members:newMembers,leaders:newLeaders});
      closeModal("group-info-modal");
      showFriendsView(); showToast("Left group");
    } catch(err){ showToast("Error: "+err.message); }
  }, { title:"Leave Group", yesLabel:"Leave", danger:true });
});

// Member action delegation: promote/demote/kick + click to view profile
$("#group-info-members-list")?.addEventListener("click", async e=>{
  const btn = e.target.closest("[data-gm-action]");
  if (btn) {
    e.stopPropagation();
    const c = state.chats.find(x=>x.id===state._groupInfoChatId); if (!c) return;
    const action = btn.dataset.gmAction, uid = btn.dataset.gmUid;
    try {
      if (action==="promote") {
        const newLeaders=[...(c.leaders||[]),uid];
        await updateDoc(doc(db,"chats",c.id),{leaders:newLeaders});
        showToast("Promoted to leader");
        openGroupInfoModal(c.id); // refresh
      } else if (action==="demote") {
        const newLeaders=(c.leaders||[]).filter(m=>m!==uid);
        await updateDoc(doc(db,"chats",c.id),{leaders:newLeaders});
        showToast("Removed leader role");
        openGroupInfoModal(c.id);
      } else if (action==="kick") {
        showConfirm("Kick this member?", async ()=>{
          const newMembers=c.members.filter(m=>m!==uid);
          const newLeaders=(c.leaders||[]).filter(m=>m!==uid);
          await updateDoc(doc(db,"chats",c.id),{members:newMembers,leaders:newLeaders});
          showToast("Member kicked");
          openGroupInfoModal(c.id);
        }, {title:"Kick Member", yesLabel:"Kick", danger:true});
      }
    } catch(err){ showToast("Error: "+err.message); }
    return;
  }
  // Click row → view profile
  const row = e.target.closest("[data-profile-uid]");
  if (row) showFullProfile(row.dataset.profileUid);
});


/* =====================================================================
   SCHOOL DISCOVERY
   Lets users with non-gmail email domains opt in to a directory of
   other users from the same school domain. Includes a school-wide
   group chat (auto-joined on opt-in).
   ===================================================================== */
const _BLOCKED_DOMAINS = new Set(["gmail.com","googlemail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","aol.com","protonmail.com","proton.me","live.com","me.com"]);

function _userSchoolDomain() {
  const email = (state.user?.email || "").toLowerCase();
  const at = email.indexOf("@");
  if (at < 0) return null;
  const dom = email.slice(at+1);
  if (!dom || _BLOCKED_DOMAINS.has(dom)) return null;
  return dom;
}

function _updateSchoolRailVisibility() {
  const btn = $("#rail-school");
  if (!btn) return;
  const dom = _userSchoolDomain();
  btn.classList.toggle("hidden", !dom);
  if (dom) btn.title = `School Discovery — ${dom}`;
}

let _schoolMembersUnsub = null;

async function openSchoolModal() {
  const dom = _userSchoolDomain();
  if (!dom) { showToast("School Discovery is only for non-personal email domains."); return; }

  $("#school-domain-display").textContent = dom;
  $("#school-directory-domain").textContent = dom;

  // Check if already opted in
  let optedIn = false;
  try {
    const snap = await getDoc(doc(db, "EducationDiscovery", dom, "members", state.user.uid));
    optedIn = snap.exists();
  } catch(_){}

  if (optedIn) _showSchoolDirectory(dom);
  else _showSchoolOptin(dom);
  openModal("school-modal");
}

function _showSchoolOptin(dom) {
  $("#school-optin-view").classList.remove("hidden");
  $("#school-directory-view").classList.add("hidden");
  $("#school-consent-check").checked = false;
  $("#school-join-btn").disabled = true;
}

let _schoolGradeFilter = "";

async function _showSchoolDirectory(dom) {
  $("#school-optin-view").classList.add("hidden");
  $("#school-directory-view").classList.remove("hidden");
  $("#school-filters-row")?.classList.remove("hidden");

  // Listen to members
  if (_schoolMembersUnsub) { _schoolMembersUnsub(); _schoolMembersUnsub = null; }
  const list = $("#school-members-list");
  list.innerHTML = `<div class="empty" style="padding:18px;color:var(--t-muted);">Loading…</div>`;

  try {
    _schoolMembersUnsub = onSnapshot(
      collection(db, "EducationDiscovery", dom, "members"),
      snap => {
        const allMembers = snap.docs.map(d => d.data());
        const members = _schoolGradeFilter
          ? allMembers.filter(m => m.grade === _schoolGradeFilter)
          : allMembers;
        $("#school-directory-count").textContent = `${members.length}${_schoolGradeFilter ? ` of ${allMembers.length}` : ""}`;
        if (!members.length) {
          list.innerHTML = `<div class="empty" style="padding:18px;color:var(--t-muted);">${_schoolGradeFilter?"No members match that grade.":"No other members yet — be the first!"}</div>`;
          return;
        }
        const GRADE_LABELS = { freshman:"🌱 Freshman", sophomore:"📗 Sophomore", junior:"🎒 Junior", senior:"🎓 Senior", grad:"🎓 Grad", staff:"👨‍🏫 Staff" };
        list.innerHTML = members.map(m => {
          const username = m.username || "User";
          const displayName = m.nickname ? m.nickname : username;
          const bio = m.bio || "";
          const isMe = m.uid === state.user.uid;
          const gradeChip = m.grade && GRADE_LABELS[m.grade]
            ? `<span class="school-grade-chip" title="Self-reported — anyone can claim any grade">${escapeHtml(GRADE_LABELS[m.grade])}</span>` : "";
          const nameLine = m.nickname
            ? `${escapeHtml(displayName)} <small style='color:var(--t-muted);font-weight:400;'>(@${escapeHtml(username)})</small>`
            : escapeHtml(displayName);
          return `<div class="school-member-row" data-profile-uid="${escapeHtml(m.uid)}">
            ${avatarMarkup(displayName, m.photoURL, "side-row-avatar", "side-row-fallback")}
            <div class="school-member-info">
              <div class="school-member-name">${nameLine}${gradeChip}${isMe?" <small style='color:var(--t-muted);font-weight:400;'>(you)</small>":""}</div>
              <div class="school-member-bio">${escapeHtml(bio.slice(0,80) || "No bio")}</div>
            </div>
          </div>`;
        }).join("");
      },
      err => {
        console.warn("school members:", err);
        list.innerHTML = `<div class="empty" style="padding:18px;color:var(--c-danger);">Couldn't load members: ${escapeHtml(err.message||"unknown error")}</div>`;
      }
    );
  } catch(err) {
    list.innerHTML = `<div class="empty" style="padding:18px;color:var(--c-danger);">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// Consent checkbox enables the join button
document.addEventListener("change", e => {
  if (e.target.id === "school-consent-check") {
    const btn = $("#school-join-btn"); if (btn) btn.disabled = !e.target.checked;
  }
});

// Opt in (with optional nickname)
$("#school-join-btn")?.addEventListener("click", async () => {
  const dom = _userSchoolDomain(); if (!dom || !state.user) return;
  if (!$("#school-consent-check").checked) return;
  const btn = $("#school-join-btn");
  btn.disabled = true; btn.textContent = "Joining…";
  try {
    const nickname = ($("#school-nickname-input")?.value || "").trim().slice(0, 32);
    const grade = ($("#school-grad-input")?.value || "").trim();
    await setDoc(doc(db, "EducationDiscovery", dom, "members", state.user.uid), {
      uid: state.user.uid,
      username: state.user.username || state.user.displayName,
      nickname: nickname || null,
      grade: grade || null,
      photoURL: state.user.photoURL || null,
      bio: state.user.bio || "",
      joinedAt: serverTimestamp()
    });
    await setDoc(doc(db, "EducationDiscovery", dom), {
      domain: dom, lastJoinedAt: serverTimestamp()
    }, { merge: true });
    showToast("✓ Welcome to the directory!");
    _showSchoolDirectory(dom);
  } catch(err) {
    showToast("Error joining: " + err.message);
    btn.disabled = false; btn.textContent = "Opt In & Continue";
  }
});

// Leave directory
$("#school-leave-btn")?.addEventListener("click", () => {
  const dom = _userSchoolDomain(); if (!dom) return;
  showConfirm("Stop being discoverable to other " + dom + " members?", async () => {
    try {
      await deleteDoc(doc(db, "EducationDiscovery", dom, "members", state.user.uid));
      showToast("Left the directory");
      closeModal("school-modal");
      if (_schoolMembersUnsub) { _schoolMembersUnsub(); _schoolMembersUnsub = null; }
    } catch(err) { showToast("Error: " + err.message); }
  }, { title: "Leave Directory", yesLabel: "Leave", danger: true });
});

// Sanitize a domain into a Firestore-safe deterministic chat id
function _schoolChatId(domain) {
  return "eduDisc_" + domain.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

// Open school chat — find or create the deterministic school chat
$("#school-open-chat-btn")?.addEventListener("click", async () => {
  const dom = _userSchoolDomain(); if (!dom || !state.user) return;
  const btn = $("#school-open-chat-btn");
  btn.disabled = true;
  try {
    const chatId = _schoolChatId(dom);
    const chatSnap = await getDoc(doc(db, "chats", chatId));
    if (!chatSnap.exists()) {
      // First joiner creates the chat (semi-leader for photo & nickname only)
      await setDoc(doc(db, "chats", chatId), {
        type: "group",
        schoolDomain: dom,
        firstMember: state.user.uid,    // semi-leader: photo + nickname edits only
        members: [state.user.uid],
        leaders: [],                     // no traditional leaders — democratic
        name: `🎓 ${dom}`,
        chatNickname: "",                // optional nickname set by firstMember
        description: `Auto-created school chat for ${dom}. Verify identities before sharing personal info — domain match is not identity.`,
        createdBy: state.user.uid,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        // No joinCode — school chats are joined only via Discovery
      });
      await setDoc(doc(db, "EducationDiscovery", dom), {
        chatId, domain: dom, lastJoinedAt: serverTimestamp()
      }, { merge: true });
    } else if (!chatSnap.data().members.includes(state.user.uid)) {
      // Auto-add — already opted in, just join the chat
      await updateDoc(doc(db, "chats", chatId), { members: arrayUnion(state.user.uid) });
    }
    closeModal("school-modal");
    openChat(chatId);
  } catch(err) {
    showToast("Error opening school chat: " + err.message);
  } finally {
    btn.disabled = false;
  }
});

// Rail button click
$("#rail-school")?.addEventListener("click", openSchoolModal);

// Grade-filter chip clicks
document.addEventListener("click", e => {
  const chip = e.target.closest("[data-grade-filter]");
  if (!chip) return;
  $$("[data-grade-filter]").forEach(b => b.classList.remove("active"));
  chip.classList.add("active");
  _schoolGradeFilter = chip.dataset.gradeFilter || "";
  // Re-render via the existing onSnapshot — trigger by toggling the filter; the listener will fire fresh on next change.
  // For immediate feedback, manually re-fetch:
  const dom = _userSchoolDomain(); if (!dom) return;
  if (_schoolMembersUnsub) { _schoolMembersUnsub(); _schoolMembersUnsub = null; _showSchoolDirectory(dom); }
});

// Member row click → full profile
$("#school-members-list")?.addEventListener("click", e => {
  const row = e.target.closest("[data-profile-uid]");
  if (row) {
    e.stopPropagation();
    showFullProfile(row.dataset.profileUid);
  }
});

/* ---------- Diverge: Create private group from school directory ---------- */
let _divergeSelections = new Set();

$("#school-diverge-btn")?.addEventListener("click", async () => {
  const dom = _userSchoolDomain(); if (!dom) return;
  _divergeSelections.clear();
  $("#school-diverge-name").value = "";
  // Pull directory members
  const list = $("#school-diverge-list");
  list.innerHTML = `<div class="empty" style="padding:12px;color:var(--t-muted);">Loading…</div>`;
  try {
    const snap = await getDocs(collection(db, "EducationDiscovery", dom, "members"));
    const members = snap.docs.map(d => d.data()).filter(m => m.uid !== state.user.uid);
    if (!members.length) {
      list.innerHTML = `<div class="empty" style="padding:12px;">No other classmates in the directory yet.</div>`;
    } else {
      list.innerHTML = members.map(m => {
        const display = m.nickname || m.username || "User";
        return `<label class="school-member-row" style="cursor:pointer;">
          <input type="checkbox" data-diverge-uid="${escapeHtml(m.uid)}" data-diverge-name="${escapeHtml(display)}" data-diverge-photo="${escapeHtml(m.photoURL||'')}" style="margin-right:8px;flex-shrink:0;" />
          ${avatarMarkup(display, m.photoURL, "side-row-avatar", "side-row-fallback")}
          <div class="school-member-info">
            <div class="school-member-name">${escapeHtml(display)}</div>
            <div class="school-member-bio">${escapeHtml((m.bio||"").slice(0,60))}</div>
          </div>
        </label>`;
      }).join("");
    }
    openModal("school-diverge-modal");
  } catch(err) {
    showToast("Couldn't load directory: " + err.message);
  }
});

$("#school-diverge-list")?.addEventListener("change", e => {
  if (e.target.matches('[data-diverge-uid]')) {
    const uid = e.target.dataset.divergeUid;
    if (e.target.checked) _divergeSelections.add(uid);
    else _divergeSelections.delete(uid);
  }
});

$("#school-diverge-create-btn")?.addEventListener("click", async () => {
  const name = $("#school-diverge-name").value.trim();
  if (!name) { showToast("Give the group a name"); return; }
  if (_divergeSelections.size < 1) { showToast("Pick at least one classmate"); return; }
  const btn = $("#school-diverge-create-btn");
  btn.disabled = true; btn.textContent = "Creating…";
  try {
    const memberUids = [state.user.uid, ..._divergeSelections];
    const ref = await addDoc(collection(db, "chats"), {
      type: "group",
      members: memberUids,
      leaders: [state.user.uid],
      name,
      createdBy: state.user.uid,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      // No schoolDomain — this is a regular private group, fully separate
      joinCode: _generateInviteCode()
    });
    closeModal("school-diverge-modal");
    closeModal("school-modal");
    showToast(`✓ Created "${name}"`);
    openChat(ref.id);
  } catch(err) {
    showToast("Error: " + err.message);
    btn.disabled = false; btn.textContent = "Create Group";
  }
});


/* =====================================================================
   MODALS
   ===================================================================== */
function openModal(id)  { const m=document.getElementById(id); if(m) m.classList.remove("hidden"); }
function closeModal(id) { const m=document.getElementById(id); if(m) m.classList.add("hidden"); }
$$("[data-close]").forEach(b=>b.addEventListener("click",()=>{
  // settings-modal has a dirty-check interceptor at the document level — skip here
  if (b.dataset.close==="settings-modal") return;
  closeModal(b.dataset.close);
}));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{
  if (e.target===m) {
    // settings-modal backdrop handled by document listener (dirty-check)
    if (m.id==="settings-modal") return;
    m.classList.add("hidden");
  }
}));

// Track whether account-pane fields have unsaved changes
let _settingsDirty = false;
function _markSettingsDirty() {
  _settingsDirty = true;
  // Add CSS class so Save Changes button pulses to indicate unsaved state
  $("#settings-modal")?.classList.add("settings-dirty");
}

// Wire dirty tracking to account form fields
["settings-username-input","settings-bio-input","settings-photo-input","settings-custom-status-input"].forEach(id=>{
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
      $("#settings-modal")?.classList.remove("settings-dirty");
      if (_pendingTheme!==null && _pendingTheme!==state.theme) applyTheme(state.theme);
      closeModal("settings-modal");
    }, {title:"Unsaved changes", yesLabel:"Discard", danger:true,
        noLabel:"Keep Editing"  /* Cancel = keep editing */
    });
    return;
  }
  _settingsDirty=false;
  $("#settings-modal")?.classList.remove("settings-dirty");
  if (_pendingTheme!==null && _pendingTheme!==state.theme) applyTheme(state.theme);
  closeModal("settings-modal");
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

$("#settings-btn").addEventListener("click", () => openSettingsModal());

let _lastSettingsPane="account";
function switchSettingsPane(paneId) {
  _lastSettingsPane=paneId;
  $$(".settings-pane").forEach(p=>p.classList.toggle("hidden",p.dataset.pane!==paneId));
  $$(".settings-discord-nav-item[data-pane]").forEach(n=>n.classList.toggle("active",n.dataset.pane===paneId));
}

function openSettingsModal(pane) {
  // Guard: if called with an Event object (from addEventListener), ignore it
  if (typeof pane !== "string") pane = null;
  // Use last-opened pane if none specified
  if (!pane) pane=_lastSettingsPane||"account";
  // Remap removed panes to merged ones
  if (pane==="profile")       pane="account";
  if (pane==="notifications")  pane="appearance";
  _settingsDirty = false; // reset dirty flag each open
  $("#settings-modal")?.classList.remove("settings-dirty");
  const u=state.user;
  _pendingTheme=state.theme;
  _pendingStatus=state.status;
  _pendingBannerColor=state.bannerColor;
  _pendingPrivate=state.isPrivate;

  if($("#settings-username-input"))       $("#settings-username-input").value=u.username||u.displayName||"";
  if($("#settings-tag-display"))          $("#settings-tag-display").textContent=u.discriminator?`#${u.discriminator}`:"#????";
  if($("#settings-bio-input"))            $("#settings-bio-input").value=u.bio||"";
  if($("#settings-photo-input"))          $("#settings-photo-input").value=u.photoURL||"";
  if($("#settings-custom-status-input"))  $("#settings-custom-status-input").value=state.customStatus||"";
  if($("#settings-sound-toggle"))              $("#settings-sound-toggle").checked=state.soundEnabled;
  if($("#settings-hints-toggle"))              $("#settings-hints-toggle").checked=localStorage.getItem("sc_hints")!=="false";
  if($("#settings-autosend-gif-toggle"))            $("#settings-autosend-gif-toggle").checked=state.autoSendGif;
  if($("#settings-gif-freeze-default-toggle"))  $("#settings-gif-freeze-default-toggle").checked=state.gifFreezeDefault;
  if($("#settings-gif-keep-frozen-toggle"))     $("#settings-gif-keep-frozen-toggle").checked=state.gifKeepFrozen;
  if($("#settings-gif-autofreeze-toggle"))      $("#settings-gif-autofreeze-toggle").checked=state.gifAutoFreeze;
  if($("#settings-compact-toggle"))            $("#settings-compact-toggle").checked=state.compactMode;
  $$(".text-size-btn").forEach(b=>b.classList.toggle("active", parseFloat(b.dataset.size)===state.textSize));
  if($("#settings-show-last-active-toggle"))   $("#settings-show-last-active-toggle").checked=state.showLastActive;
  if($("#settings-autoscroll-toggle"))         $("#settings-autoscroll-toggle").checked=state.autoScrollNew;
  // Birthday from cached profile
  const myProf = state.userCache[state.user?.uid] || {};
  if (myProf.birthday) {
    if ($("#settings-birthday-month")) $("#settings-birthday-month").value = String(myProf.birthday.month||"");
    if ($("#settings-birthday-day")) $("#settings-birthday-day").value = String(myProf.birthday.day||"");
  }
  // PFP animate mode
  const pfpRadio = document.querySelector(`input[name="pfp-animate"][value="${state.pfpAnimate}"]`);
  if (pfpRadio) pfpRadio.checked = true;
  if($("#settings-dblclick-react-toggle"))     $("#settings-dblclick-react-toggle").checked=state.dblClickReact;
  if($("#settings-dblclick-emoji"))            $("#settings-dblclick-emoji").value=state.dblClickEmoji;
  if($("#dblclick-emoji-preview"))             $("#dblclick-emoji-preview").textContent=state.dblClickEmoji;
  // Double-click mode radio
  const modeRadio = document.querySelector(`input[name="dblclick-mode"][value="${state.dblClickMode}"]`);
  if (modeRadio) modeRadio.checked = true;
  const ch = $("#dblclick-emoji-chooser");
  if (ch) ch.style.display = (state.dblClickMode === "emoji") ? "" : "none";
  if($("#settings-silent-typing-toggle"))      $("#settings-silent-typing-toggle").checked=state.silentTyping;
  // Show/hide dblclick emoji row
  const dblRow=$("#dblclick-emoji-row"); if(dblRow) dblRow.style.display=state.dblClickReact?"":"none";

  $$(".theme-swatch").forEach(sw=>sw.classList.toggle("active",sw.dataset.theme===_pendingTheme));
  // Show custom pickers if current theme is custom, and restore picker values
  const customPickers=$("#theme-custom-pickers");
  if (customPickers) {
    customPickers.style.display=(_pendingTheme==="custom")?"":"none";
    const tcBg=$("#tc-bg"), tcSb=$("#tc-sidebar"), tcAc=$("#tc-accent");
    if(tcBg) tcBg.value=localStorage.getItem("sc_custom_bg")||"#1a1b1e";
    if(tcSb) tcSb.value=localStorage.getItem("sc_custom_sidebar")||"#131416";
    if(tcAc) tcAc.value=localStorage.getItem("sc_custom_accent")||"#4f7cff";
  }
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

  _refreshSettingsPreview(u);
  switchSettingsPane(pane);
  // Clear settings search
  const settingsSearch=$("#settings-search-input");
  if (settingsSearch) { settingsSearch.value=""; }
  $$(".settings-field-group, .settings-toggle-row, .settings-section-title").forEach(f=>{ f.style.display=""; f.style.opacity=""; });
  openModal("settings-modal");
}

// Settings Discord left-nav clicks
document.addEventListener("click", e=>{
  const navItem=e.target.closest(".settings-discord-nav-item[data-pane]");
  if (navItem) switchSettingsPane(navItem.dataset.pane);
});

// Settings search
document.addEventListener("input", e=>{
  if (e.target.id !== "settings-search-input") return;
  const q=e.target.value.trim().toLowerCase();
  const allPanes=$$(".settings-pane");
  const allFields=$$(".settings-field-group, .settings-toggle-row, .settings-section-title");
  if (!q) {
    // Restore normal view — just show current pane
    allFields.forEach(f=>{ f.style.display=""; f.style.opacity=""; });
    return;
  }
  // Show ALL panes during search
  allPanes.forEach(p=>p.classList.remove("hidden"));
  // Highlight matching fields
  allFields.forEach(f=>{
    const text=f.textContent.toLowerCase();
    const match=text.includes(q);
    f.style.display=match?"":"none";
    f.style.opacity=match?"1":"";
  });
});

// Second Save Changes button (in Profile pane) delegates to main one
document.addEventListener("click", e=>{
  if (e.target.closest("#settings-save-btn-2")) $("#settings-save-btn")?.click();
  if (e.target.closest("#settings-signout-btn")) {
    closeModal("settings-modal");
    setTimeout(()=>{
      showConfirm("You'll need to sign in again to use Static Chat.", async ()=>{
        cleanupAllSubscriptions();
        await signOut(auth).catch(()=>{});
      }, {title:"Sign out?", yesLabel:"Sign Out", danger:true});
    }, 150);
  }
});

// Full settings preview refresh — used on open and on any field change
function _refreshSettingsPreview(u) {
  u = u || state.user;
  const name       = $("#settings-username-input")?.value.trim()      || u?.username || u?.displayName || "";
  const photo      = $("#settings-photo-input")?.value.trim()         || null;
  const bio        = $("#settings-bio-input")?.value.trim()           || "";
  const statusTxt  = $("#settings-custom-status-input")?.value.trim() || state.customStatus || "";

  updateAvatarPreview("settings", name, photo);

  const set = (id, val) => { const el=$("#"+id); if(el) el.textContent=val; };
  set("settings-preview-name",   name || "Username");
  set("settings-preview-tag",    u?.discriminator ? `#${u.discriminator}` : "");
  set("settings-preview-bio",    bio  || "No bio set yet.");
  set("settings-preview-custom-status", statusTxt);

  // Status dot
  const sDot = $("#settings-preview-status-dot");
  if (sDot) sDot.dataset.status = resolveStatus(u) || "online";

  // Badges
  const pBadges = $("#settings-preview-badges");
  if (pBadges) pBadges.innerHTML = renderBadges(state.userCache[u?.uid]?.badges || []);

  // Member since
  const sinceWrap = $("#settings-preview-since-wrap");
  const sinceSpan = $("#settings-preview-since");
  if (u?.createdAt && sinceWrap && sinceSpan) {
    const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    sinceSpan.textContent = d.toLocaleDateString(undefined, {year:"numeric", month:"long"});
    sinceWrap.style.display = "";
  }

  // Banner
  const banner = $("#settings-preview-banner");
  if (banner && _pendingBannerColor) {
    const parts = _pendingBannerColor.split(",");
    banner.style.background = parts.length >= 2
      ? `linear-gradient(135deg,${parts[0]},${parts[1]})` : parts[0];
  } else if (banner) {
    banner.style.background = "linear-gradient(135deg,var(--c-input-2),var(--c-rail))";
  }
}

// Keep legacy name so other call sites still work
function _updateSettingsPreview() { _refreshSettingsPreview(); }

// Settings live preview — update on any field change
["settings-photo-input","settings-username-input","settings-bio-input","settings-custom-status-input"].forEach(id=>{
  document.addEventListener("input",e=>{ if(e.target.id===id) _refreshSettingsPreview(); });
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
// Text size buttons — instant-apply
document.addEventListener("click", e => {
  const btn = e.target.closest(".text-size-btn");
  if (!btn) return;
  const size = parseFloat(btn.dataset.size);
  if (!size) return;
  state.textSize = size;
  localStorage.setItem("sc_text_size", size);
  document.body.style.setProperty("--msg-font-size", size + "px");
  $$(".text-size-btn").forEach(b => b.classList.toggle("active", b.dataset.size == btn.dataset.size));
});
$("#settings-dblclick-react-toggle")?.addEventListener("change", e => {
  state.dblClickReact = e.target.checked;
  localStorage.setItem("sc_dblclick_react", e.target.checked ? "true" : "false");
  const row=$("#dblclick-emoji-row"); if(row) row.style.display=e.target.checked?"":"none";
});
// Double-click mode (emoji vs picker)
document.addEventListener("change", e => {
  if (e.target.name !== "dblclick-mode") return;
  state.dblClickMode = e.target.value;
  localStorage.setItem("sc_dblclick_mode", e.target.value);
  const ch = $("#dblclick-emoji-chooser");
  if (ch) ch.style.display = (e.target.value === "emoji") ? "" : "none";
});

// Profile picture animation mode
document.addEventListener("change", e => {
  if (e.target.name !== "pfp-animate") return;
  state.pfpAnimate = e.target.value;
  localStorage.setItem("sc_pfp_animate", e.target.value);
  // Re-render visible UI so the new mode applies immediately
  renderMessages?.(); renderChatLists?.(); renderFriendsList?.(); renderChatHeader?.(); updateUserPanel?.();
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
$("#settings-autoscroll-toggle")?.addEventListener("change", e => {
  state.autoScrollNew = e.target.checked;
  localStorage.setItem("sc_auto_scroll", e.target.checked ? "true" : "false");
});
// Birthday: save month/day on change to user profile
async function _saveBirthday() {
  if (!state.user?.uid) return;
  const m = parseInt($("#settings-birthday-month")?.value, 10);
  const d = parseInt($("#settings-birthday-day")?.value, 10);
  const bday = (m && d) ? { month: m, day: d } : null;
  try {
    await updateDoc(doc(db,"users",state.user.uid), { birthday: bday });
    showToast(bday ? "Birthday saved" : "Birthday cleared");
  } catch(err) { showToast("Save failed: " + err.message); }
}
$("#settings-birthday-month")?.addEventListener("change", _saveBirthday);
$("#settings-birthday-day")?.addEventListener("change", _saveBirthday);
$("#settings-birthday-clear")?.addEventListener("click", () => {
  $("#settings-birthday-month").value = "";
  $("#settings-birthday-day").value = "";
  _saveBirthday();
});

$("#settings-show-last-active-toggle")?.addEventListener("change", async e => {
  state.showLastActive = e.target.checked;
  localStorage.setItem("sc_show_last_active", e.target.checked ? "true" : "false");
  // Persist to Firestore so others' clients see the preference
  if (state.user?.uid) {
    try { await updateDoc(doc(db,"users",state.user.uid), { showLastActive: e.target.checked }); }
    catch(_){}
  }
});
$("#settings-gif-freeze-default-toggle")?.addEventListener("change", e => {
  state.gifFreezeDefault = e.target.checked;
  localStorage.setItem("sc_gif_freeze_default", e.target.checked ? "true" : "false");
});
$("#settings-gif-keep-frozen-toggle")?.addEventListener("change", e => {
  state.gifKeepFrozen = e.target.checked;
  localStorage.setItem("sc_gif_keep_frozen", e.target.checked ? "true" : "false");
  // If turned off, clear the frozen set
  if (!e.target.checked) { state.frozenGifs.clear(); _saveFrozenGifs(); }
});
$("#settings-gif-autofreeze-toggle")?.addEventListener("change", e => {
  state.gifAutoFreeze = e.target.checked;
  localStorage.setItem("sc_gif_autofreeze", e.target.checked ? "true" : "false");
});

// Avatar position is saved via the crop modal (no preset buttons needed)

// Settings modal interactions (theme/status/banner)
$("#settings-modal")?.addEventListener("click", e=>{
  const themeSwatch=e.target.closest(".theme-swatch");
  if (themeSwatch) {
    _pendingTheme=themeSwatch.dataset.theme;
    $$(".theme-swatch").forEach(s=>s.classList.toggle("active",s.dataset.theme===_pendingTheme));
    // Show/hide custom color pickers
    const customPickers=$("#theme-custom-pickers");
    if (customPickers) customPickers.style.display=(_pendingTheme==="custom")?"":"none";
    applyTheme(_pendingTheme); // live preview
    if (_pendingTheme==="custom") _applyCustomThemeColors();
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
  const newCustomStatus=($("#settings-custom-status-input")?.value.trim())||"";
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
    // Save custom status
    state.customStatus=newCustomStatus;
    localStorage.setItem("sc_custom_status",newCustomStatus);
    await updateDoc(doc(db,"users",state.user.uid),{
      displayName:username, displayNameLower:username.toLowerCase(),
      username, bio:bio||"", photoURL:photoURL||null,
      status:state.status, bannerColor:state.bannerColor||null,
      isPrivate:privOn, customStatus:newCustomStatus
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
    $("#settings-modal")?.classList.remove("settings-dirty");
    closeModal("settings-modal"); showToast("Settings saved ✓");
  } catch(err){ showToast("Save failed: "+err.message); }
  finally { btn.disabled=false; btn.textContent="Save Changes"; }
});


/* =====================================================================
   AVATAR CROP MODAL
   ===================================================================== */
let _cropImg=null, _cropOffX=0, _cropOffY=0, _cropZoom=1;
let _cropDragging=false, _cropDragStart={x:0,y:0}, _cropDragOff={x:0,y:0}, _cropPanScale=1;
const CROP_CANVAS_SIZE=280, CROP_OUTPUT_SIZE=160;

function _initCrop(src) {
  const canvas=document.getElementById("avatar-crop-canvas");
  if (!canvas) return;
  canvas.width=CROP_CANVAS_SIZE; canvas.height=CROP_CANVAS_SIZE;
  // Ensure events are wired (in case MutationObserver missed it)
  if (typeof window.wireCropCanvas === "function") window.wireCropCanvas();
  _cropImg=new Image();
  _cropImg.crossOrigin="anonymous";
  _cropImg.onload=()=>{
    const fitZoom=Math.max(CROP_CANVAS_SIZE/_cropImg.naturalWidth, CROP_CANVAS_SIZE/_cropImg.naturalHeight);
    _cropZoom=fitZoom;
    _cropOffX=(_cropImg.naturalWidth*_cropZoom-CROP_CANVAS_SIZE)/2;
    _cropOffY=(_cropImg.naturalHeight*_cropZoom-CROP_CANVAS_SIZE)/2;
    const sl=document.getElementById("crop-zoom-slider");
    if (sl) { sl.min=fitZoom*0.5; sl.max=fitZoom*5; sl.step=fitZoom*0.01; sl.value=_cropZoom; }
    _drawCrop();
  };
  _cropImg.onerror=()=>showToast("Could not load image. Try a direct image URL.");
  _cropImg.src=src;
  openModal("avatar-crop-modal");
}

function _drawCrop() {
  const canvas=document.getElementById("avatar-crop-canvas");
  if (!canvas||!_cropImg) return;
  const ctx=canvas.getContext("2d");
  const W=CROP_CANVAS_SIZE, cx=W/2, cy=W/2, r=W/2-3;
  // Draw image
  ctx.clearRect(0,0,W,W);
  ctx.drawImage(_cropImg,-_cropOffX,-_cropOffY,_cropImg.naturalWidth*_cropZoom,_cropImg.naturalHeight*_cropZoom);
  // Dark vignette OUTSIDE circle — use even-odd rule: rect with inner circle = donut shape
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.55)";
  ctx.beginPath();
  ctx.rect(0,0,W,W);                          // outer boundary (clockwise)
  ctx.arc(cx,cy,r,0,Math.PI*2,true);          // inner circle cut-out (counter-clockwise)
  ctx.fill("evenodd");
  ctx.restore();
  // Circle guide border
  ctx.save();
  ctx.strokeStyle="rgba(255,255,255,.65)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

function _clampCropOffset() {
  if (!_cropImg) return;
  const iw=_cropImg.naturalWidth*_cropZoom, ih=_cropImg.naturalHeight*_cropZoom;
  const W=CROP_CANVAS_SIZE;
  _cropOffX=Math.max(0,Math.min(iw-W,_cropOffX));
  _cropOffY=Math.max(0,Math.min(ih-W,_cropOffY));
}

function _getCroppedDataUrl() {
  if (!_cropImg) return null;
  const off=document.createElement("canvas");
  off.width=CROP_OUTPUT_SIZE; off.height=CROP_OUTPUT_SIZE;
  const ctx=off.getContext("2d");
  const S=CROP_OUTPUT_SIZE, r=S/2;
  // Clip to circle so output is transparent outside
  ctx.beginPath(); ctx.arc(r,r,r,0,Math.PI*2); ctx.clip();
  const scale=CROP_OUTPUT_SIZE/CROP_CANVAS_SIZE;
  ctx.drawImage(_cropImg,-_cropOffX*scale,-_cropOffY*scale,
    _cropImg.naturalWidth*_cropZoom*scale,
    _cropImg.naturalHeight*_cropZoom*scale);
  // Use PNG for transparency, JPEG loses the alpha channel
  return off.toDataURL("image/png");
}

// Wire up crop canvas events
document.addEventListener("DOMContentLoaded", ()=>{}, {once:true});
(function(){
  let canvasWired=false;
  window.wireCropCanvas = function wireCropCanvas() {
    if (canvasWired) return;
    const canvas=document.getElementById("avatar-crop-canvas");
    if (!canvas) return;
    canvasWired=true;
    canvas.addEventListener("mousedown",e=>{
      _cropDragging=true;
      // Compute scale: canvas internal coords vs CSS display size
      const rect=canvas.getBoundingClientRect();
      _cropPanScale=canvas.width/Math.max(1,rect.width);
      _cropDragStart={x:e.clientX,y:e.clientY};
      _cropDragOff={x:_cropOffX,y:_cropOffY};
      canvas.style.cursor="grabbing";
      e.preventDefault();
    });
    document.addEventListener("mousemove",e=>{
      if (!_cropDragging) return;
      _cropOffX=_cropDragOff.x-(e.clientX-_cropDragStart.x)*_cropPanScale;
      _cropOffY=_cropDragOff.y-(e.clientY-_cropDragStart.y)*_cropPanScale;
      _clampCropOffset(); _drawCrop();
    });
    document.addEventListener("mouseup",()=>{ _cropDragging=false; if(canvas) canvas.style.cursor="grab"; });
    // Touch
    canvas.addEventListener("touchstart",e=>{
      if(e.touches.length!==1) return;
      const t=e.touches[0];
      const rect=canvas.getBoundingClientRect();
      _cropPanScale=canvas.width/Math.max(1,rect.width);
      _cropDragging=true;
      _cropDragStart={x:t.clientX,y:t.clientY};
      _cropDragOff={x:_cropOffX,y:_cropOffY};
      e.preventDefault();
    },{passive:false});
    canvas.addEventListener("touchmove",e=>{
      if(!_cropDragging||e.touches.length!==1) return;
      const t=e.touches[0];
      _cropOffX=_cropDragOff.x-(t.clientX-_cropDragStart.x)*_cropPanScale;
      _cropOffY=_cropDragOff.y-(t.clientY-_cropDragStart.y)*_cropPanScale;
      _clampCropOffset(); _drawCrop(); e.preventDefault();
    },{passive:false});
    canvas.addEventListener("touchend",()=>{ _cropDragging=false; });
    // Wheel zoom
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();
      const delta=e.deltaY>0?-0.05:0.05;
      const newZoom=Math.max(parseFloat(document.getElementById("crop-zoom-slider")?.min||0.1), _cropZoom+delta);
      const oldZoom=_cropZoom; _cropZoom=newZoom;
      // Keep center fixed
      const W=CROP_CANVAS_SIZE;
      _cropOffX=(_cropOffX+W/2)*(_cropZoom/oldZoom)-W/2;
      _cropOffY=(_cropOffY+W/2)*(_cropZoom/oldZoom)-W/2;
      _clampCropOffset();
      const sl=document.getElementById("crop-zoom-slider");
      if(sl) sl.value=_cropZoom;
      _drawCrop();
    },{passive:false});
    canvas.style.cursor="grab";
  };
  // Wire after modal first opens (or eagerly try now)
  window.wireCropCanvas();
  const observer=new MutationObserver(()=>window.wireCropCanvas());
  observer.observe(document.body, {childList:true, subtree:true});
})();

// Zoom slider
document.addEventListener("input",e=>{
  if(e.target.id!=="crop-zoom-slider") return;
  const newZoom=parseFloat(e.target.value);
  if(!_cropImg) return;
  const oldZoom=_cropZoom; _cropZoom=newZoom;
  const W=CROP_CANVAS_SIZE;
  _cropOffX=(_cropOffX+W/2)*(_cropZoom/oldZoom)-W/2;
  _cropOffY=(_cropOffY+W/2)*(_cropZoom/oldZoom)-W/2;
  _clampCropOffset(); _drawCrop();
});

// File input → open crop
document.addEventListener("change",e=>{
  if(e.target.id!=="settings-photo-file") return;
  const file=e.target.files?.[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>_initCrop(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value=""; // reset so same file can be re-selected
});

// "Crop" button next to URL input — open crop editor with whatever URL is typed
document.addEventListener("click",e=>{
  if(!e.target.closest("#settings-photo-crop-btn")) return;
  const url=($("#settings-photo-input")?.value||"").trim();
  if (!url) { showToast("Paste an image URL first, then click Crop."); return; }
  _initCrop(url);
});

// "Use This Photo" confirm
document.addEventListener("click",e=>{
  if(!e.target.closest("#crop-confirm-btn")) return;
  const dataUrl=_getCroppedDataUrl();
  if (!dataUrl) { showToast("No image loaded"); return; }
  // Put into the URL input so save-settings uses it
  const photoInput=document.getElementById("settings-photo-input");
  if (photoInput) { photoInput.value=dataUrl; }
  closeModal("avatar-crop-modal");
  _updateSettingsPreview();
  showToast("Photo cropped! Hit Save Changes to apply.");
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
    // Favorites includes both standard favs AND personal custom emoji
    const favNames=Object.keys(state.favEmojis);
    items=favNames.length
      ? favNames.map(name=>EMOJI_DATA.find(e=>e.name===name)).filter(Boolean)
      : [];
    // Append personal custom emoji as virtual entries
    const personal=_getPersonalEmoji?.()||{};
    for (const [pname, purl] of Object.entries(personal)) {
      items.push({ name:pname, char:purl, isPersonal:true, cat:"special" });
    }
  } else if (state.activeCat==="special") {
    // Special: :Static: + all personal custom emoji
    const staticEntry=EMOJI_DATA.find(e=>e.isStatic);
    items = staticEntry ? [staticEntry] : [];
    const personal=_getPersonalEmoji?.()||{};
    for (const [pname, purl] of Object.entries(personal)) {
      items.push({ name:pname, char:purl, isPersonal:true, cat:"special" });
    }
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
    if (e.isPersonal) {
      const safeUrl = e.char.replace(/"/g,"&quot;");
      return `<div class="emoji-item-wrap"><button class="emoji-cell" title=":${escapeHtml(e.name)}:" data-insert=":${escapeHtml(e.name)}:"><img src="${safeUrl}" class="static-emoji-square" alt=":${escapeHtml(e.name)}:" onerror="this.outerHTML=':'+this.alt.slice(1,-1)+':'" /></button></div>`;
    }
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
    // Default to favorites tab if user has any favorites OR personal emoji
    const hasFavs = Object.keys(state.favEmojis||{}).length
                  || Object.keys(_getPersonalEmoji?.()||{}).length;
    if (hasFavs) state.activeCat = "favorites";
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
  if (e.target.closest("#emoji-picker")||e.target.closest("#emoji-btn")
      ||e.target.closest("#dblclick-emoji-pick-btn")
      ||e.target.closest("#emoji-submit-modal")) return;
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

// @mention autocomplete
let _mentionAcOpen=false, _mentionAcItems=[], _mentionAcIndex=0;

function updateMentionAutocomplete() {
  const val=composer.value;
  const curPos=composer.selectionStart;
  // Find @ before cursor
  const before=val.slice(0,curPos);
  const match=before.match(/@(\w*)$/);
  if (!match) { hideMentionAc(); return; }
  const query=match[1].toLowerCase();
  const allUsers=[...state.friends.map(f=>({uid:f.uid,name:f.displayName,photo:f.photoURL}))];
  // In group chats, also include group members
  if (state.activeChat?.type==="group") {
    state.activeChat.members?.forEach(uid=>{
      if (!allUsers.find(u=>u.uid===uid)) {
        const p=state.userCache[uid];
        if (p) allUsers.push({uid, name:p.username||p.displayName||uid, photo:p.photoURL});
      }
    });
  }
  _mentionAcItems=allUsers.filter(u=>!query||u.name.toLowerCase().startsWith(query)).slice(0,8);
  if (!_mentionAcItems.length) { hideMentionAc(); return; }
  _mentionAcOpen=true;
  const ac=$("#mention-autocomplete"); if(!ac) return;
  ac.innerHTML=_mentionAcItems.map((u,i)=>`
    <button class="emoji-ac-item${i===_mentionAcIndex?" active":""}" data-idx="${i}" role="option">
      <span class="emoji-ac-char">${u.photo?`<img src="${u.photo}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" alt=""/>`:u.name[0]?.toUpperCase()}</span>
      <span class="emoji-ac-name">@${u.name}</span>
    </button>`).join("");
  ac.classList.remove("hidden");
}

function hideMentionAc() {
  _mentionAcOpen=false; _mentionAcIndex=0; _mentionAcItems=[];
  $("#mention-autocomplete")?.classList.add("hidden");
}

function insertMentionAcItem(idx) {
  const u=_mentionAcItems[idx]; if (!u) return;
  const val=composer.value, pos=composer.selectionStart;
  const before=val.slice(0,pos);
  const match=before.match(/@(\w*)$/);
  if (!match) return;
  const start=pos-match[0].length;
  const after=val.slice(pos);
  composer.value=before.slice(0,start)+`@${u.name} `+after;
  const newPos=start+u.name.length+2;
  composer.setSelectionRange(newPos,newPos);
  hideMentionAc();
  composer.dispatchEvent(new Event("input"));
}

function updateMentionAcHighlight() {
  document.querySelectorAll("#mention-autocomplete .emoji-ac-item").forEach((el,i)=>{
    el.classList.toggle("active", i===_mentionAcIndex);
  });
}

document.addEventListener("click", e=>{
  const item=e.target.closest("#mention-autocomplete .emoji-ac-item");
  if (item) { insertMentionAcItem(parseInt(item.dataset.idx)); return; }
  if (!e.target.closest("#mention-autocomplete")&&!e.target.closest("#composer-input")) hideMentionAc();
});

function updateEmojiAutocomplete() {
  const ac=$("#emoji-autocomplete"); if (!ac) return;
  const val=composer.value;
  const pos=composer.selectionStart;
  const before=val.slice(0,pos);
  const match=before.match(/:([a-zA-Z0-9_+\-]{1,})$/);
  if (!match) { hideEmojiAc(); return; }
  const q=match[1].toLowerCase();
  acTriggerStart=pos-match[0].length;

  // Personal custom emoji come FIRST in the autocomplete (user's own come first)
  const personal = _getPersonalEmoji?.() || {};
  const personalMatches = Object.entries(personal)
    .filter(([name]) => name.startsWith(q) || name.includes(q))
    .map(([name, url]) => ({ name, char: url, isPersonal: true }));

  const standardMatches = EMOJI_DATA.filter(e=>{
    if (e.isStatic) return "static".startsWith(q)||q==="sta";
    return e.name.startsWith(q)||e.name.includes(q)||(e.alt&&e.alt.some(a=>a.toLowerCase().replace(/\s/g,"").includes(q)));
  });

  acItems = [...personalMatches, ...standardMatches].slice(0, 8);

  if (!acItems.length) { hideEmojiAc(); return; }
  state.emojiAcIndex=0;
  ac.innerHTML=acItems.map((e,i)=>{
    let display;
    if (e.isPersonal) {
      const safeUrl = e.char.replace(/"/g,"&quot;");
      display = `<img src="${safeUrl}" style="width:18px;height:18px;border-radius:3px;object-fit:contain;" alt=":${escapeHtml(e.name)}:" />`;
    } else if (e.isStatic) {
      display = `<img src="${STATIC_EMOJI_URL}" style="width:18px;height:18px;border-radius:3px;" alt=":Static:">`;
    } else {
      display = e.char;
    }
    return `<div class="emoji-ac-item${i===0?" active":""}" data-index="${i}">
      <span class="emoji-ac-char">${display}</span>
      <span class="emoji-ac-name">:${escapeHtml(e.name)}:${e.isPersonal?' <span style="font-size:10px;color:var(--c-accent);">personal</span>':''}</span>
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
  // Personal emoji inserts as :name: so formatMessage can render it as <img>
  const insert = item.isPersonal ? `:${item.name}:`
               : item.isStatic ? ":Static:"
               : item.char;
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
  { name:"poll",     aliases:[],                     desc:"Start a poll — /poll Question? | A | B [duration:1h]", openPoll: true },
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
  // /poll opens the visual poll builder instead of inserting raw text
  if (cmd.openPoll) {
    composer.value = "";
    hideCmdAc(); updateSendBtn();
    openPollBuilder();
    return;
  }
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

  // Badges — merge hardcoded augmented badges with Firestore userBadges/{uid}
  const badgesEl=$("#profile-card-badges");
  if (badgesEl) {
    badgesEl.innerHTML=renderBadges(profile.badges||[]);
    // Async fetch extra badges from Firestore (won't block card show)
    getDoc(doc(db,"userBadges",uid)).then(snap=>{
      if (!snap.exists()) return;
      const fb = snap.data()?.badges || [];
      if (!fb.length) return;
      const merged = [...new Set([...(profile.badges||[]), ...fb])];
      // Cache so repeated opens are fast
      state.userCache[uid] = {...profile, badges: merged};
      if (!$("#profile-card")?.classList.contains("hidden")) {
        badgesEl.innerHTML = renderBadges(merged);
      }
    }).catch(()=>{});
  }

  // Name / custom status / bio
  $("#profile-card-name").textContent=profile.username||profile.displayName||"User";
  $("#profile-card-tag").textContent=profile.discriminator?`#${profile.discriminator}`:"";
  // Custom status phrase (shown below name/tag)
  const pcCustomStatus=$("#profile-card-custom-status");
  if (pcCustomStatus) {
    const cs = isSelf ? state.customStatus : (profile.customStatus||"");
    pcCustomStatus.textContent = cs;
    pcCustomStatus.style.display = cs ? "" : "none";
  }
  $("#profile-card-bio").textContent=isPrivate?"This profile is private.":(profile.bio||"No bio set yet.");

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
  // "View Full Profile" button always visible (except self — they have Edit Profile)
  if (!isSelf) actionsHtml+=`<button class="btn-ghost" data-pc-action="view-full-profile" data-pc-uid="${escapeHtml(uid)}" style="font-size:12px;">Full Profile</button>`;

  // 3-dots more menu button (injected after actions div so it floats right via flex)
  const moreBtn = `<button class="profile-card-more-btn" id="profile-card-more-btn" data-pc-uid="${escapeHtml(uid)}" title="More options">⋯</button>`;
  $("#profile-card-actions").innerHTML = actionsHtml + moreBtn;

  // Notes — show for non-self, load from Firestore
  const notesArea = $("#profile-card-notes");
  const notesLabel = $("#profile-card-notes-label");
  if (notesArea) {
    if (!isSelf) {
      notesArea.style.display = "";
      if (notesLabel) notesLabel.style.display = "";
      notesArea.dataset.noteUid = uid;
      // Show localStorage value immediately, then update from Firestore
      notesArea.value = localStorage.getItem(`sc_notes_${uid}`) || "";
      _loadNote(uid).then(text => { if (notesArea.dataset.noteUid === uid) notesArea.value = text; });
    } else {
      notesArea.style.display = "none";
      if (notesLabel) notesLabel.style.display = "none";
    }
  }

  // Position — expand height estimate if notes visible
  const W=290, H=isSelf?340:400;
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
  } else if (action==="view-full-profile") {
    const targetUid = btn.dataset.pcUid;
    $("#profile-card").classList.add("hidden");
    showFullProfile(targetUid);
  }
});

// Notes autosave — debounced write to Firestore + instant localStorage fallback
let _notesSaveTimer = null;
function _saveNote(targetUid, text) {
  if (!state.user || !targetUid) return;
  // Instant localStorage fallback so the value is always readable locally
  if (text.trim()) localStorage.setItem(`sc_notes_${targetUid}`, text);
  else localStorage.removeItem(`sc_notes_${targetUid}`);
  // Debounced Firestore write
  clearTimeout(_notesSaveTimer);
  _notesSaveTimer = setTimeout(async () => {
    try {
      const noteRef = doc(db, "users", state.user.uid, "notes", targetUid);
      if (text.trim()) await setDoc(noteRef, { text, updatedAt: serverTimestamp() });
      else await deleteDoc(noteRef).catch(()=>{});
    } catch(_){}
  }, 1200);
}

// Load a note from Firestore (with localStorage fallback)
async function _loadNote(targetUid) {
  if (!state.user || !targetUid) return "";
  try {
    const snap = await getDoc(doc(db, "users", state.user.uid, "notes", targetUid));
    if (snap.exists()) return snap.data().text || "";
  } catch(_){}
  return localStorage.getItem(`sc_notes_${targetUid}`) || "";
}

document.addEventListener("input", e => {
  const isProfileNote = e.target.id === "profile-card-notes" || e.target.id === "fp-notes";
  if (!isProfileNote) return;
  const uid = e.target.dataset.noteUid;
  if (!uid) return;
  _saveNote(uid, e.target.value);
});

// 3-dots context menu on profile card
document.addEventListener("click", e => {
  const moreBtn = e.target.closest("#profile-card-more-btn");
  if (!moreBtn) return;
  e.stopPropagation();
  const uid = moreBtn.dataset.pcUid;
  if (!uid) return;
  const isFriend = state.friends.some(f => f.uid === uid);
  const isBlocked = (state.user?.blockedUsers||[]).includes(uid);
  const items = [
    { label:"View Full Profile", action:"ctx-view-full-profile", data:{uid} },
    { label:"Copy User ID",      action:"ctx-copy-user-id",      data:{uid} },
    "divider",
    isFriend ? { label:"Remove Friend", action:"ctx-pc-unfriend", data:{uid}, danger:true } : null,
    isBlocked
      ? { label:"Unblock User",   action:"ctx-pc-unblock", data:{uid} }
      : { label:"Block User",     action:"ctx-pc-block",   data:{uid}, danger:true },
  ].filter(Boolean);
  const rect = moreBtn.getBoundingClientRect();
  showCtxMenu(rect.left, rect.bottom+4, items);
});

document.addEventListener("click",e=>{
  const card=$("#profile-card");
  if (!card||card.classList.contains("hidden")) return;
  if (card.contains(e.target)) return;
  if (e.target.closest("[data-profile-uid]")||e.target.closest(".friend-row")) return;
  card.classList.add("hidden");
});


/* =====================================================================
   FULL PROFILE MODAL
   ===================================================================== */
async function showFullProfile(uid) {
  const modal = $("#full-profile-modal"); if (!modal) return;
  const profile = await fetchUserProfile(uid); if (!profile) return;
  const isSelf = uid === state.user?.uid;
  const isFriend = state.friends.some(f => f.uid === uid);
  const hasPendingOut = state.outgoing?.some(r => r.toUid === uid);
  const isPrivate = profile.isPrivate && !isFriend && !isSelf;

  // Banner
  const bannerEl = $("#fp-banner");
  if (bannerEl) {
    const bc = isSelf ? (state.bannerColor||null) : (profile.bannerColor||null);
    if (bc) bannerEl.style.background = bc.includes(",") ? `linear-gradient(135deg,${bc})` : bc;
    else bannerEl.style.background = "linear-gradient(135deg,var(--c-input-2),var(--c-rail))";
  }

  // Avatar
  const avatarEl = $("#fp-avatar");
  if (avatarEl) {
    if (isPrivate) { avatarEl.innerHTML=""; avatarEl.textContent="?"; }
    else if (profile.photoURL) avatarEl.innerHTML = `<img src="${escapeHtml(profile.photoURL)}" alt="" />`;
    else { avatarEl.innerHTML=""; avatarEl.textContent = (profile.username||profile.displayName||"?").charAt(0).toUpperCase(); }
  }

  // Status dot — positioned inside avatar-wrap
  const sdot = $("#fp-status-dot");
  const statusVal = (isSelf || isFriend) ? resolveStatus(isSelf ? state.userCache[uid]||{} : profile) : "offline";
  if (sdot) {
    if (!isSelf && !isFriend) { sdot.style.display="none"; }
    else { sdot.style.display=""; sdot.dataset.status = statusVal; }
  }

  // Status label text next to name
  const fpStatusLabel = $("#fp-status-label");
  if (fpStatusLabel) {
    const statusMap = { online:"● Online", idle:"● Idle", dnd:"● Do Not Disturb", offline:"● Offline", invisible:"● Invisible" };
    if (isSelf || isFriend) {
      fpStatusLabel.textContent = statusMap[statusVal] || "";
      fpStatusLabel.className = `full-profile-status-label ${statusVal}`;
      fpStatusLabel.style.display = "";
    } else {
      fpStatusLabel.style.display = "none";
    }
  }

  // Name / tag / custom status
  $("#fp-name").textContent = profile.username||profile.displayName||"User";
  $("#fp-tag").textContent = profile.discriminator ? `#${profile.discriminator}` : "";
  const cs = isSelf ? state.customStatus : (profile.customStatus||"");
  const fpCs = $("#fp-custom-status");
  if (fpCs) { fpCs.textContent=cs; fpCs.style.display=cs?"":"none"; }
  $("#fp-bio").textContent = isPrivate ? "This profile is private." : (profile.bio||"No bio set yet.");
  const fpSince = $("#fp-since");
  if (fpSince) {
    if (profile.createdAt && !isPrivate) {
      const d = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
      fpSince.textContent = "Member since " + d.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
      fpSince.style.display="";
    } else fpSince.style.display="none";
  }
  // Birthday (optional — only if user set it)
  const fpBday = $("#fp-birthday");
  if (fpBday) {
    if (profile.birthday && profile.birthday.month && profile.birthday.day && !isPrivate) {
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const m = months[profile.birthday.month-1] || "";
      // Today?
      const today = new Date();
      const isToday = today.getMonth()+1 === profile.birthday.month && today.getDate() === profile.birthday.day;
      fpBday.innerHTML = `🎂 Birthday: <strong>${escapeHtml(m)} ${profile.birthday.day}</strong>${isToday ? ' <span style="color:var(--c-accent);font-weight:700;">— Today! 🎉</span>' : ''}`;
      fpBday.style.display = "";
    } else fpBday.style.display = "none";
  }

  // Last active timeline (optional — only if profile owner enabled it)
  const fpLastActive = $("#fp-last-active");
  if (fpLastActive) {
    const showLastActive = profile.showLastActive !== false; // default off unless explicitly enabled
    if (!isSelf && showLastActive && profile.lastSeen && !isPrivate) {
      const ls = profile.lastSeen.toDate ? profile.lastSeen.toDate() : new Date(profile.lastSeen);
      const diff = Date.now() - ls.getTime();
      let txt = "Active just now";
      if (profile.isOnline && diff < 5*60*1000) txt = "Active now";
      else if (diff < 60*1000) txt = "Active just now";
      else if (diff < 60*60*1000) txt = `Last active ${Math.floor(diff/60000)} min ago`;
      else if (diff < 24*60*60*1000) txt = `Last active ${Math.floor(diff/3600000)}h ago`;
      else if (diff < 7*24*60*60*1000) txt = `Last active ${Math.floor(diff/86400000)}d ago`;
      else txt = `Last active ${ls.toLocaleDateString()}`;
      fpLastActive.textContent = txt;
      fpLastActive.style.display = "";
    } else fpLastActive.style.display = "none";
  }

  // Friends since
  const fpFriendsSince = $("#fp-friends-since");
  if (fpFriendsSince) {
    if (isFriend && !isSelf) {
      const fs = state.friends.find(f=>f.uid===uid);
      if (fs?.friendshipId) {
        fpFriendsSince.style.display="";
        fpFriendsSince.textContent = "Friends";
        getDoc(doc(db,"friendships",fs.friendshipId)).then(snap=>{
          if (!snap.exists()) return;
          const fa = snap.data().createdAt;
          if (fa) {
            const fd = fa.toDate ? fa.toDate() : new Date(fa);
            fpFriendsSince.textContent = "Friends since " + fd.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
          }
        }).catch(()=>{});
      } else fpFriendsSince.style.display="none";
    } else fpFriendsSince.style.display="none";
  }
  // Mutual groups (groups both viewer and target are members of)
  const fpMutualGroups = $("#fp-mutual-groups");
  const fpMutualList   = $("#fp-mutual-groups-list");
  if (fpMutualGroups && fpMutualList && !isSelf) {
    const mutuals = state.chats.filter(c => c.type==="group" && Array.isArray(c.members) && c.members.includes(uid));
    if (mutuals.length) {
      fpMutualGroups.style.display="";
      fpMutualList.innerHTML = mutuals.map(c=>`
        <div class="fp-mutual-item" data-chat-id="${escapeHtml(c.id)}" title="Open ${escapeHtml(c.name||"Group")}">
          <div class="fp-mutual-icon">${escapeHtml(groupInitials(c.name||"G"))}</div>
          <span>${escapeHtml(c.name||"Group")}</span>
        </div>`).join("");
      fpMutualList.addEventListener("click", e=>{
        const item=e.target.closest(".fp-mutual-item");
        if (item) { closeModal("full-profile-modal"); openChat(item.dataset.chatId); }
      }, {once:true});
    } else fpMutualGroups.style.display="none";
  } else if (fpMutualGroups) fpMutualGroups.style.display="none";

  // Badges
  const fpBadges = $("#fp-badges");
  if (fpBadges) {
    fpBadges.innerHTML = renderBadges(profile.badges||[]);
    getDoc(doc(db,"userBadges",uid)).then(snap=>{
      if (!snap.exists()) return;
      const fb = snap.data()?.badges||[];
      if (!fb.length) return;
      const merged = [...new Set([...(profile.badges||[]),...fb])];
      fpBadges.innerHTML = renderBadges(merged);
    }).catch(()=>{});
  }

  // Notes — only shown for non-self
  const fpNotesSection = $("#fp-notes-section");
  const fpNotesArea = $("#fp-notes");
  if (fpNotesSection) {
    if (!isSelf && !isPrivate) {
      fpNotesSection.style.display = "";
      if (fpNotesArea) {
        fpNotesArea.dataset.noteUid = uid;
        fpNotesArea.value = localStorage.getItem(`sc_notes_${uid}`) || "";
        _loadNote(uid).then(text => { if (fpNotesArea.dataset.noteUid === uid) fpNotesArea.value = text; });
      }
    } else {
      fpNotesSection.style.display = "none";
    }
  }

  // Actions — bigger buttons, more options
  const isBlocked = (state.user?.blockedUsers||[]).includes(uid);
  let actionsHtml = "";
  if (isSelf) {
    actionsHtml = `<button class="btn-primary fp-action-btn" data-fp-action="edit-profile">
      <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
      Edit Profile
    </button>`;
  } else {
    if (!isFriend && !hasPendingOut)
      actionsHtml += `<button class="btn-primary fp-action-btn" data-fp-action="add-friend" data-fp-uid="${escapeHtml(uid)}">
        <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        Add Friend
      </button>`;
    else if (hasPendingOut)
      actionsHtml += `<span class="fp-action-sent">Request Sent ✓</span>`;
    if (isFriend) {
      actionsHtml += `<button class="btn-primary fp-action-btn" data-fp-action="message" data-fp-uid="${escapeHtml(uid)}">
        <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        Message
      </button>`;
      // Invite to group — only show if user is in any groups
      const myGroups = state.chats.filter(c=>c.type==="group" && c.members.includes(state.user.uid) && !c.members.includes(uid));
      if (myGroups.length) {
        actionsHtml += `<button class="btn-ghost fp-action-btn" data-fp-action="invite-group" data-fp-uid="${escapeHtml(uid)}" title="Invite to a group chat">
          <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          Invite to Group
        </button>`;
      }
      actionsHtml += `<button class="btn-ghost fp-action-btn fp-action-danger" data-fp-action="remove-friend" data-fp-uid="${escapeHtml(uid)}">Remove Friend</button>`;
    }
    actionsHtml += isBlocked
      ? `<button class="btn-ghost fp-action-btn" data-fp-action="unblock" data-fp-uid="${escapeHtml(uid)}">Unblock</button>`
      : `<button class="btn-ghost fp-action-btn fp-action-danger" data-fp-action="block" data-fp-uid="${escapeHtml(uid)}">Block</button>`;
    // Snooze toggle (local-only UI hide)
    const isSnoozed = isUserSnoozed(uid);
    const snoozeTitle = isSnoozed ? "Show their messages again" : "Hide their messages from your view";
    actionsHtml += `<button class="btn-ghost fp-action-btn" data-fp-action="snooze" data-fp-uid="${escapeHtml(uid)}" title="${snoozeTitle}">
      <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M9.5 5.5v3l5.5 5.5h3v-3l-5.5-5.5h-3zm-2 12.5l-1.5-1.5L4 18l1.5 1.5L7.5 18zm6.5-9V5h-2v3h2zm-7 4l-2-2L4 13l2 2 1-1zM12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z"/></svg>
      ${isSnoozed?"Unsnooze":"Snooze"}
    </button>`;
  }
  // Copy user ID — always available
  actionsHtml += `<button class="btn-ghost fp-action-btn" data-fp-action="copy-id" data-fp-uid="${escapeHtml(uid)}" title="Copy user ID">
    <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
    Copy ID
  </button>`;
  const fpActions = $("#fp-actions"); if (fpActions) fpActions.innerHTML = actionsHtml;

  openModal("full-profile-modal");
}

$("#full-profile-close")?.addEventListener("click", ()=>closeModal("full-profile-modal"));

document.addEventListener("click", async e=>{
  const btn = e.target.closest("[data-fp-action]"); if (!btn) return;
  const action = btn.dataset.fpAction, uid = btn.dataset.fpUid;
  if (action==="edit-profile") { closeModal("full-profile-modal"); openSettingsModal(); }
  else if (action==="message") { closeModal("full-profile-modal"); await openOrCreateDm(uid); }
  else if (action==="add-friend") {
    btn.disabled=true; btn.textContent="Sending…";
    try {
      const p=state.userCache[uid]||{};
      await setDoc(doc(db,"friendRequests",`${state.user.uid}_${uid}`),{
        fromUid:state.user.uid, toUid:uid,
        fromName:state.user.displayName, fromPhoto:state.user.photoURL||null,
        toName:p.username||p.displayName||"User", toPhoto:p.photoURL||null,
        createdAt:serverTimestamp()
      });
      btn.textContent="Sent ✓"; showToast("Friend request sent");
    } catch(err){ btn.disabled=false; btn.textContent="Add Friend"; showToast("Error: "+err.message); }
  }
  else if (action==="remove-friend") {
    const fs = state.friends?.find(f=>f.uid===uid);
    if (!fs?.friendshipId) { showToast("Friendship not found."); return; }
    showConfirm("Remove this friend?", async ()=>{
      try {
        await deleteDoc(doc(db,"friendships",fs.friendshipId));
        closeModal("full-profile-modal");
        showToast("Friend removed.");
      } catch(err){ showToast("Error: "+err.message); }
    }, { title:"Remove Friend", yesLabel:"Remove", danger:true });
  }
  else if (action==="block") {
    closeModal("full-profile-modal");
    blockUser(uid);
  }
  else if (action==="unblock") {
    if (!state.user) return;
    btn.disabled=true;
    try {
      const blocked=(state.user.blockedUsers||[]).filter(id=>id!==uid);
      await updateDoc(doc(db,"users",state.user.uid),{blockedUsers:blocked});
      state.blockedUsers.delete(uid);
      state.user.blockedUsers=blocked;
      closeModal("full-profile-modal");
      showToast("User unblocked.");
      renderMessages();
    } catch(err){ btn.disabled=false; showToast("Error: "+err.message); }
  }
  else if (action==="copy-id") {
    navigator.clipboard.writeText(uid||"").catch(()=>{});
    showToast("User ID copied!");
  }
  else if (action==="snooze") {
    toggleSnoozeUser(uid);
    closeModal("full-profile-modal");
  }
  else if (action==="invite-group") {
    // Show a small picker with this user's groups (where target is not yet a member)
    const myGroups = state.chats.filter(c=>c.type==="group" && c.members.includes(state.user.uid) && !c.members.includes(uid));
    if (!myGroups.length) { showToast("No eligible groups"); return; }
    // Remove any existing inviter
    document.getElementById("group-invite-picker")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "group-invite-picker";
    overlay.className = "modal";
    overlay.innerHTML = `
      <div class="modal-card" style="max-width:380px;width:90vw;">
        <div class="modal-head"><h2>Invite to Group</h2>
          <button class="icon-btn modal-close" data-close-invite>
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="modal-body" style="padding:14px 18px;max-height:50vh;overflow-y:auto;">
          ${myGroups.map(g=>`
            <button class="group-invite-row" data-gi-chat-id="${escapeHtml(g.id)}">
              <div class="side-row-fallback">${escapeHtml(groupInitials(g.name||"G"))}</div>
              <span style="flex:1;text-align:left;">${escapeHtml(g.name||"Group")}</span>
              <span style="font-size:11px;color:var(--t-muted);">${g.members.length} member${g.members.length===1?"":"s"}</span>
            </button>
          `).join("")}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", async e2 => {
      if (e2.target.closest("[data-close-invite]") || e2.target===overlay) { overlay.remove(); return; }
      const row = e2.target.closest("[data-gi-chat-id]");
      if (!row) return;
      const chatId = row.dataset.giChatId;
      try {
        await updateDoc(doc(db,"chats",chatId), { members: arrayUnion(uid) });
        showToast("Added to group ✓");
        overlay.remove();
      } catch(err){ showToast("Error: "+err.message); }
    });
  }
});


/* =====================================================================
   UPDATE BANNER
   ===================================================================== */
function _dismissUpdateBanner() {
  const banner = $("#update-banner");
  const v = banner?.dataset.version || "";
  if (v) localStorage.setItem("sc_seen_update", v);
  banner?.classList.add("hidden");
}
$("#update-banner-refresh")?.addEventListener("click", () => {
  _dismissUpdateBanner();
  location.reload();
});
$("#update-banner-dismiss")?.addEventListener("click", _dismissUpdateBanner);
$("#update-banner-x")?.addEventListener("click", _dismissUpdateBanner);


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

// Hamburger button toggles sidebar on mobile
$("#mobile-sidebar-toggle")?.addEventListener("click", () => {
  const appEl = $("#app");
  if (appEl.classList.contains("show-sidebar")) appEl.classList.remove("show-sidebar");
  else appEl.classList.add("show-sidebar");
});
// Close sidebar when tapping outside (mobile only)
document.addEventListener("click", e => {
  if (!window.matchMedia("(max-width: 768px)").matches) return;
  const appEl = $("#app");
  if (!appEl?.classList.contains("show-sidebar")) return;
  if (e.target.closest(".sidebar, .rail, #mobile-sidebar-toggle")) return;
  appEl.classList.remove("show-sidebar");
});


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
/* Poll builder modal — friendly UI for creating polls */
function _renderPollBuilderOptions(opts) {
  const wrap = $("#poll-builder-options");
  if (!wrap) return;
  wrap.innerHTML = opts.map((v, i) => `
    <div class="poll-builder-option-row">
      <span class="poll-builder-option-num">${i+1}.</span>
      <input type="text" class="poll-builder-option" data-poll-opt-idx="${i}" maxlength="80" value="${escapeHtml(v||"")}" placeholder="Option ${i+1}" />
      ${opts.length > 2 ? `<button class="icon-btn poll-builder-remove-opt" data-poll-opt-idx="${i}" title="Remove" style="color:var(--c-danger);">✕</button>` : ""}
    </div>
  `).join("");
}

function openPollBuilder() {
  if (!state.activeChatId) { showToast("Open a chat first"); return; }
  $("#poll-builder-question").value = "";
  $("#poll-builder-duration").value = "86400000";
  $$(".poll-dur-chip").forEach(b => b.classList.toggle("active", b.dataset.pollDur === "86400000"));
  _renderPollBuilderOptions(["", ""]);
  openModal("poll-builder-modal");
  setTimeout(() => $("#poll-builder-question")?.focus(), 100);
}

// Add/remove option rows
$("#poll-builder-add-option")?.addEventListener("click", () => {
  const opts = [...document.querySelectorAll(".poll-builder-option")].map(i => i.value);
  if (opts.length >= 10) { showToast("Max 10 options"); return; }
  opts.push("");
  _renderPollBuilderOptions(opts);
});
$("#poll-builder-options")?.addEventListener("click", e => {
  const rm = e.target.closest(".poll-builder-remove-opt");
  if (!rm) return;
  const idx = +rm.dataset.pollOptIdx;
  const opts = [...document.querySelectorAll(".poll-builder-option")].map(i => i.value);
  opts.splice(idx, 1);
  _renderPollBuilderOptions(opts);
});

// Duration chips
document.addEventListener("click", e => {
  const chip = e.target.closest(".poll-dur-chip");
  if (!chip) return;
  $$(".poll-dur-chip").forEach(b => b.classList.remove("active"));
  chip.classList.add("active");
  $("#poll-builder-duration").value = chip.dataset.pollDur;
});

// Create poll
$("#poll-builder-create-btn")?.addEventListener("click", async () => {
  const question = $("#poll-builder-question").value.trim();
  if (!question) { showToast("Add a question"); return; }
  const optionEls = [...document.querySelectorAll(".poll-builder-option")];
  const options = optionEls.map(i => i.value.trim()).filter(Boolean);
  if (options.length < 2) { showToast("Need at least 2 non-empty options"); return; }
  const durMs = parseInt($("#poll-builder-duration").value, 10) || 86400000;
  const chatId = state.activeChatId; if (!chatId || !state.user) return;
  const btn = $("#poll-builder-create-btn");
  btn.disabled = true; btn.textContent = "Posting…";
  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderUid: state.user.uid, senderName: state.user.displayName,
      senderPhoto: state.user.photoURL || null, createdAt: serverTimestamp(),
      type: "poll", text: question, reactions: {},
      pollData: {
        question, options, votes: {},
        durationMs: durMs, endsAt: Date.now() + durMs,
        createdAt: Date.now(), createdBy: state.user.uid
      }
    });
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: `📊 Poll: ${question.slice(0, 100)}`,
      lastMessageAt: serverTimestamp(), lastSenderUid: state.user.uid
    });
    closeModal("poll-builder-modal");
    showToast("✓ Poll posted");
  } catch(err) {
    showToast("Error: " + err.message);
  } finally {
    btn.disabled = false; btn.textContent = "📊 Post Poll";
  }
});

async function castPollVote(msgId, optionIdx) {
  const chatId = state.activeChatId;
  if (!chatId || !state.user) return;
  const msg = state.messages.find(m => m.id === msgId);
  if (!msg || msg.type !== "poll" || !msg.pollData) return;
  if (msg.pollData.endsAt && Date.now() > msg.pollData.endsAt) {
    showToast("Poll has ended"); return;
  }
  const newVotes = { ...(msg.pollData.votes || {}) };
  if (newVotes[state.user.uid] === optionIdx) delete newVotes[state.user.uid];
  else newVotes[state.user.uid] = optionIdx;
  try {
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
      "pollData.votes": newVotes
    });
  } catch(err) { showToast("Vote failed: " + err.message); }
}

// Click delegation for poll options
$("#messages")?.addEventListener("click", e => {
  const btn = e.target.closest("[data-poll-vote]");
  if (!btn) return;
  e.stopPropagation();
  castPollVote(btn.dataset.msgId, parseInt(btn.dataset.pollVote, 10));
});

/* ---------- School governance: propose a change as a poll ---------- */
$("#group-info-modal")?.addEventListener("click", async e => {
  const btn = e.target.closest("[data-school-propose]");
  if (!btn) return;
  const c = state.chats.find(x => x.id === state._groupInfoChatId);
  if (!c || !c.schoolDomain) return;
  const field = btn.dataset.schoolPropose;
  const fieldLabel = { nickname:"nickname", photoURL:"photo URL", description:"description" }[field] || field;
  const newVal = prompt(`Propose new ${fieldLabel} for the school chat:`, c[field === "nickname" ? "chatNickname" : field] || "");
  if (newVal === null) return;
  const trimmed = (newVal||"").trim();
  if (trimmed.length > 1000) { showToast("Too long"); return; }
  // Decide poll duration: 1 hour by default
  const durMs = 60 * 60 * 1000;
  try {
    await addDoc(collection(db, "chats", c.id, "messages"), {
      senderUid: state.user.uid,
      senderName: state.user.displayName,
      senderPhoto: state.user.photoURL || null,
      createdAt: serverTimestamp(),
      type: "poll", text: `Proposal: change ${fieldLabel}`, reactions: {},
      pollData: {
        question: `Change ${fieldLabel} to: "${trimmed.slice(0,140)}"?`,
        options: ["Yes — apply", "No — keep current"],
        votes: {}, durationMs: durMs, endsAt: Date.now() + durMs,
        createdAt: Date.now(), createdBy: state.user.uid,
        // Governance metadata
        kind: "governance",
        govField: field === "nickname" ? "chatNickname" : field,
        govValue: trimmed,
        govThresholdPct: 50, // 50%+ of voters voting Yes
        govApplied: false
      }
    });
    await updateDoc(doc(db, "chats", c.id), {
      lastMessage: `📊 Proposal: change ${fieldLabel}`,
      lastMessageAt: serverTimestamp(), lastSenderUid: state.user.uid
    });
    closeModal("group-info-modal");
    showToast("✓ Proposal posted as a poll");
  } catch(err) { showToast("Error: " + err.message); }
});

/* ---------- Auto-apply governance polls when they end ---------- */
async function _autoApplyGovernancePoll(msg, chatId) {
  const pd = msg.pollData; if (!pd) return;
  if (pd.kind !== "governance" || pd.govApplied) return;
  if (!pd.endsAt || Date.now() < pd.endsAt) return;
  const votes = Object.values(pd.votes || {});
  const total = votes.length;
  if (total === 0) return; // no quorum, skip
  const yes = votes.filter(v => v === 0).length;
  const yesPct = (yes / total) * 100;
  const passed = yesPct >= (pd.govThresholdPct || 50);
  // Only one client should apply — use a simple write that's idempotent on `govApplied`
  try {
    if (passed && pd.govField && pd.govValue !== undefined) {
      await updateDoc(doc(db, "chats", chatId), { [pd.govField]: pd.govValue });
    }
    await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
      "pollData.govApplied": true,
      "pollData.govPassed": passed,
      "pollData.govYesPct": yesPct
    });
    if (passed) showToast(`✓ Vote passed: ${pd.govField} updated`);
  } catch(_) { /* race / permission — ignore */ }
}

// Run periodically while on a school chat
setInterval(() => {
  if (!state.activeChat?.schoolDomain) return;
  const cid = state.activeChatId;
  for (const m of state.messages || []) {
    if (m.type === "poll" && m.pollData?.kind === "governance" && !m.pollData.govApplied) {
      _autoApplyGovernancePoll(m, cid);
    }
  }
}, 30 * 1000);

async function toggleReaction(msgId, emoji) {
  const chatId=state.activeChatId;
  if (!chatId||!state.user) return;
  const msg=state.messages.find(m=>m.id===msgId);
  if (!msg) return;
  const reactions={...(msg.reactions||{})};
  const uids=reactions[emoji]?[...reactions[emoji]]:[];
  const idx=uids.indexOf(state.user.uid);
  if (idx>=0) { uids.splice(idx,1); if (!uids.length) delete reactions[emoji]; else reactions[emoji]=uids; }
  else { uids.push(state.user.uid); reactions[emoji]=uids; _pushRecentReact(emoji); }
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
  if (!names.length) { el.classList.add("hidden"); el.innerHTML=""; return; }
  const phrase=names.length===1?`${escapeHtml(names[0])} is typing`
    :names.length===2?`${escapeHtml(names[0])} and ${escapeHtml(names[1])} are typing`
    :"Several people are typing";
  // Animated dots — three pulsing dots (like Discord/iMessage)
  el.innerHTML=`<span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span><span class="typing-text">${phrase}</span>`;
  el.classList.remove("hidden");
}

/* Sidebar typing indicators — listen to top 15 recent chats so we can
   show "typing…" in DM/group rows without opening them. */
function _updateSidebarTypingListeners() {
  if (!state.user) return;
  const top = state.chats.slice(0, 15);
  const wanted = new Set(top.map(c => c.id));
  for (const id of Object.keys(state.sidebarTypingUnsubs)) {
    if (!wanted.has(id)) {
      try { state.sidebarTypingUnsubs[id](); } catch(_){}
      delete state.sidebarTypingUnsubs[id];
      delete state.sidebarTyping[id];
    }
  }
  for (const c of top) {
    if (state.sidebarTypingUnsubs[c.id]) continue;
    try {
      state.sidebarTypingUnsubs[c.id] = onSnapshot(
        collection(db, "chats", c.id, "typing"),
        snap => {
          const names = snap.docs.filter(d => d.id !== state.user?.uid)
                                  .map(d => d.data().name || "Someone");
          if (names.length) state.sidebarTyping[c.id] = names;
          else delete state.sidebarTyping[c.id];
          renderChatLists();
        },
        () => {}
      );
    } catch(_){}
  }
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

/* Markdown preview toggle */
let _mdPreviewOn = localStorage.getItem("sc_md_preview") === "true";
function _renderMdPreview() {
  const pane = $("#md-preview");
  if (!pane) return;
  const txt = ($("#composer-input")?.value || "").trim();
  if (!_mdPreviewOn || !txt) {
    pane.classList.add("hidden");
    return;
  }
  pane.classList.remove("hidden");
  pane.innerHTML = `<div class="md-preview-label">Preview</div><div class="md-preview-body">${formatMessage(txt)}</div>`;
}
// Composer poll button → open builder
$("#composer-poll-btn")?.addEventListener("click", () => openPollBuilder());

/* ---------- Custom emoji: personal (immediate) + sticker submission ---------- */

// Personal emoji storage in localStorage
function _getPersonalEmoji() {
  try { return JSON.parse(localStorage.getItem("sc_personal_emoji")||"{}"); }
  catch(_){ return {}; }
}
function _savePersonalEmoji(map) {
  localStorage.setItem("sc_personal_emoji", JSON.stringify(map));
}

function _renderPersonalEmojiList() {
  const list = $("#emoji-personal-list"); if (!list) return;
  const map = _getPersonalEmoji();
  const entries = Object.entries(map);
  if (!entries.length) {
    list.innerHTML = `<span class="hint" style="font-size:11px;">— none yet —</span>`;
    return;
  }
  list.innerHTML = entries.map(([name, url]) => `
    <div class="emoji-personal-item" title=":${escapeHtml(name)}:">
      <img src="${escapeHtml(url)}" alt=":${escapeHtml(name)}:" onerror="this.style.display='none'" />
      <span class="emoji-personal-name">:${escapeHtml(name)}:</span>
      <button class="emoji-personal-del" data-del-emoji="${escapeHtml(name)}" title="Remove">✕</button>
    </div>
  `).join("");
}

function _switchEmojiModalTab(tab) {
  $$("[data-emoji-tab]").forEach(t => t.classList.toggle("active", t.dataset.emojiTab === tab));
  $$("[data-emoji-pane]").forEach(p => p.style.display = (p.dataset.emojiPane === tab) ? "" : "none");
  // Show the correct primary action button
  const personalBtn = $("#emoji-personal-add-btn");
  const stickerBtn  = $("#emoji-submit-confirm-btn");
  if (personalBtn) personalBtn.style.display = (tab === "personal") ? "" : "none";
  if (stickerBtn)  stickerBtn.style.display  = (tab === "sticker")  ? "" : "none";
}

$("#emoji-submit-btn")?.addEventListener("click", () => {
  // Personal pane
  $("#emoji-personal-name").value = "";
  $("#emoji-personal-url").value = "";
  $("#emoji-personal-preview").style.display = "none";
  // Sticker pane
  $("#emoji-submit-name").value = "";
  $("#emoji-submit-url").value = "";
  $("#emoji-submit-preview").style.display = "none";
  _renderPersonalEmojiList();
  _switchEmojiModalTab("personal");
  $("#emoji-picker")?.classList.add("hidden");
  emojiOpen = false;
  openModal("emoji-submit-modal");
});

// Tab switching
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-emoji-tab]");
  if (tab) _switchEmojiModalTab(tab.dataset.emojiTab);
});

// Personal-emoji URL preview
$("#emoji-personal-url")?.addEventListener("input", e => {
  const url = e.target.value.trim();
  const wrap = $("#emoji-personal-preview");
  const img = $("#emoji-personal-preview-img");
  if (url && /^https?:\/\//i.test(url)) {
    img.src = url; img.onerror = () => wrap.style.display = "none";
    img.onload = () => wrap.style.display = "block";
  } else { wrap.style.display = "none"; }
});

// Add personal emoji (no review, instant). Also auto-favorites it so it
// shows up in the Favorites tab without manual action.
$("#emoji-personal-add-btn")?.addEventListener("click", () => {
  const name = ($("#emoji-personal-name").value||"").trim().toLowerCase();
  const url  = ($("#emoji-personal-url").value||"").trim();
  if (!/^[a-z0-9_]{2,32}$/.test(name)) { showToast("Name: 2-32 letters/numbers/underscores"); return; }
  if (!/^https?:\/\/.+\.(png|gif|webp|jpe?g)(\?.*)?$/i.test(url)) {
    showToast("URL must end in .png, .gif, .webp, or .jpg"); return;
  }
  const map = _getPersonalEmoji();
  map[name] = url;
  _savePersonalEmoji(map);
  // Personal emoji are always considered "favorited" + appear under Special tab.
  // We don't add to state.favEmojis (which expects unicode chars) — buildEmojiGrid
  // pulls them in directly from _getPersonalEmoji() for both Favorites and Special.
  $("#emoji-personal-name").value = "";
  $("#emoji-personal-url").value = "";
  $("#emoji-personal-preview").style.display = "none";
  _renderPersonalEmojiList();
  showToast(`✓ Added :${name}: — use it in any message`);
});

// Delete personal emoji
$("#emoji-personal-list")?.addEventListener("click", e => {
  const btn = e.target.closest("[data-del-emoji]");
  if (!btn) return;
  const name = btn.dataset.delEmoji;
  const map = _getPersonalEmoji();
  delete map[name];
  _savePersonalEmoji(map);
  _renderPersonalEmojiList();
  showToast(`Removed :${name}:`);
});

// Live preview as URL is typed
$("#emoji-submit-url")?.addEventListener("input", e => {
  const url = e.target.value.trim();
  const previewWrap = $("#emoji-submit-preview");
  const img = $("#emoji-submit-preview-img");
  if (url && /^https?:\/\//i.test(url)) {
    img.src = url; img.onerror = () => previewWrap.style.display = "none";
    img.onload = () => previewWrap.style.display = "block";
  } else {
    previewWrap.style.display = "none";
  }
});

$("#emoji-submit-confirm-btn")?.addEventListener("click", async () => {
  const name = ($("#emoji-submit-name").value||"").trim().toLowerCase();
  const url  = ($("#emoji-submit-url").value||"").trim();
  if (!/^[a-z0-9_]{2,32}$/.test(name)) {
    showToast("Name must be 2-32 chars: letters, numbers, underscores"); return;
  }
  if (!/^https?:\/\/.+\.(png|gif|webp|jpe?g)(\?.*)?$/i.test(url)) {
    showToast("URL must end in .png, .gif, .webp, or .jpg"); return;
  }
  const btn = $("#emoji-submit-confirm-btn");
  btn.disabled = true; btn.textContent = "Submitting…";
  try {
    await addDoc(collection(db, "customEmojiSubmissions"), {
      name, url,
      submittedBy: state.user.uid,
      submittedByName: state.user.displayName,
      chatId: state.activeChatId || null,
      submittedAt: serverTimestamp(),
      status: "pending"
    });
    closeModal("emoji-submit-modal");
    showToast("✓ Submitted! Admin will review.");
  } catch(err) {
    showToast("Error: " + err.message);
  } finally {
    btn.disabled = false; btn.textContent = "Submit for Review";
  }
});

$("#md-preview-btn")?.addEventListener("click", () => {
  _mdPreviewOn = !_mdPreviewOn;
  localStorage.setItem("sc_md_preview", _mdPreviewOn ? "true" : "false");
  $("#md-preview-btn")?.classList.toggle("active", _mdPreviewOn);
  _renderMdPreview();
  showToast(_mdPreviewOn ? "Markdown preview ON" : "Markdown preview OFF");
});
$("#composer-input")?.addEventListener("input", _renderMdPreview);
// Initialize state on load
if (_mdPreviewOn) $("#md-preview-btn")?.classList.add("active");

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
   GIF FREEZE HELPERS
   ===================================================================== */

function _saveFrozenGifs() {
  try { localStorage.setItem("sc_frozen_gifs", JSON.stringify([...state.frozenGifs])); } catch(_){}
}

// Freeze a gif-embed-live img element in place using a canvas snapshot.
// manual=true means the user clicked it, so we may persist the URL.
function _freezeGifImg(gifImg, manual=false) {
  if (!gifImg || gifImg.dataset.frozen === "true") return;
  const wrap = gifImg.closest(".gif-embed-wrap");
  if (!wrap) return;
  try {
    const w = gifImg.offsetWidth || gifImg.naturalWidth || 300;
    const h = gifImg.offsetHeight || gifImg.naturalHeight || 200;
    if (w < 2 || h < 2) return; // image hasn't rendered yet — skip
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.className = "gif-freeze-canvas";
    const ctx = canvas.getContext("2d");
    ctx.drawImage(gifImg, 0, 0, w, h);
    const src = gifImg.src || gifImg.dataset.gifSrc || "";
    gifImg.dataset.origSrc = src;
    gifImg.dataset.frozen = "true";
    gifImg.src = "";
    gifImg.style.display = "none";
    gifImg.title = "";
    const overlay = document.createElement("div");
    overlay.className = "gif-freeze-overlay";
    overlay.innerHTML = `<button class="gif-replay-btn" title="Replay GIF">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
      Replay
    </button>`;
    wrap.appendChild(canvas);
    wrap.appendChild(overlay);
    // Persist if keep-frozen is on and it was a manual freeze
    if (manual && state.gifKeepFrozen && src) {
      state.frozenGifs.add(src);
      _saveFrozenGifs();
    }
  } catch (_) { /* cross-origin draw error — skip */ }
}

// Timer-based auto-freeze after ~2 GIF loops.
// Browsers only fire the img 'load' event once (initial load), not on GIF loop
// restarts — so the old loop-count approach never reached 2. Use a timeout instead.
function _startAutoFreezeTimer(gifImg) {
  if (gifImg._autoFreezeTimer) return; // already running
  // Use data-gif-duration (seconds) when available, else assume 3.5 s per loop
  const secs = parseFloat(gifImg.dataset.gifDuration || "3.5");
  const delay = Math.max(2500, secs * 2 * 1000); // 2 loops, min 2.5 s
  gifImg._autoFreezeTimer = setTimeout(() => {
    gifImg._autoFreezeTimer = null;
    if (gifImg.dataset.frozen !== "true" && gifImg.isConnected) {
      _freezeGifImg(gifImg, false);
    }
  }, delay);
}

// Called after a GIF img loads. Handles:
//   • freeze-by-default / keep-frozen (data-autofreeze attr)
//   • auto-freeze after 2 loops (timer-based)
function _onGifImgLoad(gifImg) {
  if (!gifImg || !gifImg.classList.contains("gif-embed-live")) return;
  if (gifImg.dataset.frozen === "true") return;

  // Auto-freeze immediately (freeze-default or keep-frozen)
  if (gifImg.dataset.autofreeze === "true") {
    setTimeout(() => _freezeGifImg(gifImg, false), 120);
    return;
  }

  // Auto-freeze after 2 loops
  if (state.gifAutoFreeze) {
    _startAutoFreezeTimer(gifImg);
  }
}

// MutationObserver: watch the messages area for new gif-embed-live images
// and attach the load handler + autofreeze logic.
(function _initGifFreezeObserver() {
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        // Check if the added node itself is a gif-embed-live img
        const imgs = node.classList?.contains("gif-embed-live")
          ? [node]
          : [...node.querySelectorAll(".gif-embed-live")];
        for (const img of imgs) {
          if (img._gifLoadBound) continue;
          img._gifLoadBound = true;
          img.addEventListener("load", () => _onGifImgLoad(img));
          // If already loaded (cached), run immediately
          if (img.complete && img.naturalWidth > 0) {
            _onGifImgLoad(img);
          }
        }
      }
    }
  });
  // Start observing once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();


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
let _gifNextPos="", _gifLoadingMore=false, _gifCurrentQuery="";

async function fetchGifs(query, isTrending=false, nextPos="") {
  try {
    const pos=nextPos?`&pos=${encodeURIComponent(nextPos)}`:"";
    const base=isTrending
      ? `https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=30&contentfilter=high${pos}`
      : `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=30&contentfilter=high${pos}`;
    const r=await fetch(base);
    const d=await r.json();
    return {results:d.results||[], next:d.next||""};
  } catch(e){ console.error("GIF:",e); return {results:[], next:""}; }
}

function _gifCellHtml(insertUrl, previewUrl, title, durationSecs) {
  const isFav = !!state.favGifs[insertUrl];
  const durAttr = durationSecs ? ` data-gif-duration="${durationSecs}"` : "";
  // No loading="lazy" — lazy prevents images from loading in dynamically shown containers
  return `<div class="gif-cell" role="button" tabindex="0" data-gif-url="${escapeHtml(insertUrl)}"
    data-gif-preview="${escapeHtml(previewUrl)}" data-gif-title="${escapeHtml(title)}"${durAttr}
    title="${escapeHtml(title)}">
    <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(title||"GIF")}" />
    <span class="gif-fav-btn${isFav?" active":""}" data-fav-url="${escapeHtml(insertUrl)}"
      title="${isFav?"Remove from saved":"Save GIF"}" role="button" tabindex="-1">♥</span>
  </div>`;
}

function renderGifGrid(results, append=false) {
  const grid=$("#gif-grid"); if (!grid) return;
  if (!results.length && !append) { grid.innerHTML=`<p class="gif-hint">No GIFs found — try a different search.</p>`; return; }
  const cells=results.map(r=>{
    const media=r.media?.[0];
    // Use mediumgif for preview (higher quality than tinygif, lower bandwidth than gif)
    // Fall back to gif → tinygif in order of quality
    const previewUrl=media?.mediumgif?.url||media?.gif?.url||media?.tinygif?.url||"";
    const insertUrl =media?.gif?.url||media?.mediumgif?.url||media?.tinygif?.url||"";
    if (!previewUrl) return "";
    // Tenor v1 includes duration in media objects — store for auto-freeze timer
    const dur = media?.gif?.duration||media?.mediumgif?.duration||null;
    return _gifCellHtml(insertUrl, previewUrl, r.title||"", dur);
  }).filter(Boolean).join("");
  if (append) {
    grid.insertAdjacentHTML("beforeend", cells);
  } else {
    grid.innerHTML=cells;
  }
}

function renderFavGifGrid() {
  const grid=$("#gif-grid"); if (!grid) return;
  const favs=Object.values(state.favGifs);
  if (!favs.length) { grid.innerHTML=`<p class="gif-hint">No saved GIFs yet — hover a GIF and click ♥ to save it.</p>`; return; }
  grid.innerHTML=favs.map(f=>_gifCellHtml(f.url, f.previewUrl||f.url, f.title||"")).join("");
}

async function loadGifCategory(cat) {
  _gifActiveCat=cat; _gifNextPos=""; _gifCurrentQuery=cat==="trending"?"":cat;
  $$(".gif-cat-btn").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat));
  const grid=$("#gif-grid");
  if (cat==="favorites") { renderFavGifGrid(); return; }
  if (grid) grid.innerHTML=`<p class="gif-hint">Loading…</p>`;
  const q=cat==="trending"?"":cat;
  const {results, next}=await fetchGifs(q, cat==="trending");
  _gifNextPos=next;
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

// GIF infinite scroll — attached directly to #gif-grid on first picker open (see openGifPicker)
async function _gifGridScrollHandler() {
  const grid=document.getElementById("gif-grid"); if (!grid) return;
  const near=grid.scrollHeight-grid.scrollTop-grid.clientHeight<160;
  if (!near||_gifLoadingMore||!_gifNextPos||_gifActiveCat==="favorites") return;
  _gifLoadingMore=true;
  const loader=document.createElement("p");
  loader.className="gif-hint"; loader.id="gif-load-more"; loader.textContent="Loading…";
  grid.appendChild(loader);
  const isTrending=_gifActiveCat==="trending";
  const {results, next}=await fetchGifs(_gifCurrentQuery, isTrending, _gifNextPos);
  document.getElementById("gif-load-more")?.remove();
  _gifNextPos=next;
  renderGifGrid(results, true);
  _gifLoadingMore=false;
}

// GIF picker toggle
let gifOpen=false;
let _gifScrollListenerAttached=false;
$("#gif-btn")?.addEventListener("click", async ()=>{
  const picker=$("#gif-picker");
  if (!picker) return;
  gifOpen=!gifOpen;
  if (gifOpen) {
    picker.classList.remove("hidden");
    $("#emoji-picker")?.classList.add("hidden"); emojiOpen=false;
    initGifCategoryTabs();
    // Attach scroll listener directly to the grid element once
    const grid=$("#gif-grid");
    if (grid && !_gifScrollListenerAttached) {
      grid.addEventListener("scroll", _gifGridScrollHandler, {passive:true});
      _gifScrollListenerAttached=true;
    }
    // Load trending only if grid is empty / has placeholder
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
  _gifNextPos=""; _gifCurrentQuery=q;
  $$(".gif-cat-btn").forEach(b=>b.classList.remove("active"));
  const grid=$("#gif-grid");
  if (grid) grid.innerHTML=`<p class="gif-hint">Searching…</p>`;
  fetchGifs(q).then(({results, next})=>{ _gifNextPos=next; renderGifGrid(results); });
}
$("#gif-search-input")?.addEventListener("input", ()=>{
  clearTimeout(_gifSearchTimer);
  _gifSearchTimer=setTimeout(doGifSearch, 380);
});
$("#gif-search-input")?.addEventListener("keydown", e=>{ if(e.key==="Enter"){ clearTimeout(_gifSearchTimer); doGifSearch(); } });
$("#gif-search-btn")?.addEventListener("click", ()=>{ clearTimeout(_gifSearchTimer); doGifSearch(); });

// Keyboard activation for gif-cell divs (Enter/Space)
document.addEventListener("keydown", e=>{
  if (e.key!=="Enter"&&e.key!==" ") return;
  const cell=e.target.closest(".gif-cell");
  if (cell && !e.target.closest(".gif-fav-btn")) cell.click();
});

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
  // .ctx-item check handles context-menu clicks (element may be detached but closest() still walks its own tree)
  if (e.target.closest("#gif-picker")||e.target.closest("#gif-btn")||e.target.closest(".ctx-item")) return;
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

// Right-click on inline GIF or image in messages → save/remove from favorites
document.addEventListener("contextmenu", async e=>{
  const img=e.target.closest(".msg-embed-img, .gif-freeze-canvas");
  if (!img) return;
  // For frozen GIFs, get the stored original URL
  const wrap = img.closest(".gif-embed-wrap");
  const gifLive = wrap?.querySelector(".gif-embed-live");
  const url = (gifLive?.dataset.origSrc) || img.src || "";
  // Use same CDN regex as the message formatter
  const isGif=IMAGE_URL_RE.test(url)||GIF_CDN_RE.test(url);
  if (!url||!isGif) return;
  e.preventDefault();
  if (!state.user) return;
  const isFav=!!state.favGifs[url];
  showCtxMenu(e.clientX, e.clientY, [
    {label: isFav ? "Remove from Saved" : "Save GIF", action:"ctx-fav-gif", data:{url, previewUrl:url, title:""}},
  ]);
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
    items.push("divider");
    items.push({label:"📊 Create Poll", action:"ctx-create-poll"});
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
  else if (action==="ctx-group-info") { if(item.dataset.chatId) openGroupInfoModal(item.dataset.chatId); }
  else if (action==="ctx-add-members") {
    if (item.dataset.chatId) {
      // Switch to that chat first so the existing add-member flow works
      await openChat(item.dataset.chatId);
      $("#chat-add-member-btn")?.click();
    }
  }
  else if (action==="ctx-copy-invite") {
    const cid=item.dataset.chatId;
    const ch=state.chats.find(c=>c.id===cid);
    if (ch?.joinCode) { navigator.clipboard.writeText(ch.joinCode).catch(()=>{}); showToast("Invite code copied!"); }
    else showToast("No invite code set");
  }
  else if (action==="ctx-set-color") {
    const cid=item.dataset.chatId; if (!cid) return;
    _showChatColorPicker(cid, e.clientX, e.clientY);
  }
  else if (action==="ctx-pin-chat") {
    if (item.dataset.chatId) _togglePinChat(item.dataset.chatId);
  }
  else if (action==="ctx-move-folder") {
    if (item.dataset.chatId) _showFolderPicker(item.dataset.chatId, e.clientX, e.clientY);
  }
  else if (action==="ctx-leave-group") {
    const cid=item.dataset.chatId;
    const ch=state.chats.find(c=>c.id===cid); if (!ch) return;
    showConfirm(`Leave "${ch.name}"?`, async ()=>{
      try {
        const newMembers=ch.members.filter(m=>m!==state.user.uid);
        const newLeaders=(ch.leaders||[]).filter(m=>m!==state.user.uid);
        await updateDoc(doc(db,"chats",cid),{members:newMembers,leaders:newLeaders});
        if (state.activeChatId===cid) showFriendsView();
        showToast("Left group");
      } catch(err){ showToast("Error: "+err.message); }
    }, { title:"Leave Group", yesLabel:"Leave", danger:true });
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
  else if (action==="ctx-create-poll") { openPollBuilder(); }
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
    const url=item.dataset.url, previewUrl=item.dataset.previewUrl||item.dataset.previewurl||item.dataset.url, title=item.dataset.title||"";
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
  // Profile card 3-dots actions
  else if (action==="ctx-view-full-profile") {
    $("#profile-card")?.classList.add("hidden");
    showFullProfile(uid);
  }
  else if (action==="ctx-copy-user-id") {
    navigator.clipboard.writeText(uid||"").catch(()=>{});
    showToast("User ID copied");
  }
  else if (action==="ctx-pc-unfriend") {
    const fs = state.friends?.find(f=>f.uid===uid);
    if (fs?.friendshipId) { await deleteDoc(doc(db,"friendships",fs.friendshipId)).catch(()=>{}); showToast("Friend removed"); }
    $("#profile-card")?.classList.add("hidden");
  }
  else if (action==="ctx-pc-block") {
    blockUser(uid);
    $("#profile-card")?.classList.add("hidden");
  }
  else if (action==="ctx-pc-unblock") {
    const blocked = (state.user?.blockedUsers||[]).filter(id=>id!==uid);
    await updateDoc(doc(db,"users",state.user.uid),{blockedUsers:blocked}).catch(()=>{});
    showToast("User unblocked");
    $("#profile-card")?.classList.add("hidden");
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
  const inp=$("#chat-search-input");
  if (inp) { inp.focus(); inp.select(); }
}

function closeChatSearch() {
  const inp=$("#chat-search-input");
  if (inp) { inp.value=""; inp.blur(); }
  $$(".msg-search-match").forEach(el=>el.classList.remove("msg-search-match","msg-search-focus"));
  _chatSearchMatches=[]; _chatSearchIdx=0;
  const countEl=$("#chat-search-count"); if(countEl) countEl.textContent="";
  const prevBtn=$("#chat-search-prev"); if(prevBtn) prevBtn.classList.add("hidden");
  const nextBtn=$("#chat-search-next"); if(nextBtn) nextBtn.classList.add("hidden");
  const clearBtn=$("#chat-search-close"); if(clearBtn) clearBtn.classList.add("hidden");
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

$("#chat-search-close")?.addEventListener("click", closeChatSearch);
$("#chat-search-input")?.addEventListener("input", e=>{
  const q=e.target.value;
  runChatSearch(q);
  const hasText = q.length > 0;
  $("#chat-search-prev")?.classList.toggle("hidden", !hasText || _chatSearchMatches.length === 0);
  $("#chat-search-next")?.classList.toggle("hidden", !hasText || _chatSearchMatches.length === 0);
  $("#chat-search-close")?.classList.toggle("hidden", !hasText);
  if (!hasText) { _chatSearchMatches=[]; _chatSearchIdx=0; }
});
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
/* Mute levels:
   - "notif"   — silence sounds/badges (default, what existed before)
   - "preview" — also hide last-message preview in sidebar
   - "all"     — also hide chat entirely from sidebar (still accessible via search)
*/
function _normalizeMute(entry) {
  if (entry == null) return null;
  if (typeof entry === "number") return { exp: entry, level: "notif" };
  return entry;
}
function isChatMuted(chatId) {
  if (!chatId) return false;
  const mutes = _getMutes();
  const e = _normalizeMute(mutes[chatId]); if (!e) return false;
  if (e.exp === -1) return true;
  if (Date.now() < e.exp) return true;
  delete mutes[chatId]; _saveMutes(mutes);
  return false;
}
function chatMuteLevel(chatId) {
  if (!isChatMuted(chatId)) return null;
  const e = _normalizeMute(_getMutes()[chatId]);
  return e?.level || "notif";
}
function muteChat(chatId, durationMs, level="notif") {
  const mutes = _getMutes();
  mutes[chatId] = {
    exp: durationMs === -1 ? -1 : Date.now() + durationMs,
    level
  };
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
  // Build dropdown — duration + level options
  const rect = btn.getBoundingClientRect();
  const menu = document.createElement("div");
  menu.id = "mute-menu";
  menu.className = "mute-menu";
  menu.innerHTML = `
    <div class="mute-menu-title">Mute Level</div>
    <label class="mute-level-row">
      <input type="radio" name="mute-level" value="notif" checked />
      <span>🔕 Notifications only<small>Silence sounds &amp; badges</small></span>
    </label>
    <label class="mute-level-row">
      <input type="radio" name="mute-level" value="preview" />
      <span>🤫 Hide preview<small>Also hide last-message preview</small></span>
    </label>
    <label class="mute-level-row">
      <input type="radio" name="mute-level" value="all" />
      <span>👁️‍🗨️ Hide chat<small>Also hide from sidebar</small></span>
    </label>
    <div class="mute-menu-title" style="margin-top:8px;">Duration</div>
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
    const level = menu.querySelector('input[name="mute-level"]:checked')?.value || "notif";
    muteChat(state.activeChatId, ms, level);
    updateChatMuteBtn();
    renderChatLists(); // refresh sidebar to apply preview/hide level
    const label = opt.textContent.trim();
    const levelLabel = level==="all"?" (hidden)":level==="preview"?" (preview hidden)":"";
    showToast(`🔕 Muted${levelLabel}: ${label}`);
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
   ESC KEY — close any open overlay  (double-Escape = scroll to bottom)
   ===================================================================== */
let _lastEscTime = 0;
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
  // In-chat search — clear if input has text
  const searchInp = $("#chat-search-input");
  if (searchInp && searchInp.value) {
    closeChatSearch(); closed = true;
  }
  // Modals (close top-most open modal)
  if (!closed) {
    const openModal = document.querySelector(".modal:not(.hidden)");
    if (openModal) {
      // Don't close profile-setup modal (required flow)
      if (openModal.id !== "profile-setup-modal" && openModal.id !== "tos-overlay") {
        // Settings modal goes through dirty-check
        if (openModal.id === "settings-modal") onSettingsClose();
        else closeModal(openModal.id);
        closed = true;
      }
    }
  }

  // Double-Escape → scroll to newest messages (bottom)
  const now = Date.now();
  if (!closed) {
    if (now - _lastEscTime < 450) {
      // Second Escape within 450ms — jump to bottom
      const msgWrap = $("#messages");
      if (msgWrap) {
        msgWrap.scrollTo({ top: msgWrap.scrollHeight, behavior: "smooth" });
        showToast("⬇️ Jumped to latest messages");
      }
      _lastEscTime = 0; // reset so triple-Esc doesn't re-trigger
    } else {
      _lastEscTime = now;
    }
  } else {
    _lastEscTime = 0; // something was closed — reset double-Esc timer
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
