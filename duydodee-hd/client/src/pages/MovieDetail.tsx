import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  getMovies,
  Movie,
  auth,
  onAuthChange,
  loginWithGoogle,
  subscribeToComments,
  addComment,
  subscribeToFavorites,
  addFavorite,
  removeFavorite,
  type Comment
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, MessageCircle, Send } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MovieDetail() {
  const params = useParams();
  const movieId = params.id ?? "";
  const [, setLocation] = useLocation();
  const [movie, setMovie] = useState<(Movie & { id: string }) | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const movies = await getMovies();
        const found = movies.find((m) => m.id === movieId);
        if (found) {
          setMovie(found);
        }
      } catch (error) {
        console.error("Error loading movie:", error);
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [movieId]);

  useEffect(() => {
    if (!movieId) return;
    const unsubComments = subscribeToComments(movieId, setComments);
    return () => unsubComments();
  }, [movieId]);

  useEffect(() => {
    if (!user || !movieId) {
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      setIsFavorite(favorites.includes(movieId));
      return;
    }
    const unsubFav = subscribeToFavorites(user.uid, (movieIds) => {
      setIsFavorite(movieIds.includes(movieId));
    });
    return () => unsubFav();
  }, [user, movieId]);

  const handleToggleFavorite = async () => {
    if (user) {
      try {
        if (isFavorite) {
          await removeFavorite(user.uid, movieId);
          toast.success("ลบออกจากรายการโปรดแล้ว");
        } else {
          await addFavorite(user.uid, movieId);
          toast.success("เพิ่มเข้ารายการโปรดแล้ว");
        }
        setIsFavorite(!isFavorite);
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.error("เกิดข้อผิดพลาด");
      }
    } else {
      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (isFavorite) {
        const next = favorites.filter((id: string) => id !== movieId);
        localStorage.setItem("favorites", JSON.stringify(next));
      } else {
        favorites.push(movieId);
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? "ลบออกจากรายการโปรดแล้ว" : "เพิ่มเข้ารายการโปรดแล้ว");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setIsSubmittingComment(true);
    try {
      await addComment(movieId, text, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setCommentText("");
      toast.success("แสดงความคิดเห็นแล้ว");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("เกิดข้อผิดพลาดในการแสดงความคิดเห็น");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-accent"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-muted-foreground">ไม่พบหนังนี้</p>
        <Button onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าแรก
        </Button>
      </div>
    );
  }

  const currentEpisode = movie.episodes?.[selectedEpisode];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <h1 className="flex-1 truncate text-xl font-bold text-foreground">{movie.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-lg bg-card">
              <img
                src={movie.poster}
                alt={movie.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%231e293b' width='400' height='600'/%3E%3C/svg%3E";
                }}
              />
              {movie.isVip && (
                <div className="absolute left-4 top-4 rounded bg-yellow-500 px-3 py-1 text-sm font-bold text-black">
                  VIP
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleToggleFavorite}
                variant={isFavorite ? "default" : "outline"}
                className="w-full gap-2"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "ลบออกจากรายการโปรด" : "เพิ่มเข้ารายการโปรด"}
              </Button>
              <ShareButton movie={movie} />
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            {/* Title & Meta */}
            <div className="mb-6">
              <h2 className="mb-2 text-3xl font-bold text-foreground">{movie.title}</h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {movie.badge && (
                  <span className="rounded bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                    {movie.badge}
                  </span>
                )}
                <span className="rounded bg-muted px-3 py-1 text-sm text-muted-foreground">
                  {movie.category === "vertical" ? "ซีรีส์สั้น" : "ซีรีส์ยาว"}
                </span>
                <span className="rounded bg-muted px-3 py-1 text-sm text-muted-foreground">
                  👁 {movie.viewCount || 0} ครั้ง
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">เรื่องย่อ</h3>
              <p className="leading-relaxed text-muted-foreground">{movie.desc}</p>
            </div>

            {/* Video Player */}
            {currentEpisode && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  ตอนที่ {selectedEpisode + 1}:{" "}
                  {currentEpisode.title || `ตอน ${selectedEpisode + 1}`}
                </h3>
                <div className="aspect-video overflow-hidden rounded-lg bg-black shadow-lg shadow-accent/20">
                  <iframe
                    src={currentEpisode.url}
                    className="h-full w-full"
                    allowFullScreen
                    allow="autoplay"
                  />
                </div>
              </div>
            )}

            {/* Episodes List */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  ตอนทั้งหมด ({movie.episodes.length} ตอน)
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {movie.episodes.map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEpisode(idx)}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        selectedEpisode === idx
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      ตอน {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                <MessageCircle className="h-5 w-5" />
                ความคิดเห็น ({comments.length})
              </h3>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-4 flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="แสดงความคิดเห็น..."
                    className="flex-1"
                    disabled={isSubmittingComment}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 bg-accent hover:bg-accent/90"
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="mb-4 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => loginWithGoogle().catch((e) => toast.error("เข้าสู่ระบบไม่สำเร็จ"))}
                  >
                    เข้าสู่ระบบด้วย Google
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">ยังไม่มีความคิดเห็น</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={c.userPhoto ?? undefined} />
                        <AvatarFallback className="bg-muted text-sm text-muted-foreground">
                          {(c.userName || c.userEmail || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {c.userName || c.userEmail || "ผู้ใช้"}
                        </p>
                        <p className="mt-0.5 break-words text-sm text-foreground">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
