# 📊 Student Performance Analytics Dashboard

A cloud-based analytics dashboard that processes and visualizes student performance data using Supabase, Node.js, and Chart.js.

---

# 🚀 Features
- Fetch data from Supabase (cloud database)
- Interactive dashboard (charts + KPIs)
- Optional local CSV fallback (offline mode)
- Deployable via Vercel / Netlify
---

# 🛠 Technologies Used

- Node.js (Express)
- Supabase (Cloud Database & API)
- Chart.js
- HTML, CSS, JavaScript

---

# 📦 Installation & Setup

## 1. Clone the Repository

    git clone https://github.com/basarinasif/StudentsPerformanceStat.git

## 2. Navigate to the Project Folder

    cd StudentsPerformanceStat

---

## 3. Install Dependencies

    npm install

---

# 🔐 OPTION 1: Using Supabase (Recommended)

## Step 1: Create `.env` file

    SUPABASE_URL=your_supabase_url

    SUPABASE_KEY=your_supabase_anon_key

    PORT=3000

---

## Step 2: Run the Server

    npm run dev

---

## Step 3: Open in Browser

    http://localhost:3000

---

# 💻 OPTION 2: Using Local CSV (Offline Mode)

## Step 1: Place Dataset

student_performance.csv

---

## Step 2: Modify server.js

Remove Supabase code:

    import { createClient } from "@supabase/supabase-js"; 

    const supabase = createClient( 
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_KEY 
    ); 

    app.get("/api/students", async (req, res) => { 
      const { data, error } = await supabase 
        .from("Students_Performance_tb") 
        .select("*"); 
      if (error) return res.status(500).json(error); res.json(data); 
    });

Replace with:

    import fs from "fs";

    app.get("/api/students", (req, res) => {
      const data = fs.readFileSync("student_performance.csv", "utf-8");
      const rows = data.split("\n").slice(1);

      const result = rows.map(row => {
        const cols = row.split(",");
        return {
          Student_ID: cols[0],
          HSC_Result: parseFloat(cols[13])
        };
      });

    res.json(result);
    });

---

## Step 3: Run Server

    npm run dev

---

# ▶️ Running Locally vs Deployment

## Local Development

Enable:

    app.listen(process.env.PORT || 3000, () => {

      console.log("Server running on port " + (process.env.PORT || 3000));
  
    });

---

## Deployment

Comment out app.listen() and use:

    export default app;

---

# 📁 Project Structure

    project/
    │── server.js
    │── package.json
    │── vercel.json 
    │── .env
    │
    ├── public/
    │   ├── index.html
    │   ├── app.js
    │   └── style.css
    
---

# 🔒 Security Notes

- Do NOT commit .env file
- Use environment variables for API keys
- Use Supabase anon key only

---
