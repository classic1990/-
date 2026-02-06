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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-lg">ไม่พบหนังนี้</p>
        <Button onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าแรก
        </Button>
      </div>
    );
  }

  const currentEpisode = movie.episodes?.[selectedEpisode];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-4 py-3">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
          <h1 className="text-xl font-bold text-white flex-1 truncate">{movie.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 mb-4">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%231e293b' width='400' height='600'/%3E%3C/svg%3E";
                }}
              />
              {movie.isVip && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded font-bold text-sm">
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
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "ลบออกจากรายการโปรด" : "เพิ่มเข้ารายการโปรด"}
              </Button>
              <ShareButton movie={movie} />
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            {/* Title & Meta */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{movie.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.badge && (
                  <span className="bg-cyan-500 text-white px-3 py-1 rounded text-sm font-semibold">
                    {movie.badge}
                  </span>
                )}
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-sm">
                  {movie.category === "vertical" ? "ซีรีส์สั้น" : "ซีรีส์ยาว"}
                </span>
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-sm">
                  👁 {movie.viewCount || 0} ครั้ง
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">เรื่องย่อ</h3>
              <p className="text-slate-400 leading-relaxed">{movie.desc}</p>
            </div>

            {/* Video Player */}
            {currentEpisode && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  ตอนที่ {selectedEpisode + 1}:{" "}
                  {currentEpisode.title || `ตอน ${selectedEpisode + 1}`}
                </h3>
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                  <iframe
                    src={currentEpisode.url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay"
                  />
                </div>
              </div>
            )}

            {/* Episodes List */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">
                  ตอนทั้งหมด ({movie.episodes.length} ตอน)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {movie.episodes.map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEpisode(idx)}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        selectedEpisode === idx
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                ความคิดเห็น ({comments.length})
              </h3>

              {user ? (
                <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="แสดงความคิดเห็น..."
                    className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    disabled={isSubmittingComment}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-cyan-500 hover:bg-cyan-600 shrink-0"
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-slate-500 text-sm">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น</p>
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
                  <p className="text-slate-500 text-sm py-4">ยังไม่มีความคิดเห็น</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={c.userPhoto ?? undefined} />
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-sm">
                          {(c.userName || c.userEmail || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300">
                          {c.userName || c.userEmail || "ผู้ใช้"}
                        </p>
                        <p className="text-white text-sm mt-0.5 break-words">{c.text}</p>
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
