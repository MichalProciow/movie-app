import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { title, year } = await request.json();

  if (!title) {
    return Response.json({ error: "Missing title" }, { status: 400 });
  }

  try {
    const claudeResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Give a 2-3 sentence spoiler summary of the movie "${title}"${year ? ` (${year})` : ""}. Be direct, reveal what actually happens including the ending. No fluff, no "in this film...", just the story. Write in plain text, no markdown.`,
        },
      ],
    });

    const block = claudeResponse.content[0];
    const summary = block.type === "text" ? block.text.trim() : "";

    return Response.json({ summary });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not fetch summary" }, { status: 500 });
  }
}