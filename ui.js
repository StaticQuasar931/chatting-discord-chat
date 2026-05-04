/* =====================================================================
   Static Chat — ui.js
   Exports buildUI() which injects the full application HTML into <body>.
   Call this ONCE at the very top of app.js before any DOM queries.
   ===================================================================== */

const LOGO = "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png";

export function buildUI() {
  document.body.insertAdjacentHTML("beforeend", /* html */`

  <!-- ====== LOGIN SCREEN ====== -->
  <div id="login-screen" class="login-screen">
    <div class="login-card">
      <div class="login-logo-wrap">
        <img class="login-logo" src="${LOGO}" alt="Static Chat logo" />
      </div>
      <h1 class="login-title">Static Chat</h1>
      <p class="login-sub">Your school-safe space to chat with friends.</p>
      <ul class="login-features">
        <li>💬 Direct Messages</li>
        <li>👥 Group Chats</li>
        <li>🎭 GIFs &amp; Emojis</li>
        <li>🔒 School-safe</li>
      </ul>
      <button id="google-signin-btn" class="btn-google">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.78 3.97 14.6 3 12 3 6.95 3 2.85 7.06 2.85 12.45S6.95 21.9 12 21.9c6.93 0 9.5-4.86 9.5-7.4 0-.5-.05-.95-.15-1.4z"/>
        </svg>
        Continue with Google
      </button>
      <hr class="login-divider" />
      <p class="login-game-plug">
        From the same creator —
        <a href="https://sites.google.com/view/staticquasar931/static-gmes/wheres-epstein"
           target="_blank" rel="noopener noreferrer">🕵️ Where's Epstein?</a>
        — a fun hidden-object game!
      </p>
      <p class="login-footer">By continuing you agree to use this chat respectfully.</p>
    </div>
  </div>

  <!-- ====== MAIN APP ====== -->
  <div id="app" class="app hidden">

    <!-- LEFT NAV RAIL -->
    <nav class="rail">
      <button class="rail-btn rail-home active" id="rail-home" title="Direct Messages">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2zm0 14h12.17l1.83 1.83V6H4v12zm3-7h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
        </svg>
      </button>
      <div class="rail-divider"></div>
      <div class="rail-groups" id="rail-groups"></div>
      <button class="rail-btn rail-add" id="rail-create-group" title="Create group chat">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
        </svg>
      </button>
      <button class="rail-btn" id="rail-join-code" title="Join group by code">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/>
        </svg>
      </button>
    </nav>

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <input type="text" id="sidebar-search" placeholder="Find or start a conversation" />
      </div>
      <div class="sidebar-content">
        <button class="side-btn" id="open-friends-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span>Friends</span>
        </button>
        <a href="https://sites.google.com/view/staticquasar931/google-form" target="_blank" rel="noopener noreferrer" class="side-btn suggestions-link">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
          </svg>
          <span>Suggestions ↗</span>
        </a>
        <div class="side-section-label">
          <span>Direct Messages</span>
          <button class="icon-btn" id="new-dm-btn" title="Start new DM">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
            </svg>
          </button>
        </div>
        <div class="side-list" id="dm-list"></div>
        <div class="side-section-label"><span>Group Chats</span></div>
        <div class="side-list" id="group-list"></div>
      </div>

      <!-- User panel -->
      <div class="user-panel" id="user-panel">
        <div class="user-panel-avatar-area" id="user-panel-avatar-area">
          <div class="user-panel-avatar-wrap" id="user-panel-avatar-wrap"></div>
          <span class="status-dot" id="user-status-dot" data-status="online"></span>
        </div>
        <div class="user-panel-info">
          <div class="user-panel-name" id="user-panel-name">…</div>
          <div class="user-panel-tag" id="user-panel-tag"></div>
        </div>
        <button class="icon-btn" id="settings-btn" title="User Settings">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
        </button>
        <button class="icon-btn" id="signout-btn" title="Sign out">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- MAIN AREA -->
    <main class="main">

      <!-- FRIENDS VIEW -->
      <section id="friends-view" class="view">
        <header class="main-header">
          <div class="main-header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Friends
          </div>
          <nav class="tabs">
            <button class="tab active" data-tab="all">All</button>
            <button class="tab" data-tab="pending">Pending</button>
            <button class="tab tab-cta" data-tab="add">Add Friend</button>
          </nav>
        </header>
        <div class="friends-body">
          <div class="tab-panel" data-panel="all">
            <div class="panel-search">
              <input type="text" id="friends-filter" placeholder="Search friends" />
            </div>
            <h3 class="panel-title" id="all-count">All Friends</h3>
            <div class="friends-list" id="friends-list"></div>
            <p class="empty" id="friends-empty" hidden>You don't have any friends yet. Try the Add Friend tab.</p>
          </div>
          <div class="tab-panel hidden" data-panel="pending">
            <h3 class="panel-title">Incoming Requests</h3>
            <div class="friends-list" id="incoming-list"></div>
            <p class="empty" id="incoming-empty" hidden>No incoming requests.</p>
            <h3 class="panel-title" style="margin-top:24px;">Sent Requests</h3>
            <div class="friends-list" id="outgoing-list"></div>
            <p class="empty" id="outgoing-empty" hidden>No outgoing requests.</p>
          </div>
          <div class="tab-panel hidden" data-panel="add">
            <h3 class="panel-title">Add Friend</h3>
            <p class="panel-sub">Search by username, or type <strong>username#1234</strong> for an exact match.</p>
            <div class="add-friend-row">
              <input type="text" id="add-friend-input" placeholder="username or username#1234" autocomplete="off" />
              <button class="btn-primary" id="add-friend-search-btn">Search</button>
            </div>
            <div class="search-results" id="search-results"></div>
            <p class="hint" id="search-hint">Search by the first few letters, or use username#1234 for an exact match.</p>
          </div>
        </div>
      </section>

      <!-- CHAT VIEW -->
      <section id="chat-view" class="view hidden">
        <header class="main-header chat-header">
          <div class="chat-header-info">
            <div class="chat-header-avatar-wrap" id="chat-header-avatar-wrap"></div>
            <div>
              <div class="chat-header-name" id="chat-header-name">—</div>
              <div class="chat-header-sub" id="chat-header-sub"></div>
            </div>
          </div>
          <div class="chat-header-actions">
            <div class="join-code-badge hidden" id="chat-join-code-badge"></div>
            <button class="icon-btn" id="chat-search-btn" title="Search messages (Ctrl+F)">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
            <button class="icon-btn" id="chat-pins-btn" title="Pinned messages">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
            </button>
            <button class="icon-btn" id="chat-add-member-btn" title="Add members" hidden>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
            <button class="icon-btn" id="chat-leave-btn" title="Leave chat" hidden>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- In-chat message search bar -->
        <div id="chat-search-bar" class="chat-search-bar hidden">
          <div class="chat-search-inner">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="flex-shrink:0;color:var(--t-muted)">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input type="text" id="chat-search-input" placeholder="Search messages…" autocomplete="off" />
            <span id="chat-search-count" class="chat-search-count"></span>
            <button class="icon-btn chat-search-nav" id="chat-search-prev" title="Previous (Shift+Enter)">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
            </button>
            <button class="icon-btn chat-search-nav" id="chat-search-next" title="Next (Enter)">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
            </button>
            <button class="icon-btn" id="chat-search-close" title="Close (Esc)">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <div class="messages" id="messages"></div>

        <!-- Pinned messages side panel -->
        <div id="pins-panel" class="pins-panel hidden">
          <div class="pins-panel-head">
            <span>📌 Pinned Messages</span>
            <button class="icon-btn" id="pins-panel-close" title="Close">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div class="pins-panel-body" id="pins-panel-body">
            <p class="pins-empty">No pinned messages yet.<br><span style="font-size:12px;color:var(--t-muted)">Right-click a message to pin it.</span></p>
          </div>
        </div>

        <!-- Jump to latest button (shown when scrolled up) -->
        <button id="jump-latest" class="jump-latest hidden" title="Jump to latest messages">
          ↓ Jump to Latest
        </button>

        <!-- Typing indicator -->
        <div id="typing-indicator" class="typing-indicator hidden"></div>

        <!-- Composer -->
        <div class="composer">
          <!-- Reply bar (shown when replying to a message) -->
          <div id="reply-bar" class="reply-bar hidden">
            <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0;opacity:0.6"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
            <span class="reply-bar-label">Replying to <strong id="reply-bar-name"></strong></span>
            <span class="reply-bar-preview" id="reply-bar-preview"></span>
            <button class="icon-btn reply-bar-cancel" id="reply-bar-cancel" title="Cancel reply">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>

          <!-- Emoji autocomplete (inside .composer for correct absolute positioning) -->
          <div id="emoji-autocomplete" class="emoji-autocomplete hidden" role="listbox"></div>

          <div class="composer-inner">
            <div class="composer-input-wrap">
              <textarea id="composer-input" placeholder="Message… or /help for commands" rows="1"></textarea>
            </div>
            <button class="icon-btn composer-emoji-btn" id="emoji-btn" title="Emoji">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0C9.33 11 10 10.33 10 9.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </button>
            <button class="icon-btn composer-gif-btn" id="gif-btn" title="Search GIFs">GIF</button>
            <button class="icon-btn composer-send-btn" id="send-btn" title="Send" data-active="false">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <div class="composer-hint" id="composer-hint">
            <span>**bold** *italic* \`code\` :smile: :Static: &nbsp;·&nbsp; /8ball /joke /tod /coinflip /roll /ship /help</span>
            <button class="icon-btn hint-dismiss-btn" id="hint-dismiss-btn" title="Hide tips">✕</button>
          </div>
        </div>

        <!-- Emoji picker -->
        <div id="emoji-picker" class="emoji-picker hidden" role="dialog" aria-label="Emoji picker">
          <div class="emoji-picker-header">
            <input type="text" id="emoji-search" placeholder="Search emoji…" autocomplete="off" />
          </div>
          <div class="emoji-picker-cats" id="emoji-picker-cats" role="tablist"></div>
          <div class="emoji-picker-grid" id="emoji-grid"></div>
        </div>

        <!-- GIF picker -->
        <div id="gif-picker" class="gif-picker hidden" role="dialog" aria-label="GIF picker">
          <div class="gif-picker-header">
            <input type="text" id="gif-search-input" placeholder="Search GIFs…" autocomplete="off" />
            <button class="btn-primary" id="gif-search-btn" style="padding:6px 12px;font-size:13px;">Search</button>
          </div>
          <div id="gif-grid" class="gif-grid">
            <p class="gif-hint">Type something and hit Search!</p>
          </div>
          <div class="gif-footer">
            <span style="font-size:10px;color:var(--t-muted);">Powered by Tenor</span>
          </div>
        </div>
      </section>

      <!-- EMPTY STATE -->
      <section id="empty-view" class="view hidden empty-view">
        <img src="${LOGO}" alt="" />
        <h2>Select a conversation</h2>
        <p>Pick a friend or group from the sidebar to start chatting.</p>
      </section>
    </main>
  </div>

  <!-- Status picker popup (created dynamically, placeholder kept here for reference) -->

  <!-- ====== TERMS OF USE — shown on first visit ====== -->
  <div id="tos-overlay" class="tos-overlay" role="dialog" aria-modal="true" aria-labelledby="tos-title">
    <div class="tos-card">
      <div class="tos-header">
        <img src="${LOGO}" alt="" class="tos-logo" />
        <h2 id="tos-title">Before You Continue</h2>
        <p class="tos-sub">Static Chat is a community tool. By entering, you agree to the following.</p>
      </div>
      <div class="tos-body">
        <ul class="tos-list">
          <li>⚠️ <strong>Use at your own risk.</strong> This is a school-built, school-safe project — but no platform is 100% monitored.</li>
          <li>🧠 <strong>Be mature.</strong> Treat everyone with respect. Harassment, bullying, and hate speech will result in removal.</li>
          <li>🔒 <strong>Protect your privacy.</strong> Never share passwords, addresses, phone numbers, or any sensitive personal information.</li>
          <li>📵 <strong>No inappropriate content.</strong> Keep it school-appropriate. No NSFW text, links, or images.</li>
          <li>🚩 <strong>Report problems.</strong> Use the report button if you see something wrong. Don't abuse it.</li>
          <li>📋 <strong>No abuse of the platform.</strong> No spam, bots, impersonation, or attempts to exploit the system.</li>
          <li>👤 <strong>You are responsible</strong> for what you send. Think before you type.</li>
        </ul>
        <p class="tos-footer-note">By clicking "I Agree", you acknowledge you've read this and agree to use Static Chat responsibly.</p>
      </div>
      <div class="tos-foot">
        <button class="btn-primary" id="tos-agree-btn" style="width:100%;padding:13px;font-size:15px;">I Agree — Let Me In</button>
      </div>
    </div>
  </div>

  <!-- ====== MODALS ====== -->

  <!-- Profile Setup Modal -->
  <div class="modal hidden" id="profile-setup-modal">
    <div class="modal-card">
      <div class="modal-head"><h2>✨ Set Up Your Profile</h2></div>
      <div class="modal-body">
        <div class="setup-avatar-section">
          <div class="setup-avatar-preview" id="setup-avatar-preview">
            <span id="setup-avatar-initial">?</span>
          </div>
          <div class="setup-avatar-meta">
            <label class="modal-label">Profile Photo URL <span class="label-optional">optional</span></label>
            <input type="text" id="setup-photo-input" placeholder="https://…" autocomplete="off" />
            <p class="hint" style="margin:5px 0 0;">Leave blank to use your Google photo.</p>
          </div>
        </div>
        <label class="modal-label" style="margin-top:18px;">Username <span class="label-optional">letters, numbers, underscores · 3–32 chars</span></label>
        <input type="text" id="setup-username-input" placeholder="cooluser" maxlength="32" autocomplete="off" spellcheck="false" />
        <label class="modal-label" style="margin-top:14px;">Bio <span class="label-optional">optional · up to 200 chars</span></label>
        <textarea id="setup-bio-input" class="modal-textarea" placeholder="Tell people a little about yourself…" maxlength="200" rows="3"></textarea>
        <p class="field-error" id="setup-error"></p>
      </div>
      <div class="modal-foot">
        <button class="btn-primary" id="setup-confirm-btn">Let's Go →</button>
      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  <div class="modal hidden" id="settings-modal">
    <div class="modal-card modal-card-wide">
      <div class="modal-head">
        <h2>User Settings</h2>
        <button class="icon-btn modal-close" data-close="settings-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="settings-section">
          <div class="settings-section-title">My Account</div>
          <div class="setup-avatar-section">
            <div class="setup-avatar-preview" id="settings-avatar-preview">
              <span id="settings-avatar-initial">?</span>
            </div>
            <div class="setup-avatar-meta">
              <label class="modal-label">Profile Photo URL</label>
              <input type="text" id="settings-photo-input" placeholder="https://…" autocomplete="off" />
              <p class="hint" style="margin:5px 0 0;">Paste a direct image URL, or clear to use your Google photo.</p>
            </div>
          </div>
          <div style="margin-top:16px;">
            <label class="modal-label">Username</label>
            <input type="text" id="settings-username-input" maxlength="32" spellcheck="false" />
            <p class="hint" style="margin:5px 0 0;">Your full tag: <strong id="settings-tag-display">#0000</strong></p>
          </div>
          <div style="margin-top:14px;">
            <label class="modal-label">Bio <span class="label-optional">up to 200 chars</span></label>
            <textarea id="settings-bio-input" class="modal-textarea" maxlength="200" rows="3"></textarea>
          </div>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <div class="settings-section-title">Appearance</div>
          <label class="modal-label">Theme</label>
          <div class="theme-swatches" id="theme-swatches">
            <button class="theme-swatch" data-theme="dark">🌙 Dark</button>
            <button class="theme-swatch" data-theme="oled">⬛ OLED</button>
            <button class="theme-swatch" data-theme="midnight">🔵 Midnight</button>
            <button class="theme-swatch" data-theme="light">☀️ Light</button>
            <button class="theme-swatch" data-theme="warm">🍂 Warm</button>
            <button class="theme-swatch" data-theme="daylight">🌤️ Daylight</button>
          </div>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <div class="settings-section-title">Status</div>
          <div class="status-row-options" id="settings-status-options">
            <button class="status-row-option" data-status="online"><span class="status-dot-sm" data-status="online"></span>Online</button>
            <button class="status-row-option" data-status="idle"><span class="status-dot-sm" data-status="idle"></span>Idle</button>
            <button class="status-row-option" data-status="dnd"><span class="status-dot-sm" data-status="dnd"></span>Do Not Disturb</button>
            <button class="status-row-option" data-status="invisible"><span class="status-dot-sm" data-status="invisible"></span>Invisible</button>
          </div>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <div class="settings-section-title">Profile</div>
          <label class="modal-label">Banner Color</label>
          <div class="banner-swatches" id="banner-swatches">
            <button class="banner-swatch active" data-color="#4f7cff,#7c3aed" title="Blue-Purple" style="background:linear-gradient(135deg,#4f7cff,#7c3aed)"></button>
            <button class="banner-swatch" data-color="#23a55a,#1a8a4b" title="Green" style="background:linear-gradient(135deg,#23a55a,#1a8a4b)"></button>
            <button class="banner-swatch" data-color="#f0b232,#e0941f" title="Gold" style="background:linear-gradient(135deg,#f0b232,#e0941f)"></button>
            <button class="banner-swatch" data-color="#f23f43,#c0302e" title="Red" style="background:linear-gradient(135deg,#f23f43,#c0302e)"></button>
            <button class="banner-swatch" data-color="#ff8c42,#e07030" title="Orange" style="background:linear-gradient(135deg,#ff8c42,#e07030)"></button>
            <button class="banner-swatch" data-color="#1a91da,#1060a0" title="Sky" style="background:linear-gradient(135deg,#1a91da,#1060a0)"></button>
            <button class="banner-swatch" data-color="#e91e8c,#b5166e" title="Pink" style="background:linear-gradient(135deg,#e91e8c,#b5166e)"></button>
            <button class="banner-swatch" data-color="#7c3aed,#5b1fb5" title="Purple" style="background:linear-gradient(135deg,#7c3aed,#5b1fb5)"></button>
          </div>
          <div style="margin-top:14px;">
            <label class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Private Profile</div>
                <div class="settings-toggle-sub">Bio &amp; avatar hidden until someone searches your exact username#tag</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-privacy-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
          </div>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <div class="settings-section-title">Notifications &amp; Sounds</div>
          <label class="settings-toggle-row">
            <div class="settings-toggle-info">
              <div class="settings-toggle-label">Message sounds</div>
              <div class="settings-toggle-sub">Play a sound when new messages arrive</div>
            </div>
            <span class="toggle-switch">
              <input type="checkbox" id="settings-sound-toggle" />
              <span class="toggle-track"></span>
            </span>
          </label>
          <label class="settings-toggle-row" style="margin-top:10px;">
            <div class="settings-toggle-info">
              <div class="settings-toggle-label">Show formatting tips</div>
              <div class="settings-toggle-sub">Show the hint bar below the message box</div>
            </div>
            <span class="toggle-switch">
              <input type="checkbox" id="settings-hints-toggle" checked />
              <span class="toggle-track"></span>
            </span>
          </label>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <div class="settings-section-title">Account</div>
          <div class="settings-info-row">
            <span class="settings-info-label">Member Since</span>
            <span id="settings-created-at" class="settings-info-value">—</span>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="settings-modal">Cancel</button>
        <button class="btn-primary" id="settings-save-btn">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- Create Group Modal -->
  <div class="modal hidden" id="create-group-modal">
    <div class="modal-card">
      <div class="modal-head">
        <h2>Create Group Chat</h2>
        <button class="icon-btn modal-close" data-close="create-group-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <label class="modal-label">Group name</label>
        <input type="text" id="group-name-input" placeholder="My study squad" maxlength="50" />
        <label class="modal-label" style="margin-top:14px;">Add friends</label>
        <div class="modal-friend-list" id="modal-friend-list"></div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="create-group-modal">Cancel</button>
        <button class="btn-primary" id="create-group-confirm-btn">Create</button>
      </div>
    </div>
  </div>

  <!-- Add to Group Modal -->
  <div class="modal hidden" id="add-member-modal">
    <div class="modal-card">
      <div class="modal-head">
        <h2>Add Friends to Group</h2>
        <button class="icon-btn modal-close" data-close="add-member-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <label class="modal-label">Friends not in this group</label>
        <div class="modal-friend-list" id="add-member-list"></div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="add-member-modal">Cancel</button>
        <button class="btn-primary" id="add-member-confirm-btn">Add</button>
      </div>
    </div>
  </div>

  <!-- Join by Code Modal -->
  <div class="modal hidden" id="join-code-modal">
    <div class="modal-card">
      <div class="modal-head">
        <h2>Join Group by Code</h2>
        <button class="icon-btn modal-close" data-close="join-code-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <label class="modal-label">8-character group code</label>
        <input type="text" id="join-code-input" placeholder="AB3XY9QZ" maxlength="8" autocomplete="off" spellcheck="false" class="join-code-input-field" />
        <p class="hint">Codes are case-insensitive. Ask the group leader for the code.</p>
        <p class="field-error" id="join-code-error"></p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="join-code-modal">Cancel</button>
        <button class="btn-primary" id="join-code-confirm-btn">Join Group</button>
      </div>
    </div>
  </div>

  <!-- Group Code Display Modal -->
  <div class="modal hidden" id="group-code-modal">
    <div class="modal-card">
      <div class="modal-head"><h2>🎉 Group Created!</h2></div>
      <div class="modal-body" style="text-align:center;padding:24px 20px;">
        <p style="color:var(--t-secondary);margin:0 0 16px;">Share this code so friends can join:</p>
        <div class="join-code-display" id="group-code-display" title="Click to copy">——————</div>
        <p class="hint" style="margin-top:12px;">Click the code above to copy. Anyone with this code can join your group.</p>
      </div>
      <div class="modal-foot" style="justify-content:center;">
        <button class="btn-primary" id="group-code-ok-btn">Let's Chat!</button>
      </div>
    </div>
  </div>

  <!-- Report Modal -->
  <div class="modal hidden" id="report-modal">
    <div class="modal-card">
      <div class="modal-head">
        <h2>🚩 Report</h2>
        <button class="icon-btn modal-close" data-close="report-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="panel-sub" id="report-target-info" style="margin:0 0 14px;"></p>
        <label class="modal-label">Reason</label>
        <select id="report-reason" class="modal-select">
          <option value="spam">Spam or repetitive content</option>
          <option value="harassment">Harassment or bullying</option>
          <option value="inappropriate">Inappropriate content</option>
          <option value="impersonation">Impersonation</option>
          <option value="other">Other</option>
        </select>
        <label class="modal-label" style="margin-top:14px;">Details <span class="label-optional">optional · max 500 chars</span></label>
        <textarea id="report-details" class="modal-textarea" rows="3" maxlength="500" placeholder="Tell us more about the issue…"></textarea>
        <p class="field-error" id="report-error"></p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="report-modal">Cancel</button>
        <button class="btn-danger" id="report-submit-btn">Submit Report</button>
      </div>
    </div>
  </div>

  <!-- Profile Card Popup -->
  <div id="profile-card" class="profile-card hidden" role="dialog">
    <button class="profile-card-close" id="profile-card-close" aria-label="Close">
      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
    <div class="profile-card-banner" id="profile-card-banner"></div>
    <div class="profile-card-body">
      <div class="profile-card-avatar-wrap">
        <div class="profile-card-avatar" id="profile-card-avatar-inner"></div>
        <span class="status-dot profile-card-status-dot" id="profile-card-status-dot" data-status="offline"></span>
      </div>
      <div class="profile-card-name" id="profile-card-name"></div>
      <div class="profile-card-tag" id="profile-card-tag"></div>
      <div class="profile-card-badges" id="profile-card-badges"></div>
      <div class="profile-card-since" id="profile-card-since"></div>
      <div class="profile-card-divider"></div>
      <div class="profile-card-bio-label">About Me</div>
      <div class="profile-card-bio" id="profile-card-bio"></div>
      <div class="profile-card-actions" id="profile-card-actions"></div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast hidden"></div>
  `);
}
