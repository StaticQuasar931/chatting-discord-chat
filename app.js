/* =====================================================================
   Static Chat — app.js
   School-safe Discord-inspired chat using Firebase modular SDK.
   ---------------------------------------------------------------------
   FIRESTORE STRUCTURE
   ---------------------------------------------------------------------
   users/{uid}                                 -- user profile
       uid             string   (== document id)
       displayName     string   (from Google)
       displayNameLower string  (lowercased, used for prefix search)
       email           string
       photoURL        string|null
       createdAt       timestamp

   friendRequests/{requestId}                  -- pending friend requests
       fromUid        string
       toUid          string
       fromName       string   (denormalized for UI)
       fromPhoto      string|null
       toName         string   (denormalized for UI)
       toPhoto        string|null
       createdAt      timestamp

   friendships/{friendshipId}                  -- accepted friendships.
       (friendshipId is sortedUids.join("_"))
       users          [uidA, uidB]   (sorted)
       createdAt      timestamp

   chats/{chatId}                              -- DM or group chat
       type           "dm" | "group"
       members        [uid, ...]       (always includes creator)
       name           string           (group only; DMs leave blank)
       createdBy      string
       createdAt      timestamp
       lastMessage    string
       lastMessageAt  timestamp

       messages/{messageId}
           text         string
           senderUid    string
           senderName   string
           senderPhoto  string|null
           createdAt    timestamp

   For DMs we use a deterministic chatId of "dm_<uidA>_<uidB>" (sorted)
   so opening the same DM again reuses the existing chat.
   ===================================================================== */


/* =====================================================================
   1) FIREBASE CONFIG
   ---------------------------------------------------------------------
   >>> REPLACE the placeholder values below with your own config from
       Firebase Console -> Project settings -> Your apps -> Web app.
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
  Timestamp,
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
  user: null,            // current signed-in user profile {uid, displayName, photoURL, email}
  friends: [],           // [{uid, displayName, photoURL, friendshipId}]
  incoming: [],          // [{id, fromUid, fromName, fromPhoto}]
  outgoing: [],          // [{id, toUid, toName, toPhoto}]
  chats: [],             // [{id, type, name, members, lastMessage, lastMessageAt}]
  activeChatId: null,
  activeChat: null,
  messages: [],          // current chat's messages
  userCache: {},         // uid -> profile (fetched on demand)
  unsubscribers: {       // listener cleanups
    friendships: null,
    incoming: null,
    outgoing: null,
    chats: null,
    messages: null
  },
  filters: { sidebar: "" },
  groupSelections: new Set(), // selected friend uids in create-group modal
  addMemberSelections: new Set()
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
  const yesterday = new Date(today.getTime() - 24*60*60*1000);
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

  // gestures / hands
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

  // weather / nature
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

  // objects / activities
  book: "📚", pencil: "✏️", computer: "💻", phone: "📱", clock: "⏰",
  music: "🎵", headphones: "🎧", soccer: "⚽", basketball: "🏀",
  football: "🏈", baseball: "⚾", videogame: "🎮", art: "🎨",
  camera: "📷", rocket: "🚀", airplane: "✈️", car: "🚗", bike: "🚲",

  // travel / places
  earth: "🌍", school: "🏫", house: "🏠", office: "🏢", park: "🏞️",
};

// Build a list view for the picker (label + render html)
function emojiPickerItems() {
  // Special at top
  const items = [{
    name: "Static",
    html: `<img src="${STATIC_EMOJI_URL}" alt=":Static:" />`,
    insert: ":Static:",
    keywords: "static logo special"
  }];
  for (const [name, char] of Object.entries(EMOJI_MAP)) {
    items.push({
      name,
      html: char,
      insert: char,
      keywords: name
    });
  }
  return items;
}


/* =====================================================================
   6) MESSAGE FORMATTER (markdown-lite + emoji)
   ===================================================================== */
