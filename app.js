/* =====================================================================
   Static Chat — app.js
   School-safe Discord-inspired chat using Firebase modular SDK.
   ---------------------------------------------------------------------
   FIRESTORE STRUCTURE
   ---------------------------------------------------------------------
   users/{uid}
       uid             string   (== document id)
       displayName     string   (== username, kept in sync)
       displayNameLower string  (lowercased, used for prefix search)
       username        string   (chosen display name, 3-32 chars)
       discriminator   string   (4-digit zero-padded, e.g. "0042")
       bio             string   (optional, up to 200 chars)
       email           string   (private — never shown in UI)
       photoURL        string|null
       createdAt       timestamp

   friendRequests/{requestId}     -- pending friend requests
       fromUid / toUid / fromName / fromPhoto / toName / toPhoto / createdAt

   friendships/{friendshipId}     -- sortedUids.join("_")
       users [uidA, uidB] / createdAt

   chats/{chatId}                 -- DM or group chat
       type / members / name / createdBy / createdAt / lastMessage / lastMessageAt
       messages/{messageId}
           text / senderUid / senderName / senderPhoto / createdAt

   DM chatId: "dm_<uidA>_<uidB>" (sorted)
   ===================================================================== */


/* =====================================================================
   1) FIREBASE CONFIG
   ===================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_LRlGIPn6pXEeoh89mocrXe7aiyAlvE8",
  authDomain: "claude-static-chat.firebaseapp.com",
  projectId: "claude-static-chat",
  storageBucket: "claude-static-chat.firebasestorage.app",
  messagingSenderId: "217707625831",
  appId: "1:217707625831:web:25d5bbbc72e7965a9f83c2",
  measurementId: "G-X3DN5PWEYL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


/* =====================================================================
   2) STATE
   ===================================================================== */
const state = {
  user: null,            // current user profile
  friends: [],
  incoming: [],
  outgoing: [],
  chats: [],
  activeChatId: null,
  activeChat: null,
  messages: [],
  userCache: {},
  unsubscribers: {
    friendships: null,
    incoming: null,
    outgoing: null,
    chats: null,
    messages: null,
    ownProfile: null    // live own-profile updates
  },
  filters: { sidebar: "" },
  groupSelections: new Set(),
  addMemberSelections: new Set(),
  soundEnabled: localStorage.getItem("sc_sound") !== "false",
  chatInitialized: new Set(),   // chatIds whose first snapshot has loaded
  incomingInitialized: false    // skips sound on first incoming-requests snapshot
};


/* =====================================================================
   3) DOM HELPERS
   ===================================================================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(msg, ms = 2400) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), ms);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function avatarMarkup(displayName, photoURL, sizeClass = "side-row-avatar", fallbackClass = "side-row-fallback") {
  if (photoURL) {
    return `<img class="${sizeClass}" src="${escapeHtml(photoURL)}" alt="" />`;
  }
  const initial = (displayName || "?").trim().charAt(0).toUpperCase() || "?";
  return `<div class="${fallbackClass}">${escapeHtml(initial)}</div>`;
}

function groupInitials(name) {
  if (!name) return "G";
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map(w => w[0]).join("").toUpperCase() || "G";
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today.getTime() - 86400000);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${d.toLocaleDateString()} ${time}`;
}

function shortTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function genDiscriminator() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}


/* =====================================================================
   4) PROFANITY FILTER (placeholder — customize as needed)
   ---------------------------------------------------------------------
   Add lowercase words to PROFANITY_LIST. They'll be replaced with
   asterisks before sending. Real moderation should also be enforced
   server-side; this is intentionally simple as a starting point.
   ===================================================================== */
const PROFANITY_LIST = [
  // "examplebadword",
];

function filterProfanity(text) {
  if (!PROFANITY_LIST.length) return text;
  let out = text;
  for (const word of PROFANITY_LIST) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, "*".repeat(word.length));
  }
  return out;
}


/* =====================================================================
   5) EMOJI MAP + special :Static: image
   ===================================================================== */
const STATIC_EMOJI_URL = "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png";

const EMOJI_MAP = {
  // faces
  smile: "😄", grin: "😀", joy: "😂", rofl: "🤣", laughing: "😆",
  sweat_smile: "😅", wink: "😉", blush: "😊", kiss: "😘", heart_eyes: "😍",
  yum: "😋", smirk: "😏", thinking: "🤔", neutral_face: "😐",
  expressionless: "😑", no_mouth: "😶", roll_eyes: "🙄", pensive: "😔",
  worried: "😟", confused: "😕", flushed: "😳", scream: "😱", angry: "😠",
  rage: "😡", sob: "😭", cry: "😢", sleeping: "😴", yawn: "🥱",
  sunglasses: "😎", nerd: "🤓", cool: "🆒", pleading: "🥺", smiley: "😃",
  // gestures
  thumbsup: "👍", "+1": "👍", thumbsdown: "👎", "-1": "👎",
  ok_hand: "👌", clap: "👏", wave: "👋", muscle: "💪", point_right: "👉",
  point_left: "👈", point_up: "👆", point_down: "👇", pray: "🙏",
  raised_hands: "🙌", handshake: "🤝", fist: "✊", crossed_fingers: "🤞",
  // hearts / symbols
  heart: "❤️", broken_heart: "💔", sparkling_heart: "💖", two_hearts: "💕",
  fire: "🔥", "100": "💯", star: "⭐", sparkles: "✨", boom: "💥",
  zzz: "💤", eyes: "👀", brain: "🧠", warning: "⚠️", check: "✅",
  white_check_mark: "✅", x: "❌", question: "❓", exclamation: "❗",
  tada: "🎉", confetti_ball: "🎊", gift: "🎁", trophy: "🏆", medal: "🏅",
  // weather
  sun: "☀️", moon: "🌙", cloud: "☁️", rainbow: "🌈", snowflake: "❄️",
  zap: "⚡", umbrella: "☂️", fog: "🌫️",
  // food
  pizza: "🍕", burger: "🍔", fries: "🍟", taco: "🌮", sushi: "🍣",
  ramen: "🍜", coffee: "☕", tea: "🍵", cake: "🎂", cookie: "🍪",
  apple: "🍎", banana: "🍌", strawberry: "🍓", watermelon: "🍉", grapes: "🍇",
  popcorn: "🍿", donut: "🍩",
  // animals
  dog: "🐶", cat: "🐱", fox: "🦊", bear: "🐻", panda: "🐼",
  lion: "🦁", tiger: "🐯", pig: "🐷", monkey: "🐵", penguin: "🐧",
  unicorn: "🦄", bee: "🐝", bug: "🐛", butterfly: "🦋",
  // objects
  book: "📚", pencil: "✏️", computer: "💻", phone: "📱", clock: "⏰",
  music: "🎵", headphones: "🎧", soccer: "⚽", basketball: "🏀",
  football: "🏈", baseball: "⚾", videogame: "🎮", art: "🎨",
  camera: "📷", rocket: "🚀", airplane: "✈️", car: "🚗", bike: "🚲",
  earth: "🌍", school: "🏫", house: "🏠", office: "🏢", park: "🏞️",
};

