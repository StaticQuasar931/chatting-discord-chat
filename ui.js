/* =====================================================================
   Static Chat — ui.js
   Exports buildUI() which injects the full application HTML into <body>.
   Call this ONCE at the very top of app.js before any DOM queries.
   ===================================================================== */

// Always load the logo from jsDelivr (CDN-served, works on any host including
// Google Sites / Apps Script embeds). Local file kept as final-fallback for
// offline dev only.
const LOGO = "https://cdn.jsdelivr.net/gh/StaticQuasar931/chatting-discord-chat@main/staticcord.png";
const LOGO_FALLBACK = "./staticcord.png";

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
      <div class="loading-spinner" id="loading-spinner">
        <div class="ls-arc"></div>
      </div>
      <p class="loading-tip" id="loading-tip">Loading…</p>
      <!-- Quota exceeded message — hidden until quota is actually hit -->
      <div id="loading-quota-msg" class="loading-quota-msg" style="display:none;">
        <div class="lqm-icon">⚠️</div>
        <div class="lqm-title">Daily Quota Reached</div>
        <div class="lqm-body">Static Chat has hit its daily limit.<br>Things will be back to normal once the quota resets — usually within a few hours.</div>
        <a class="lqm-discord-btn" href="https://discord.gg/DP2hM7RRhR" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="flex-shrink:0;"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Join the Discord for updates
        </a>
        <p class="lqm-note">This page will automatically retry every 30 seconds.</p>
      </div>
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
      <button class="rail-btn rail-school hidden" id="rail-school" title="School Discovery — find people from your school">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
        </svg>
      </button>
    </nav>

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <input type="text" id="sidebar-search" placeholder="Find or start a conversation" />
      </div>
      <div class="sidebar-content">
        <button class="side-btn" id="open-friends-btn" style="position:relative;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
            <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
            <path fill="currentColor" d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"/>
          </svg>
          <span>Friends</span>
          <span class="side-btn-badge hidden" id="friend-req-badge" aria-label="pending friend requests"></span>
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
            <button class="tab" data-tab="pending">Pending <span class="tab-badge hidden" id="pending-tab-badge"></span></button>
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
            <div class="empty empty-state" id="friends-empty" hidden>
              <div class="empty-icon">👋</div>
              <div class="empty-title">No friends yet</div>
              <div class="empty-desc">Find someone using the <button class="empty-action" data-empty-action="open-add-friend">Add Friend</button> tab — search by username or username#discriminator.</div>
            </div>
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
          <button class="mobile-sidebar-toggle" id="mobile-sidebar-toggle" title="Toggle sidebar" aria-label="Open sidebar">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
          </button>
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
            <button class="icon-btn" id="chat-group-info-btn" title="Group info" hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2z"/></svg>
            </button>
            <button class="icon-btn" id="chat-anon-toggle-btn" title="Toggle anonymous mode (school chats only)" hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4 0-.55.11-1.07.29-1.55l1.32 1.32c-.06.07-.11.15-.11.23 0 .55.45 1 1 1s1-.45 1-1c0-.55-.45-1-1-1-.08 0-.16.05-.23.11l-1.32-1.32C9.93 11.61 10.45 11.5 11 11.5c2.21 0 4 1.79 4 4 0 .55-.11 1.07-.29 1.55-.49.18-1.01.45-1.71.45z"/></svg>
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

          <!-- Markdown preview (toggleable, shows above composer) -->
          <div id="md-preview" class="md-preview hidden"></div>

          <!-- Silent-armed ribbon — appears above the composer when + → Silent is on -->
          <div id="composer-silent-ribbon" class="composer-silent-ribbon hidden" aria-live="polite">
            <span>🔕 Next message will be sent silently — no notification will play for recipients.</span>
            <button type="button" class="silent-ribbon-cancel" id="silent-ribbon-cancel" title="Cancel silent">✕</button>
          </div>

          <div class="composer-inner">
            <!-- + button moved to the LEFT of the textarea -->
            <button class="icon-btn composer-plus-btn" id="composer-plus-btn" title="More — polls, games, commands, silent">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>
              </svg>
            </button>
            <div class="composer-input-wrap">
              <textarea id="composer-input" placeholder="Message… or /help for commands" rows="1"></textarea>
            </div>
            <button class="icon-btn composer-md-btn" id="md-preview-btn" title="Toggle Markdown preview">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path fill="currentColor" d="M2.5 5h19c.83 0 1.5.67 1.5 1.5v11c0 .83-.67 1.5-1.5 1.5h-19C1.67 19 1 18.33 1 17.5v-11C1 5.67 1.67 5 2.5 5zm3 11.5v-5L8 14l2.5-2.5v5h-2v-2L8 15l-1.5-1.5v3H5.5zm12 .25 3-3.25h-2v-3h-2v3h-2l3 3.25z"/>
              </svg>
            </button>
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
              <!-- GIF badge — tighter viewBox so the box hugs the letters -->
              <svg viewBox="0 0 28 20" width="26" height="15" aria-hidden="true" fill="currentColor">
                <rect x="0.8" y="0.8" width="26.4" height="18.4" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
                <!-- G -->
                <path d="M9.1 5.5C6.5 5.5 4.4 7.4 4.4 10s2.1 4.5 4.7 4.5c1.4 0 2.5-.5 3.3-1.4v-3.3H8.3v1.5h2.4v1.2c-.5.4-1.1.6-1.6.6-1.8 0-3-1.3-3-3s1.2-3 3-3c.9 0 1.7.4 2.2 1l1.1-1.1C11.6 6.1 10.4 5.5 9.1 5.5z"/>
                <!-- I -->
                <rect x="14.2" y="5.7" width="1.7" height="8.6"/>
                <!-- F (extended to fill box) -->
                <path d="M18.3 5.7h6.5v1.7h-4.8v2.1h4.2v1.7h-4.2v3.1h-1.7z"/>
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
          <div class="emoji-picker-footer">
            <button class="emoji-picker-submit-btn" id="emoji-submit-btn" type="button" title="Submit a custom emoji for review">
              + Submit custom emoji
            </button>
          </div>
        </div>

        <!-- Custom Emoji Modal — two flows: personal (immediate) or sticker submission (admin review) -->
        <div class="modal hidden" id="emoji-submit-modal">
          <div class="modal-card" style="max-width:460px;width:96vw;">
            <div class="modal-head">
              <h2>✨ Custom Emoji</h2>
              <button class="icon-btn modal-close" data-close="emoji-submit-modal">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>

            <!-- Tabs: Personal vs Submit-as-sticker -->
            <div class="emoji-modal-tabs">
              <button class="emoji-modal-tab active" data-emoji-tab="personal">🙂 Personal Emoji</button>
              <button class="emoji-modal-tab" data-emoji-tab="sticker">📤 Submit as Sticker</button>
            </div>

            <div class="modal-body" style="padding:16px 20px;">
              <!-- Personal tab -->
              <div class="emoji-tab-pane" data-emoji-pane="personal">
                <p class="hint" style="margin:0 0 12px;">Add a custom emoji that <strong>only you and people in your chats</strong> can see when you use it. Stays on your account, no review needed.</p>

                <label class="modal-label">Shortcode <span class="label-optional">— used as <code>:name:</code></span></label>
                <input type="text" id="emoji-personal-name" maxlength="32" placeholder="my_emoji" />

                <label class="modal-label" style="margin-top:14px;">Image URL <span class="label-optional">— direct .png/.gif/.webp link</span></label>
                <input type="text" id="emoji-personal-url" placeholder="https://example.com/image.png" />

                <div id="emoji-personal-preview" style="margin-top:12px;text-align:center;display:none;">
                  <img id="emoji-personal-preview-img" alt="Preview" style="max-width:64px;max-height:64px;border-radius:8px;background:var(--c-input-2);padding:4px;" />
                </div>

                <!-- Existing personal emojis -->
                <div style="margin-top:14px;">
                  <div class="modal-label" style="margin-bottom:6px;">Your custom emoji</div>
                  <div id="emoji-personal-list" class="emoji-personal-list">
                    <span class="hint" style="font-size:11px;">— none yet —</span>
                  </div>
                </div>
              </div>

              <!-- Sticker submission tab -->
              <div class="emoji-tab-pane" data-emoji-pane="sticker" style="display:none;">
                <p class="hint" style="margin:0 0 12px;">Submit your emoji for admin review. <strong>Approved</strong> stickers may be added for everyone to use later.</p>

                <label class="modal-label">Sticker name <span class="label-optional">— letters, numbers, underscores</span></label>
                <input type="text" id="emoji-submit-name" maxlength="32" placeholder="my_cool_emoji" />

                <label class="modal-label" style="margin-top:14px;">Image URL <span class="label-optional">— direct .png/.gif/.webp link</span></label>
                <input type="text" id="emoji-submit-url" placeholder="https://example.com/image.png" />

                <div id="emoji-submit-preview" style="margin-top:12px;text-align:center;display:none;">
                  <img id="emoji-submit-preview-img" alt="Preview" style="max-width:80px;max-height:80px;border-radius:8px;background:var(--c-input-2);padding:4px;" />
                </div>

                <p class="hint" style="margin-top:12px;color:var(--c-warn);font-size:12px;">
                  ⚠️ Don't submit copyrighted, NSFW, or hateful content.
                </p>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-secondary" data-close="emoji-submit-modal">Cancel</button>
              <button class="btn-primary" id="emoji-personal-add-btn">Add to My Emoji</button>
              <button class="btn-primary" id="emoji-submit-confirm-btn" style="display:none;">Submit for Review</button>
            </div>
          </div>
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
        <img src="${LOGO}" alt="" onerror="this.src='${LOGO_FALLBACK}'" />
        <h2>Select a conversation</h2>
        <p>Pick a friend or group from the sidebar to start chatting.</p>
      </section>
    </main>
  </div>

  <!-- Status picker popup (created dynamically, placeholder kept here for reference) -->

  <!-- ====== TERMS OF USE — shown on first visit ====== -->
  <div id="tos-overlay" class="tos-overlay" role="dialog" aria-modal="true" aria-labelledby="tos-title">
    <div class="tos-card">
      <!-- 3-column header: icon left · title center · icon right -->
      <div class="tos-header">
        <div class="tos-header-row">
          <img src="${LOGO}" alt="" class="tos-side-icon tos-side-icon-left" onerror="this.src='${LOGO_FALLBACK}'" />
          <div class="tos-header-center">
            <h2 id="tos-title">Before You Continue</h2>
            <p class="tos-sub">Please read carefully before entering Static Chat.</p>
          </div>
          <img src="${LOGO}" alt="" class="tos-side-icon tos-side-icon-right" onerror="this.src='${LOGO_FALLBACK}'" />
        </div>
        <div class="tos-author">
          <a href="https://sites.google.com/view/staticquasar931/gm3z" target="_blank" rel="noopener noreferrer">
            Built by <strong>StaticQuasar931</strong>
          </a>
        </div>
      </div>

      <div class="tos-body">
        <ul class="tos-list">
          <li>⚠️ <strong>Use at your own risk.</strong> This is an independent, hobbyist project provided "as is" without warranties of any kind. The creator is not liable for any loss, harm, or damages from use of this service.</li>
          <li>🔞 <strong>Age requirement.</strong> You must be at least 13 years old (or the digital-consent age in your country) to use Static Chat. If you are under that age, leave now.</li>
          <li>🧠 <strong>Be respectful.</strong> Harassment, bullying, hate speech, threats, or discriminatory content are not allowed and may result in removal.</li>
          <li>🔒 <strong>Protect your privacy.</strong> Never share passwords, addresses, phone numbers, financial info, or other sensitive personal information. The creator cannot prevent other users from saving anything you send.</li>
          <li>📵 <strong>Keep it appropriate.</strong> No NSFW, sexual, violent, illegal, or otherwise harmful content. No content that exploits minors. No content that violates any applicable law.</li>
          <li>🤖 <strong>No abuse of the platform.</strong> No spam, bots, impersonation, scraping, or attempts to bypass security. The creator may remove accounts at any time and without notice.</li>
          <li>👁️ <strong>Limited moderation.</strong> Reports are reviewed when possible. Automated filters exist but no platform is 100% monitored. <strong>You are responsible</strong> for what you send and how you interact with others.</li>
          <li>🛂 <strong>School Discovery feature.</strong> Domain matching is not identity verification. Anyone can create an email at most domains. Treat everyone as a stranger and never share personal info just because you share a domain.</li>
          <li>📜 <strong>Service may change or end.</strong> Features, data, and the service itself may change, be paused, or shut down at any time. No guarantee of message persistence or backups.</li>
          <li>🚩 <strong>Report problems</strong> using the in-app report button. Don't abuse the report system.</li>
        </ul>
        <p class="tos-footer-note">
          By clicking "I Agree", you confirm you have read these terms, are old enough to use this service, and agree to use Static Chat responsibly. If you do not agree, close this page.
        </p>
      </div>

      <div class="tos-foot">
        <button class="btn-primary" id="tos-agree-btn">I Agree — Let Me In</button>
      </div>
    </div>

    <!-- Where's Epstein plug — fixed to bottom-right of the entire viewport -->
    <a class="tos-epstein-plug"
       href="https://sites.google.com/view/staticquasar931/static-gmes/wheres-epstein"
       target="_blank" rel="noopener noreferrer"
       title="Play Where's Epstein? — by StaticQuasar931">
      🎮 Play Where's Epstein?
    </a>
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
        <label class="modal-label" style="margin-top:14px;">Bio <span class="label-optional">optional · up to 400 chars</span></label>
        <textarea id="setup-bio-input" class="modal-textarea" placeholder="Tell people a little about yourself…" maxlength="400" rows="3"></textarea>
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
        <button class="settings-discord-nav-item active" data-pane="account">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          Account &amp; Profile
        </button>
        <button class="settings-discord-nav-item" data-pane="appearance">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          Appearance
        </button>
        <!-- Spacer pushes sign-out to bottom -->
        <div class="settings-nav-spacer"></div>
        <div class="settings-discord-nav-divider settings-signout-divider"></div>
        <button class="settings-discord-nav-item danger" id="settings-signout-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          Sign Out
        </button>
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
                  <button class="btn-secondary" id="settings-photo-crop-btn" title="Open the crop editor with this URL" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:0 10px;height:36px;">
                    <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/></svg>
                    Crop
                  </button>
                  <label class="btn-secondary avatar-upload-label" title="Upload a photo from your device">
                    <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
                    Upload
                    <input type="file" id="settings-photo-file" accept="image/*" style="display:none" />
                  </label>
                </div>
                <p class="hint" style="margin:4px 0 0;font-size:11px;">Paste a URL and click <strong>Crop</strong> to drag-position it, or upload directly. Crop Position buttons also work for URL photos.</p>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Username</label>
                <input type="text" id="settings-username-input" maxlength="32" spellcheck="false" />
                <p class="hint" style="margin:5px 0 0;">Your full tag: <strong id="settings-tag-display">#0000</strong></p>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Bio <span class="label-optional">up to 400 chars</span></label>
                <textarea id="settings-bio-input" maxlength="400" rows="3" placeholder="Tell people a bit about yourself…"></textarea>
              </div>
              <div class="settings-field-group">
                <label class="modal-label">Status Phrase <span class="label-optional">up to 60 chars</span></label>
                <input type="text" id="settings-custom-status-input" maxlength="60"
                  placeholder="Feeling good, working on something…" spellcheck="false" autocomplete="off" />
                <p class="hint" style="margin:4px 0 0;font-size:11px;">Short message shown on your profile and in chat.</p>
              </div>

              <div class="settings-field-group">
                <label class="modal-label">Favorite Game on StaticQuasar931
                  <span class="label-optional">— shows on your profile, links to a game</span></label>
                <input type="text" id="settings-favgame-name" maxlength="50"
                  placeholder="Game name (e.g. Where's Epstein)" spellcheck="false" autocomplete="off" />
                <input type="text" id="settings-favgame-url" maxlength="200"
                  placeholder="https://sites.google.com/view/staticquasar931/..." spellcheck="false" autocomplete="off"
                  style="margin-top:6px;" />
                <p class="hint" id="settings-favgame-hint" style="margin:4px 0 0;font-size:11px;">URL must include <code>sites.google.com/view</code></p>
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
                  <!-- Custom gradient swatches (in-app pickers) -->
                  <div class="banner-custom-row" style="grid-column:1/-1;margin-top:6px;">
                    <label class="banner-custom-label">Custom:</label>
                    <button class="ic-color-btn" data-ic-target="banner1" type="button">
                      <span class="ic-color-swatch" id="banner-custom-color1-swatch" style="background:#4f7cff"></span>
                      <span id="banner-custom-color1-text">#4f7cff</span>
                    </button>
                    <button class="ic-color-btn" data-ic-target="banner2" type="button">
                      <span class="ic-color-swatch" id="banner-custom-color2-swatch" style="background:#7c3aed"></span>
                      <span id="banner-custom-color2-text">#7c3aed</span>
                    </button>
                    <input type="hidden" id="banner-custom-color1" value="#4f7cff" />
                    <input type="hidden" id="banner-custom-color2" value="#7c3aed" />
                    <button class="banner-swatch" id="banner-custom-apply" style="width:auto;padding:0 10px;height:28px;font-size:11px;background:var(--c-input-2);color:var(--t-secondary);" title="Apply custom gradient">Apply</button>
                  </div>
                </div>
              </div>
              <div id="banner-solid-section" style="display:none;">
                <div class="banner-custom-row">
                  <label class="banner-custom-label">Color:</label>
                  <button class="ic-color-btn" data-ic-target="bannerSolid" type="button">
                    <span class="ic-color-swatch" id="banner-solid-swatch" style="background:#4f7cff"></span>
                    <span id="banner-solid-text">#4f7cff</span>
                  </button>
                  <input type="hidden" id="banner-solid-color" value="#4f7cff" />
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
                    <div class="setup-avatar-preview spp-avatar-pos" id="settings-avatar-preview" style="width:84px;height:84px;font-size:30px;">
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
                  <div class="spp-favgame" id="settings-preview-favgame" style="display:none"></div>
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
            <button class="theme-swatch" data-theme="ocean">Ocean ✨</button>
            <button class="theme-swatch" data-theme="sunset">Sunset ✨</button>
            <button class="theme-swatch" data-theme="aurora">Aurora ✨</button>
            <button class="theme-swatch" data-theme="cloud">Cloud</button>
            <button class="theme-swatch" data-theme="daylight">Daylight</button>
            <button class="theme-swatch" data-theme="light">Light</button>
            <button class="theme-swatch theme-swatch-custom" data-theme="custom" id="theme-swatch-custom">🌈 Custom</button>
          </div>
          <!-- Custom theme color pickers (in-app HSV) -->
          <div id="theme-custom-pickers" style="display:none;margin-top:10px;">
            <div class="theme-custom-row">
              <label class="theme-custom-label">Background</label>
              <button class="ic-color-btn" data-ic-target="bg"><span class="ic-color-swatch" id="tc-bg-swatch" style="background:#1a1b1e"></span><span id="tc-bg-text">#1a1b1e</span></button>
              <input type="hidden" id="tc-bg" value="#1a1b1e" />
            </div>
            <div class="theme-custom-row">
              <label class="theme-custom-label">Sidebar</label>
              <button class="ic-color-btn" data-ic-target="sidebar"><span class="ic-color-swatch" id="tc-sidebar-swatch" style="background:#131416"></span><span id="tc-sidebar-text">#131416</span></button>
              <input type="hidden" id="tc-sidebar" value="#131416" />
            </div>
            <div class="theme-custom-row">
              <label class="theme-custom-label">Accent</label>
              <button class="ic-color-btn" data-ic-target="accent"><span class="ic-color-swatch" id="tc-accent-swatch" style="background:#4f7cff"></span><span id="tc-accent-text">#4f7cff</span></button>
              <input type="hidden" id="tc-accent" value="#4f7cff" />
            </div>
          </div>

          <!-- In-app color picker popover (hidden by default) -->
          <div id="ic-color-popover" class="ic-color-popover hidden">
            <div class="ic-color-grid" id="ic-color-grid"></div>
            <div class="ic-color-hex-row">
              <span style="font-size:11px;color:var(--t-muted);">HEX</span>
              <input type="text" class="ic-color-hex" id="ic-color-hex" maxlength="7" />
              <button class="btn-secondary" id="ic-color-apply">Apply</button>
            </div>
          </div>

          <!-- Chat Background / Wallpaper -->
          <div class="settings-section-title" style="margin-top:20px;margin-bottom:8px;">Chat Background</div>
          <div class="chat-bg-options">
            <button class="chat-bg-preset" data-bg-preset="none">None</button>
            <button class="chat-bg-preset" data-bg-preset="bubbles">Bubbles</button>
            <button class="chat-bg-preset" data-bg-preset="dots">Dots</button>
            <button class="chat-bg-preset" data-bg-preset="grid">Grid</button>
            <button class="chat-bg-preset" data-bg-preset="waves">Waves</button>
            <button class="chat-bg-preset" data-bg-preset="stars">Stars ✨</button>
            <button class="chat-bg-preset" data-bg-preset="custom-img">📷 Custom Image</button>
          </div>
          <div id="chat-bg-img-row" style="display:none;margin-top:8px;">
            <input type="text" id="chat-bg-img-url" placeholder="Image URL…" style="width:100%;margin-bottom:6px;" />
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              <label style="font-size:11px;color:var(--t-muted);">Size</label>
              <select id="chat-bg-size" style="flex:1;font-size:12px;background:var(--c-input-2);border:1px solid var(--c-border-2);border-radius:4px;color:var(--t-primary);padding:2px 6px;">
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain</option>
                <option value="auto">Actual size</option>
              </select>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              <label style="font-size:11px;color:var(--t-muted);">Opacity</label>
              <input type="range" id="chat-bg-opacity" min="5" max="100" value="30" style="flex:1;" />
              <span id="chat-bg-opacity-val" style="font-size:11px;color:var(--t-muted);width:28px;">30%</span>
            </div>
            <button class="btn-secondary" id="chat-bg-apply" style="width:100%;">Apply</button>
          </div>
          <div style="margin-top:4px;font-size:11px;color:var(--t-muted);">Background appears behind messages in all chats.</div>

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
              <label class="modal-label">Double-click action</label>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label class="radio-row">
                  <input type="radio" name="dblclick-mode" value="emoji" id="dbl-mode-emoji" checked />
                  <span>React with chosen emoji</span>
                </label>
                <label class="radio-row">
                  <input type="radio" name="dblclick-mode" value="picker" id="dbl-mode-picker" />
                  <span>Open emoji picker</span>
                </label>
              </div>
              <div id="dblclick-emoji-chooser" style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;">
                <button class="dblclick-emoji-btn" id="dblclick-emoji-pick-btn" type="button" title="Click to open the emoji picker">
                  <span id="dblclick-emoji-preview">👍</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" style="opacity:.7;"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
                </button>
                <span class="hint" style="font-size:11px;">— or type up to 4 chars —</span>
                <input type="text" id="settings-dblclick-emoji" value="👍" maxlength="4"
                       style="width:70px;text-align:center;font-size:18px;padding:6px;" />
              </div>
            </div>
            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Auto-scroll on new messages</div>
                <div class="settings-toggle-sub">Smoothly jump to bottom when a new message arrives (only if you're near the bottom)</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-autoscroll-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
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
            <div class="settings-field-group" style="margin-top:14px;">
              <label class="modal-label">Birthday <span class="label-optional">— optional, shows on your profile</span></label>
              <div style="display:flex;gap:6px;align-items:center;">
                <select id="settings-birthday-month" style="flex:1;">
                  <option value="">— Month —</option>
                  <option value="1">January</option><option value="2">February</option><option value="3">March</option>
                  <option value="4">April</option><option value="5">May</option><option value="6">June</option>
                  <option value="7">July</option><option value="8">August</option><option value="9">September</option>
                  <option value="10">October</option><option value="11">November</option><option value="12">December</option>
                </select>
                <select id="settings-birthday-day" style="width:90px;">
                  <option value="">— Day —</option>
                  ${Array.from({length:31},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("")}
                </select>
                <button class="btn-secondary" id="settings-birthday-clear" style="padding:0 12px;">Clear</button>
              </div>
              <p class="hint">Your year is never stored. Only month + day are shown to others.</p>
            </div>

            <label class="settings-toggle-row" style="margin-top:12px;">
              <div class="settings-toggle-info">
                <div class="settings-toggle-label">Show Last Active Time</div>
                <div class="settings-toggle-sub">Let others see when you were last active on your profile</div>
              </div>
              <span class="toggle-switch">
                <input type="checkbox" id="settings-show-last-active-toggle" />
                <span class="toggle-track"></span>
              </span>
            </label>
            <div class="settings-field-group" style="margin-top:14px;">
              <label class="modal-label">Animated Profile Pictures (GIFs)</label>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <label class="radio-row">
                  <input type="radio" name="pfp-animate" value="always" id="pfp-anim-always" />
                  <span>Animate everywhere <small style="color:var(--t-muted);">(default)</small></span>
                </label>
                <label class="radio-row">
                  <input type="radio" name="pfp-animate" value="sidebar-only" id="pfp-anim-sidebar" />
                  <span>Animate in sidebar only <small style="color:var(--t-muted);">(static in chat messages — reduces movement)</small></span>
                </label>
                <label class="radio-row">
                  <input type="radio" name="pfp-animate" value="never" id="pfp-anim-never" />
                  <span>Never animate <small style="color:var(--t-muted);">(show initials instead)</small></span>
                </label>
              </div>
            </div>
          </div>

          <!-- ── Performance / Bandwidth ───────────────────────────── -->
          <div class="settings-section-divider" style="margin-top:20px;margin-bottom:14px;">
            <span>Performance &amp; Bandwidth</span>
          </div>

          <label class="settings-toggle-row">
            <div class="settings-toggle-info">
              <div class="settings-toggle-label">Low Bandwidth Mode</div>
              <div class="settings-toggle-sub">Disables sidebar typing indicators and reduces background listener count. Helpful on slow connections or when usage is high.</div>
            </div>
            <span class="toggle-switch">
              <input type="checkbox" id="settings-low-bandwidth-toggle" />
              <span class="toggle-track"></span>
            </span>
          </label>

          <div id="settings-debug-stats" style="margin-top:14px;padding:10px 12px;background:var(--bg-2);border-radius:8px;font-size:11px;color:var(--t-muted);display:none;">
            <div style="font-weight:600;color:var(--t-normal);margin-bottom:6px;">🔧 Firestore Debug</div>
            <div>Active listeners: <strong id="dbg-listener-count">0</strong> <span style="opacity:.6;font-size:10px;">(cap: 20)</span></div>
            <div>getDoc reads (session): <strong id="dbg-read-count">0</strong></div>
            <div>Presence writes (session): <strong id="dbg-presence-writes">0</strong></div>
            <div>User cache entries: <strong id="dbg-cache-size">0</strong></div>
            <div style="margin-top:6px;"><button class="btn-secondary" style="font-size:11px;padding:3px 8px;" id="dbg-show-listeners-btn">Show listener list</button></div>
          </div>
          <label class="settings-toggle-row" style="margin-top:10px;">
            <div class="settings-toggle-info">
              <div class="settings-toggle-label">Show Debug Stats</div>
              <div class="settings-toggle-sub">Show Firestore listener count and cache stats (developer tool)</div>
            </div>
            <span class="toggle-switch">
              <input type="checkbox" id="settings-debug-toggle" />
              <span class="toggle-track"></span>
            </span>
          </label>

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

  <!-- School Discovery Modal -->
  <div class="modal hidden" id="school-modal">
    <div class="modal-card school-modal-card">
      <div class="modal-head">
        <h2>🎓 School Discovery</h2>
        <button class="icon-btn modal-close" data-close="school-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:18px 20px;max-height:75vh;overflow-y:auto;">
        <!-- OPT-IN VIEW (shown if not yet opted in) -->
        <div id="school-optin-view">
          <div class="school-banner">
            <div class="school-banner-icon">🎓</div>
            <div>
              <div class="school-banner-title">Connect with classmates</div>
              <div class="school-banner-sub">Find people who go to your school</div>
            </div>
          </div>

          <div class="school-domain-card">
            <div class="modal-label">Your school domain (auto-detected)</div>
            <div class="school-domain-value" id="school-domain-display">—</div>
            <div class="hint">Anyone signed in with this email domain can find you here.</div>
          </div>

          <div class="school-warning">
            <strong>⚠️ Stay safe:</strong>
            <ul style="margin:6px 0 0;padding-left:18px;font-size:13px;color:var(--t-secondary);line-height:1.5;">
              <li>People can <strong>spoof and lie</strong>. Just because they share your email domain doesn't mean they're a real classmate.</li>
              <li><strong>Catfishing is possible.</strong> Someone could pretend to be a student or staff member.</li>
              <li>Be careful with <strong>personal info</strong> (full name, location, phone, photos) — same rules as the rest of Static Chat.</li>
              <li>If something feels off, <strong>report it</strong> and don't share more.</li>
            </ul>
          </div>

          <div class="settings-field-group" style="margin:10px 0 14px;">
            <label class="modal-label">Optional nickname for school discovery
              <span class="label-optional">— shown to classmates instead of your username (school context only)</span>
            </label>
            <input type="text" id="school-nickname-input" maxlength="32" placeholder="e.g. Alex (Period 4 Bio)" />
          </div>

          <div class="settings-field-group" style="margin:10px 0 14px;">
            <label class="modal-label">Grade / graduation year
              <span class="label-optional">— optional, helps classmates find peers in the same year</span>
            </label>
            <select id="school-grad-input" style="width:100%;">
              <option value="">— Prefer not to say —</option>
              <option value="freshman">Freshman</option>
              <option value="sophomore">Sophomore</option>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="grad">Graduate / Alumni</option>
              <option value="staff">Staff / Teacher</option>
            </select>
            <p class="hint" style="color:var(--c-warn);margin-top:4px;">
              ⚠️ Anyone can lie about this. Don't fully trust grade tags — verify in person before sharing personal info.
            </p>
          </div>

          <div id="school-filters-row" class="hidden">
            <label class="modal-label" style="margin-top:10px;">Filter directory by grade</label>
            <div class="poll-builder-duration-row">
              <button class="poll-dur-chip active" data-grade-filter="">All</button>
              <button class="poll-dur-chip" data-grade-filter="freshman">Freshman</button>
              <button class="poll-dur-chip" data-grade-filter="sophomore">Sophomore</button>
              <button class="poll-dur-chip" data-grade-filter="junior">Junior</button>
              <button class="poll-dur-chip" data-grade-filter="senior">Senior</button>
              <button class="poll-dur-chip" data-grade-filter="grad">Grad/Alumni</button>
              <button class="poll-dur-chip" data-grade-filter="staff">Staff</button>
            </div>
          </div>

          <label class="school-consent-row">
            <input type="checkbox" id="school-consent-check" />
            <span>I understand the risks and want my profile to be discoverable to other users in my school domain.</span>
          </label>
          <div class="modal-foot" style="padding:16px 0 0;">
            <button class="btn-secondary" data-close="school-modal">Not now</button>
            <button class="btn-primary" id="school-join-btn" disabled>Opt In &amp; Continue</button>
          </div>
        </div>

        <!-- DIRECTORY VIEW (shown after opt-in) -->
        <div id="school-directory-view" class="hidden">
          <div class="school-directory-head">
            <div>
              <div class="school-banner-title" id="school-directory-domain">—</div>
              <div class="school-banner-sub"><span id="school-directory-count">0</span> students discoverable</div>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn-primary" id="school-open-chat-btn" title="Open the school-wide group chat">
                💬 School Chat
              </button>
              <button class="btn-secondary" id="school-diverge-btn" title="Create your own private group with selected classmates">
                ✨ New Private Group
              </button>
              <button class="btn-ghost school-leave-btn-red" id="school-leave-btn" title="Stop being discoverable">
                Leave
              </button>
            </div>
          </div>

          <div class="hint" style="margin:8px 0;">
            🔍 Spoofing reminder: domain match doesn't guarantee identity. Verify before sharing personal info.
          </div>

          <div id="school-members-list" class="school-members-list">
            <div class="empty" style="padding:18px;color:var(--t-muted);">Loading…</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- School: Diverge Into Private Group Modal -->
  <div class="modal hidden" id="school-diverge-modal">
    <div class="modal-card" style="max-width:460px;width:96vw;">
      <div class="modal-head">
        <h2>✨ New Private Group</h2>
        <button class="icon-btn modal-close" data-close="school-diverge-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:18px 20px;max-height:70vh;overflow-y:auto;">
        <p class="hint" style="margin:0 0 12px;">Pick classmates from your school discovery to start a private group with. The group will be a regular group chat — separate from the school-wide chat.</p>
        <label class="modal-label">Group name</label>
        <input type="text" id="school-diverge-name" maxlength="50" placeholder="e.g. AP Bio Study Group" />
        <label class="modal-label" style="margin-top:14px;">Invite from school directory</label>
        <div id="school-diverge-list" class="school-members-list" style="max-height:300px;"></div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="school-diverge-modal">Cancel</button>
        <button class="btn-primary" id="school-diverge-create-btn">Create Group</button>
      </div>
    </div>
  </div>

  <!-- Bug Reporter Modal -->
  <div class="modal hidden" id="bug-report-modal">
    <div class="modal-card" style="max-width:500px;width:96vw;">
      <div class="modal-head">
        <h2>🪲 Report a Bug</h2>
        <button class="icon-btn modal-close" data-close="bug-report-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:16px 20px;">
        <p class="hint" style="margin:0 0 10px;">Found a problem? Tell me what happened. Your browser, current page, and any recent error are auto-attached so I can debug.</p>
        <label class="modal-label">What went wrong?</label>
        <textarea id="bug-report-text" maxlength="1500" rows="5" placeholder="e.g. clicking 'Join as O' on tic-tac-toe didn't work…"></textarea>
        <label class="modal-label" style="margin-top:14px;">Steps to reproduce <span class="label-optional">optional</span></label>
        <textarea id="bug-report-steps" maxlength="800" rows="3" placeholder="1. open chat&#10;2. click X&#10;3. saw Y"></textarea>
        <details style="margin-top:14px;font-size:12px;color:var(--t-muted);">
          <summary style="cursor:pointer;">📋 Auto-attached info</summary>
          <pre id="bug-report-meta" style="margin-top:6px;font-size:10.5px;background:var(--c-input-2);padding:8px;border-radius:var(--radius-sm);white-space:pre-wrap;word-break:break-all;"></pre>
        </details>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="bug-report-modal">Cancel</button>
        <button class="btn-primary" id="bug-report-send-btn">Send Report</button>
      </div>
    </div>
  </div>

  <!-- Slash Commands Help Modal -->
  <div class="modal hidden" id="commands-help-modal">
    <div class="modal-card" style="max-width:560px;width:96vw;">
      <div class="modal-head">
        <h2>⚡ Slash Commands</h2>
        <button class="icon-btn modal-close" data-close="commands-help-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:14px 18px;max-height:75vh;overflow-y:auto;">
        <input type="text" id="commands-help-search" placeholder="Search commands…" autocomplete="off" style="width:100%;padding:8px 12px;margin-bottom:10px;" />
        <div id="commands-help-list" class="commands-help-list"></div>
        <p class="hint" style="margin-top:10px;font-size:11px;text-align:center;">Click any command to insert it into your message — or click ▶ to launch it instantly.</p>
      </div>
    </div>
  </div>

  <!-- Activities (mini-games) Picker Modal -->
  <div class="modal hidden" id="activities-modal">
    <div class="modal-card" style="max-width:640px;width:96vw;">
      <div class="modal-head">
        <h2>🎮 Activities</h2>
        <button class="icon-btn modal-close" data-close="activities-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:16px 20px;">
        <!-- Search bar at top -->
        <div style="margin-bottom:12px;">
          <input type="text" id="activities-search" placeholder="🔍 Search activities…" autocomplete="off"
            style="width:100%;padding:8px 12px;font-size:13px;background:var(--c-input-2);border:1px solid var(--c-border-2);border-radius:var(--radius-sm);color:var(--t-primary);box-sizing:border-box;" />
        </div>
        <p class="hint" style="margin:0 0 12px;">Pick a game to play with everyone in this chat. The game will be posted as a message — anyone can take their turn.</p>
        <div class="activities-grid">
          <button class="activity-card" data-activity="tictactoe">
            <div class="activity-icon">⨯⭘</div>
            <div class="activity-name">Tic-Tac-Toe</div>
            <div class="activity-desc">Classic 3-in-a-row</div>
            <div class="activity-players">👥 2 players</div>
          </button>
          <button class="activity-card" data-activity="rps">
            <div class="activity-icon">✊✋✌️</div>
            <div class="activity-name">Rock Paper Scissors</div>
            <div class="activity-desc">Best-of-five</div>
            <div class="activity-players">👥 2 players</div>
          </button>
          <button class="activity-card" data-activity="connect4">
            <div class="activity-icon">🔴🟢</div>
            <div class="activity-name">Connect 4</div>
            <div class="activity-desc">Drop pieces, 4-in-a-row</div>
            <div class="activity-players">👥 2 players</div>
          </button>
          <button class="activity-card" data-activity="hangman">
            <div class="activity-icon">📝</div>
            <div class="activity-name">Hangman</div>
            <div class="activity-desc">Guess the word, 6 tries</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="20q">
            <div class="activity-icon">❓</div>
            <div class="activity-name">20 Questions</div>
            <div class="activity-desc">Yes/no guessing game</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="trivia">
            <div class="activity-icon">🧠</div>
            <div class="activity-name">Trivia</div>
            <div class="activity-desc">First to answer wins</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="wouldyou">
            <div class="activity-icon">🤔</div>
            <div class="activity-name">Would You Rather</div>
            <div class="activity-desc">Vote on a hard choice</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="truthordare">
            <div class="activity-icon">💫</div>
            <div class="activity-name">Truth or Dare</div>
            <div class="activity-desc">Host writes prompts</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="mostlikely">
            <div class="activity-icon">🌟</div>
            <div class="activity-name">Most Likely To…</div>
            <div class="activity-desc">Vote who fits best</div>
            <div class="activity-players">👥 3+ players</div>
          </button>
          <button class="activity-card sahur-card" data-activity="sahur">
            <div class="activity-icon">🥁</div>
            <div class="activity-name">Tung Tung Sahur</div>
            <div class="activity-desc">Reaction-rush meme game</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="dice">
            <div class="activity-icon">🎲</div>
            <div class="activity-name">Dice Duel</div>
            <div class="activity-desc">Roll the highest</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="numguess">
            <div class="activity-icon">🔢</div>
            <div class="activity-name">Number Guess</div>
            <div class="activity-desc">Higher or lower, race!</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="typingrace">
            <div class="activity-icon">⌨️</div>
            <div class="activity-name">Typing Race</div>
            <div class="activity-desc">Race to type the phrase</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="reactiontest">
            <div class="activity-icon">⚡</div>
            <div class="activity-name">Reaction Test</div>
            <div class="activity-desc">Hit the button first!</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="cups">
            <div class="activity-icon">🎩</div>
            <div class="activity-name">Shell Game</div>
            <div class="activity-desc">Find the hidden ball</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
          <button class="activity-card" data-activity="uno">
            <div class="activity-icon">🃏</div>
            <div class="activity-name">UNO</div>
            <div class="activity-desc">Color &amp; number matching</div>
            <div class="activity-players">👥 2–8 players</div>
          </button>
          <button class="activity-card" data-activity="draw">
            <div class="activity-icon">🎨</div>
            <div class="activity-name">Draw &amp; Guess</div>
            <div class="activity-desc">Draw it, guess it!</div>
            <div class="activity-players">👥 2+ players</div>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Poll Builder Modal -->
  <div class="modal hidden" id="poll-builder-modal">
    <div class="modal-card" style="max-width:480px;width:96vw;">
      <div class="modal-head">
        <h2>📊 Create Poll</h2>
        <button class="icon-btn modal-close" data-close="poll-builder-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:16px 20px;max-height:75vh;overflow-y:auto;">
        <label class="modal-label">Question</label>
        <input type="text" id="poll-builder-question" maxlength="200" placeholder="Pizza or burgers tonight?" />

        <label class="modal-label" style="margin-top:14px;">Options <span class="label-optional">— at least 2, max 10</span></label>
        <div id="poll-builder-options"></div>
        <button class="btn-secondary" id="poll-builder-add-option" style="margin-top:6px;font-size:12px;">+ Add option</button>

        <label class="modal-label" style="margin-top:14px;">How long is the poll open?</label>
        <div class="poll-builder-duration-row">
          <button class="poll-dur-chip" data-poll-dur="900000">15 min</button>
          <button class="poll-dur-chip" data-poll-dur="3600000">1 hour</button>
          <button class="poll-dur-chip active" data-poll-dur="86400000">24 hours</button>
          <button class="poll-dur-chip" data-poll-dur="259200000">3 days</button>
          <button class="poll-dur-chip" data-poll-dur="604800000">1 week</button>
        </div>
        <input type="hidden" id="poll-builder-duration" value="86400000" />

        <label class="settings-toggle-row" style="margin-top:14px;">
          <div class="settings-toggle-info">
            <div class="settings-toggle-label">🕶️ Anonymous voting</div>
            <div class="settings-toggle-sub">Hide who voted what — only counts shown. Reports still work.</div>
          </div>
          <span class="toggle-switch">
            <input type="checkbox" id="poll-builder-anon" />
            <span class="toggle-track"></span>
          </span>
        </label>
        <p class="hint" style="margin-top:14px;">Anyone in this chat can vote. You'll see live results as votes come in.</p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close="poll-builder-modal">Cancel</button>
        <button class="btn-primary" id="poll-builder-create-btn">📊 Post Poll</button>
      </div>
    </div>
  </div>

  <!-- Group Info / Settings Modal -->
  <div class="modal hidden" id="group-info-modal">
    <div class="modal-card group-info-card">
      <div class="modal-head">
        <h2 id="group-info-title">Group Info</h2>
        <button class="icon-btn modal-close" data-close="group-info-modal">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body" style="padding:18px 20px;max-height:70vh;overflow-y:auto;">

        <!-- Avatar + name editing -->
        <div class="group-info-head">
          <div class="group-info-avatar" id="group-info-avatar"></div>
          <div style="flex:1;min-width:0;">
            <label class="modal-label">Group Name</label>
            <div style="display:flex;gap:6px;">
              <input type="text" id="group-info-name-input" class="modal-input" maxlength="50" placeholder="Group name" />
              <button class="btn-primary" id="group-info-save-name-btn" style="padding:0 12px;">Save</button>
            </div>
          </div>
        </div>

        <!-- Group picture URL -->
        <label class="modal-label" style="margin-top:14px;">Group Picture URL <span class="label-optional">optional</span></label>
        <div style="display:flex;gap:6px;">
          <input type="text" id="group-info-photo-input" class="modal-input" placeholder="https://example.com/image.png" />
          <button class="btn-secondary" id="group-info-save-photo-btn" style="padding:0 12px;">Set</button>
        </div>

        <!-- Description -->
        <label class="modal-label" style="margin-top:14px;">Description / Rules <span class="label-optional">max 1000 chars</span></label>
        <textarea id="group-info-desc-input" class="modal-textarea" rows="3" maxlength="1000" placeholder="What's this group about? Any rules?"></textarea>
        <div style="text-align:right;margin-top:4px;">
          <button class="btn-secondary" id="group-info-save-desc-btn">Save Description</button>
        </div>

        <!-- Invite code -->
        <div class="group-info-section">
          <label class="modal-label">Invite Code</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <code id="group-info-code" class="join-code-display" style="flex:1;font-size:18px;text-align:center;cursor:pointer;" title="Click to copy">——————</code>
            <button class="icon-btn" id="group-info-regen-code" title="Regenerate code">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
          </div>
        </div>

        <!-- Members list -->
        <div class="group-info-section">
          <label class="modal-label">Members (<span id="group-info-member-count">0</span>)</label>
          <div id="group-info-members-list" class="group-info-members-list"></div>
        </div>

        <!-- Danger zone -->
        <div class="group-info-section group-info-danger">
          <button class="btn-secondary" id="group-info-leave-btn" style="color:var(--c-danger);width:100%;">
            <svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align:-2px;margin-right:4px;"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
            Leave Group
          </button>
        </div>
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
      <textarea class="profile-card-notes" id="profile-card-notes" placeholder="Add a private note about this person…" maxlength="1000"></textarea>
      <div class="profile-card-actions" id="profile-card-actions">
        <!-- buttons injected by showProfileCard() -->
        <button class="profile-card-more-btn" id="profile-card-more-btn" title="More options" style="display:none">⋯</button>
      </div>
    </div>
  </div>

  <!-- Full Profile Modal -->
  <div id="full-profile-modal" class="modal hidden">
    <div class="modal-card full-profile-modal" role="dialog" aria-label="Full Profile">
      <!-- Close button overlaps the banner -->
      <button class="profile-card-close" id="full-profile-close" aria-label="Close"
        style="position:absolute;top:10px;right:10px;z-index:10;">
        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
      <div class="full-profile-banner" id="fp-banner"></div>
      <div class="full-profile-body">
        <!-- Avatar + name row pulled up into banner -->
        <div class="full-profile-header">
          <div class="full-profile-avatar-wrap">
            <div class="full-profile-avatar" id="fp-avatar"></div>
            <span class="fp-status-dot" id="fp-status-dot" data-status="offline" style="display:none"></span>
          </div>
          <div class="full-profile-header-info">
            <div class="full-profile-name-tag">
              <span class="full-profile-name" id="fp-name"></span>
              <span class="full-profile-tag" id="fp-tag"></span>
            </div>
            <div class="full-profile-status-label" id="fp-status-label" style="display:none"></div>
            <div class="full-profile-custom-status" id="fp-custom-status" style="display:none"></div>
          </div>
        </div>
        <div class="full-profile-badges" id="fp-badges"></div>

        <!-- Two-column layout below header -->
        <div class="full-profile-cols">
          <!-- LEFT: bio + meta -->
          <div class="full-profile-left">
            <div class="full-profile-divider"></div>
            <div class="full-profile-section-label">About Me</div>
            <div class="full-profile-bio" id="fp-bio"></div>
            <!-- Fav game near top of about section -->
            <div class="fp-favgame" id="fp-favgame" style="display:none"></div>
            <div class="full-profile-divider" style="margin:10px 0 8px;"></div>
            <!-- Meta info in a compact 2-column grid -->
            <div class="fp-meta-grid">
              <div class="fp-meta-item" id="fp-since" style="display:none"></div>
              <div class="fp-meta-item fp-friends-since-row" id="fp-friends-since" style="display:none"></div>
              <div class="fp-meta-item" id="fp-birthday" style="display:none"></div>
              <div class="fp-meta-item" id="fp-last-active" style="display:none"></div>
            </div>
            <div id="fp-mutual-groups" style="display:none">
              <div class="full-profile-divider" style="margin:10px 0 8px;"></div>
              <div class="full-profile-section-label">Mutual Groups</div>
              <div id="fp-mutual-groups-list" class="fp-mutual-list"></div>
            </div>
          </div>
          <!-- RIGHT: private note -->
          <div class="full-profile-right" id="fp-notes-section" style="display:none">
            <div class="full-profile-section-label" style="margin-bottom:6px;">
              Note
              <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:10px;color:var(--t-muted);"> — only you see this</span>
            </div>
            <textarea class="full-profile-notes" id="fp-notes"
              placeholder="Add a private note…" maxlength="1000"></textarea>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="full-profile-actions" id="fp-actions"></div>
      </div>
    </div>
  </div>

  <!-- Update notification banner (bottom-right, server-pushed) -->
  <div id="update-banner" class="update-banner hidden" role="status" aria-live="polite">
    <div class="update-banner-top-bar"></div>
    <div class="update-banner-body">
      <div class="update-banner-icon" aria-hidden="true">
        <!-- Sparkle / stars icon -->
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
          <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"
                fill="rgba(251,191,36,.18)" stroke="#fbbf24" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="19" cy="4" r="1.2" fill="#fbbf24" opacity=".7"/>
          <circle cx="5"  cy="18" r="1"   fill="#fbbf24" opacity=".5"/>
          <circle cx="20" cy="17" r=".8"  fill="#a78bfa" opacity=".7"/>
        </svg>
      </div>
      <div class="update-banner-content">
        <div class="update-banner-title">✦ Update Available</div>
        <div class="update-banner-msg" id="update-banner-msg">Static Chat has been updated! Refresh for the latest version.</div>
        <div class="update-banner-btns">
          <button class="update-refresh-btn" id="update-banner-refresh">
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            Refresh Now
          </button>
          <button class="btn-ghost" id="update-banner-dismiss" style="font-size:12px;padding:4px 10px;height:28px;">Later</button>
        </div>
      </div>
      <button class="icon-btn" id="update-banner-x" title="Dismiss" style="flex-shrink:0;align-self:flex-start;color:var(--t-muted);margin-top:1px;">
        <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast hidden"></div>

  <!-- Quota exceeded overlay -->
  <div id="quota-overlay" class="quota-overlay hidden" role="alert" aria-live="assertive">
    <div class="quota-card">
      <div class="quota-icon">⚠️</div>
      <h2 class="quota-title">Daily Quota Reached</h2>
      <p class="quota-body">
        Static Chat has hit its daily Firestore read/write limit.<br>
        Things will be back to normal once the quota resets — usually within a few hours.
      </p>
      <a class="quota-discord-btn" href="https://discord.gg/DP2hM7RRhR" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="flex-shrink:0;">
          <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        Join the Discord for updates
      </a>
      <p class="quota-note">This page will automatically reload once access is restored.</p>
    </div>
  </div>

  <!-- Custom Confirm Dialog (dynamically injected by showConfirm(), placeholder here for CSS) -->
  `);
}
