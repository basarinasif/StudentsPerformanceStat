let students = [];
let currentPage = 1;
let chart;
let sortKey = null;
let sortAsc = true;
let filteredStudents = [];

const rowsPerPage = 10;
const toggleBtn = document.getElementById("darkToggle");

// Load data from API and initialize dashboard
function getTheme() {
  const isDark = document.body.classList.contains("dark");

  return {
    isDark,
    text: isDark ? "#00ff88" : "#000000",
    grid: isDark ? "#333" : "#e0e0e0",
    primary: isDark ? "#00ff88" : "#2d7ef7",
    gray: isDark ? "#ccc":"#555"  
  };
}

async function loadData() {
  const res = await fetch("/api/students");
  students = await res.json();

  

  const gpas = students.map(d => d.HSC_Result);
  const avg = (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);

  // =========================
  // METRICS
  // =========================
  // Total Students
  document.getElementById("totalStudents").innerText = students.length;

  // Average Attendance
  const avgAttendance = (
    students.reduce((a, b) => a + b.Attendance, 0) / students.length
  ).toFixed(1);
  document.getElementById("avgAttendance").innerText = avgAttendance + "%";

  // Average Study Hours
  const avgStudy = (
    students.reduce((a, b) => a + b.Study_Hours_per_Week, 0) / students.length
  ).toFixed(1);
  document.getElementById("avgStudyHours").innerText = avgStudy + " hrs/week";

  // Average HSC GPA
  document.getElementById("avgHSC").innerText = avg;

  // High Performers (GPA ≥ 4)
  const highPerformers = students.filter(s => s.HSC_Result >= 4).length;
  document.getElementById("highPerformers").innerText = highPerformers;

  // Private School %
  const privateCount = students.filter(s => s.School_Type === "Private").length;
  document.getElementById("privatePercent").innerText =
    ((privateCount / students.length) * 100).toFixed(1) + "%";

  // Internet Access %
  const internetCount = students.filter(s => s.Internet_Access === "Yes").length;
  document.getElementById("internetPercent").innerText =
    ((internetCount / students.length) * 100).toFixed(1) + "%";

  // Average Family Income

  const avgIncome = (
    students.reduce((a, b) => a + b.Family_Income_BDT, 0) / students.length
  ).toFixed(0);
  const conversionRate = 0.48;
  const avgIncomePHP = (avgIncome * conversionRate).toFixed(2);
  document.getElementById("avgIncome").innerText = "৳" + avgIncome + " (₱" + avgIncomePHP + ")";

  filteredStudents = students;

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("genderFilter").addEventListener("change", applyFilters);
  document.getElementById("schoolFilter").addEventListener("change", applyFilters);

  renderTable();
  setupPagination();
  renderChart();
  renderLineChart();
  renderPieChart();


}

// Filter function
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const gender = document.getElementById("genderFilter").value;
  const school = document.getElementById("schoolFilter").value;

  filteredStudents = students.filter(s => {
    const matchSearch =
      String(s.Student_ID).toLowerCase().includes(search) ||
      String(s.District ?? "").toLowerCase().includes(search);

    const matchGender = gender ? s.Gender === gender : true;
    const matchSchool = school ? s.School_Type === school : true;

    return matchSearch && matchGender && matchSchool;
  });

  currentPage = 1;
  renderTable();
}

// GPA Chart
function renderChart() {
  const canvas = document.getElementById("chart1");

  if (chart) {
    chart.destroy();
    chart = null;
  }

  const theme = getTheme();

  const districtMap = {};

  students.forEach(s => {
    const d = s.District;
    if (!districtMap[d]) districtMap[d] = 0;
    if (s.HSC_Result >= 4.0) districtMap[d]++;
  });

  const labels = Object.keys(districtMap);
  const data = labels.map(d => districtMap[d]);

  chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "High Performers (HSC ≥ 4.0)",
        data,
        backgroundColor: theme.primary
      }]
    },
    options: {
      responsive: true,
      animation: false, 

      plugins: {
        title: {
          display: true,
          text: "High Performing Students by District",
          color: theme.text,
          font: {
            size: 18,
            weight: "bold"
          }
        },
        legend: {
          labels: { color: theme.gray }
        }
      },
      scales: {
        x: {
          ticks: { color: theme.text },
          grid: { color: theme.grid }
        },
        y: {
          beginAtZero: true,
          ticks: { color: theme.text },
          grid: { color: theme.grid }
        }
      }
    }
  });
}

// Study Chart
let lineChart;

