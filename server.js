import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from "url";

dotenv.config();

// Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
app.use(cors());

// IMPORTANT: correct absolute path to /public
const publicPath = path.resolve(process.cwd(), "public");

// Serve static files (index.html, style.css, app.js)
app.use(express.static(publicPath));

// OPTIONAL: explicit root route (safe fallback)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// API route
app.get("/api/students", async (req, res) => {
  const { data, error } = await supabase
    .from("Students_Performance_tb")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
});

// Chat API route for Gemini
app.post("/api/chat", express.json(), async (req, res) => {
  try {
    const { message, context } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
      You are a senior data analyst AI.

      You analyze a student performance dashboard.

      You DO NOT see visual charts.
      You ONLY see structured JSON data.

      Your job:
      - Find patterns
      - Compare districts
      - Explain relationships (study hours vs GPA)
      - Highlight insights and trends
      - If asked, list specific students or filter records
      - Be short and clear

      IMPORTANT RULES:
      - Use ONLY provided data
      - If data is missing, say "not available"
      - Always refer to chart data logically (bar, line, pie)

      ------------------------
      DATA (JSON):
      ${JSON.stringify(context, null, 2)}

      ------------------------
      USER QUESTION:
      ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Gemini error occurred." });
  }
});

// Uncomment the this lines to run the server locally. 
// For deployment, use the default export and let the hosting 
// platform handle it.
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port " + (process.env.PORT || 3000));
});

export default app;