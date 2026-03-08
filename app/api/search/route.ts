import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GENRES: Record<string, number> = {
  action: 28, adventure: 12, animation: 16, comedy: 35,
  crime: 80, documentary: 99, drama: 18, family: 10751,
  fantasy: 14, history: 36, horror: 27, music: 10402,
  mystery: 9648, romance: 10749, "sci-fi": 878, thriller: 53,
  war: 10752, western: 37,
};

const TMDB_HEADERS = {
  Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
  "Content-Type": "application/json",
};

async function searchMovieId(title: string): Promise<number | null> {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&page=1`,
    { headers: TMDB_HEADERS }
  );
  const data = await res.json();
  return data.results?.[0]?.id || null;
}

async function getSimilarMovies(movieId: number): Promise<any[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/similar?page=1`,
    { headers: TMDB_HEADERS }
  );
  const data = await res.json();
  return data.results || [];
}

async function getRecommendedMovies(movieId: number): Promise<any[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/recommendations?page=1`,
    { headers: TMDB_HEADERS }
  );
  const data = await res.json();
  return data.results || [];
}

async function discoverByGenres(genreIds: string): Promise<any[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=1`,
    { headers: TMDB_HEADERS }
  );
  const data = await res.json();
  return data.results || [];
}

export async function POST(request: Request) {
  const { query, searchType } = await request.json();

  try {
    // --- Title search ---
    if (searchType === "title") {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=1`,
        { headers: TMDB_HEADERS }
      );
      const data = await res.json();
      const movies = (data.results || []).slice(0, 6);
      return Response.json({ movies, explanation: "" });
    }

    // --- Description search ---
    const claudeResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `The user is looking for a movie matching: "${query}".

Return a JSON object with:
- "genres": array of 1-3 genre names from: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, sci-fi, thriller, war, western
- "referenceTitles": array of exactly 3 well-known real movie titles that best match the description (these must be real movies that exist)
- "explanation": one sentence describing what kind of movie this is

Return ONLY raw JSON, no markdown, no backticks.`,
        },
      ],
    });

    const block = claudeResponse.content[0];
    const claudeText = block.type === "text" ? block.text : "";
    const cleaned = claudeText.replace(/```json|```/g, "").trim();
    const { genres, referenceTitles, explanation } = JSON.parse(cleaned);

    const allMovies: any[] = [];
    const seenIds = new Set<number>();

    function addMovies(movies: any[]) {
      for (const movie of movies) {
        if (!seenIds.has(movie.id) && movie.poster_path) {
          seenIds.add(movie.id);
          allMovies.push(movie);
        }
      }
    }

    // For each reference title Claude gave us:
    // 1. Find its TMDB ID
    // 2. Get similar movies from TMDB
    // 3. Get recommendations from TMDB
    for (const title of referenceTitles) {
      const movieId = await searchMovieId(title);
      if (movieId) {
        const [similar, recommended] = await Promise.all([
          getSimilarMovies(movieId),
          getRecommendedMovies(movieId),
        ]);
        addMovies(similar);
        addMovies(recommended);
      }
    }

    // Fill remaining slots with genre-based discovery
    if (allMovies.length < 6) {
      const genreIds = genres
        .map((g: string) => GENRES[g.toLowerCase()])
        .filter(Boolean)
        .join(",");
      if (genreIds) {
        const discovered = await discoverByGenres(genreIds);
        addMovies(discovered);
      }
    }

    allMovies.sort((a, b) => b.popularity - a.popularity);
    const movies = allMovies.slice(0, 6);

    return Response.json({ movies, explanation });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}