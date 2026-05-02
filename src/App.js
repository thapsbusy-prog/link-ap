import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  GoogleAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

const COLORS = {
  bg: "#0A0A0F", card: "#13131A", border: "#2A2A3A",
  accent: "#F5A623", text: "#F0EEE8", textMuted: "#8A8A9A",
  green: "#4ADE80", purple: "#A78BFA", red: "#F87171", blue: "#60A5FA",
};

const USER_COLORS = ["#A78BFA", "#4ADE80", "#F5A623", "#60A5FA", "#F87171", "#34D399"];

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/>
      <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
    </svg>
  );
}


function Avatar({ initials, color, size = 40, online = false }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `${color}22`, border: `2px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700, color,
      }}>{initials}</div>
      {online && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: "50%", background: COLORS.green,
          border: `2px solid ${COLORS.bg}`,
        }} />
      )}
    </div>
  );
}

function Tag({ label, color = COLORS.accent }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}35`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500,
    }}>{label}</span>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", autoComplete }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete || "off"} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12,
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        color: COLORS.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: COLORS.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.text }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>Connect with the right people</p>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: COLORS.text }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>

          <div style={{ marginBottom: 24 }}>
            <button onClick={handleGoogle} disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.text, cursor: "pointer",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <GoogleIcon /> Continue with Google
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ color: COLORS.textMuted, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" autoComplete="new-password" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" autoComplete="new-password" />
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button onClick={handleEmail} disabled={loading || !email || !password} style={{
            width: "100%", marginTop: 20, padding: "13px", borderRadius: 12, border: "none",
            background: email && password ? COLORS.accent : COLORS.border,
            color: email && password ? "#000" : COLORS.textMuted,
            cursor: email && password ? "pointer" : "not-allowed",
            fontSize: 14, fontWeight: 700,
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: COLORS.textMuted }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setEmail(""); setPassword(""); }} style={{ color: COLORS.accent, cursor: "pointer" }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Onboarding({ firebaseUser, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: firebaseUser.displayName || "", role: "", location: "",
    bio: "", skills: "", lookingFor: [], achievements: "", linkedin: "",
  });

  const lookingForOptions = ["Investor", "Co-founder", "Mentor", "Collaboration", "Freelance Work", "Startup to join", "A Job"];
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLF = (v) => setForm(f => ({
    ...f, lookingFor: f.lookingFor.includes(v) ? f.lookingFor.filter(x => x !== v) : [...f.lookingFor, v]
  }));

  const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      const profile = {
        uid: firebaseUser.uid,
        name: form.name,
        role: form.role,
        location: form.location,
        bio: form.bio,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        lookingFor: form.lookingFor,
        achievements: form.achievements.split(",").map(s => s.trim()).filter(Boolean),
        linkedin: normalizeUrl(form.linkedin),
        avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?",
        color,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", firebaseUser.uid), profile);
      onComplete(profile);
    } catch (e) {
      setSaveError("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  const steps = [
    {
      title: "Who are you?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Full Name" value={form.name} onChange={v => update("name", v)} placeholder="e.g. Thapelo Mokoena" />
          <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer, Designer" />
          <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
          <Input label="LinkedIn Profile URL (optional)" value={form.linkedin} onChange={v => update("linkedin", v)} placeholder="https://linkedin.com/in/yourname" />
        </div>
      ),
      valid: form.name && form.role && form.location,
    },
    {
      title: "Your story",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TextArea label="Bio — tell people what you're about" value={form.bio} onChange={v => update("bio", v)} placeholder="What are you building or working towards?" />
          <Input label="Your key skills (comma separated)" value={form.skills} onChange={v => update("skills", v)} placeholder="e.g. Marketing, Sales, React" />
          <Input label="Notable achievements (comma separated)" value={form.achievements} onChange={v => update("achievements", v)} placeholder="e.g. Built 2 websites, 5 years in finance" />
        </div>
      ),
      valid: form.bio && form.skills,
    },
    {
      title: "What are you looking for?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Select all that apply</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {lookingForOptions.map(opt => (
              <button key={opt} onClick={() => toggleLF(opt)} style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                border: `1px solid ${form.lookingFor.includes(opt) ? COLORS.accent : COLORS.border}`,
                background: form.lookingFor.includes(opt) ? `${COLORS.accent}22` : "transparent",
                color: form.lookingFor.includes(opt) ? COLORS.accent : COLORS.textMuted,
              }}>{opt}</button>
            ))}
          </div>
        </div>
      ),
      valid: form.lookingFor.length > 0,
    },
  ];

  const current = steps[step];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: COLORS.bg }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>
            Link<span style={{ color: COLORS.accent }}>-Ap</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>Let's set up your profile</p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? COLORS.accent : COLORS.border }} />
          ))}
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: COLORS.text }}>{current.title}</h2>
          {current.content}
          {saveError && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: `${COLORS.red}18`, color: COLORS.red, fontSize: 13 }}>
              {saveError}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} disabled={saving} style={{
                padding: "12px 24px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
              }}>Back</button>
            )}
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : saveProfile()}
              disabled={!current.valid || saving}
              style={{
                flex: 1, padding: "12px 24px", borderRadius: 12, border: "none",
                background: current.valid && !saving ? COLORS.accent : COLORS.border,
                color: current.valid && !saving ? "#000" : COLORS.textMuted,
                cursor: current.valid && !saving ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700,
              }}
            >
              {saving ? "Saving..." : step < steps.length - 1 ? "Continue →" : "Create Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, firebaseUser }) {
  const [tab, setTab] = useState("discover");
  const [allUsers, setAllUsers] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setAllUsers(snap.docs.map(d => d.data()).filter(u => u.uid !== firebaseUser.uid));
    });
    return unsub;
  }, [firebaseUser.uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", firebaseUser.uid, "matches"), snap => {
      setMatches(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [firebaseUser.uid]);

  const handleConnect = async (targetUser) => {
    await setDoc(doc(db, "users", firebaseUser.uid, "matches", targetUser.uid), targetUser);
    showNotif(`You connected with ${targetUser.name}! 🎉`);
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const unmatched = allUsers === null ? null : allUsers.filter(u => !matches.find(m => m.uid === u.uid));

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: COLORS.accent, color: "#000", padding: "10px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
        }}>{notification}</div>
      )}

      <div style={{
        padding: "20px 20px 12px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${COLORS.border}`,
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>
          Link<span style={{ color: COLORS.accent }}>-Ap</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={user.avatar} color={user.color} size={36} online />
          <button onClick={() => signOut(auth)} style={{
            background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12,
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ paddingBottom: 90 }}>
        {tab === "discover" && <Discover users={unmatched} onConnect={handleConnect} />}
        {tab === "matches" && <Matches matches={matches} onChat={(uid) => { setActiveChat(uid); setTab("messages"); }} />}
        {tab === "messages" && <Messages matches={matches} firebaseUser={firebaseUser} activeChat={activeChat} setActiveChat={setActiveChat} />}
        {tab === "profile" && <Profile user={user} />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: COLORS.card, borderTop: `1px solid ${COLORS.border}`,
        display: "flex", padding: "10px 0 20px",
      }}>
        {[
          { id: "discover", icon: "⚡", label: "Discover" },
          { id: "matches", icon: "🤝", label: "Matches", badge: matches.length },
          { id: "messages", icon: "💬", label: "Messages" },
          { id: "profile", icon: "👤", label: "Profile" },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
          }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <span style={{ fontSize: 10, color: tab === item.id ? COLORS.accent : COLORS.textMuted, fontWeight: 500 }}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <div style={{
                position: "absolute", top: 0, right: "calc(50% - 18px)",
                background: COLORS.accent, color: "#000", borderRadius: 10,
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{item.badge}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Discover({ users, onConnect }) {
  const [seenUids, setSeenUids] = useState(new Set());

  if (users === null) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
      <p>Finding people...</p>
    </div>
  );

  const remaining = users.filter(u => !seenUids.has(u.uid));
  const current = remaining[0];

  const act = (action) => {
    if (action === "connect") onConnect(current);
    setSeenUids(prev => new Set([...prev, current.uid]));
  };

  if (!current) return (
    <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: COLORS.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: COLORS.text }}>You've seen everyone!</h3>
      <p>Check your matches and start conversations</p>
    </div>
  );

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Discover People</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{remaining.length} people to explore</p>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: current.color }} />
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
            <Avatar initials={current.avatar} color={current.color} size={60} online />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{current.name}</div>
                {current.linkedin && (
                  <a href={current.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                    <LinkedInIcon />
                  </a>
                )}
              </div>
              <div style={{ color: current.color, fontSize: 13, marginBottom: 4 }}>{current.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {current.location}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.text, marginBottom: 20 }}>{current.bio}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.skills?.map(s => <Tag key={s} label={s} color={current.color} />)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>LOOKING FOR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {current.lookingFor?.map(s => <Tag key={s} label={s} color={COLORS.accent} />)}
            </div>
          </div>
          {current.achievements?.length > 0 && (
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {current.achievements.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.text, marginBottom: 4 }}>✦ {a}</div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, padding: "0 24px 24px" }}>
          <button onClick={() => act("pass")} style={{
            flex: 1, padding: 14, borderRadius: 14, border: `1px solid ${COLORS.border}`,
            background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
          }}>Pass</button>
          <button onClick={() => act("connect")} style={{
            flex: 2, padding: 14, borderRadius: 14, border: "none",
            background: COLORS.accent, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>Connect ⚡</button>
        </div>
      </div>
    </div>
  );
}