function formatMessage(raw) {
  if (!raw) return "";
  let text = escapeHtml(raw);

  // Code blocks ``` ... ``` (multiline)
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (_m, inner) => {
    codeBlocks.push(inner.replace(/^\n/, ""));
    return `\u0000CB${codeBlocks.length - 1}\u0000`;
  });

  // Inline code ` ... `
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_m, inner) => {
    inlineCodes.push(inner);
    return `\u0000IC${inlineCodes.length - 1}\u0000`;
  });

  // Bold ** ... **
  text = text.replace(/\*\*([^*\n][^*\n]*?)\*\*/g, "<strong>$1</strong>");
  // Underline __ ... __
  text = text.replace(/__([^_\n][^_\n]*?)__/g, "<u>$1</u>");
  // Italic * ... *  (after bold so we don't eat **)
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

  // Emoji shortcuts :name:
  text = text.replace(/:([A-Za-z0-9_+\-]+):/g, (m, name) => {
    if (name === "Static") {
      return `<img class="msg-emoji" src="${STATIC_EMOJI_URL}" alt=":Static:" title=":Static:" />`;
    }
    if (EMOJI_MAP[name]) return EMOJI_MAP[name];
    return m;
  });

  // Restore inline code and code blocks
  text = text.replace(/\u0000IC(\d+)\u0000/g, (_m, i) => `<code class="inline-code">${inlineCodes[+i]}</code>`);
  text = text.replace(/\u0000CB(\d+)\u0000/g, (_m, i) => `<pre class="code-block"><code>${codeBlocks[+i]}</code></pre>`);

  // Newlines -> <br> (but not inside code blocks; <pre> preserves \n already)
  // We replaced newlines outside code blocks — those are fine to <br>.
  text = text.replace(/\n/g, "<br>");

  return text;
}


/* =====================================================================
   7) AUTH
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
    state.user = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || "User",
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL
    };

    // Upsert profile so they're searchable / friendable
    await setDoc(doc(db, "users", state.user.uid), {
      uid: state.user.uid,
      displayName: state.user.displayName,
      displayNameLower: state.user.displayName.toLowerCase(),
      email: state.user.email || "",
      photoURL: state.user.photoURL || null,
      createdAt: serverTimestamp()
    }, { merge: true });

    state.userCache[state.user.uid] = state.user;

    showAppUI();
    bootSubscriptions();
  } else {
    state.user = null;
    cleanupAllSubscriptions();
    showLoginUI();
  }
});


/* =====================================================================
   8) UI ROUTING (login vs app, friends vs chat)
   ===================================================================== */
function showAppUI() {
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#user-panel-name").textContent = state.user.displayName;
  const av = $("#user-panel-avatar");
  if (state.user.photoURL) {
    av.src = state.user.photoURL;
    av.style.display = "";
  } else {
    av.removeAttribute("src");
    av.style.background = "var(--c-accent)";
  }
  showFriendsView();
}

function showLoginUI() {
  $("#login-screen").classList.remove("hidden");
  $("#app").classList.add("hidden");
}

function showFriendsView() {
  state.activeChatId = null;
  state.activeChat = null;
  // Update rail home active
  $("#rail-home").classList.add("active");
  $$(".rail-group-avatar").forEach(el => el.classList.remove("active"));
  $$(".side-row").forEach(el => el.classList.remove("active"));
  $("#open-friends-btn").classList.add("active");

  $("#friends-view").classList.remove("hidden");
  $("#chat-view").classList.add("hidden");
  $("#empty-view").classList.add("hidden");

  // Stop messages listener
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
   9) SUBSCRIPTIONS — friends, requests, chats
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
}

function bootSubscriptions() {
  const uid = state.user.uid;

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
          displayName: profile?.displayName || "Unknown",
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
      state.incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      for (const d of snap.docs) {
        arr.push({ id: d.id, ...d.data() });
      }
      // Pre-fetch member profiles for DMs (so the sidebar shows the other person's name)
      for (const c of arr) {
        if (c.type === "dm") {
          const otherUid = c.members.find(m => m !== uid);
          if (otherUid && !state.userCache[otherUid]) {
            await fetchUserProfile(otherUid);
          }
        }
      }
      arr.sort((a, b) => {
        const at = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : 0;
        const bt = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : 0;
        return bt - at;
      });
      state.chats = arr;
      renderChatLists();
      // If active chat got updated (e.g., members added), refresh header
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
   10) USER PROFILE FETCH (cached)
   ===================================================================== */
async function fetchUserProfile(uid) {
  if (state.userCache[uid]) return state.userCache[uid];
  try {
    const d = await getDoc(doc(db, "users", uid));
    if (d.exists()) {
      state.userCache[uid] = d.data();
      return state.userCache[uid];
    }
  } catch (e) {
    console.error("fetchUserProfile:", e);
  }
  return null;
}


