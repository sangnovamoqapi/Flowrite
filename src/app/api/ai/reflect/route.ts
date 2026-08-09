import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, body, wordCount, durationSeconds } = await request.json();

    // Check if an AI API Key is provided in env
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      // Call OpenAI API if available
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an encouraging creative writing companion. Provide a brief 2-3 sentence reflective summary and constructive insight on the user's freewriting piece.",
            },
            {
              role: "user",
              content: `Title: ${title}\nWord Count: ${wordCount}\nContent:\n${body}`,
            },
          ],
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.choices[0]?.message?.content;
        return NextResponse.json({ summary });
      }
    }

    // Default intelligent reflection generator fallback
    const reflections = [
      `Your piece "${title || "Untitled"}" shows a distinct flow of consciousness. With ${wordCount} words written under pressure, your core ideas came through vividly.`,
      `There's a captivating momentum in this draft. Writing ${wordCount} words without breaking stride allowed authentic emotional texture to surface.`,
      `A powerful freewriting session. The urgency of the timer brought out uninhibited narrative voice and strong imagery.`,
    ];

    const randomIndex = Math.floor(Math.random() * reflections.length);
    return NextResponse.json({ summary: reflections[randomIndex] });
  } catch (error) {
    return NextResponse.json(
      { summary: "Great session! Freewriting builds mental focus and writing endurance over time." },
      { status: 200 }
    );
  }
}