function emojiPickerItems() {
  const items = [{
    name: "Static",
    html: `<img src="${STATIC_EMOJI_URL}" alt=":Static:" />`,
    insert: ":Static:",
    keywords: "static logo special"
  }];
  for (const [name, char] of Object.entries(EMOJI_MAP)) {
    items.push({ name, html: char, insert: char, keywords: name });
  }
  return items;
}


/* =====================================================================
   6) MESSAGE FORMATTER (markdown-lite + emoji)
   ---------------------------------------------------------------------
   Order matters — passes build on each other.
   ===================================================================== */
function formatMessage(raw) {
  if (!raw) return "";
  let text = escapeHtml(raw);

  // Code blocks ``` ... ``` (multiline)
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (_m, inner) => {
    codeBlocks.push(inner.replace(/^\n/, ""));
    return ` CB${codeBlocks.length - 1} `;
  });

  // Inline code ` ... `
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_m, inner) => {
    inlineCodes.push(inner);
    return ` IC${inlineCodes.length - 1} `;
  });

  // Bold ** ... **
  text = text.replace(/\*\*([^*\n][^*\n]*?)\*\*/g, "<strong>$1</strong>");
  // Underline __ ... __
  text = text.replace(/__([^_\n][^_\n]*?)__/g, "<u>$1</u>");
  // Italic * ... * (after bold so we don't eat **)
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

  // Emoji shortcuts :name:
  text = text.replace(/:([A-Za-z0-9_+\-]+):/g, (m, name) => {
    if (name === "Static") {
      return `<img class="msg-emoji" src="${STATIC_EMOJI_URL}" alt=":Static:" title=":Static:" />`;
    }
    if (EMOJI_MAP[name]) return EMOJI_MAP[name];
    return m;
  });

  // Restore code placeholders
  text = text.replace(/ IC(\d+) /g, (_m, i) => `<code class="inline-code">${inlineCodes[+i]}</code>`);
  text = text.replace(/ CB(\d+) /g, (_m, i) => `<pre class="code-block"><code>${codeBlocks[+i]}</code></pre>`);

  // Newlines -> <br>
  text = text.replace(/\n/g, "<br>");

  return text;
}


/* =====================================================================
   7) NOTIFICATION SOUNDS (Web Audio API — no file needed)
   ===================================================================== */
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  return _audioCtx;
}

function playSound(type = "message") {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";

    if (type === "message") {
      // Quick upward tone
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === "ping") {
      // Two-note ping — friend request
      osc.frequency.setValueAtTime(1047, ctx.currentTime);
      osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (_) { /* audio not available */ }
}


/* =====================================================================
   8) AUTH
   ===================================================================== */
$("#google-signin-btn").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    showToast("Sign-in failed: " + (e.message || e.code));
  }
});

$("#signout-btn").addEventListener("click", async () => {
  cleanupAllSubscriptions();
  await signOut(auth);
});

onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // Fetch existing Firestore profile
    let existing = null;
    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) existing = snap.data();
    } catch (e) { console.error("profile fetch:", e); }

    state.user = {
      uid: firebaseUser.uid,
      username: existing?.username || null,
      discriminator: existing?.discriminator || null,
      displayName: existing?.username || firebaseUser.displayName || "User",
      bio: existing?.bio || "",
      email: firebaseUser.email || "",
      photoURL: (existing && existing.photoURL !== undefined)
        ? existing.photoURL
        : (firebaseUser.photoURL || null),
      googlePhotoURL: firebaseUser.photoURL || null
    };

    state.userCache[state.user.uid] = { ...state.user };

    if (!existing?.username) {
      // First sign-in — show profile setup modal
      showProfileSetupModal();
    } else {
      // Returning user
      await upsertUserProfile();
      showAppUI();
      bootSubscriptions();
    }
  } else {
    state.user = null;
    cleanupAllSubscriptions();
    showLoginUI();
  }
});

async function upsertUserProfile() {
  const u = state.user;
  // merge:true so we don't clobber email set on first creation
  await setDoc(doc(db, "users", u.uid), {
    uid: u.uid,
    displayName: u.username,
    displayNameLower: u.username.toLowerCase(),
    username: u.username,
    discriminator: u.discriminator,
    bio: u.bio || "",
    photoURL: u.photoURL || null
  }, { merge: true });
}


/* =====================================================================
   8.5) PROFILE SETUP MODAL — first sign-in only
   ===================================================================== */
function showProfileSetupModal() {
  const u = state.user;
  const defaultPhoto = u.googlePhotoURL || null;
  // Pre-fill photo field with Google photo URL
  $("#setup-photo-input").value = defaultPhoto || "";
  updateAvatarPreview("setup", "", defaultPhoto);
  openModal("profile-setup-modal");
}

// Live avatar preview
$("#setup-photo-input").addEventListener("input", () => {
  updateAvatarPreview(
    "setup",
    $("#setup-username-input").value.trim(),
    $("#setup-photo-input").value.trim() || state.user?.googlePhotoURL || null
  );
});
$("#setup-username-input").addEventListener("input", () => {
  updateAvatarPreview(
    "setup",
    $("#setup-username-input").value.trim(),
    $("#setup-photo-input").value.trim() || state.user?.googlePhotoURL || null
  );
});

