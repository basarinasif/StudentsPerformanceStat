import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Fix __dirname in ES modules
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


export default app;

