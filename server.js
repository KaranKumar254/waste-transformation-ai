import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const API_KEY     = process.env.API_KEY;          // OpenRouter key
const YT_API_KEY  = process.env.YT_API_KEY;       // YouTube Data API v3 key

// ══════════════════════════════════════════════
// POST /ai  — AI analysis + YouTube video
// ══════════════════════════════════════════════
app.post("/ai", async (req, res) => {
    try {
        const { ecoRevive, langInstruction } = req.body;

        if (!ecoRevive) {
            return res.json({ success: false, error: "Enter waste material" });
        }

        // ── 1. Build multilingual prompt ──────────────
        const langLine = langInstruction ? `\n\n${langInstruction}` : "";

        const prompt = `You are an expert in waste management, circular economy, and sustainable business.

Analyze "${ecoRevive}" as a waste/byproduct material and provide a detailed response covering:

1. **What is this waste?** (brief description)
2. **Top Transformation Methods** (at least 4-5 specific methods with process details)
3. **Products that can be created** from this waste
4. **Market Value & Earning Potential** (with approximate figures)
5. **Step-by-step process** for the most profitable method
6. **Equipment & Investment** needed to start
7. **Real-world success examples**

Format with clear headings and bullet points. Be specific, factual, and practical.${langLine}`;

        // ── 2. OpenRouter AI call ─────────────────────
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const aiData = await aiResponse.json();
        console.log("AI RESPONSE:", JSON.stringify(aiData, null, 2));

        if (aiData.error) {
            return res.json({ success: false, error: aiData.error.message });
        }

        const aiText = aiData?.choices?.[0]?.message?.content || "No response";

        // ── 3. YouTube video search ───────────────────
        const videoId = await searchYouTubeVideo(ecoRevive);

        // ── 4. Send response ──────────────────────────
        res.json({
            success: true,
            text:    aiText,          // plain text — frontend will format it
            videoId: videoId || null  // YouTube video ID or null
        });

    } catch (err) {
        console.log("SERVER ERROR:", err);
        res.json({ success: false, error: "Server error" });
    }
});

// ══════════════════════════════════════════════
// YouTube video search function
// ══════════════════════════════════════════════
async function searchYouTubeVideo(wasteMaterial) {
    // ── Method 1: YouTube Data API v3 (best, if key available) ──
    if (YT_API_KEY) {
        try {
            const query   = encodeURIComponent(`${wasteMaterial} waste to wealth recycling business`);
            const ytUrl   = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${YT_API_KEY}`;
            const ytRes   = await fetch(ytUrl);
            const ytData  = await ytRes.json();

            const videoId = ytData?.items?.[0]?.id?.videoId;
            if (videoId) {
                console.log("✅ YouTube API video found:", videoId);
                return videoId;
            }
        } catch (err) {
            console.log("YouTube API error:", err.message);
        }
    }

    // ── Method 2: Curated fallback map (no API key needed) ──
    const VIDEO_MAP = {
        "tomato":           "oWjr8iQFkJs",
        "rice husk":        "oB_E3bVqRss",
        "rice straw":       "JxGyjHNfXRs",
        "sugarcane":        "kH6Yn6i5DUc",
        "bagasse":          "kH6Yn6i5DUc",
        "coffee":           "M0T9B7tJvWM",
        "banana":           "Q2vMmIKo2eI",
        "plastic":          "RS7IzU2VJIQ",
        "coconut":          "4TgWxrTe7sA",
        "paper":            "c9mFKBzEFCU",
        "food waste":       "ishA6kry8nc",
        "crop":             "JxGyjHNfXRs",
        "agricultural":     "JxGyjHNfXRs",
        "poultry":          "zNzJvEU9nMM",
        "cotton":           "yl0FwEbGFRk",
        "jute":             "R8fPSJtFGhY",
        "wood":             "TlMLIHF4SqE",
        "sawdust":          "TlMLIHF4SqE",
        "e-waste":          "3BFYPrTwG9I",
        "electronic":       "3BFYPrTwG9I",
        "biogas":           "IhQlS9JXEYA",
        "compost":          "nRBkGqHt2Qk",
        "vermicompost":     "C_fUjp6kHhA",
        "fly ash":          "BpBKMVXgKNs",
        "tyre":             "sPADCIb6VDM",
        "rubber":           "sPADCIb6VDM",
        "glass":            "WDnBN6M9TL0",
        "metal":            "R3fzJfcCY3g",
        "scrap":            "R3fzJfcCY3g",
        "mustard":          "H2wV2Kzg_I0",
        "groundnut":        "YgU2t8gBbZQ",
        "wheat":            "JxGyjHNfXRs",
        "corn":             "kH6Yn6i5DUc",
        "mango":            "qHR2grV_kLE",
        "citrus":           "oWjr8iQFkJs",
        "orange":           "oWjr8iQFkJs",
        "lemon":            "oWjr8iQFkJs",
        "textile":          "yl0FwEbGFRk",
        "bamboo":           "TlMLIHF4SqE",
        "palm":             "vCM6p8UZBvU",
        "soybean":          "kH6Yn6i5DUc",
        "mushroom":         "nRBkGqHt2Qk",
        "algae":            "IhQlS9JXEYA",
        "hemp":             "R8fPSJtFGhY",
        "tea":              "M0T9B7tJvWM",
        "leather":          "yl0FwEbGFRk",
        "cardboard":        "c9mFKBzEFCU",
        "potato":           "ishA6kry8nc",
        "onion":            "ishA6kry8nc",
        "vegetable":        "ishA6kry8nc",
        "fruit":            "ishA6kry8nc",
        "silk":             "yl0FwEbGFRk",
        "wool":             "yl0FwEbGFRk",
        "neem":             "nRBkGqHt2Qk",
        "maize":            "kH6Yn6i5DUc",
        "sorghum":          "kH6Yn6i5DUc",
        "cassava":          "ishA6kry8nc",
        "tapioca":          "ishA6kry8nc",
    };

    const lq = wasteMaterial.toLowerCase();
    for (const [keyword, vid] of Object.entries(VIDEO_MAP)) {
        if (lq.includes(keyword)) {
            console.log(`✅ Curated video matched "${keyword}":`, vid);
            return vid;
        }
    }

    // ── Method 3: Generic fallback ──
    const generic = [
        "ishA6kry8nc",   // food waste to wealth
        "RS7IzU2VJIQ",   // plastic recycling
        "JxGyjHNfXRs",   // agricultural waste
        "oB_E3bVqRss",   // rice husk
        "nRBkGqHt2Qk",   // composting
    ];
    const fallback = generic[Math.floor(Math.random() * generic.length)];
    console.log("⚠️  Using generic fallback video:", fallback);
    return fallback;
}

// ══════════════════════════════════════════════
app.listen(3000, () => {
    console.log("🚀 EcoRevive AI running at http://localhost:3000");
});