function updateAvatarPreview(prefix, name, photoURL) {
  const preview = $(`#${prefix}-avatar-preview`);
  const initial = $(`#${prefix}-avatar-initial`);
  if (!preview) return;
  const oldImg = preview.querySelector("img");
  if (oldImg) oldImg.remove();
  if (photoURL) {
    const img = document.createElement("img");
    img.src = photoURL;
    img.onerror = () => { img.remove(); if (initial) initial.style.display = ""; };
    if (initial) initial.style.display = "none";
    preview.appendChild(img);
  } else {
    if (initial) {
      initial.style.display = "";
      initial.textContent = name ? name.charAt(0).toUpperCase() : "?";
    }
  }
}

$("#setup-confirm-btn").addEventListener("click", async () => {
  const username = $("#setup-username-input").value.trim();
  const bio = $("#setup-bio-input").value.trim();
  const photoInput = $("#setup-photo-input").value.trim();
  const errEl = $("#setup-error");
  errEl.textContent = "";

  if (!username || username.length < 3) {
    errEl.textContent = "Username must be at least 3 characters.";
    return;
  }
  if (username.length > 32) {
    errEl.textContent = "Username must be 32 characters or fewer.";
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errEl.textContent = "Username can only contain letters, numbers, and underscores.";
    return;
  }

  const discriminator = genDiscriminator();
  const photoURL = photoInput || state.user.googlePhotoURL || null;

  state.user.username = username;
  state.user.discriminator = discriminator;
  state.user.displayName = username;
  state.user.bio = bio;
  state.user.photoURL = photoURL;

  const btn = $("#setup-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    await setDoc(doc(db, "users", state.user.uid), {
      uid: state.user.uid,
      displayName: username,
      displayNameLower: username.toLowerCase(),
      username,
      discriminator,
      bio: bio || "",
      email: state.user.email || "",
      photoURL: photoURL || null,
      createdAt: serverTimestamp()
    }, { merge: true });

    state.userCache[state.user.uid] = { ...state.user };
    closeModal("profile-setup-modal");
    showAppUI();
    bootSubscriptions();
  } catch (err) {
    errEl.textContent = "Failed to save: " + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Let's Go →";
  }
});


/* =====================================================================
   9) UI ROUTING
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
  $("#user-panel-name").textContent = u.username || u.displayName || "User";
  $("#user-panel-tag").textContent = u.discriminator ? `#${u.discriminator}` : "";
  $("#user-panel-avatar-wrap").innerHTML = avatarMarkup(
    u.username || u.displayName,
    u.photoURL,
    "user-panel-avatar",
    "user-panel-avatar-fallback"
  );
}

function showFriendsView() {
  state.activeChatId = null;
  state.activeChat = null;
  $("#rail-home").classList.add("active");
  $$(".rail-group-avatar").forEach(el => el.classList.remove("active"));
  $$(".side-row").forEach(el => el.classList.remove("active"));
  $("#open-friends-btn").classList.add("active");

  $("#friends-view").classList.remove("hidden");
  $("#chat-view").classList.add("hidden");
  $("#empty-view").classList.add("hidden");

  if (state.unsubscribers.messages) {
    state.unsubscribers.messages();
    state.unsubscribers.messages = null;
  }
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
   10) SUBSCRIPTIONS — friends, requests, chats, own profile
   ===================================================================== */
function cleanupAllSubscriptions() {
  for (const k of Object.keys(state.unsubscribers)) {
    if (state.unsubscribers[k]) {
      try { state.unsubscribers[k](); } catch (_) {}
      state.unsubscribers[k] = null;
    }
  }
  state.friends = [];
  state.incoming = [];
  state.outgoing = [];
  state.chats = [];
  state.messages = [];
  state.activeChatId = null;
  state.activeChat = null;
  state.chatInitialized.clear();
  state.incomingInitialized = false;
}

function bootSubscriptions() {
  const uid = state.user.uid;

  // Own profile — live updates so settings changes reflect instantly
  state.unsubscribers.ownProfile = onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.username) {
        state.user.username = data.username;
        state.user.displayName = data.username;
      }
      if (data.discriminator) state.user.discriminator = data.discriminator;
      state.user.bio = data.bio || "";
      if (data.photoURL !== undefined) state.user.photoURL = data.photoURL;
      state.userCache[uid] = { ...state.user, ...data };
      updateUserPanel();
    },
    (err) => console.error("ownProfile listener:", err)
  );

  // Friendships
  state.unsubscribers.friendships = onSnapshot(
    query(collection(db, "friendships"), where("users", "array-contains", uid)),
    async (snap) => {
      const list = [];
      for (const d of snap.docs) {
        const data = d.data();
        const otherUid = data.users.find(u => u !== uid);
        if (!otherUid) continue;
        const profile = await fetchUserProfile(otherUid);
        list.push({
          friendshipId: d.id,
          uid: otherUid,
          displayName: profile?.username || profile?.displayName || "Unknown",
          discriminator: profile?.discriminator || null,
          photoURL: profile?.photoURL || null
        });
      }
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
      state.friends = list;
      renderFriendsList();
      renderModalFriendList();
    },
    (err) => console.error("friendships listener:", err)
  );

  // Incoming friend requests
  state.unsubscribers.incoming = onSnapshot(
    query(collection(db, "friendRequests"), where("toUid", "==", uid)),
    (snap) => {
      const prevLen = state.incoming.length;
      state.incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (state.incomingInitialized && state.incoming.length > prevLen) {
        playSound("ping");
      }
      state.incomingInitialized = true;
      renderPendingLists();
    },
    (err) => console.error("incoming listener:", err)
  );

  // Outgoing friend requests
  state.unsubscribers.outgoing = onSnapshot(
    query(collection(db, "friendRequests"), where("fromUid", "==", uid)),
    (snap) => {
      state.outgoing = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPendingLists();
    },
    (err) => console.error("outgoing listener:", err)
  );

  // Chats (DMs and groups)
  state.unsubscribers.chats = onSnapshot(
    query(collection(db, "chats"), where("members", "array-contains", uid)),
    async (snap) => {
      const arr = [];
      for (const d of snap.docs) arr.push({ id: d.id, ...d.data() });
      for (const c of arr) {
        if (c.type === "dm") {
          const otherUid = c.members.find(m => m !== uid);
          if (otherUid && !state.userCache[otherUid]) await fetchUserProfile(otherUid);
        }
      }
      arr.sort((a, b) => {
        const at = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
        const bt = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
        return bt - at;
      });
      state.chats = arr;
      renderChatLists();
      if (state.activeChatId) {
        const updated = state.chats.find(c => c.id === state.activeChatId);
        if (updated) {
          state.activeChat = updated;
          renderChatHeader();
        }
      }
    },
    (err) => console.error("chats listener:", err)
  );
}


