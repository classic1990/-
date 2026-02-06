import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth, ADMIN_EMAIL, loginWithGoogle, logout, onAuthChange, getMovies, addMovie, updateMovie, deleteMovie, Movie } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Edit2, Trash2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<(Movie & { id: string })[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    category: "vertical" as "vertical" | "series",
    poster: "",
    badge: "",
    isVip: false,
    episodes: [] as { url: string; title?: string }[]
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      const admin = currentUser && currentUser.email === ADMIN_EMAIL;
      setIsAdmin(admin);
      setLoading(false);

      if (admin) {
        loadMovies();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadMovies = async () => {
    try {
      const data = await getMovies();
      setMovies(data);
    } catch (error) {
      console.error("Error loading movies:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setFormData({
        title: "",
        desc: "",
        category: "vertical",
        poster: "",
        badge: "",
        isVip: false,
        episodes: []
      });
      setEditingId(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddEpisode = () => {
    setFormData({
      ...formData,
      episodes: [...formData.episodes, { url: "", title: "" }]
    });
  };

  const handleRemoveEpisode = (index: number) => {
    setFormData({
      ...formData,
      episodes: formData.episodes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.poster) {
      toast.error("กรุณากรอกชื่อเรื่องและ URL รูปโปสเตอร์");
      return;
    }

    try {
      if (editingId) {
        await updateMovie(editingId, formData);
        toast.success("อัปเดตข้อมูลสำเร็จ");
        setEditingId(null);
      } else {
        await addMovie(formData);
        toast.success("เพิ่มหนังใหม่สำเร็จ");
      }

      setFormData({
        title: "",
        desc: "",
        category: "vertical",
        poster: "",
        badge: "",
        isVip: false,
        episodes: []
      });

      await loadMovies();
    } catch (error) {
      console.error("Error saving movie:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleEdit = (movie: Movie & { id: string }) => {
    setFormData({
      title: movie.title,
      desc: movie.desc,
      category: movie.category,
      poster: movie.poster,
      badge: movie.badge || "",
      isVip: movie.isVip,
      episodes: movie.episodes || []
    });
    setEditingId(movie.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือว่าต้องการลบหนังนี้?")) return;

    try {
      await deleteMovie(id);
      toast.success("ลบข้อมูลสำเร็จ");
      await loadMovies();
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Admin Access</CardTitle>
            <CardDescription>เข้าสู่ระบบเพื่อจัดการเนื้อหา</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full gap-2 bg-cyan-500 hover:bg-cyan-600">
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบด้วย Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
            <CardDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              เฉพาะ {ADMIN_EMAIL} เท่านั้นที่สามารถเข้าถึงระบบจัดการได้
            </p>
            <Button onClick={handleLogout} className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900 border-slate-800 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">
                  {editingId ? "แก้ไขหนัง" : "เพิ่มหนังใหม่"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">
                      ชื่อเรื่อง *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ชื่อหนัง"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">
                      เรื่องย่อ
                    </label>
                    <Textarea
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      placeholder="เรื่องย่อ"
                      className="bg-slate-800 border-slate-700 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">
                      หมวดหมู่
                    </label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val as any })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="vertical">ซีรีส์สั้น (แนวตั้ง)</SelectItem>
                        <SelectItem value="series">ซีรีส์ยาว (พากย์ไทย)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">
                      URL รูปโปสเตอร์ *
                    </label>
                    <Input
                      type="url"
                      value={formData.poster}
                      onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                      placeholder="https://..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">
                      ป้ายกำกับ (Badge)
                    </label>
                    <Input
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="เช่น พากย์ไทย"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isVip}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked as boolean })}
                      id="vip"
                    />
                    <label htmlFor="vip" className="text-sm font-medium text-slate-300 cursor-pointer">
                      จำกัดเฉพาะสมาชิก VIP
                    </label>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-300">ตอน ({formData.episodes.length})</label>
                      <Button type="button" onClick={handleAddEpisode} size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" />
                        เพิ่ม
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.episodes.map((ep, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            type="url"
                            value={ep.url}
                            onChange={(e) => {
                              const newEps = [...formData.episodes];
                              newEps[idx].url = e.target.value;
                              setFormData({ ...formData, episodes: newEps });
                            }}
                            placeholder="URL วิดีโอ"
                            className="bg-slate-800 border-slate-700 text-white text-xs"
                          />
                          <Button
                            type="button"
                            onClick={() => handleRemoveEpisode(idx)}
                            size="sm"
                            variant="destructive"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                      {editingId ? "อัปเดต" : "เพิ่ม"}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({
                            title: "",
                            desc: "",
                            category: "vertical",
                            poster: "",
                            badge: "",
                            isVip: false,
                            episodes: []
                          });
                        }}
                        variant="outline"
                      >
                        ยกเลิก
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Movies List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">รายการหนังทั้งหมด ({movies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {movies.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">ยังไม่มีหนัง</p>
                  ) : (
                    movies.map(movie => (
                      <div key={movie.id} className="bg-slate-800 p-4 rounded-lg flex gap-4 items-start">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Crect fill='%231e293b' width='100' height='150'/%3E%3C/svg%3E";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{movie.title}</h4>
                          <p className="text-xs text-slate-400">
                            {movie.episodes?.length || 0} ตอน • {movie.category === "vertical" ? "สั้น" : "ยาว"}
                          </p>
                          {movie.isVip && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded mt-1 inline-block">VIP</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(movie)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(movie.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