function Matches({ matches, onChat }) {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Your Matches</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{matches.length} connections made</p>
      </div>
      {matches.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>Go discover people and connect!</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matches.map(u => (
          <div key={u.uid} onClick={() => onChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <Avatar initials={u.avatar} color={u.color} size={48} online />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
              <div style={{ color: u.color, fontSize: 12, marginBottom: 6 }}>{u.role}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {u.lookingFor?.slice(0, 2).map(l => <Tag key={l} label={l} color={COLORS.accent} />)}
              </div>
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 20 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Messages({ matches, firebaseUser, activeChat, setActiveChat }) {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const bottomRef = useRef(null);

  const chatUser = matches.find(u => u.uid === activeChat);
  const chatId = activeChat ? [firebaseUser.uid, activeChat].sort().join("_") : null;

  useEffect(() => {
    setChatMessages([]);
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const send = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: input.trim(),
      from: firebaseUser.uid,
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  if (activeChat && !chatUser) return null;

  if (!activeChat) return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>Messages</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Your conversations</p>
      </div>
      {matches.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p>Match with people to start chatting</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {matches.map(u => (
          <div key={u.uid} onClick={() => setActiveChat(u.uid)} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          }}>
            <Avatar initials={u.avatar} color={u.color} size={48} online />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{u.name}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Tap to chat 💬</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 12, alignItems: "center", background: COLORS.card }}>
        <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 18 }}>←</button>
        <Avatar initials={chatUser?.avatar} color={chatUser?.color} size={40} online />
        <div>
          <div style={{ fontWeight: 700, color: COLORS.text }}>{chatUser?.name}</div>
          <div style={{ color: COLORS.green, fontSize: 12 }}>● Online</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, marginTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <p style={{ fontSize: 13 }}>Say hello to {chatUser?.name}!</p>
          </div>
        )}
        {chatMessages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === firebaseUser.uid ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%",
              background: msg.from === firebaseUser.uid ? COLORS.accent : COLORS.card,
              color: msg.from === firebaseUser.uid ? "#000" : COLORS.text,
              border: msg.from === firebaseUser.uid ? "none" : `1px solid ${COLORS.border}`,
              borderRadius: msg.from === firebaseUser.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, background: COLORS.card }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 24,
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            color: COLORS.text, fontSize: 14, outline: "none",
          }}
        />
        <button onClick={send} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          background: input.trim() ? COLORS.accent : COLORS.border,
          color: input.trim() ? "#000" : COLORS.textMuted,
          cursor: input.trim() ? "pointer" : "default",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>→</button>
      </div>
    </div>
  );
}