/* =====================================================================
   11) USER PROFILE FETCH (cached)
   ===================================================================== */
async function fetchUserProfile(uid) {
  if (state.userCache[uid]) return state.userCache[uid];
  try {
    const d = await getDoc(doc(db, "users", uid));
    if (d.exists()) {
      state.userCache[uid] = d.data();
      return state.userCache[uid];
    }
  } catch (e) { console.error("fetchUserProfile:", e); }
  return null;
}


/* =====================================================================
   12) RENDER — Friends list / pending / search
   ===================================================================== */
function renderFriendsList() {
  const filterText = ($("#friends-filter")?.value || "").trim().toLowerCase();
  const list = $("#friends-list");
  const empty = $("#friends-empty");
  const filtered = state.friends.filter(f =>
    !filterText || f.displayName.toLowerCase().includes(filterText));

  $("#all-count").textContent = `All Friends — ${state.friends.length}`;

  if (state.friends.length === 0) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.innerHTML = filtered.map(f => `
    <div class="friend-row" data-uid="${escapeHtml(f.uid)}">
      ${avatarMarkup(f.displayName, f.photoURL, "friend-row-avatar", "friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(f.displayName)}</div>
        <div class="friend-row-tag">${f.discriminator ? `#${escapeHtml(f.discriminator)}` : ""}</div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle" title="Message" data-action="message" data-uid="${escapeHtml(f.uid)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <button class="action-circle decline" title="Remove friend" data-action="remove" data-uid="${escapeHtml(f.uid)}" data-friendship-id="${escapeHtml(f.friendshipId)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

function renderPendingLists() {
  const incomingList = $("#incoming-list");
  const outgoingList = $("#outgoing-list");

  $("#incoming-empty").hidden = state.incoming.length > 0;
  $("#outgoing-empty").hidden = state.outgoing.length > 0;

  incomingList.innerHTML = state.incoming.map(r => `
    <div class="friend-row">
      ${avatarMarkup(r.fromName, r.fromPhoto, "friend-row-avatar", "friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(r.fromName || "Unknown")}</div>
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
    </div>
  `).join("");

  outgoingList.innerHTML = state.outgoing.map(r => `
    <div class="friend-row">
      ${avatarMarkup(r.toName, r.toPhoto, "friend-row-avatar", "friend-row-fallback")}
      <div class="friend-row-info">
        <div class="friend-row-name">${escapeHtml(r.toName || "Unknown")}</div>
        <div class="friend-row-meta">Pending — waiting for them to accept</div>
      </div>
      <div class="friend-row-actions">
        <button class="action-circle decline" title="Cancel" data-action="cancel-out" data-id="${escapeHtml(r.id)}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

// Click delegation for friends views
$("#friends-view").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "message") {
    await openOrCreateDm(btn.dataset.uid);
  } else if (action === "remove") {
    if (!confirm("Remove this friend?")) return;
    try {
      await deleteDoc(doc(db, "friendships", btn.dataset.friendshipId));
      showToast("Friend removed");
    } catch (err) { showToast("Error: " + err.message); }
  } else if (action === "accept") {
    await acceptRequest(btn.dataset.id);
  } else if (action === "decline" || action === "cancel-out") {
    try {
      await deleteDoc(doc(db, "friendRequests", btn.dataset.id));
    } catch (err) { showToast("Error: " + err.message); }
  }
});


/* =====================================================================
   13) FRIENDS PANEL — tabs, search, add-friend search
   ===================================================================== */
$$(".tab").forEach(t => t.addEventListener("click", () => {
  $$(".tab").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  const target = t.dataset.tab;
  $$(".tab-panel").forEach(p => p.classList.add("hidden"));
  $(`.tab-panel[data-panel="${target}"]`).classList.remove("hidden");
}));

$("#friends-filter").addEventListener("input", renderFriendsList);
$("#add-friend-search-btn").addEventListener("click", searchUsers);
$("#add-friend-input").addEventListener("keydown", (e) => { if (e.key === "Enter") searchUsers(); });

async function searchUsers() {
  const raw = $("#add-friend-input").value.trim();
  const results = $("#search-results");
  results.innerHTML = "";
  if (!raw) {
    $("#search-hint").textContent = "Enter a username to search.";
    return;
  }
  $("#search-hint").textContent = "Searching…";

  try {
    let found = [];

    // Check for username#1234 exact-match format
    const hashMatch = raw.match(/^(.+)#(\d{4})$/);
    if (hashMatch) {
      const [, uname, disc] = hashMatch;
      const term = uname.toLowerCase();
      const q = query(
        collection(db, "users"),
        orderBy("displayNameLower"),
        startAt(term),
        endAt(term + ""),
        limit(50)
      );
      const snap = await getDocs(q);
      snap.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== state.user.uid &&
            u.displayNameLower === term && u.discriminator === disc) {
          found.push(u);
        }
      });
    } else {
      // Prefix search by username
      const term = raw.toLowerCase();
      const q = query(
        collection(db, "users"),
        orderBy("displayNameLower"),
        startAt(term),
        endAt(term + ""),
        limit(20)
      );
      const snap = await getDocs(q);
      snap.forEach(d => {
        const u = d.data();
        if (u.uid && u.uid !== state.user.uid) found.push(u);
      });
    }

    if (!found.length) {
      $("#search-hint").textContent = "No users found.";
      return;
    }

    $("#search-hint").textContent = `Found ${found.length} user(s).`;

    const friendUids = new Set(state.friends.map(f => f.uid));
    const incomingFromUids = new Set(state.incoming.map(r => r.fromUid));
    const outgoingToUids = new Set(state.outgoing.map(r => r.toUid));

    results.innerHTML = found.map(u => {
      const tag = u.discriminator ? `#${escapeHtml(u.discriminator)}` : "";
      let actionHtml = `<button class="btn-primary" data-action="send-request" data-uid="${escapeHtml(u.uid)}" data-name="${escapeHtml(u.username || u.displayName || "")}" data-photo="${escapeHtml(u.photoURL || "")}">Add Friend</button>`;
      if (friendUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">Already friends</span>`;
      else if (outgoingToUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">Request sent</span>`;
      else if (incomingFromUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">Accept their request instead</span>`;

      return `
        <div class="friend-row">
          ${avatarMarkup(u.username || u.displayName, u.photoURL, "friend-row-avatar", "friend-row-fallback")}
          <div class="friend-row-info">
            <div class="friend-row-name">${escapeHtml(u.username || u.displayName || "Unknown")}</div>
            <div class="friend-row-tag">${tag}</div>
          </div>
          <div class="friend-row-actions">${actionHtml}</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
    $("#search-hint").textContent = "Search failed: " + err.message;
  }
}

$("#search-results").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action='send-request']");
  if (!btn) return;
  const toUid = btn.dataset.uid;
  const toName = btn.dataset.name;
  const toPhoto = btn.dataset.photo || null;
  btn.disabled = true;
  btn.textContent = "Sending…";
  try {
    if (state.friends.find(f => f.uid === toUid)) throw new Error("Already friends");
    if (state.outgoing.find(r => r.toUid === toUid)) throw new Error("Already sent");
    if (state.incoming.find(r => r.fromUid === toUid)) throw new Error("They already sent you one — accept it instead");

    // Deterministic request ID: `${fromUid}_${toUid}`.
    // Security rules verify a matching request exists when creating a friendship.
    const reqId = `${state.user.uid}_${toUid}`;
    await setDoc(doc(db, "friendRequests", reqId), {
      fromUid: state.user.uid,
      toUid,
      fromName: state.user.displayName,
      fromPhoto: state.user.photoURL || null,
      toName,
      toPhoto,
      createdAt: serverTimestamp()
    });
    btn.textContent = "Sent ✓";
    showToast("Friend request sent");
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Add Friend";
    showToast("Error: " + err.message);
  }
});


/* =====================================================================
   14) FRIEND REQUEST ACCEPT
   ===================================================================== */
async function acceptRequest(requestId) {
  const req = state.incoming.find(r => r.id === requestId);
  if (!req) return;
  const me = state.user.uid;
  const them = req.fromUid;
  const sorted = [me, them].sort();
  const friendshipId = sorted.join("_");

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "friendships", friendshipId), {
      users: sorted,
      createdAt: serverTimestamp()
    });
    batch.delete(doc(db, "friendRequests", requestId));
    await batch.commit();
    showToast("Friend added!");
  } catch (err) {
    showToast("Error: " + err.message);
  }
}


/* =====================================================================
   15) RENDER — sidebar DMs and groups; rail group avatars
   ===================================================================== */
function renderChatLists() {
  const filterText = state.filters.sidebar.toLowerCase();
  const dms = state.chats.filter(c => c.type === "dm");
  const groups = state.chats.filter(c => c.type === "group");

  const dmList = $("#dm-list");
  dmList.innerHTML = dms.map(c => {
    const otherUid = c.members.find(m => m !== state.user.uid);
    const profile = state.userCache[otherUid];
    const name = profile?.username || profile?.displayName || "Direct Message";
    const photo = profile?.photoURL || null;
    if (filterText && !name.toLowerCase().includes(filterText)) return "";
    const active = state.activeChatId === c.id ? "active" : "";
    return `
      <div class="side-row ${active}" data-chat-id="${escapeHtml(c.id)}" data-type="dm">
        ${avatarMarkup(name, photo, "side-row-avatar", "side-row-fallback")}
        <div class="side-row-name">${escapeHtml(name)}</div>
        <button class="icon-btn side-row-close" title="Close" data-action="close-dm" data-chat-id="${escapeHtml(c.id)}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    `;
  }).join("");

  const groupList = $("#group-list");
  groupList.innerHTML = groups.map(c => {
    const name = c.name || "Group";
    if (filterText && !name.toLowerCase().includes(filterText)) return "";
    const active = state.activeChatId === c.id ? "active" : "";
    return `
      <div class="side-row ${active}" data-chat-id="${escapeHtml(c.id)}" data-type="group">
        <div class="side-row-fallback">${escapeHtml(groupInitials(name))}</div>
        <div class="side-row-name">${escapeHtml(name)}</div>
      </div>
    `;
  }).join("");

  const rail = $("#rail-groups");
  rail.innerHTML = groups.map(c => {
    const active = state.activeChatId === c.id ? "active" : "";
    return `<div class="rail-group-avatar ${active}" data-chat-id="${escapeHtml(c.id)}" title="${escapeHtml(c.name || "Group")}">${escapeHtml(groupInitials(c.name || "G"))}</div>`;
  }).join("");
}

$("#dm-list").addEventListener("click", (e) => {
  const close = e.target.closest("button[data-action='close-dm']");
  if (close) {
    e.stopPropagation();
    if (state.activeChatId === close.dataset.chatId) showFriendsView();
    return;
  }
  const row = e.target.closest(".side-row");
  if (row) openChat(row.dataset.chatId);
});

$("#group-list").addEventListener("click", (e) => {
  const row = e.target.closest(".side-row");
  if (row) openChat(row.dataset.chatId);
});

$("#rail-groups").addEventListener("click", (e) => {
  const av = e.target.closest(".rail-group-avatar");
  if (av) openChat(av.dataset.chatId);
});

$("#sidebar-search").addEventListener("input", (e) => {
  state.filters.sidebar = e.target.value;
  renderChatLists();
});

$("#new-dm-btn").addEventListener("click", () => {
  showFriendsView();
  $$(".tab").forEach(x => x.classList.remove("active"));
  $(".tab[data-tab='all']").classList.add("active");
  $$(".tab-panel").forEach(p => p.classList.add("hidden"));
  $(".tab-panel[data-panel='all']").classList.remove("hidden");
  showToast("Click any friend's message icon to start a DM.");
});


/* =====================================================================
   16) DM open/create
   ===================================================================== */
async function openOrCreateDm(otherUid) {
  const me = state.user.uid;
  const sorted = [me, otherUid].sort();
  const chatId = `dm_${sorted[0]}_${sorted[1]}`;
  const ref = doc(db, "chats", chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    try {
      await setDoc(ref, {
        type: "dm",
        members: sorted,
        name: "",
        createdBy: me,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp()
      });
    } catch (err) {
      showToast("Could not open DM: " + err.message);
      return;
    }
  }
  openChat(chatId);
}


/* =====================================================================
   17) OPEN CHAT — subscribe to messages, render
   ===================================================================== */
async function openChat(chatId) {
  state.activeChatId = chatId;
  state.activeChat = state.chats.find(c => c.id === chatId) || null;
  if (!state.activeChat) {
    try {
      const d = await getDoc(doc(db, "chats", chatId));
      if (d.exists()) state.activeChat = { id: d.id, ...d.data() };
    } catch (_) {}
  }
  if (!state.activeChat) return;

  showChatView();
  renderChatHeader();
  renderChatLists();

  if (state.unsubscribers.messages) {
    state.unsubscribers.messages();
    state.unsubscribers.messages = null;
  }

  state.messages = [];
  $("#messages").innerHTML = `<div class="empty" style="margin:24px;">Loading messages…</div>`;

  state.unsubscribers.messages = onSnapshot(
    query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    ),
    (snap) => {
      const prevLen = state.messages.length;
      state.messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Play sound for new messages from others (skip initial load)
      if (state.chatInitialized.has(chatId) && state.messages.length > prevLen) {
        const newest = state.messages[state.messages.length - 1];
        if (newest && newest.senderUid !== state.user.uid) {
          playSound("message");
        }
      }
      state.chatInitialized.add(chatId);
      renderMessages();
    },
    (err) => {
      console.error(err);
      $("#messages").innerHTML = `<div class="empty" style="margin:24px;color:var(--c-danger)">Could not load messages: ${escapeHtml(err.message)}</div>`;
    }
  );
}

async function renderChatHeader() {
  const c = state.activeChat;
  if (!c) return;

  const avatarWrap = $("#chat-header-avatar-wrap");
  const addBtn = $("#chat-add-member-btn");
  const leaveBtn = $("#chat-leave-btn");

  if (c.type === "dm") {
    const otherUid = c.members.find(m => m !== state.user.uid);
    const profile = await fetchUserProfile(otherUid);
    const name = profile?.username || profile?.displayName || "Direct Message";
    const tag = profile?.discriminator ? `#${profile.discriminator}` : "";
    $("#chat-header-name").textContent = name;
    $("#chat-header-sub").textContent = tag ? `${tag} · Direct Message` : "Direct Message";
    avatarWrap.innerHTML = avatarMarkup(name, profile?.photoURL, "chat-header-avatar", "chat-header-avatar-fallback");
    addBtn.hidden = true;
    leaveBtn.hidden = true;
  } else {
    $("#chat-header-name").textContent = c.name || "Group";
    $("#chat-header-sub").textContent = `${c.members.length} member${c.members.length === 1 ? "" : "s"}`;
    avatarWrap.innerHTML = `<div class="chat-header-avatar-fallback">${escapeHtml(groupInitials(c.name || "G"))}</div>`;
    addBtn.hidden = false;
    leaveBtn.hidden = false;
  }
}

function renderMessages() {
  const wrap = $("#messages");
  if (!state.messages.length) {
    wrap.innerHTML = `<div class="empty" style="margin:24px;">No messages yet — say hi!</div>`;
    return;
  }

  const html = [];
  let lastSenderUid = null;
  let lastTime = 0;

  for (const m of state.messages) {
    const ts = m.createdAt;
    const tms = ts?.toMillis ? ts.toMillis() : 0;
    const sameSender = m.senderUid === lastSenderUid;
    const closeInTime = tms - lastTime < 5 * 60 * 1000;

    if (sameSender && closeInTime && lastSenderUid !== null) {
      html.push(`
        <div class="msg-followup">
          <span class="msg-time-inline">${escapeHtml(shortTime(ts))}</span>
          <div class="msg-body">${formatMessage(m.text || "")}</div>
        </div>
      `);
    } else {
      html.push(`
        <div class="message-group">
          <div class="msg-avatar-btn" data-profile-uid="${escapeHtml(m.senderUid)}" title="View profile" role="button" tabindex="0">
            ${avatarMarkup(m.senderName, m.senderPhoto, "msg-avatar", "msg-avatar-fallback")}
          </div>
          <div class="msg-content">
            <div class="msg-head">
              <span class="msg-author" data-profile-uid="${escapeHtml(m.senderUid)}">${escapeHtml(m.senderName || "User")}</span>
              <span class="msg-time">${escapeHtml(formatTime(ts))}</span>
            </div>
            <div class="msg-body">${formatMessage(m.text || "")}</div>
          </div>
        </div>
      `);
    }

    lastSenderUid = m.senderUid;
    lastTime = tms;
  }

  wrap.innerHTML = html.join("");
  wrap.scrollTop = wrap.scrollHeight;
}

// Avatar / author name click → profile card
$("#messages").addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-profile-uid]");
  if (trigger) showProfileCard(trigger.dataset.profileUid, e);
});


