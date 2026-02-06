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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>เข้าสู่ระบบเพื่อจัดการเนื้อหา</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบด้วย Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              เฉพาะ {ADMIN_EMAIL} เท่านั้นที่สามารถเข้าถึงระบบจัดการได้
            </p>
            <Button onClick={handleLogout} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{editingId ? "แก้ไขหนัง" : "เพิ่มหนังใหม่"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      ชื่อเรื่อง *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ชื่อหนัง"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      เรื่องย่อ
                    </label>
                    <Textarea
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      placeholder="เรื่องย่อ"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      หมวดหมู่
                    </label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">ซีรีส์สั้น (แนวตั้ง)</SelectItem>
                        <SelectItem value="series">ซีรีส์ยาว (พากย์ไทย)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      URL รูปโปสเตอร์ *
                    </label>
                    <Input
                      type="url"
                      value={formData.poster}
                      onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      ป้ายกำกับ (Badge)
                    </label>
                    <Input
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="เช่น พากย์ไทย"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isVip}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked as boolean })}
                      id="vip"
                    />
                    <label htmlFor="vip" className="cursor-pointer text-sm font-medium">
                      จำกัดเฉพาะสมาชิก VIP
                    </label>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium">ตอน ({formData.episodes.length})</label>
                      <Button type="button" onClick={handleAddEpisode} size="sm" variant="outline" className="gap-1">
                        <Plus className="h-3 w-3" />
                        เพิ่ม
                      </Button>
                    </div>
                    <div className="max-h-40 space-y-2 overflow-y-auto">
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
                            className="text-xs"
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
                    <Button type="submit" className="flex-1">
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
            <Card>
              <CardHeader>
                <CardTitle>รายการหนังทั้งหมด ({movies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] space-y-3 overflow-y-auto">
                  {movies.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">ยังไม่มีหนัง</p>
                  ) : (
                    movies.map(movie => (
                      <div key={movie.id} className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="h-16 w-12 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 150'%3E%3Crect fill='%231e293b' width='100' height='150'/%3E%3C/svg%3E";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold">{movie.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {movie.episodes?.length || 0} ตอน • {movie.category === "vertical" ? "สั้น" : "ยาว"}
                          </p>
                          {movie.isVip && <span className="mt-1 inline-block rounded bg-yellow-500 px-2 py-0.5 text-xs text-black">VIP</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(movie)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(movie.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
