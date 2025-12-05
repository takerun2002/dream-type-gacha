import { fal } from "@fal-ai/client";
import fs from "fs";

fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949"
});

async function generateBanner() {
  const prompt = `A vibrant Japanese gacha game promotional banner. Center features a cute chibi anime boy with blonde hair wearing white kimono in meditation pose. Multiple colorful trading cards with mythical creatures (phoenix, dragon, wolf) float around him dynamically. Dark purple gradient background with golden sparkles, magical light rays bursting outward, and mystical fortune-telling atmosphere. Premium mobile game aesthetic like Pokemon cards. Warm orange, pink, and gold accents. High quality promotional art, detailed and polished. No text. 16:9 wide banner format.`;

  try {
    console.log("🎨 Generating banner with FAL AI...");
    
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_images: 1,
        enable_safety_checker: false,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("⏳ Processing...");
        }
      },
    });

    if (result.data?.images?.[0]?.url) {
      const imageUrl = result.data.images[0].url;
      console.log("✅ Image URL:", imageUrl);
      
      // Download image
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync("public/gacha-banner.jpg", buffer);
      console.log("✅ Banner saved to public/gacha-banner.jpg");
      console.log("   Size:", buffer.length, "bytes");
    } else {
      console.log("❌ No image generated");
      console.log("Result:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

generateBanner();