/* =====================================================================
   18) SEND MESSAGE
   ===================================================================== */
const composer = $("#composer-input");
composer.addEventListener("input", () => {
  composer.style.height = "auto";
  composer.style.height = Math.min(composer.scrollHeight, 200) + "px";
});

composer.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendCurrentMessage();
  }
});

$("#send-btn").addEventListener("click", sendCurrentMessage);

async function sendCurrentMessage() {
  const raw = composer.value;
  const text = filterProfanity(raw).trim();
  if (!text) return;
  if (!state.activeChatId) return;
  if (text.length > 2000) { showToast("Message too long (2000 char max)"); return; }

  const chatId = state.activeChatId;
  composer.value = "";
  composer.style.height = "auto";

  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderUid: state.user.uid,
      senderName: state.user.displayName,
      senderPhoto: state.user.photoURL || null,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text.slice(0, 200),
      lastMessageAt: serverTimestamp()
    });
  } catch (err) {
    showToast("Send failed: " + err.message);
    composer.value = raw;
  }
}


/* =====================================================================
   19) CREATE GROUP CHAT
   ===================================================================== */
$("#rail-create-group").addEventListener("click", () => {
  state.groupSelections.clear();
  $("#group-name-input").value = "";
  renderModalFriendList();
  openModal("create-group-modal");
});

