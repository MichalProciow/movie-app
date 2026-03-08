export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId");
  const country = searchParams.get("country") || "US";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    const providers = data.results?.[country];

    return Response.json({
      streaming: providers?.flatrate || [],
      rent: providers?.rent || [],
      buy: providers?.buy || [],
      link: providers?.link || null,
    });
  } catch (err) {
    return Response.json({ error: "Could not fetch providers" }, { status: 500 });
  }
}