import { useEffect, useState, useCallback } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Search,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { firebaseConfig } from "../firebaseConfig";

// --- การตั้งค่า ---
const ADMIN_EMAIL = "duy.kan1234@gmail.com";
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- ตั้งค่า Firebase ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- ประเภทข้อมูล ---
export interface Movie {
  title: string;
  desc: string;
  category: "vertical" | "series";
  poster: string;
  badge?: string;
  isVip: boolean;
  episodes: { url: string; title?: string }[];
}

// --- ฟังก์ชันช่วยเหลือ AI Gemini ---
const callGemini = async (prompt: string, systemPrompt: string = "") => {
  if (!GEMINI_API_KEY) {
    toast.error("ยังไม่ได้ตั้งค่า Gemini API Key");
    return;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );
    if (!response.ok) {
      toast.error("เกิดข้อผิดพลาดจาก Gemini API");
      return;
    }
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    toast.error("ไม่สามารถเชื่อมต่อ AI ได้");
    return null;
  }
};

const generateAIImage = async (prompt: string) => {
  // ตัวอย่างการสร้างรูปภาพ (Placeholder)
  return `https://dummyimage.com/600x900/1a1a1a/ffffff&text=${encodeURIComponent(prompt)}`;
};

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<(Movie & { id: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [formData, setFormData] = useState<Movie>({
    title: "",
    desc: "",
    category: "vertical",
    poster: "",
    badge: "",
    isVip: false,
    episodes: [],
  });

  // 1. ตรวจสอบสิทธิ์
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. ดึงข้อมูล
  useEffect(() => {
    if (!isAdmin) {
      setMovies([]);
      return;
    }
    const q = query(collection(db, "movies"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const moviesList = snapshot.docs.map(doc => ({
          ...(doc.data() as Movie),
          id: doc.id,
        }));
        setMovies(moviesList);
      },
      error => {
        console.error("Firestore read error:", error);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      toast.success("เข้าสู่ระบบสำเร็จ");
    } catch (error) {
      toast.error("เข้าสู่ระบบล้มเหลว");
    }
  };

  const resetForm = () => {
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
  };

  const handleAddEpisode = () => {
    setFormData({
      ...formData,
      episodes: [...formData.episodes, { url: "", title: "" }],
    });
  };

  const handleRemoveEpisode = (index: number) => {
    setFormData({
      ...formData,
      episodes: formData.episodes.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formData.title || !formData.poster) {
      toast.error("กรุณากรอกชื่อเรื่องและ URL โปสเตอร์");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "movies", editingId), { ...formData });
        toast.success("อัปเดตข้อมูลสำเร็จ");
      } else {
        await addDoc(collection(db, "movies"), formData);
        toast.success("เพิ่มข้อมูลสำเร็จ");
      }
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("บันทึกข้อมูลล้มเหลว");
    }
  };

  const handleEdit = (movie: Movie & { id: string }) => {
    setFormData(movie);
    setEditingId(movie.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || !confirm("ต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    try {
      await deleteDoc(doc(db, "movies", id));
      toast.success("ลบข้อมูลสำเร็จ");
    } catch (error) {
      toast.error("ลบข้อมูลล้มเหลว");
    }
  };

  // --- ฟังก์ชัน AI ---
  const handleAISummarize = async (content: string) => {
    if (!content) return;
    setIsAILoading(true);
    try {
      const prompt = `สรุปเนื้อหาหนังเรื่องนี้ให้กระชับ น่าสนใจ และน่าติดตาม โดยใช้ภาษาไทยที่สละสลวย: ${content}`;
      const summary = await callGemini(
        prompt,
        "คุณเป็นนักเขียนคำโปรยหนังมืออาชีพที่เชี่ยวชาญการสรุปเนื้อหาให้น่าสนใจ"
      );
      if (summary) setFormData(prev => ({ ...prev, desc: summary.trim() }));
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAIGenerateBadge = async () => {
    if (!formData.title) return;
    setIsAILoading(true);
    try {
      const prompt = `แนะนำคำสั้นๆ 1-2 คำ (เช่น แนวหนัง หรือจุดเด่น) สำหรับหนังชื่อ: "${formData.title}"`;
      const badge = await callGemini(
        prompt,
        "ตอบเพียงคำที่แนะนำเท่านั้นเป็นภาษาไทย ไม่ต้องมีเครื่องหมายคำพูด"
      );
      if (badge)
        setFormData(prev => ({
          ...prev,
          badge: badge.trim().replace(/[\."]/g, ""),
        }));
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAIGeneratePoster = async () => {
    if (!formData.title) return;
    setIsImageLoading(true);
    try {
      const imageUrl = await generateAIImage(formData.title);
      if (imageUrl) setFormData(prev => ({ ...prev, poster: imageUrl }));
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleAIImport = useCallback(async (targetUrl: string) => {
    if (!targetUrl || !YOUTUBE_API_KEY) {
      if (!YOUTUBE_API_KEY) toast.error("ไม่ได้ตั้งค่า YouTube API Key");
      return;
    }
    setIsFetchingYoutube(true);
    try {
      const videoId = targetUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/)?.[1];
      if (videoId) {
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
        );
        const vData = await vRes.json();
        const snippet = vData.items?.[0]?.snippet;
        if (snippet) {
          const rawTitle = snippet.title;
          const rawDesc = snippet.description;

          setFormData(prev => ({
            ...prev,
            title: rawTitle,
            poster:
              snippet.thumbnails?.maxres?.url ||
              snippet.thumbnails?.high?.url ||
              "",
            episodes:
              prev.episodes.length > 0
                ? prev.episodes
                : [{ url: targetUrl, title: rawTitle }],
          }));

          // เรียกใช้ AI สรุปเนื้อหาอัตโนมัติจากคำอธิบาย YouTube
          await handleAISummarize(rawDesc);

          toast.success("ดึงข้อมูลและสรุปเนื้อหาด้วย AI สำเร็จ");
        }
      }
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลจาก YouTube ได้");
    } finally {
      setIsFetchingYoutube(false);
    }
  }, []);

  const filteredMovies = movies.filter(
    m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-lg font-medium animate-pulse">
          กำลังเตรียมข้อมูล...
        </p>
      </div>
    );

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <Database className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              แผงควบคุมแอดมิน
            </CardTitle>
            <CardDescription className="text-slate-400">
              กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-blue-600 py-6 text-lg hover:bg-blue-700"
              onClick={handleSignIn}
            >
              <LogIn className="mr-2 h-5 w-5" /> เข้าสู่ระบบด้วย Google
            </Button>
            {user && !isAdmin && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>อีเมล {user.email} ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* ส่วนหัว */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">
                ระบบจัดการเนื้อหา
              </h1>
              <p className="text-xs text-slate-500">Admin Dashboard v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium">
                {user?.displayName || "แอดมิน"}
              </span>
              <span className="text-[10px] text-slate-500">{user?.email}</span>
            </div>
            <Button
              onClick={() => auth.signOut()}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-transparent hover:bg-slate-900 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ส่วนฟอร์ม (ซ้าย) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card className="sticky top-24 border-slate-800 bg-slate-900 text-white shadow-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {editingId ? "แก้ไขข้อมูล" : "เพิ่มเนื้อหาใหม่"}
                  </CardTitle>
                  {editingId && (
                    <Badge
                      variant="outline"
                      className="border-blue-500/50 text-blue-400"
                    >
                      โหมดแก้ไข
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-slate-400">
                  กรอกข้อมูลหรือวางลิงก์ YouTube เพื่อดึงข้อมูลอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    {/* YouTube Import */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 transition-all focus-within:border-blue-500/40">
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
                        <Youtube className="h-4 w-4" /> ดึงข้อมูลอัตโนมัติจาก
                        YouTube
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={youtubeUrl}
                          onChange={e => setYoutubeUrl(e.target.value)}
                          placeholder="วางลิงก์ YouTube ที่นี่..."
                          className="border-slate-700 bg-slate-800 text-sm focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          size="icon"
                          className="shrink-0 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAIImport(youtubeUrl)}
                          disabled={isFetchingYoutube || !youtubeUrl}
                        >
                          {isFetchingYoutube ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {isFetchingYoutube && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>กำลังดึงข้อมูลและสรุปด้วย AI...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">
                        ชื่อเรื่อง
                      </label>
                      <Input
                        value={formData.title}
                        onChange={e =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="ระบุชื่อหนังหรือซีรีส์"
                        className="border-slate-700 bg-slate-800"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-400">
                          เรื่องย่อ (AI สรุปให้ตอนดึงลิงก์)
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAISummarize(formData.desc)}
                          className="h-7 text-[10px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                          disabled={isAILoading || !formData.desc}
                        >
                          {isAILoading ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1 h-3 w-3" />
                          )}
                          ปรับปรุงด้วย AI
                        </Button>
                      </div>
                      <Textarea
                        value={formData.desc}
                        onChange={e =>
                          setFormData({ ...formData, desc: e.target.value })
                        }
                        placeholder="รายละเอียดเนื้อหา..."
                        className="min-h-[120px] border-slate-700 bg-slate-800 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">
                          หมวดหมู่
                        </label>
                        <Select
                          value={formData.category}
                          onValueChange={(v: any) =>
                            setFormData({ ...formData, category: v })
                          }
                        >
                          <SelectTrigger className="border-slate-700 bg-slate-800">
                            <SelectValue placeholder="เลือกหมวดหมู่" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-800 bg-slate-900 text-white">
                            <SelectItem value="vertical">
                              หนังตอนเดียว
                            </SelectItem>
                            <SelectItem value="series">ซีรีส์</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-400">
                            ป้ายกำกับ
                          </label>
                          <button
                            type="button"
                            onClick={handleAIGenerateBadge}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <Wand2 className="h-3 w-3" />
                          </button>
                        </div>
                        <Input
                          value={formData.badge}
                          onChange={e =>
                            setFormData({ ...formData, badge: e.target.value })
                          }
                          placeholder="เช่น ใหม่, แนะนำ"
                          className="border-slate-700 bg-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">
                        รูปโปสเตอร์ (URL)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.poster}
                          onChange={e =>
                            setFormData({ ...formData, poster: e.target.value })
                          }
                          placeholder="https://..."
                          className="border-slate-700 bg-slate-800 text-sm"
                          required
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="shrink-0 border-slate-700 bg-slate-800 hover:bg-slate-700"
                          onClick={handleAIGeneratePoster}
                          disabled={isImageLoading || !formData.title}
                        >
                          {isImageLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 p-3">
                      <Checkbox
                        checked={formData.isVip}
                        onCheckedChange={(v: any) =>
                          setFormData({ ...formData, isVip: v })
                        }
                        id="vip"
                        className="border-slate-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                      />
                      <label
                        htmlFor="vip"
                        className="cursor-pointer text-sm font-medium text-slate-300"
                      >
                        เนื้อหาสำหรับสมาชิก VIP เท่านั้น
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <ListIcon className="h-4 w-4 text-blue-500" />
                        รายการตอน ({formData.episodes.length})
                      </span>
                      <Button
                        type="button"
                        onClick={handleAddEpisode}
                        size="sm"
                        variant="outline"
                        className="h-8 border-slate-700 bg-slate-800 text-xs hover:bg-slate-700"
                      >
                        <Plus className="mr-1 h-3 w-3" /> เพิ่มตอน
                      </Button>
                    </div>
                    <div className="max-h-[200px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                      {formData.episodes.map((ep, i) => (
                        <div
                          key={i}
                          className="group flex gap-2 items-center rounded-lg border border-slate-800 bg-slate-950 p-2 transition-all hover:border-slate-700"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                            {i + 1}
                          </div>
                          <Input
                            value={ep.url}
                            onChange={e => {
                              const n = [...formData.episodes];
                              n[i].url = e.target.value;
                              setFormData({ ...formData, episodes: n });
                            }}
                            className="h-8 border-none bg-transparent text-xs focus-visible:ring-0"
                            placeholder="วาง URL วิดีโอที่นี่"
                          />
                          <Button
                            type="button"
                            onClick={() => handleRemoveEpisode(i)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {formData.episodes.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-500 italic">
                          ยังไม่มีข้อมูลตอน
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 py-6 text-lg font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      {editingId ? (
                        <>
                          <Edit2 className="mr-2 h-5 w-5" /> อัปเดตข้อมูล
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />{" "}
                          บันทึกข้อมูลลงระบบ
                        </>
                      )}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-slate-400 hover:text-white"
                        onClick={resetForm}
                      >
                        ยกเลิกการแก้ไข
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ส่วนรายการ (ขวา) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  คลังเนื้อหาทั้งหมด
                </h3>
                <p className="text-sm text-slate-500">
                  มีทั้งหมด {movies.length} รายการในระบบ
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="ค้นหาชื่อเรื่อง..."
                  className="pl-10 border-slate-800 bg-slate-900 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2">
              {filteredMovies.map(movie => (
                <div
                  key={movie.id}
                  className="group relative flex gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-3 transition-all hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800 shadow-lg">
                    <img
                      src={movie.poster}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={movie.title}
                    />
                    {movie.isVip && (
                      <div className="absolute left-0 top-0 rounded-br-lg bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-md">
                        VIP
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between py-1 min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                          {movie.title}
                        </h4>
                        {movie.badge && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1.5 py-0 shrink-0"
                          >
                            {movie.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-3">
                        {movie.desc}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <LayoutGrid className="h-3 w-3" />
                          {movie.category === "series"
                            ? "ซีรีส์"
                            : "หนังตอนเดียว"}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <ListIcon className="h-3 w-3" />
                          {movie.episodes.length} ตอน
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white"
                          onClick={() => handleEdit(movie)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white"
                          onClick={() => handleDelete(movie.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMovies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 py-20 text-slate-500">
                  <Search className="mb-4 h-12 w-12 opacity-20" />
                  <p className="text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                  <p className="text-sm opacity-60">
                    ลองเปลี่ยนคำค้นหาหรือเพิ่มข้อมูลใหม่
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
