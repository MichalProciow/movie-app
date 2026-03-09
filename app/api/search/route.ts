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

async function searchMovieByTitle(title: string): Promise<any[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&page=1`,
    { headers: TMDB_HEADERS }
  );
  const data = await res.json();
  return data.results || [];
}

async function searchMovieId(title: string): Promise<number | null> {
  const results = await searchMovieByTitle(title);
  return results[0]?.id || null;
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

async function searchByKeywords(keywords: string[]): Promise<any[]> {
  // Search TMDB using the keywords as a natural language query
  const keywordQuery = keywords.join(" ");
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(keywordQuery)}&page=1`,
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
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `The user is looking for a movie matching: "${query}".

Return a JSON object with:
- "directTitle": if the description clearly refers to one specific movie, return its exact title. Otherwise null.
- "keywords": array of 3-5 descriptive search terms (themes, setting, character types, mood — NOT genre names). These will be used to search a movie database directly, so make them specific and evocative.
- "genres": array of 1-3 genre names from: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, sci-fi, thriller, war, western
- "referenceTitles": array of 2 well-known real movie titles with a VERY similar vibe (used only as fallback)
- "explanation": one sentence describing what kind of movie the user is looking for

Example for "a fish that gets lost and his dad searches the ocean for him":
{
  "directTitle": "Finding Nemo",
  "keywords": ["lost fish", "ocean adventure", "father son", "underwater"],
  "genres": ["animation", "adventure", "family"],
  "referenceTitles": ["Finding Dory", "The Little Mermaid"],
  "explanation": "A heartwarming animated ocean adventure about a parent searching for their lost child."
}

Return ONLY raw JSON, no markdown, no backticks.`,
        },
      ],
    });

    const block = claudeResponse.content[0];
    const claudeText = block.type === "text" ? block.text : "";
    const cleaned = claudeText.replace(/```json|```/g, "").trim();
    const { directTitle, keywords, genres, referenceTitles, explanation } = JSON.parse(cleaned);

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

    // Step 1: If Claude identified a specific movie, surface it first
    if (directTitle) {
      const directResults = await searchMovieByTitle(directTitle);
      // Put the best direct match at the front
      const exactMatch = directResults[0];
      if (exactMatch && exactMatch.poster_path) {
        seenIds.add(exactMatch.id);
        allMovies.unshift(exactMatch);
      }
      // Also get recommendations based on that movie
      if (exactMatch?.id) {
        const [similar, recommended] = await Promise.all([
          getSimilarMovies(exactMatch.id),
          getRecommendedMovies(exactMatch.id),
        ]);
        addMovies(similar);
        addMovies(recommended);
      }
    }

    // Step 2: Search TMDB directly using Claude's keywords
    if (allMovies.length < 6 && keywords?.length) {
      const keywordResults = await searchByKeywords(keywords);
      addMovies(keywordResults);
    }

    // Step 3: Fall back to similar/recommended from reference titles
    if (allMovies.length < 6 && referenceTitles?.length) {
      for (const title of referenceTitles) {
        if (allMovies.length >= 10) break;
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
    }

    // Step 4: Fill remaining slots with genre-based discovery
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

    // Sort by popularity but keep the direct match pinned at index 0
    const pinned = directTitle ? allMovies.slice(0, 1) : [];
    const rest = directTitle ? allMovies.slice(1) : allMovies;
    rest.sort((a, b) => b.popularity - a.popularity);
    const movies = [...pinned, ...rest].slice(0, 6);

    return Response.json({ movies, explanation });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}