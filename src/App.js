import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithPopup, signOut,
  GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

const COLORS = {
  bg: "#0A0A0F", card: "#13131A", border: "#2A2A3A",
  accent: "#F5A623", text: "#F0EEE8", textMuted: "#8A8A9A",
  green: "#4ADE80", purple: "#A78BFA", red: "#F87171", blue: "#60A5FA",
};

const USER_COLORS = ["#A78BFA", "#4ADE80", "#F5A623", "#60A5FA", "#F87171", "#34D399"];

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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="white">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 268.5-317.5 99.8 0 160.6 66.1 215 66.1 52.8 0 121.4-70.1 232.6-70.1zm-86.4-194.5c43.3-51.3 74.1-122.3 74.1-193.3 0-9.9-.6-19.8-2.5-28.1-70.5 2.5-154.6 47.2-205.9 105.7-38.5 43.9-75.9 114.9-75.9 187 0 10.5 1.9 21.1 2.5 24.4 4.5.6 11.8 1.9 19.1 1.9 63.5 0 144.4-42.8 188.6-97.6z"/>
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

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
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

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      onAuth(result.user);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new OAuthProvider("apple.com"));
      onAuth(result.user);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  const handleEmail = async () => {
    setLoading(true);
    setError("");
    try {
      let result;
      if (mode === "login") {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuth(result.user);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    }
    setLoading(false);
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

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <button onClick={handleGoogle} disabled={loading} style={{
              padding: "13px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.text, cursor: "pointer",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <GoogleIcon /> Continue with Google
            </button>
            <button onClick={handleApple} disabled={loading} style={{
              padding: "13px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.text, cursor: "pointer",
              fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <AppleIcon /> Continue with Apple
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            <span style={{ color: COLORS.textMuted, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
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
            <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ color: COLORS.accent, cursor: "pointer" }}>
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
  const [form, setForm] = useState({
    name: firebaseUser.displayName || "", role: "", location: "",
    bio: "", skills: "", lookingFor: [], achievements: "",
  });

  const lookingForOptions = ["Investor", "Co-founder", "Mentor", "Collaboration", "Freelance Work", "Startup to join"];
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleLF = (v) => setForm(f => ({
    ...f, lookingFor: f.lookingFor.includes(v) ? f.lookingFor.filter(x => x !== v) : [...f.lookingFor, v]
  }));

  const saveProfile = async () => {
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
      avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      color,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", firebaseUser.uid), profile);
    onComplete(profile);
  };

  const steps = [
    {
      title: "Who are you?",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Full Name" value={form.name} onChange={v => update("name", v)} placeholder="e.g. Thapelo Mokoena" />
          <Input label="What do you do?" value={form.role} onChange={v => update("role", v)} placeholder="e.g. Entrepreneur, Developer, Designer" />
          <Input label="Location" value={form.location} onChange={v => update("location", v)} placeholder="e.g. Cape Town, SA" />
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
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: "12px 24px", borderRadius: 12, border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 14,
              }}>Back</button>
            )}
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : saveProfile()}
              disabled={!current.valid}
              style={{
                flex: 1, padding: "12px 24px", borderRadius: 12, border: "none",
                background: current.valid ? COLORS.accent : COLORS.border,
                color: current.valid ? "#000" : COLORS.textMuted,
                cursor: current.valid ? "pointer" : "not-allowed",
                fontSize: 14, fontWeight: 700,
              }}
            >
              {step < steps.length - 1 ? "Continue →" : "Create Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, firebaseUser }) {
  const [tab, setTab] = useState("discover");
  const [allUsers, setAllUsers] = useState([]);
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

  const unmatched = allUsers.filter(u => !matches.find(m => m.uid === u.uid));

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
  const [idx, setIdx] = useState(0);
  const current = users[idx];

  const act = (action) => {
    if (action === "connect") onConnect(current);
    setIdx(i => i + 1);
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
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>{users.length - idx} people to explore</p>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ height: 4, background: current.color }} />
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
            <Avatar initials={current.avatar} color={current.color} size={60} online />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{current.name}</div>
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
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{user.name}</div>
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
      setFirebaseUser(user);
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

  if (!firebaseUser) return <AuthScreen onAuth={setFirebaseUser} />;
  if (!profile) return <Onboarding firebaseUser={firebaseUser} onComplete={setProfile} />;
  return <MainApp user={profile} firebaseUser={firebaseUser} />;
}