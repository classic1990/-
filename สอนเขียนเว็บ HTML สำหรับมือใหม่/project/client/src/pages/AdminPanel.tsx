import React, { useEffect, useState, useCallback } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User, // Keep User type for useState
  // signInWithCustomToken, // Not needed for Google Sign-In only
  // signInAnonymously // Not needed for Google Sign-In only
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  LogOut,
  Edit2,
  Trash2,
  LogIn,
  Database,
  Youtube,
  Loader2,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Plus,
  ChevronRight,
  Film,
  ShieldCheck,
  Zap,
  LayoutGrid,
  ListVideo,
} from "lucide-react";

// --- Custom Firebase Config Import ---
import { firebaseConfig } from "../firebaseConfig"; // <-- Import firebaseConfig here

// --- Type Definitions ---
interface Episode {
  url: string;
  title?: string;
}

interface MovieFormData {
  title: string;
  desc: string;
  category: "vertical" | "series";
  poster: string;
  badge?: string;
  isVip: boolean;
  episodes: Episode[];
}

interface Movie extends MovieFormData {
  id: string; // Document ID จาก Firestore
}

// --- Configuration ---
const ADMIN_EMAIL = "duy.kan1234@gmail.com";
// ใช้ import.meta.env สำหรับ API Keys เพื่อความปลอดภัย
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- Firebase Initialization ---
// ใช้ firebaseConfig ที่ import มา
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
// ใช้ projectId จาก firebaseConfig
const appId = firebaseConfig.projectId || "movie-admin-app"; // <-- ดึง appId จาก firebaseConfig

// --- Components ---

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden ${className}`}
  >
    {children}
  </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  // <-- อัปเดต Type สำหรับ textarea
  label?: string;
  icon?: React.ElementType;
  as?: "input" | "textarea"; // <-- เพิ่ม prop สำหรับเลือก input/textarea
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon: Icon,
  as = "input",
  ...props
}) => {
  // <-- ใช้ as prop
  const Component = as === "textarea" ? "textarea" : "input";
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 ml-1">
          {Icon && <Icon size={14} />} {label}
        </label>
      )}
      <Component // <-- ใช้ Component
        {...props}
        className={`w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400 ${props.className || ""}`} // <-- เพิ่ม props.className
      />
    </div>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  variant?: "default" | "danger" | "primary" | "ghost";
  loading?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  variant = "default",
  loading = false,
  className = "",
  ...props
}) => {
  const variants = {
    default:
      "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    danger:
      "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20",
    ghost:
      "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || props.disabled} // Use props.disabled as well
      className={`p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Icon size={18} />
      )}
    </button>
  );
};