/* =====================================================================
   11) RENDER — Friends list / pending / search
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
        <div class="friend-row-meta">Friend</div>
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
    const fid = btn.dataset.friendshipId;
    if (!confirm("Remove this friend?")) return;
    try {
      await deleteDoc(doc(db, "friendships", fid));
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
   12) FRIENDS PANEL — tabs, search, add-friend search
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
$("#add-friend-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchUsers();
});

async function searchUsers() {
  const term = $("#add-friend-input").value.trim().toLowerCase();
  const results = $("#search-results");
  results.innerHTML = "";
  if (!term) {
    $("#search-hint").textContent = "Enter a name to search.";
    return;
  }
  $("#search-hint").textContent = "Searching…";

  try {
    const q = query(
      collection(db, "users"),
      orderBy("displayNameLower"),
      startAt(term),
      endAt(term + "\uf8ff"),
      limit(20)
    );
    const snap = await getDocs(q);
    const found = [];
    snap.forEach(d => {
      const u = d.data();
      if (u.uid && u.uid !== state.user.uid) found.push(u);
    });

    if (!found.length) {
      $("#search-hint").textContent = "No users found.";
      return;
    }

    $("#search-hint").textContent = `Found ${found.length} user(s).`;

    const friendUids = new Set(state.friends.map(f => f.uid));
    const incomingFromUids = new Set(state.incoming.map(r => r.fromUid));
    const outgoingToUids = new Set(state.outgoing.map(r => r.toUid));

    results.innerHTML = found.map(u => {
      let actionHtml = `<button class="btn-primary" data-action="send-request" data-uid="${escapeHtml(u.uid)}" data-name="${escapeHtml(u.displayName || "")}" data-photo="${escapeHtml(u.photoURL || "")}">Send Request</button>`;
      if (friendUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">Already friends</span>`;
      else if (outgoingToUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">Request sent</span>`;
      else if (incomingFromUids.has(u.uid)) actionHtml = `<span class="friend-row-meta">They already sent you a request</span>`;

      return `
        <div class="friend-row">
          ${avatarMarkup(u.displayName, u.photoURL, "friend-row-avatar", "friend-row-fallback")}
          <div class="friend-row-info">
            <div class="friend-row-name">${escapeHtml(u.displayName || "Unknown")}</div>
            <div class="friend-row-meta">${escapeHtml(u.email || "")}</div>
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
    // Block if already friends or already requested either direction
    if (state.friends.find(f => f.uid === toUid)) throw new Error("Already friends");
    if (state.outgoing.find(r => r.toUid === toUid)) throw new Error("Already sent");
    if (state.incoming.find(r => r.fromUid === toUid)) throw new Error("They already sent you one — accept it instead");

    // Deterministic request ID: `${fromUid}_${toUid}`. This prevents
    // duplicate requests and lets the security rules verify a matching
    // request exists when a friendship is created.
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
    btn.textContent = "Request sent";
    showToast("Friend request sent");
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Send Request";
    showToast("Error: " + err.message);
  }
});


/* =====================================================================
   13) FRIEND REQUEST ACCEPT
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
    showToast("Friend added");
  } catch (err) {
    showToast("Error: " + err.message);
  }
}


/* =====================================================================
   14) RENDER — sidebar DMs and groups; rail group avatars
   ===================================================================== */
