"use client";
import { useState } from "react";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
};

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

type StreamingInfo = {
  streaming: Provider[];
  link: string;
};

type StreamingMap = {
  [key: number]: StreamingInfo;
};

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "PL", name: "Poland" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
];

function ProviderList({ info }: { info: StreamingInfo }) {
  if (!info) {
    return <p className="text-xs text-gray-600">Loading...</p>;
  }
  if (!info.streaming || info.streaming.length === 0) {
    return <p className="text-xs text-gray-600">Not streaming in this country</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {info.streaming.map((p) => {
        return (
          <a key={p.provider_id} href={info.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
            <img
              src={"https://image.tmdb.org/t/p/w45" + p.logo_path}
              alt={p.provider_name}
              className="w-8 h-8 rounded-md"
            />
          </a>
        );
      })}
    </div>
  );
}

function MovieCard({ movie, streaming }: { movie: Movie; streaming: StreamingInfo }) {
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
      {movie.poster_path ? (
        <img
          src={"https://image.tmdb.org/t/p/w500" + movie.poster_path}
          alt={movie.title}
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-600">
          No poster
        </div>
      )}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-1">{movie.title}</h2>
        <div className="flex gap-3 text-sm text-gray-400 mb-3">
          <span>{year}</span>
          <span>{"⭐ " + rating}</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
          {movie.overview || "No description available."}
        </p>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Streaming</p>
          <ProviderList info={streaming} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("description");
  const [results, setResults] = useState<Movie[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("US");
  const [streamingData, setStreamingData] = useState<StreamingMap>({});

  async function loadStreaming(movieId: number, countryCode: string) {
    const res = await fetch("/api/streaming?movieId=" + movieId + "&country=" + countryCode);
    const data = await res.json();
    setStreamingData((prev) => {
      const next = Object.assign({}, prev);
      next[movieId] = data;
      return next;
    });
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setStreamingData({});

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, searchType: searchType }),
    });
    const data = await res.json();
    const movies: Movie[] = data.movies || [];
    setResults(movies);
    setExplanation(data.explanation || "");
    setLoading(false);
    movies.forEach((m) => loadStreaming(m.id, country));
  }

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    setStreamingData({});
    results.forEach((m) => loadStreaming(m.id, newCountry));
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 MovieMatch</h1>
          <p className="text-gray-400">Describe a movie or search by title</p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setSearchType("description")}
            className={searchType === "description"
              ? "px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white"
              : "px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700"}
          >
            Describe a movie
          </button>
          <button
            onClick={() => setSearchType("title")}
            className={searchType === "title"
              ? "px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white"
              : "px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700"}
          >
            Search by title
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { handleSearch(); } }}
            placeholder={searchType === "description"
              ? "e.g. a psychological thriller like Get Out but set in space..."
              : "e.g. Inception"}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {explanation !== "" && (
          <p className="text-center text-gray-400 italic mb-6">{explanation}</p>
        )}

        {results.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-400 text-sm">Streaming in:</span>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              streaming={streamingData[movie.id]}
            />
          ))}
        </div>

      </div>
    </main>
  );
}