// --- Main AdminPanel Component ---
export default function AdminPanel() {
  // <-- เปลี่ยนชื่อคอมโพเนนต์จาก App เป็น AdminPanel
  const [user, setUser] = useState<User | null>(null); // <-- ระบุ Type User
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // <-- ระบุ Type boolean
  const [loading, setLoading] = useState<boolean>(true); // <-- ระบุ Type boolean
  const [movies, setMovies] = useState<Movie[]>([]); // <-- ระบุ Type Movie[]
  const [editingId, setEditingId] = useState<string | null>(null); // <-- ระบุ Type string | null
  const [youtubeUrl, setYoutubeUrl] = useState<string>(""); // <-- ระบุ Type string
  const [isFetchingYoutube, setIsFetchingYoutube] = useState<boolean>(false); // <-- ระบุ Type boolean
  const [isAILoading, setIsAILoading] = useState<boolean>(false); // <-- ระบุ Type boolean

  // ใช้ MovieFormData interface สำหรับ formData
  const [formData, setFormData] = useState<MovieFormData>({
    title: "",
    desc: "",
    category: "vertical",
    poster: "",
    badge: "",
    isVip: false,
    episodes: [],
  });

  // 1. Auth Logic (Simplified for Google Sign-In only)
  useEffect(() => {
    // ลบ initAuth ออกทั้งหมด เหลือแค่ onAuthStateChanged
    return onAuthStateChanged(auth, u => {
      setUser(u);
      // ตรวจสอบ isAdmin จากอีเมลเท่านั้น
      setIsAdmin(u?.email === ADMIN_EMAIL);
      setLoading(false);
    });
  }, []);

  // 2. Real-time Data
  useEffect(() => {
    if (!user || !isAdmin) {
      // ต้องเป็นแอดมินถึงจะโหลดข้อมูล
      setMovies([]); // เคลียร์หนังถ้าไม่ใช่แอดมิน
      return;
    }
    const q = collection(db, "artifacts", appId, "public", "data", "movies");
    return onSnapshot(
      q,
      snapshot => {
        setMovies(
          snapshot.docs.map(doc => ({
            ...(doc.data() as MovieFormData),
            id: doc.id,
          }))
        ); // Cast data
      },
      err => {
        console.error("Firestore Error:", err);
      }
    );
  }, [user, isAdmin]); // เพิ่ม isAdmin ใน dependency array

  // 3. AI & Youtube Logic
  const callGemini = async (prompt: string): Promise<string | null> => {
    // <-- ระบุ Type
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set.");
      return null;
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
      console.error("Gemini API error:", e);
      return null;
    }
  };

  const handleYoutubeImport = async (url: string) => {
    // <-- ระบุ Type
    if (!url || !YOUTUBE_API_KEY) {
      console.warn("YouTube URL or API Key is missing.");
      return;
    }
    setIsFetchingYoutube(true);
    try {
      const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      if (!videoId) {
        console.warn("Invalid YouTube URL.");
        return;
      }

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      const item = data.items?.[0]?.snippet;

      if (item) {
        setFormData(prev => ({
          ...prev,
          title: item.title || "",
          desc: item.description?.split("\n")[0] || item.description || "", // <-- แก้ Syntax Error ที่นี่
          poster:
            item.thumbnails?.maxres?.url || item.thumbnails?.high?.url || "",
          episodes:
            prev.episodes.length > 0
              ? prev.episodes
              : [{ url, title: item.title || "ตอนที่ 1" }],
        }));
      }
    } catch (e) {
      console.error("YouTube API error:", e);
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  const handleAISummary = async () => {
    if (!formData.title) return;
    setIsAILoading(true);
    const prompt = `เขียนเรื่องย่อสั้นๆ ให้น่าสนใจและดูเป็นมืออาชีพสำหรับหนังเรื่อง "${formData.title}" โดยอิงจากข้อมูลเดิม: ${formData.desc}. ขอเป็นภาษาไทยความยาว 2-3 บรรทัด`;
    const result = await callGemini(prompt);
    if (result) setFormData(p => ({ ...p, desc: result.trim() }));
    setIsAILoading(false);
  };

  const handleAITag = async () => {
    if (!formData.title) return;
    setIsAILoading(true);
    const prompt = `จากชื่อหนัง "${formData.title}" ช่วยคิดป้ายกำกับสั้นๆ 1-2 คำที่ดึงดูดใจ (เช่น แนะนำ, มาใหม่, ซึ้งกินใจ) เป็นภาษาไทย`;
    const result = await callGemini(prompt);
    if (result)
      setFormData(p => ({ ...p, badge: result.trim().replace(/[".]/g, "") }));
    setIsAILoading(false);
  };

  // 4. CRUD Operations
  const handleSubmit = async (e: React.FormEvent) => {
    // <-- ระบุ Type
    e.preventDefault();
    if (!formData.title || !formData.poster) return;
    if (!isAdmin) {
      // ต้องเป็นแอดมินถึงจะบันทึกได้
      console.warn("Only admins can submit data.");
      return;
    }

    const colRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "movies"
    );
    try {
      if (editingId) {
        await updateDoc(
          doc(db, "artifacts", appId, "public", "data", "movies", editingId),
          formData as any
        ); // Cast to any for updateDoc
      } else {
        await addDoc(colRef, formData);
      }
      // Reset formData ให้ตรงตาม MovieFormData
      setFormData({
        title: "",
        desc: "",
        category: "vertical",
        poster: "",
        badge: "",
        isVip: false,
        episodes: [],
      });
      setEditingId(null);
      setYoutubeUrl("");
    } catch (e) {
      console.error("Error submitting data:", e);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-zinc-500 font-medium">กำลังเตรียมระบบจัดการ...</p>
        </div>
      </div>
    );

  // ถ้า user ไม่ใช่แอดมิน (หรือไม่มี user) ให้แสดงหน้าล็อกอิน
  if (!user || !isAdmin)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">แผงควบคุมแอดมิน</h2>
            <p className="text-zinc-500 text-sm">
              กรุณาเข้าสู่ระบบด้วยบัญชี {ADMIN_EMAIL} เพื่อจัดการเนื้อหาหน้าเว็บ
            </p>
          </div>
          <button
            onClick={() => signInWithPopup(auth, provider)}
            className="w-full py-3 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogIn size={20} /> เข้าสู่ระบบด้วย Google
          </button>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Film size={18} />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">
              Movie Studio{" "}
              <span className="text-blue-600 text-xs ml-1 font-normal px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-full uppercase tracking-wider">
                Admin
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold">{user.displayName || "Admin"}</p>
              <p className="text-[10px] text-zinc-500">{user.email}</p>
            </div>
            <IconButton
              icon={LogOut}
              onClick={() => auth.signOut()}
              variant="ghost"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Side */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card className="p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                {editingId ? (
                  <Edit2 size={18} className="text-orange-500" />
                ) : (
                  <Plus size={18} className="text-blue-500" />
                )}
                {editingId ? "แก้ไขข้อมูลหนัง" : "เพิ่มหนังเข้าคลัง"}
              </h3>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      desc: "",
                      category: "vertical",
                      poster: "",
                      badge: "",
                      isVip: false,
                      episodes: [],
                    }); // Reset ด้วย Type ที่ถูกต้อง
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  ยกเลิกการแก้
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* YouTube Auto-Import */}
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 uppercase tracking-widest">
                    <Youtube size={14} /> ดึงข้อมูลอัตโนมัติ
                  </span>
                  {isFetchingYoutube && (
                    <Loader2 size={14} className="animate-spin text-red-600" />
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="วางลิงก์ YouTube ที่นี่..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border-none rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleYoutubeImport(youtubeUrl)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ดึงข้อมูล
                  </button>
                </div>
              </div>

              <InputField
                label="ชื่อภาพยนตร์"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="ระบุชื่อเรื่อง..."
                required
              />

              <div className="relative group">
                {/* ใช้ <textarea> แทน <input> สำหรับเรื่องย่อ */}
                <InputField
                  as="textarea" // <-- เพิ่ม prop as="textarea"
                  label="เรื่องย่อ"
                  value={formData.desc}
                  onChange={e =>
                    setFormData({ ...formData, desc: e.target.value })
                  }
                  placeholder="อธิบายเนื้อหาพอสังเขป..."
                  className="min-h-[100px]" // <-- เพิ่ม min-height
                />
                <button
                  type="button"
                  onClick={handleAISummary}
                  disabled={isAILoading || !formData.title} // Disable ถ้าไม่มีชื่อหนัง
                  className="absolute right-2 bottom-2 p-1.5 bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold"
                >
                  <Sparkles size={12} /> ให้ AI ช่วยแต่ง
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5 ml-1">
                    <LayoutGrid size={14} /> ประเภท
                  </label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        category: e.target.value as "vertical" | "series",
                      })
                    } // Cast type
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none"
                  >
                    <option value="vertical">หนังตอนเดียว (แนวตั้ง)</option>
                    <option value="series">ซีรีส์หลายตอน</option>
                  </select>
                </div>
                <div className="relative">
                  <InputField
                    label="ป้ายกำกับ"
                    value={formData.badge}
                    onChange={e =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    placeholder="เช่น มาใหม่"
                  />
                  <button
                    type="button"
                    onClick={handleAITag}
                    disabled={isAILoading || !formData.title}
                    className="absolute right-2 bottom-2.5 text-blue-500 hover:scale-110 transition-transform"
                  >
                    <Wand2 size={16} />
                  </button>
                </div>
              </div>

              <InputField
                label="URL รูปโปสเตอร์"
                value={formData.poster}
                onChange={e =>
                  setFormData({ ...formData, poster: e.target.value })
                }
                placeholder="https://..."
                required
              />

              <div
                className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={() =>
                  setFormData({ ...formData, isVip: !formData.isVip })
                }
              >
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${formData.isVip ? "bg-orange-500" : "bg-zinc-300"}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isVip ? "left-6" : "left-1"}`}
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">
                  เนื้อหาเฉพาะ VIP
                </span>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <ListVideo size={14} /> จัดการตอน (
                    {formData.episodes.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        episodes: [
                          ...formData.episodes,
                          {
                            url: "",
                            title: `ตอนที่ ${formData.episodes.length + 1}`,
                          },
                        ],
                      })
                    }
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> เพิ่มตอนใหม่
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.episodes.map((ep, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={ep.url}
                        onChange={e => {
                          const newList = [...formData.episodes];
                          newList[idx] = {
                            ...newList[idx],
                            url: e.target.value,
                          }; // Update immutably
                          setFormData({ ...formData, episodes: newList });
                        }}
                        className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[10px] outline-none"
                        placeholder="Link วิดีโอ..."
                      />
                      <IconButton
                        icon={Trash2}
                        variant="danger"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            episodes: formData.episodes.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="h-8 w-8 !p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {editingId ? "อัปเดตข้อมูลภาพยนตร์" : "บันทึกข้อมูลเข้าสู่ระบบ"}
              </button>
            </form>
          </Card>
        </div>

        {/* List Side */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              ภาพยนตร์ในระบบ
              <span className="text-xs font-normal bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {movies.length} เรื่อง
              </span>
            </h2>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Zap size={12} /> เชื่อมต่อ Cloud สำเร็จ
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {movies.map(movie => (
              <Card
                key={movie.id}
                className="group hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {movie.isVip && (
                      <span className="bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded font-black shadow-lg shadow-orange-500/30">
                        VIP
                      </span>
                    )}
                    {movie.badge && (
                      <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-bold shadow-lg shadow-blue-500/30">
                        {movie.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="flex w-full gap-2">
                      <button
                        onClick={() => {
                          setEditingId(movie.id);
                          // สร้าง copy ของ movie object ก่อนส่งให้ setFormData
                          setFormData({
                            ...movie,
                            episodes: [...movie.episodes],
                          }); // แก้ไขตรงนี้
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex-1 py-2 bg-white text-zinc-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-zinc-100 transition-colors"
                      >
                        <Edit2 size={14} /> แก้ไข
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("ยืนยันการลบหนังเรื่องนี้?")) {
                            await deleteDoc(
                              doc(
                                db,
                                "artifacts",
                                appId,
                                "public",
                                "data",
                                "movies",
                                movie.id
                              )
                            );
                          }
                        }}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h4 className="font-bold text-sm truncate leading-tight">
                    {movie.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 min-h-[30px]">
                    {movie.desc || "ไม่มีรายละเอียด"}
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded capitalize">
                      {movie.category === "vertical" ? "แนวตั้ง" : "ซีรีส์"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {movie.episodes?.length || 0} ตอน
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            {movies.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                  <Film size={32} />
                </div>
                <p className="text-zinc-500 font-medium">
                  ไม่พบข้อมูลหนังในระบบ เริ่มต้นเพิ่มหนังใหม่ได้เลย
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
      `}</style>
    </div>
  );
}