function renderChatLists() {
  const filterText = state.filters.sidebar.toLowerCase();
  const dms = state.chats.filter(c => c.type === "dm");
  const groups = state.chats.filter(c => c.type === "group");

  // DMs: show other person's display name
  const dmList = $("#dm-list");
  dmList.innerHTML = dms.map(c => {
    const otherUid = c.members.find(m => m !== state.user.uid);
    const profile = state.userCache[otherUid];
    const name = profile?.displayName || "Direct Message";
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

  // Groups
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

  // Rail group avatars
  const rail = $("#rail-groups");
  rail.innerHTML = groups.map(c => {
    const active = state.activeChatId === c.id ? "active" : "";
    return `<div class="rail-group-avatar ${active}" data-chat-id="${escapeHtml(c.id)}" title="${escapeHtml(c.name || 'Group')}">${escapeHtml(groupInitials(c.name || "G"))}</div>`;
  }).join("");
}

// Sidebar click delegation
$("#dm-list").addEventListener("click", (e) => {
  const close = e.target.closest("button[data-action='close-dm']");
  if (close) {
    e.stopPropagation();
    // We don't delete the chat doc (other user might want it); just unselect if active
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

// "New DM" button — for now just opens friends view's add tab
$("#new-dm-btn").addEventListener("click", () => {
  showFriendsView();
  $$(".tab").forEach(x => x.classList.remove("active"));
  $(".tab[data-tab='all']").classList.add("active");
  $$(".tab-panel").forEach(p => p.classList.add("hidden"));
  $(".tab-panel[data-panel='all']").classList.remove("hidden");
  showToast("Click any friend's message icon to start a DM.");
});


/* =====================================================================
   15) DM open/create
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
   16) OPEN CHAT — subscribe to messages, render
   ===================================================================== */
async function openChat(chatId) {
  state.activeChatId = chatId;
  state.activeChat = state.chats.find(c => c.id === chatId) || null;
  if (!state.activeChat) {
    // Possibly just-created chat not yet in snapshot
    try {
      const d = await getDoc(doc(db, "chats", chatId));
      if (d.exists()) state.activeChat = { id: d.id, ...d.data() };
    } catch (_) {}
  }
  if (!state.activeChat) return;

  showChatView();
  renderChatHeader();
  renderChatLists();

  // Stop any prior messages listener
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
      state.messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

  const avatarEl = $("#chat-header-avatar");
  const addBtn = $("#chat-add-member-btn");
  const leaveBtn = $("#chat-leave-btn");

  if (c.type === "dm") {
    const otherUid = c.members.find(m => m !== state.user.uid);
    const profile = await fetchUserProfile(otherUid);
    const name = profile?.displayName || "Direct Message";
    $("#chat-header-name").textContent = name;
    $("#chat-header-sub").textContent = "Direct Message";
    if (profile?.photoURL) {
      avatarEl.src = profile.photoURL;
      avatarEl.style.display = "";
    } else {
      avatarEl.removeAttribute("src");
    }
    addBtn.hidden = true;
    leaveBtn.hidden = true;
  } else {
    $("#chat-header-name").textContent = c.name || "Group";
    $("#chat-header-sub").textContent = `${c.members.length} member${c.members.length === 1 ? "" : "s"}`;
    avatarEl.removeAttribute("src");
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
      // followup
      html.push(`
        <div class="msg-followup">
          <span class="msg-time-inline">${escapeHtml(shortTime(ts))}</span>
          <div class="msg-body">${formatMessage(m.text || "")}</div>
        </div>
      `);
    } else {
      html.push(`
        <div class="message-group">
          ${avatarMarkup(m.senderName, m.senderPhoto, "msg-avatar", "msg-avatar-fallback")}
          <div class="msg-content">
            <div class="msg-head">
              <span class="msg-author">${escapeHtml(m.senderName || "User")}</span>
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
  // scroll to bottom
  wrap.scrollTop = wrap.scrollHeight;
}


/* =====================================================================
   17) SEND MESSAGE
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
  if (text.length > 2000) {
    showToast("Message too long (2000 char max)");
    return;
  }

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
    // Update parent chat preview
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
   18) CREATE GROUP CHAT
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
      <div style="flex:1;">${escapeHtml(f.displayName)}</div>
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
    showToast("Group created");
    setTimeout(() => openChat(ref.id), 200);
  } catch (err) {
    showToast("Error: " + err.message);
  }
});


/* =====================================================================
   19) ADD MEMBERS to existing group
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
        <div style="flex:1;">${escapeHtml(f.displayName)}</div>
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
    const ref = doc(db, "chats", state.activeChatId);
    // Use arrayUnion for each selected
    const updates = {};
    updates.members = arrayUnion(...state.addMemberSelections);
    await updateDoc(ref, updates);
    closeModal("add-member-modal");
    showToast("Members added");
  } catch (err) {
    showToast("Error: " + err.message);
  }
});


/* =====================================================================
   20) LEAVE GROUP
   ===================================================================== */
$("#chat-leave-btn").addEventListener("click", async () => {
  const c = state.activeChat;
  if (!c || c.type !== "group") return;
  if (!confirm(`Leave "${c.name}"?`)) return;
  try {
    const newMembers = c.members.filter(m => m !== state.user.uid);
    if (newMembers.length === 0) {
      // Last person leaving — keep chat but you're gone. (We don't delete because rules forbid it.)
      await updateDoc(doc(db, "chats", c.id), { members: newMembers });
    } else {
      await updateDoc(doc(db, "chats", c.id), { members: newMembers });
    }
    showFriendsView();
    showToast("Left group");
  } catch (err) {
    showToast("Error: " + err.message);
  }
});


/* =====================================================================
   21) MODALS
   ===================================================================== */
function openModal(id) { $("#" + id).classList.remove("hidden"); }
function closeModal(id) { $("#" + id).classList.add("hidden"); }
$$("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.close)));
$$(".modal").forEach(m => m.addEventListener("click", (e) => {
  if (e.target === m) m.classList.add("hidden");
}));


/* =====================================================================
   22) EMOJI PICKER
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
  const before = composer.value.slice(0, start);
  const after = composer.value.slice(end);
  composer.value = before + insert + after;
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
   23) MOBILE / RESPONSIVE — sidebar toggle on small screens
   ===================================================================== */
// On small screens, picking a chat closes the sidebar; tapping nav rail opens it
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