function renderModalFriendList() {
  const wrap = $("#modal-friend-list");
  if (!wrap) return;
  if (!state.friends.length) {
    wrap.innerHTML = `<div class="empty" style="padding:12px;">You need friends to invite. Add some first!</div>`;
    return;
  }
  wrap.innerHTML = state.friends.map(f => `
    <label class="modal-friend-row">
      <input type="checkbox" data-uid="${escapeHtml(f.uid)}" ${state.groupSelections.has(f.uid) ? "checked" : ""}>
      ${avatarMarkup(f.displayName, f.photoURL, "side-row-avatar", "side-row-fallback")}
      <div style="flex:1;">${escapeHtml(f.displayName)}${f.discriminator ? `<span style="color:var(--t-muted);font-size:11px;margin-left:2px;">#${escapeHtml(f.discriminator)}</span>` : ""}</div>
    </label>
  `).join("");
  wrap.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const uid = e.target.dataset.uid;
      if (e.target.checked) state.groupSelections.add(uid);
      else state.groupSelections.delete(uid);
    });
  });
}

$("#create-group-confirm-btn").addEventListener("click", async () => {
  const name = $("#group-name-input").value.trim();
  if (!name) { showToast("Enter a group name"); return; }
  if (state.groupSelections.size === 0) { showToast("Pick at least one friend"); return; }
  const members = [state.user.uid, ...state.groupSelections];
  try {
    const ref = await addDoc(collection(db, "chats"), {
      type: "group",
      members,
      name,
      createdBy: state.user.uid,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp()
    });
    closeModal("create-group-modal");
    showToast("Group created!");
    setTimeout(() => openChat(ref.id), 200);
  } catch (err) { showToast("Error: " + err.message); }
});


/* =====================================================================
   20) ADD MEMBERS to existing group
   ===================================================================== */
$("#chat-add-member-btn").addEventListener("click", () => {
  const c = state.activeChat;
  if (!c || c.type !== "group") return;
  state.addMemberSelections.clear();
  const candidates = state.friends.filter(f => !c.members.includes(f.uid));
  const wrap = $("#add-member-list");
  if (!candidates.length) {
    wrap.innerHTML = `<div class="empty" style="padding:12px;">All your friends are already in this group.</div>`;
  } else {
    wrap.innerHTML = candidates.map(f => `
      <label class="modal-friend-row">
        <input type="checkbox" data-uid="${escapeHtml(f.uid)}">
        ${avatarMarkup(f.displayName, f.photoURL, "side-row-avatar", "side-row-fallback")}
        <div style="flex:1;">${escapeHtml(f.displayName)}${f.discriminator ? `<span style="color:var(--t-muted);font-size:11px;margin-left:2px;">#${escapeHtml(f.discriminator)}</span>` : ""}</div>
      </label>
    `).join("");
    wrap.querySelectorAll("input[type='checkbox']").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const uid = e.target.dataset.uid;
        if (e.target.checked) state.addMemberSelections.add(uid);
        else state.addMemberSelections.delete(uid);
      });
    });
  }
  openModal("add-member-modal");
});

$("#add-member-confirm-btn").addEventListener("click", async () => {
  if (!state.activeChatId || !state.addMemberSelections.size) {
    closeModal("add-member-modal");
    return;
  }
  try {
    await updateDoc(doc(db, "chats", state.activeChatId), {
      members: arrayUnion(...state.addMemberSelections)
    });
    closeModal("add-member-modal");
    showToast("Members added");
  } catch (err) { showToast("Error: " + err.message); }
});


/* =====================================================================
   21) LEAVE GROUP
   ===================================================================== */
$("#chat-leave-btn").addEventListener("click", async () => {
  const c = state.activeChat;
  if (!c || c.type !== "group") return;
  if (!confirm(`Leave "${c.name}"?`)) return;
  try {
    const newMembers = c.members.filter(m => m !== state.user.uid);
    await updateDoc(doc(db, "chats", c.id), { members: newMembers });
    showFriendsView();
    showToast("Left group");
  } catch (err) { showToast("Error: " + err.message); }
});


/* =====================================================================
   22) MODALS — open/close helpers
   ===================================================================== */
function openModal(id) { $("#" + id).classList.remove("hidden"); }
function closeModal(id) { $("#" + id).classList.add("hidden"); }
$$("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.close)));
$$(".modal").forEach(m => m.addEventListener("click", (e) => {
  if (e.target === m) m.classList.add("hidden");
}));


/* =====================================================================
   23) SETTINGS MODAL
   ===================================================================== */
$("#settings-btn").addEventListener("click", openSettingsModal);

function openSettingsModal() {
  const u = state.user;
  $("#settings-username-input").value = u.username || u.displayName || "";
  $("#settings-tag-display").textContent = u.discriminator ? `#${u.discriminator}` : "#????";
  $("#settings-bio-input").value = u.bio || "";
  $("#settings-photo-input").value = u.photoURL || "";
  $("#settings-sound-toggle").checked = state.soundEnabled;
  updateAvatarPreview("settings", u.username || u.displayName, u.photoURL);
  openModal("settings-modal");
}

// Live avatar preview as user types in settings
$("#settings-photo-input").addEventListener("input", () => {
  updateAvatarPreview(
    "settings",
    $("#settings-username-input").value.trim(),
    $("#settings-photo-input").value.trim() || null
  );
});
$("#settings-username-input").addEventListener("input", () => {
  updateAvatarPreview(
    "settings",
    $("#settings-username-input").value.trim(),
    $("#settings-photo-input").value.trim() || null
  );
});

$("#settings-save-btn").addEventListener("click", async () => {
  const username = $("#settings-username-input").value.trim();
  const bio = $("#settings-bio-input").value.trim();
  const photoInput = $("#settings-photo-input").value.trim();
  const soundOn = $("#settings-sound-toggle").checked;

  if (!username || username.length < 3) {
    showToast("Username must be at least 3 characters.");
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showToast("Username: letters, numbers, underscores only.");
    return;
  }

  const photoURL = photoInput || null;
  state.soundEnabled = soundOn;
  localStorage.setItem("sc_sound", soundOn ? "true" : "false");

  const btn = $("#settings-save-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    await updateDoc(doc(db, "users", state.user.uid), {
      displayName: username,
      displayNameLower: username.toLowerCase(),
      username,
      bio: bio || "",
      photoURL: photoURL || null
    });

    // Pre-apply locally (ownProfile listener will also fire)
    state.user.username = username;
    state.user.displayName = username;
    state.user.bio = bio;
    state.user.photoURL = photoURL;
    state.userCache[state.user.uid] = { ...state.user };
    updateUserPanel();

    closeModal("settings-modal");
    showToast("Settings saved ✓");
  } catch (err) {
    showToast("Save failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
});


/* =====================================================================
   24) EMOJI PICKER
   ===================================================================== */
let emojiOpen = false;
const emojiBtn = $("#emoji-btn");
const emojiPicker = $("#emoji-picker");
const emojiGrid = $("#emoji-grid");
const emojiSearch = $("#emoji-search");

function buildEmojiGrid(filter = "") {
  const items = emojiPickerItems();
  const f = filter.trim().toLowerCase();
  const filtered = f ? items.filter(it => it.name.toLowerCase().includes(f) || it.keywords.includes(f)) : items;
  emojiGrid.innerHTML = filtered.map(it => `
    <button class="emoji-cell" title=":${escapeHtml(it.name)}:" data-insert="${escapeHtml(it.insert)}">
      ${it.html}
    </button>
  `).join("");
}

emojiBtn.addEventListener("click", () => {
  emojiOpen = !emojiOpen;
  if (emojiOpen) {
    emojiPicker.classList.remove("hidden");
    buildEmojiGrid();
    emojiSearch.value = "";
    emojiSearch.focus();
  } else {
    emojiPicker.classList.add("hidden");
  }
});

emojiSearch.addEventListener("input", () => buildEmojiGrid(emojiSearch.value));

emojiGrid.addEventListener("click", (e) => {
  const cell = e.target.closest(".emoji-cell");
  if (!cell) return;
  const insert = cell.dataset.insert;
  const start = composer.selectionStart;
  const end = composer.selectionEnd;
  composer.value = composer.value.slice(0, start) + insert + composer.value.slice(end);
  composer.focus();
  composer.selectionStart = composer.selectionEnd = start + insert.length;
});

document.addEventListener("click", (e) => {
  if (!emojiOpen) return;
  if (e.target.closest("#emoji-picker") || e.target.closest("#emoji-btn")) return;
  emojiPicker.classList.add("hidden");
  emojiOpen = false;
});


/* =====================================================================
   25) PROFILE CARD
   ===================================================================== */
async function showProfileCard(uid, event) {
  const profile = await fetchUserProfile(uid);
  if (!profile) return;

  const card = $("#profile-card");
  const isSelf = uid === state.user.uid;
  const isFriend = state.friends.some(f => f.uid === uid);
  const hasPendingOut = state.outgoing.some(r => r.toUid === uid);

  // Avatar
  const avatarEl = $("#profile-card-avatar-inner");
  if (profile.photoURL) {
    avatarEl.innerHTML = `<img src="${escapeHtml(profile.photoURL)}" alt="" />`;
  } else {
    const initial = (profile.username || profile.displayName || "?").charAt(0).toUpperCase();
    avatarEl.innerHTML = "";
    avatarEl.textContent = initial;
  }

  $("#profile-card-name").textContent = profile.username || profile.displayName || "User";
  $("#profile-card-tag").textContent = profile.discriminator ? `#${profile.discriminator}` : "";
  $("#profile-card-bio").textContent = profile.bio || "No bio set yet.";

  let actionsHtml = "";
  if (isSelf) {
    actionsHtml = `<button class="btn-ghost" data-pc-action="edit-profile">Edit Profile</button>`;
  } else {
    if (!isFriend && !hasPendingOut) {
      actionsHtml += `<button class="btn-primary" data-pc-action="add-friend" data-pc-uid="${escapeHtml(uid)}">Add Friend</button>`;
    } else if (hasPendingOut) {
      actionsHtml += `<span style="font-size:12px;color:var(--t-muted);">Request sent</span>`;
    }
    actionsHtml += `<button class="btn-ghost" data-pc-action="message" data-pc-uid="${escapeHtml(uid)}">Message</button>`;
  }
  $("#profile-card-actions").innerHTML = actionsHtml;

  // Position near cursor, clamped to viewport
  const W = 290, H = 320;
  let x = event.clientX + 12;
  let y = event.clientY - 20;
  if (x + W > window.innerWidth - 8) x = event.clientX - W - 12;
  if (y + H > window.innerHeight - 8) y = window.innerHeight - H - 8;
  if (y < 8) y = 8;
  if (x < 8) x = 8;
  card.style.left = x + "px";
  card.style.top = y + "px";
  card.classList.remove("hidden");
}

$("#profile-card-close").addEventListener("click", () => {
  $("#profile-card").classList.add("hidden");
});

$("#profile-card").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-pc-action]");
  if (!btn) return;
  const action = btn.dataset.pcAction;
  const uid = btn.dataset.pcUid;

  if (action === "message") {
    $("#profile-card").classList.add("hidden");
    await openOrCreateDm(uid);
  } else if (action === "add-friend") {
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const p = state.userCache[uid] || {};
      const reqId = `${state.user.uid}_${uid}`;
      await setDoc(doc(db, "friendRequests", reqId), {
        fromUid: state.user.uid,
        toUid: uid,
        fromName: state.user.displayName,
        fromPhoto: state.user.photoURL || null,
        toName: p.username || p.displayName || "User",
        toPhoto: p.photoURL || null,
        createdAt: serverTimestamp()
      });
      btn.textContent = "Sent ✓";
      showToast("Friend request sent");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Add Friend";
      showToast("Error: " + err.message);
    }
  } else if (action === "edit-profile") {
    $("#profile-card").classList.add("hidden");
    openSettingsModal();
  }
});

// Close profile card on outside click
document.addEventListener("click", (e) => {
  const card = $("#profile-card");
  if (card.classList.contains("hidden")) return;
  if (card.contains(e.target)) return;
  if (e.target.closest("[data-profile-uid]")) return;
  card.classList.add("hidden");
});


/* =====================================================================
   26) MOBILE / RESPONSIVE — sidebar toggle on small screens
   ===================================================================== */
function maybeToggleSidebar(open) {
  const appEl = $("#app");
  if (window.matchMedia("(max-width: 768px)").matches) {
    if (open) appEl.classList.add("show-sidebar");
    else appEl.classList.remove("show-sidebar");
  }
}

["#dm-list", "#group-list", "#rail-groups"].forEach(sel => {
  $(sel).addEventListener("click", () => maybeToggleSidebar(false));
});
$("#rail-home").addEventListener("click", () => maybeToggleSidebar(true));
$("#open-friends-btn").addEventListener("click", () => maybeToggleSidebar(false));