function renderLineChart() {
  const ctx = document.getElementById("chart2").getContext("2d");
  const isDark = document.body.classList.contains("dark");
  const theme = getTheme();
  const ranges = {
    "0-5 hrs": [],
    "6-10 hrs": [],
    "11-15 hrs": [],
    "16-20 hrs": [],
    "20+ hrs": []
  };

  students.forEach(s => {
    const h = s.Study_Hours_per_Week;

    if (h <= 5) ranges["0-5 hrs"].push(s.HSC_Result);
    else if (h <= 10) ranges["6-10 hrs"].push(s.HSC_Result);
    else if (h <= 15) ranges["11-15 hrs"].push(s.HSC_Result);
    else if (h <= 20) ranges["16-20 hrs"].push(s.HSC_Result);
    else ranges["20+ hrs"].push(s.HSC_Result);
  });

  const labels = Object.keys(ranges);

  const data = labels.map(r => {
    const arr = ranges[r];
    if (arr.length === 0) return 0;
    return Number(
      (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
    );
  });

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Average HSC Result",
        data: data,
        borderColor: theme.primary,
        backgroundColor: theme.primary,
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Study Hours vs Academic Performance",
          color: theme.text,
          font: {
            size: 18,
            weight: "bold"
          }
        },
        legend: {
          labels: { color: theme.gray }
        },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: { color: theme.text },
          grid: { color: theme.grid },
          title: { color: theme.text }
        },
        y: {
          ticks: { color: theme.text },
          grid: { color: theme.grid },
          title: { color: theme.text }
        }
      }
    }
  });
}

//District Chart
let pieChart;

function renderPieChart() {
  const ctx = document.getElementById("chart3").getContext("2d");
  const isDark = document.body.classList.contains("dark");
  const theme = getTheme();
  if (pieChart) pieChart.destroy();

  // 1. Group totals
  const districtMap = {};

  students.forEach(s => {
    const d = s.District;

    if (!districtMap[d]) {
      districtMap[d] = {
        total: 0,
        sum: 0
      };
    }

    districtMap[d].total += 1;
    districtMap[d].sum += s.HSC_Result;
  });

  // 2. Compute average
  const labels = Object.keys(districtMap);

  const data = labels.map(d => {
    const obj = districtMap[d];
    return obj.sum / obj.total;
  });

  // 3. Better labels
  const formattedLabels = labels.map((d, i) =>
    `${d} (${data[i].toFixed(2)})`
  );

  // 4. Chart
  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: formattedLabels,
      datasets: [{
        data: data,
        backgroundColor: [
          "#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0",
          "#9966ff", "#ff9f40", "#00c49a", "#e74c3c"
        ],
        borderColor: isDark ? "#000" : "#fff",
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Average HSC Result by District",
          color: theme.text,
          font: {
            size: 18,
            weight: "bold"
          }
        },
        legend: {
          labels: {
            color: theme.gray
          }
        }
      }
    }
  });
}

// Table Rendering, Sorting, Pagination
function renderTable() {
  const table = document.getElementById("student-table-body");

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageData = filteredStudents.slice(start, end);

  table.innerHTML = pageData.map(row => `
    <tr>
      <td>${row.Student_ID}</td>
      <td>${row.Gender}</td>
      <td>${row.Age}</td>
      <td>${row.District}</td>
      <td>${row.School_Type}</td>
      <td>${row.Family_Income_BDT}</td>
      <td>${row.HSC_Result}</td>
    </tr>
  `).join("");

  document.getElementById("pageInfo").innerText = `Page ${currentPage} of ${Math.ceil(filteredStudents.length / rowsPerPage)}`;
}

function sortTable(key) {
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }

  filteredStudents.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    if (typeof valA === "string") {
      return sortAsc
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortAsc ? valA - valB : valB - valA;
    }
  });

  updateHeaderUI(key);

  currentPage = 1;
  renderTable();
}

function updateHeaderUI(activeKey) {
  document.querySelectorAll("th").forEach(th => {
    const base = th.innerText.replace(" ↑", "").replace(" ↓", "");
    th.innerText = base;

    if (th.dataset.key === activeKey) {
      th.innerText += sortAsc ? " ↑" : " ↓";
    }
  });
}

function setupPagination() {
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentPage < Math.ceil(filteredStudents.length / rowsPerPage)) {
      currentPage++;
      renderTable();
    }
  });
}

// =========================
// CHAT SYSTEM
// =========================
const chatIcon = document.getElementById("chat-icon");
const chatBox = document.getElementById("chat-box");
const closeChat = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("chat-input");
const messages = document.getElementById("chat-messages");