function Profile({ user }) {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>My Profile</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>How others see you</p>
      </div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: user.color }} />
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <Avatar initials={user.avatar} color={user.color} size={64} online />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{user.name}</div>
                {user.linkedin && (
                  <a href={user.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center" }}>
                    <LinkedInIcon />
                  </a>
                )}
              </div>
              <div style={{ color: user.color, fontSize: 14, marginBottom: 4 }}>{user.role}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>📍 {user.location}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, color: COLORS.text }}>{user.bio}</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>SKILLS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.skills?.map(s => <Tag key={s} label={s} color={user.color} />)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>LOOKING FOR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.lookingFor?.map(s => <Tag key={s} label={s} color={COLORS.purple} />)}
            </div>
          </div>
          {user.achievements?.length > 0 && (
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>ACHIEVEMENTS</div>
              {user.achievements.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.text, marginBottom: 4 }}>✦ {a}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setProfile(null);
      setFirebaseUser(user ?? null);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>Link<span style={{ color: COLORS.text }}>-Ap</span></div>
    </div>
  );

  if (!firebaseUser) return <AuthScreen />;
  if (!profile || profile.uid !== firebaseUser.uid) return <Onboarding firebaseUser={firebaseUser} onComplete={setProfile} />;
  return <MainApp user={profile} firebaseUser={firebaseUser} />;
}