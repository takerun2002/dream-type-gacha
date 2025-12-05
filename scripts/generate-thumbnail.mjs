import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDbfFVcai0OAgTB2z7DEMeaoj9mn43HDjU"
});

async function generateThumbnail() {
  const prompt = `Create a vibrant gacha game promotional banner image:

- Center: A cute chibi anime boy with blonde hair wearing white kimono, sitting in meditation pose
- Around him: Multiple colorful trading cards floating dynamically (phoenix, dragon, wolf themed cards visible)
- Background: Dark purple gradient with golden sparkles and magical light rays bursting outward
- Style: Japanese mobile gacha game aesthetic, like Pokemon or Dragon Ball card games
- Mood: Exciting, premium, mystical fortune-telling vibe
- Colors: Warm orange, pink, gold accents on deep purple background
- NO TEXT on the image - leave space for title overlay
- Aspect ratio: Wide horizontal banner format (16:9)
- High quality promotional art, detailed and polished`;

  try {
    console.log("Generating thumbnail banner...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync("public/gacha-banner.jpg", buffer);
          console.log("✅ Banner saved to public/gacha-banner.jpg");
          console.log("   Size:", buffer.length, "bytes");
          return;
        }
      }
    }
    console.log("❌ No image generated");
    if (response.text) console.log("Text response:", response.text.substring(0, 200));
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

generateThumbnail();