// Open chat
chatIcon.addEventListener("click", () => {
  const isOpen = chatBox.style.display === "flex";
  chatBox.style.display = isOpen ? "none" : "flex";
});

// Close chat
closeChat.addEventListener("click", () => {
  chatBox.style.display = "none";
});

// Send message
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // SMART SHORTCUTS (no API call)
  const lower = text.toLowerCase();

  if (lower.includes("average gpa")) {
    addMessage(document.getElementById("avgHSC").innerText, "bot");
    return;
  }

  if (lower.includes("total students")) {
    addMessage(document.getElementById("totalStudents").innerText, "bot");
    return;
  }

  // typing indicator
  const typing = addMessage("AI is typing...", "bot");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        context: buildAIContext()
      })
    });

    const data = await res.json();

    typing.remove();
    addMessage(data.reply, "bot");

  } catch (err) {
    typing.remove();
    addMessage("Connection error.", "bot");
  }
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div; // IMPORTANT
}

function buildAIContext() {
  const avg = (arr, key) =>
    (arr.reduce((a, b) => a + b[key], 0) / arr.length).toFixed(2);

  // =========================
  // BAR CHART (Chart 1)
  // High performers per district
  // =========================
  const districtMap = {};

  students.forEach(s => {
    if (!districtMap[s.District]) {
      districtMap[s.District] = { total: 0, high: 0, sum: 0 };
    }

    districtMap[s.District].total++;
    districtMap[s.District].sum += s.HSC_Result;

    if (s.HSC_Result >= 4) {
      districtMap[s.District].high++;
    }
  });

  const barChartData = Object.keys(districtMap).map(d => ({
    district: d,
    totalStudents: districtMap[d].total,
    highPerformers: districtMap[d].high,
    avgGPA: +(districtMap[d].sum / districtMap[d].total).toFixed(2)
  }));

  // =========================
  // LINE CHART (Chart 2)
  // Study hours vs GPA
  // =========================
  const studyBuckets = {
    "0-5": [],
    "6-10": [],
    "11-15": [],
    "16-20": [],
    "20+": []
  };

  students.forEach(s => {
    const h = s.Study_Hours_per_Week;

    if (h <= 5) studyBuckets["0-5"].push(s.HSC_Result);
    else if (h <= 10) studyBuckets["6-10"].push(s.HSC_Result);
    else if (h <= 15) studyBuckets["11-15"].push(s.HSC_Result);
    else if (h <= 20) studyBuckets["16-20"].push(s.HSC_Result);
    else studyBuckets["20+"].push(s.HSC_Result);
  });

  const lineChartData = Object.keys(studyBuckets).map(k => ({
    studyHours: k,
    avgGPA: studyBuckets[k].length
      ? +(studyBuckets[k].reduce((a, b) => a + b, 0) / studyBuckets[k].length).toFixed(2)
      : 0
  }));

  // =========================
  // PIE CHART (Chart 3)
  // District GPA distribution
  // =========================
  const pieChartData = Object.keys(districtMap).map(d => ({
    district: d,
    avgGPA: +(districtMap[d].sum / districtMap[d].total).toFixed(2)
  }));

  // =========================
  // FINAL CONTEXT OBJECT
  // =========================
  return {
    summary: {
      totalStudents: students.length,
      avgGPA: avg(students, "HSC_Result"),
      avgAttendance: avg(students, "Attendance"),
      avgStudyHours: avg(students, "Study_Hours_per_Week")
    },

    stats: {
      highPerformers: students.filter(s => s.HSC_Result >= 4).length,
      privateSchoolPercent:
        ((students.filter(s => s.School_Type === "Private").length / students.length) * 100).toFixed(1),
      internetAccessPercent:
        ((students.filter(s => s.Internet_Access === "Yes").length / students.length) * 100).toFixed(1)
    },

    income: {
      avgBDT: (
        students.reduce((a, b) => a + b.Family_Income_BDT, 0) /
        students.length
      ).toFixed(0)
    },

    charts: {
      barChart: barChartData,
      lineChart: lineChartData,
      pieChart: pieChartData
    }
  };
}

// Auto open with greeting
window.addEventListener("load", () => {
  setTimeout(() => {
    chatBox.style.display = "flex";
    addMessage("Hey 👋 I'm your AI assistant. Ask me anything!", "bot");
  }, 1200);
});


// Dark Mode Toggle
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "enabled");
  } else {
    localStorage.setItem("darkMode", "disabled");
  }
  renderChart();
  renderLineChart();
  renderPieChart();

});

loadData();