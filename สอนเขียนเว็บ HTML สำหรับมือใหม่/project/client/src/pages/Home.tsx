import { useEffect, useState } from "react";
import { subscribeToMovies, Movie, incrementViewCount } from "@/lib/firebase";
import MovieCard from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LogIn } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [movies, setMovies] = useState<(Movie & { id: string })[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<
    (Movie & { id: string })[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "vertical" | "series"
  >("all");
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMovies(moviesData => {
      setMovies(moviesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = movies;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(movie => movie.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        movie =>
          movie.title.toLowerCase().includes(term) ||
          movie.desc.toLowerCase().includes(term)
      );
    }

    setFilteredMovies(filtered);
  }, [movies, searchTerm, selectedCategory]);

  const handleMovieClick = (movieId: string) => {
    incrementViewCount(movieId).catch(console.error);
    setLocation(`/movie/${movieId}`);
  };

  const verticalCount = movies.filter(m => m.category === "vertical").length;
  const seriesCount = movies.filter(m => m.category === "series").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DH</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              DUYDODEE-HD
            </h1>
          </div>
          <Button
            onClick={() => setLocation("/admin")}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Admin
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ดูหนังออนไลน์ <span className="text-cyan-400">ฟรี</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              ซีรีส์สั้น ซีรีส์พากย์ไทย และเนื้อหาบันเทิงอื่น ๆ ที่คุณชอบ
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type="text"
                placeholder="ค้นหาหนัง..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 py-3 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={val => setSelectedCategory(val as any)}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              >
                ทั้งหมด
              </TabsTrigger>
              <TabsTrigger
                value="vertical"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              >
                ซีรีส์สั้น ({verticalCount})
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              >
                ซีรีส์ยาว ({seriesCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <MovieGrid
                movies={filteredMovies}
                loading={loading}
                onMovieClick={handleMovieClick}
              />
            </TabsContent>
            <TabsContent value="vertical" className="mt-8">
              <MovieGrid
                movies={filteredMovies}
                loading={loading}
                onMovieClick={handleMovieClick}
              />
            </TabsContent>
            <TabsContent value="series" className="mt-8">
              <MovieGrid
                movies={filteredMovies}
                loading={loading}
                onMovieClick={handleMovieClick}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function MovieGrid({
  movies,
  loading,
  onMovieClick,
}: {
  movies: (Movie & { id: string })[];
  loading: boolean;
  onMovieClick: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">ไม่พบหนังที่ตรงกับการค้นหา</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={() => onMovieClick(movie.id!)}
        />
      ))}
    </div>
  );
}
