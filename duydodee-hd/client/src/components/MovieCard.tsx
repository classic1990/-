import { Movie } from "@/lib/firebase";
import { Play } from "lucide-react";

interface MovieCardProps {
  movie: Movie & { id: string };
  onClick: () => void;
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-700">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={e => {
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%231e293b' width='400' height='600'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%2364748b' font-size='24' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3 transition-colors">
            <Play className="w-6 h-6 fill-white" />
          </button>
        </div>

        {/* VIP Badge */}
        {movie.isVip && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
            VIP
          </div>
        )}

        {/* Badge */}
        {movie.badge && (
          <div className="absolute top-2 right-2 bg-cyan-500 text-white px-2 py-1 rounded text-xs font-semibold">
            {movie.badge}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {movie.title}
        </h3>
        <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
          <span>{movie.episodes?.length || 0} ตอน</span>
          <span>👁 {movie.viewCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
