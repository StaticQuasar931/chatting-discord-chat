/* =====================================================================
   Static Chat — firebase.js
   Single source of truth for Firebase app, auth, db, and provider.
   Import from this file everywhere instead of re-initialising.
   ===================================================================== */

import { initializeApp }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider }
                               from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyC_LRlGIPn6pXEeoh89mocrXe7aiyAlvE8",
  authDomain:        "claude-static-chat.firebaseapp.com",
  projectId:         "claude-static-chat",
  storageBucket:     "claude-static-chat.firebasestorage.app",
  messagingSenderId: "217707625831",
  appId:             "1:217707625831:web:25d5bbbc72e7965a9f83c2"
};

export const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();
