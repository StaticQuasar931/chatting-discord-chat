/* =====================================================================
   Static Chat — ui.js
   Exports buildUI() which injects the full application HTML into <body>.
   Call this ONCE at the very top of app.js before any DOM queries.
   ===================================================================== */

const LOGO = "./staticcord.png";
const LOGO_FALLBACK = "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png";

export function buildUI() {
  document.body.insertAdjacentHTML("beforeend", /* html */`

  <!-- ====== LOADING SCREEN — shown until Firebase auth resolves ====== -->
  <div id="loading-screen" class="loading-screen">
    <div class="loading-content">
      <img class="loading-logo" src="${LOGO}" alt="Static Chat"
           onerror="this.src='${LOGO_FALLBACK}'" />
      <div class="loading-brand">
        <span class="loading-title">Static Chat</span>
        <span class="loading-beta">BETA</span>
      </div>
      <div class="loading-spinner">
        <div class="ls-arc"></div>
      </div>
      <p class="loading-tip" id="loading-tip">Loading…</p>
    </div>
    <div class="loading-footer-bar">
      <span id="loading-tip-bottom"></span>
    </div>
  </div>

  <!-- ====== LOGIN SCREEN ====== -->
  <div id="login-screen" class="login-screen hidden">

    <!-- Background decorations -->
    <div class="login-bg-orb login-bg-orb-1"></div>
    <div class="login-bg-orb login-bg-orb-2"></div>
    <div class="login-bg-orb login-bg-orb-3"></div>

    <!-- Two-column card -->
    <div class="login-card">

      <!-- Left: logo & brand panel + feature highlights -->
      <div class="login-left">
        <div class="login-logo-area">
          <img class="login-logo-img" src="${LOGO}" alt="Static Chat"
               onerror="this.src='${LOGO_FALLBACK}'" />
        </div>
        <div class="login-brand-row">
          <h1 class="login-title">Static Chat</h1>
          <span class="login-beta-badge">BETA</span>
        </div>
        <p class="login-sub">A school-safe space to chat with friends</p>

        <!-- Feature highlights -->
        <div class="login-features">
          <div class="login-feature-item">
            <span class="login-feature-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </span>
            <div class="login-feature-text">
              <span class="login-feature-name">Direct Messages</span>
              <span class="login-feature-desc">Private one-on-one chats</span>
            </div>
          </div>
          <div class="login-feature-item">
            <span class="login-feature-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </span>
            <div class="login-feature-text">
              <span class="login-feature-name">Group Chats</span>
              <span class="login-feature-desc">Hang with multiple friends</span>
            </div>
          </div>
          <div class="login-feature-item">
            <span class="login-feature-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
              </svg>
            </span>
            <div class="login-feature-text">
              <span class="login-feature-name">GIFs &amp; Emojis</span>
              <span class="login-feature-desc">Express yourself fully</span>
            </div>
          </div>
          <div class="login-feature-item">
            <span class="login-feature-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/>
              </svg>
            </span>
            <div class="login-feature-text">
              <span class="login-feature-name">School-Safe</span>
              <span class="login-feature-desc">Filtered &amp; respectful</span>
            </div>
          </div>
          <div class="login-feature-item">
            <span class="login-feature-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            <div class="login-feature-text">
              <span class="login-feature-name">Custom Profiles</span>
              <span class="login-feature-desc">Themes, status &amp; badges</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: sign-in panel -->
      <div class="login-right">
        <h2 class="login-welcome">Welcome back.</h2>
        <p class="login-welcome-sub">Sign in with your Google account to continue chatting.</p>

        <ul class="login-chips">
          <li>💬 DMs</li>
          <li>👥 Groups</li>
          <li>🎭 GIFs</li>
          <li>⭐ Favorites</li>
          <li>🔒 Safe</li>
        </ul>

        <button id="google-signin-btn" class="btn-google">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#fff" d="M21.35 11.1H12v2.9h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.78 3.97 14.6 3 12 3 6.95 3 2.85 7.06 2.85 12.45S6.95 21.9 12 21.9c6.93 0 9.5-4.86 9.5-7.4 0-.5-.05-.95-.15-1.4z"/>
          </svg>
          Continue with Google
        </button>
        <p class="login-error hidden" id="login-error"></p>

        <p class="login-footer">By signing in, you agree to use this platform respectfully.</p>
      </div>

    </div>

    <!-- Bottom bar — tip + plug -->
    <div class="login-bottom-bar">
      <span class="login-tip-line">
        <svg viewBox="0 0 24 24" width="12" height="12" style="flex-shrink:0;opacity:.5"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        <span id="login-tip-text">Tip: Right-click any message for quick actions.</span>
      </span>
      <div class="login-plug-wrap">
        <span class="login-plug-by">By the creator of</span>
        <a class="login-plug-link"
           href="https://sites.google.com/view/staticquasar931/static-gmes/wheres-epstein"
           target="_blank" rel="noopener noreferrer">🕵️ Where's Epstein?</a>
      </div>
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
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
            <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
            <path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"/>
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
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
              <path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"/>
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
            <button class="icon-btn" id="chat-pins-btn" title="Pinned messages">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
            </button>
            <button class="icon-btn" id="chat-mute-btn" title="Mute notifications">
              <svg class="mute-bell-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <svg class="mute-slash-icon hidden" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M20 18.69L7.84 6.14 6.43 4.73 5.02 3.32 3.61 4.73l2.39 2.39C5.37 8.23 5 9.58 5 11v5l-2 2v1h14.73l2 2 1.41-1.41L20 18.69zm-8 3.31c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm7-7.62V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.99.23-1.87.68-2.62 1.27L19 19.08V14.38z"/>
              </svg>
            </button>
            <button class="icon-btn" id="chat-add-member-btn" title="Add members" hidden>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
            <!-- Divider line before search -->
            <div class="header-divider"></div>
            <!-- Always-visible compact search — expands on focus -->
            <div class="header-search-wrap" id="header-search-wrap">
              <svg viewBox="0 0 24 24" width="15" height="15" class="header-search-icon" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" id="chat-search-input" placeholder="Search" autocomplete="off" aria-label="Search messages" />
              <span id="chat-search-count" class="chat-search-count"></span>
              <button class="icon-btn chat-search-nav hidden" id="chat-search-prev" title="Previous (Shift+Enter)">
                <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
              </button>
              <button class="icon-btn chat-search-nav hidden" id="chat-search-next" title="Next (Enter)">
                <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
              </button>
              <button class="icon-btn header-search-clear hidden" id="chat-search-close" title="Clear (Esc)">
                <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
          </div>
        </header>

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

          <!-- @mention autocomplete -->
          <div id="mention-autocomplete" class="emoji-autocomplete hidden" role="listbox"></div>

          <!-- Slash command autocomplete -->
          <div id="cmd-autocomplete" class="hidden" role="listbox"></div>

          <div class="composer-inner">
            <div class="composer-input-wrap">
              <textarea id="composer-input" placeholder="Message… or /help for commands" rows="1"></textarea>
            </div>
            <!-- Silent typing toggle — LEFTMOST, before emoji -->
            <button class="icon-btn composer-silent-btn" id="silent-typing-btn"
                    title="Silent typing — others won't see you typing" aria-pressed="false">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                <path fill="currentColor" opacity="0.85" d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                <circle fill="currentColor" cx="8" cy="11" r="1.2"/>
                <circle fill="currentColor" cx="12" cy="11" r="1.2"/>
                <circle fill="currentColor" cx="16" cy="11" r="1.2"/>
                <line class="silent-slash" x1="3" y1="21" x2="21" y2="3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn composer-emoji-btn" id="emoji-btn" title="Emoji">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2ZM8.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8.003 15.484A.502.502 0 0 1 8.5 15h7a.5.5 0 0 1 .392.81C14.972 17.345 13.572 18 12 18c-1.572 0-2.972-.655-3.892-1.69a.5.5 0 0 1-.105-.826Z"/>
              </svg>
            </button>
            <button class="icon-btn composer-gif-btn" id="gif-btn" title="Send a GIF">
              <!-- GIF badge — rounded rect + clean path letterforms -->
              <svg viewBox="0 0 36 20" width="28" height="16" aria-hidden="true" fill="currentColor">
                <rect x="0.8" y="0.8" width="34.4" height="18.4" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                <!-- G -->
                <path d="M9.1 5.5C6.5 5.5 4.4 7.4 4.4 10s2.1 4.5 4.7 4.5c1.4 0 2.5-.5 3.3-1.4v-3.3H8.3v1.5h2.4v1.2c-.5.4-1.1.6-1.6.6-1.8 0-3-1.3-3-3s1.2-3 3-3c.9 0 1.7.4 2.2 1l1.1-1.1C11.6 6.1 10.4 5.5 9.1 5.5z"/>
                <!-- I -->
                <rect x="14.2" y="5.7" width="1.7" height="8.6"/>
                <!-- F -->
                <path d="M18.3 5.7h5.6v1.7h-3.9v2.1h3.4v1.7h-3.4v3.1h-1.7z"/>
              </svg>
            </button>
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
            <div class="gif-search-wrap">
              <svg class="gif-search-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" id="gif-search-input" placeholder="Search GIFs…" autocomplete="off" />
              <button class="icon-btn" id="gif-search-btn" title="Search" style="flex-shrink:0">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
          <div class="gif-cats" id="gif-cats"></div>
          <div id="gif-grid" class="gif-grid">
            <p class="gif-hint">Loading trending GIFs…</p>
          </div>
          <div class="gif-footer">
            <svg viewBox="0 0 24 24" width="10" height="10" style="opacity:.4"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
            <span>Powered by Tenor</span>
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

  <!-- Settings Modal — Discord left-nav style -->
  <div class="modal hidden" id="settings-modal">
    <div class="modal-card settings-modal-discord">

      <!-- Left nav -->
      <nav class="settings-discord-nav">
        <div class="settings-discord-nav-label">User Settings</div>
        <div class="settings-search-wrap">
          <input type="text" id="settings-search-input" placeholder="Search settings…" autocomplete="off" />
        </div>
        <button class="settings-discord-nav-item active" data-pane="account">Account &amp; Profile</button>
        <button class="settings-discord-nav-item" data-pane="appearance">Appearance</button>
        <div class="settings-discord-nav-divider"></div>
        <button class="settings-discord-nav-item danger" id="settings-signout-btn">Sign Out</button>
      </nav>

      <!-- Right content -->
      <div class="settings-discord-body">

        <!-- ACCOUNT & PROFILE PANE (merged) -->
        <div class="settings-pane" data-pane="account">
          <div class="settings-pane-title">Account &amp; Profile</div>

          <div class="settings-account-cols">

            <!-- LEFT: Edit form -->
            <div class="settings-account-form">

              <div class="settings-field-group">
                <label class="modal-label">Profile Photo</label>
                <div class="avatar-upload-row">
                  <input type="text" id="settings-photo-input" placeholder="Paste image URL, or upload below…" autocomplete="off" />
                  <label class="btn-secondary avatar-upload-label" title="Upload a photo from your device">
                    <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
                    Upload
                    <input type="file" id="settings-photo-file" accept="image/*" style="display:none" />
                  </label>
                </div>
                <p class="hint" style="margin:4px 0 0;font-size:11px;">Upload will let you crop to a circle. URL input also works.</p>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Username</label>
                <input type="text" id="settings-username-input" maxlength="32" spellcheck="false" />
                <p class="hint" style="margin:5px 0 0;">Your full tag: <strong id="settings-tag-display">#0000</strong></p>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Bio <span class="label-optional">up to 200 chars</span></label>
                <textarea id="settings-bio-input" maxlength="200" rows="3" placeholder="Tell people a bit about yourself…"></textarea>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Status Phrase <span class="label-optional">up to 60 chars</span></label>
                <input type="text" id="settings-custom-status-input" maxlength="60"
                  placeholder="Feeling good, working on something…" spellcheck="false" autocomplete="off" />
                <p class="hint" style="margin:4px 0 0;font-size:11px;">Short message shown on your profile and in chat.</p>
              </div>

              <!-- Banner section -->
              <div class="settings-section-title" style="margin-top:20px;margin-bottom:8px;">Banner</div>
              <div class="banner-type-row">
                <button class="banner-type-btn active" id="banner-type-gradient" data-type="gradient">Gradient</button>
                <button class="banner-type-btn" id="banner-type-solid" data-type="solid">Solid Color</button>
              </div>
              <div id="banner-gradient-section">
                <div class="banner-swatches" id="banner-swatches">
                  <button class="banner-swatch active" data-color="#4f7cff,#7c3aed" title="Blue-Purple" style="background:linear-gradient(135deg,#4f7cff,#7c3aed)"></button>
                  <button class="banner-swatch" data-color="#23a55a,#1a8a4b" title="Green" style="background:linear-gradient(135deg,#23a55a,#1a8a4b)"></button>
                  <button class="banner-swatch" data-color="#f0b232,#e0941f" title="Gold" style="background:linear-gradient(135deg,#f0b232,#e0941f)"></button>
                  <button class="banner-swatch" data-color="#f23f43,#c0302e" title="Red" style="background:linear-gradient(135deg,#f23f43,#c0302e)"></button>
                  <button class="banner-swatch" data-color="#ff8c42,#e07030" title="Orange" style="background:linear-gradient(135deg,#ff8c42,#e07030)"></button>
                  <button class="banner-swatch" data-color="#1a91da,#1060a0" title="Sky" style="background:linear-gradient(135deg,#1a91da,#1060a0)"></button>
                  <button class="banner-swatch" data-color="#e91e8c,#b5166e" title="Pink" style="background:linear-gradient(135deg,#e91e8c,#b5166e)"></button>
                  <button class="banner-swatch" data-color="#7c3aed,#5b1fb5" title="Purple" style="background:linear-gradient(135deg,#7c3aed,#5b1fb5)"></button>
                  <!-- Custom gradient swatches -->
                  <div class="banner-custom-row" style="grid-column:1/-1;margin-top:6px;">
                    <label class="banner-custom-label">Custom:</label>
                    <input type="color" id="banner-custom-color1" value="#4f7cff" title="Start color" />
                    <input type="color" id="banner-custom-color2" value="#7c3aed" title="End color" />
                    <button class="banner-swatch" id="banner-custom-apply" style="width:auto;padding:0 10px;height:28px;font-size:11px;background:var(--c-input-2);color:var(--t-secondary);" title="Apply custom gradient">Apply</button>
                  </div>
                </div>
              </div>
              <div id="banner-solid-section" style="display:none;">
                <div class="banner-custom-row">
                  <label class="banner-custom-label">Color:</label>
                  <input type="color" id="banner-solid-color" value="#4f7cff" title="Banner solid color" />
                  <input type="text" id="banner-solid-hex" class="hex-input" placeholder="#4f7cff" maxlength="7" />
                </div>
              </div>

              <div style="margin-top:20px;">
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

              <div class="settings-field-group" style="margin-top:16px;">
                <div class="settings-info-row">
                  <span class="settings-info-label">Member Since</span>
                  <span id="settings-created-at" class="settings-info-value">—</span>
                </div>
              </div>

              <div class="settings-pane-foot">
                <button class="btn-secondary" data-close="settings-modal">Cancel</button>
                <button class="btn-primary" id="settings-save-btn">Save Changes</button>
              </div>
            </div><!-- /.settings-account-form -->

            <!-- RIGHT: Live preview -->
            <div class="settings-account-sidebar">
              <div class="settings-preview-label">Preview</div>
              <div class="settings-profile-preview" id="settings-profile-preview-card">
                <div class="spp-banner" id="settings-preview-banner"></div>
                <div class="spp-body">
                  <div class="spp-avatar-wrap">
                    <div class="setup-avatar-preview spp-avatar-pos" id="settings-avatar-preview" style="width:72px;height:72px;font-size:26px;">
                      <span id="settings-avatar-initial">?</span>
                    </div>
                    <span class="spp-status-dot" id="settings-preview-status-dot" data-status="online"></span>
                  </div>
                  <div class="spp-name-row">
                    <span class="spp-name" id="settings-preview-name">Username</span>
                    <span class="spp-tag" id="settings-preview-tag">#0000</span>
                  </div>
                  <div class="spp-custom-status" id="settings-preview-custom-status"></div>
                  <div class="spp-preview-badges" id="settings-preview-badges"></div>
                  <div class="spp-divider"></div>
                  <div class="spp-section-label">About Me</div>
                  <div class="spp-bio" id="settings-preview-bio"></div>
                  <div class="spp-section-label spp-since-label" id="settings-preview-since-wrap" style="display:none">
                    Member Since <span id="settings-preview-since"></span>
                  </div>
                </div>
              </div>
              <p class="hint" style="margin-top:6px;font-size:11px;text-align:center;">Live preview — as others see you</p>
            </div>

          </div><!-- /.settings-account-cols -->
        </div>

        <!-- APPEARANCE PANE (theme + status + sounds + hints) -->
        <div class="settings-pane hidden" data-pane="appearance">
          <div class="settings-pane-title">Appearance &amp; Preferences</div>

          <div class="settings-section-title" style="margin-bottom:10px;">Theme</div>
          <div class="theme-swatches" id="theme-swatches">
            <button class="theme-swatch" data-theme="oled">OLED</button>
            <button class="theme-swatch" data-theme="dark">Dark</button>
            <button class="theme-swatch" data-theme="midnight">Midnight</button>
            <button class="theme-swatch" data-theme="warm">Warm</button>
            <button class="theme-swatch" data-theme="forest">Forest</button>
            <button class="theme-swatch" data-theme="rose">Rose</button>
            <button class="theme-swatch" data-theme="slate">Slate</button>
            <button class="theme-swatch" data-theme="cloud">Cloud</button>
            <button class="theme-swatch" data-theme="daylight">Daylight</button>
            <button class="theme-swatch" data-theme="light">Light</button>
            <button class="theme-swatch theme-swatch-custom" data-theme="custom" id="theme-swatch-custom">Custom</button>
          </div>
          <!-- Custom theme color pickers (shown when Custom is selected) -->
          <div id="theme-custom-pickers" style="display:none;margin-top:10px;">
            <div class="theme-custom-row">
              <label class="theme-custom-label">Background</label>
              <input type="color" id="tc-bg" value="#1a1b1e" />
            </div>
            <div class="theme-custom-row">
              <label class="theme-custom-label">Sidebar</label>
              <input type="color" id="tc-sidebar" value="#131416" />
            </div>
            <div class="theme-custom-row">
              <label class="theme-custom-label">Accent</label>
              <input type="color" id="tc-accent" value="#4f7cff" />
            </div>
          </div>

          <div style="margin-top:24px;">
            <div class="settings-section-title" style="margin-bottom:10px;">Status</div>
            <div class="status-row-options" id="settings-status-options">
              <button class="status-row-option" data-status="online">
                <span class="status-dot-sm" data-status="online"></span>Online
              </button>
              <button class="status-row-option" data-status="idle">
                <span class="status-dot-sm" data-status="idle"></span>Idle
              </button>
              <button class="status-row-option" data-status="dnd">
                <span class="status-dot-sm" data-status="dnd"></span>Do Not Disturb
              </button>
              <button class="status-row-option" data-status="invisible">
                <span class="status-dot-sm" data-status="invisible"></span>Invisible
              </button>
            </div>
          </div>

          <div style="margin-top:24px;">
            <div class="settings-section-title" style="margin-bottom:10px;">Notifications &amp; Sounds</div>
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
            <label class="settings-toggle-row" style="margin-top:12px;">
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

          <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Auto-send GIFs</div>
                <div class="settings-toggle-sub">Click a GIF to send it immediately instead of pasting into the composer</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-autosend-gif-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Freeze GIFs on load</div>
                <div class="settings-toggle-sub">Pause all incoming GIFs automatically — click to replay</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-gif-freeze-default-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Keep GIFs frozen</div>
                <div class="settings-toggle-sub">Remember which GIFs you froze — stays frozen through menus &amp; reloads</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-gif-keep-frozen-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Auto-freeze after 2 loops</div>
                <div class="settings-toggle-sub">GIFs automatically pause after playing twice</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-gif-autofreeze-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>

          <div style="margin-top:24px;">
            <div class="settings-section-title" style="margin-bottom:10px;">Messages</div>
            <div class="settings-field-group" style="margin-bottom:16px;">
              <label class="modal-label">Text Size</label>
              <div class="text-size-row" id="text-size-options">
                <button class="text-size-btn" data-size="12">Small</button>
                <button class="text-size-btn" data-size="15">Default</button>
                <button class="text-size-btn" data-size="17">Medium</button>
                <button class="text-size-btn" data-size="19">Large</button>
              </div>
              <p class="hint" style="margin:4px 0 0;font-size:11px;">Controls the size of chat message text.</p>
            </div>
            <label class="settings-toggle-row">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Compact message mode</div>
                <div class="settings-toggle-sub">Show messages closer together with smaller avatars</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-compact-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Double-click to react</div>
                <div class="settings-toggle-sub">Double-click any message to react with your chosen emoji</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-dblclick-react-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <div class="settings-field-group" style="margin-top:12px;" id="dblclick-emoji-row">
              <label class="modal-label">Double-click react emoji</label>
              <div style="display:flex;align-items:center;gap:8px;">
                <span id="dblclick-emoji-preview" style="font-size:22px;cursor:pointer;" title="Click to change">👍</span>
                <input type="text" id="settings-dblclick-emoji" placeholder="👍" maxlength="4"
                  style="width:60px;text-align:center;font-size:18px;" />
                <span class="hint">Any emoji character or shortcode</span>
              </div>
            </div>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Hide Typing Indicator</div>
                <div class="settings-toggle-sub">Don't show when you're typing to others</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-silent-typing-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
          </div>

          <p class="hint" style="margin-top:20px;text-align:center;">All appearance &amp; preference changes apply instantly.</p>
        </div>

      </div><!-- /.settings-discord-body -->

      <!-- Close button (outside both columns) -->
      <button class="settings-discord-close-btn" data-close="settings-modal" title="Close (Esc)">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>
  </div>

  <!-- Avatar Crop Modal -->
  <div class="modal hidden" id="avatar-crop-modal">
    <div class="modal-card" style="max-width:360px;width:calc(100% - 32px);">
      <div class="modal-head">
        <h2>Crop Profile Picture</h2>
        <button class="icon-btn modal-close" data-close="avatar-crop-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding-top:0;">
        <div class="crop-canvas-wrap">
          <canvas id="avatar-crop-canvas" width="280" height="280"></canvas>
        </div>
        <div class="crop-zoom-row">
          <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0;color:var(--t-muted)"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="range" id="crop-zoom-slider" min="0.5" max="4" step="0.01" value="1" style="flex:1;" />
          <svg viewBox="0 0 24 24" width="18" height="18" style="flex-shrink:0;color:var(--t-muted)"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </div>
        <p class="hint" style="text-align:center;margin:6px 0 0;font-size:11px;">Drag to pan · Scroll or slider to zoom</p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="avatar-crop-modal">Cancel</button>
        <button class="btn-primary" id="crop-confirm-btn">Use This Photo</button>
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
      <div class="profile-card-custom-status" id="profile-card-custom-status" style="display:none"></div>
      <div class="profile-card-badges" id="profile-card-badges"></div>
      <div class="profile-card-since" id="profile-card-since"></div>
      <div class="profile-card-divider"></div>
      <div class="profile-card-bio-label">About Me</div>
      <div class="profile-card-bio" id="profile-card-bio"></div>
      <div class="profile-card-notes-label" id="profile-card-notes-label">Note</div>
      <textarea class="profile-card-notes" id="profile-card-notes" placeholder="Add a private note about this person…" maxlength="500"></textarea>
      <div class="profile-card-actions" id="profile-card-actions">
        <!-- buttons injected by showProfileCard() -->
        <button class="profile-card-more-btn" id="profile-card-more-btn" title="More options" style="display:none">⋯</button>
      </div>
    </div>
  </div>

  <!-- Full Profile Modal -->
  <div id="full-profile-modal" class="modal hidden">
    <div class="modal-card full-profile-modal" role="dialog" aria-label="Full Profile" style="position:relative;overflow:hidden;max-height:92vh;overflow-y:auto;">
      <div class="full-profile-banner" id="fp-banner"></div>
      <div class="full-profile-body">
        <div class="full-profile-avatar-row">
          <div class="full-profile-avatar" id="fp-avatar"></div>
          <span class="status-dot full-profile-status" id="fp-status-dot" data-status="offline" style="display:none"></span>
        </div>
        <div class="full-profile-name" id="fp-name"></div>
        <div class="full-profile-tag" id="fp-tag"></div>
        <div class="full-profile-custom-status" id="fp-custom-status" style="display:none"></div>
        <div class="full-profile-badges" id="fp-badges"></div>
        <div class="full-profile-divider"></div>
        <div class="full-profile-section-label">About Me</div>
        <div class="full-profile-bio" id="fp-bio"></div>
        <div class="full-profile-since" id="fp-since"></div>
        <div class="full-profile-actions" id="fp-actions"></div>
      </div>
      <button class="profile-card-close" id="full-profile-close" aria-label="Close" style="position:absolute;top:8px;right:8px;z-index:2;">
        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast hidden"></div>

  <!-- Custom Confirm Dialog (dynamically injected by showConfirm(), placeholder here for CSS) -->
  `);
}
