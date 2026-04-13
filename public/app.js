let students = [];
let currentPage = 1;
let chart;
let currentChartType = "gpa";
let sortKey = null;
let sortAsc = true;
let filteredStudents = [];

const rowsPerPage = 10;
const toggleBtn = document.getElementById("darkToggle");
const chartSelector = document.getElementById("chartSelector");

// Load data from API and initialize dashboard

async function loadData() {
  const res = await fetch("/api/students");
  students = await res.json();

  
  document.getElementById("total").innerText = students.length;

  const gpas = students.map(d => d.HSC_Result);
  const avg = (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);
  const max = Math.max(...gpas);

  document.getElementById("avg").innerText = avg;
  document.getElementById("max").innerText = max;

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

  showSelectedChart(currentChartType);
  updateCards(currentChartType);
  renderTable();
  setupPagination();
}

// Chart rendering functions

function showSelectedChart(type) {
  // Hide all charts first
  document.getElementById("chart1").style.display = "none";
  document.getElementById("chart2").style.display = "none";
  document.getElementById("chart3").style.display = "none";

  if (type === "gpa") {
    document.getElementById("chart1").style.display = "block";
    renderChart();
  } 
  else if (type === "attendance") {
    document.getElementById("chart2").style.display = "block";
    renderLineChart();
  } 
  else if (type === "study") {
    document.getElementById("chart3").style.display = "block";
    renderPieChart();
  }
}

// Chart type selector

chartSelector.addEventListener("change", (e) => {
  currentChartType = e.target.value;
  showSelectedChart(currentChartType);
  updateCards(currentChartType);
  setTimeout(() => {
  window.dispatchEvent(new Event('resize'));
}, 50);
});

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

// Update metric cards based on selected chart type

function updateCards(type) {
  const total = students.length;
  let label1 = "Total Students", label2, label3, avglabel, maxlabel;

  if (type === "gpa") {
    const gpas = students.map(s => s.HSC_Result);
    const avg = (gpas.reduce((a, b) => a + b, 0) / total).toFixed(2);
    const max = Math.max(...gpas);

    label2 = "Average GPA";
    label3 = "Max GPA";
    avglabel = avg;
    maxlabel = max;
    
  }

  else if (type === "attendance") {
    const avgAttendance = (
      students.reduce((a, b) => a + b.Attendance, 0) / total
    ).toFixed(1);



    const maxAttendance = Math.max(...students.map(s => s.Attendance));
    

    label2 = "Average Attendance";
    label3 = "Max Attendance";
    avglabel = avgAttendance + "%";
    maxlabel = maxAttendance + "%";
    
  }

  else if (type === "study") {
    const avgStudy = (
      students.reduce((a, b) => a + b.Study_Hours_per_Week, 0) / total
    ).toFixed(1);

    const maxStudy = Math.max(...students.map(s => s.Study_Hours_per_Week));
    label2 = "Average Study Hours";
    label3 = "Max Study Hours";
    avglabel = avgStudy + " hrs";
    maxlabel = maxStudy + " hrs";
  }

  document.querySelector(".label1").innerText = `${label1}: ${total}`;
  document.querySelector(".label2").innerText = `${label2}: ${avglabel}`;
  document.querySelector(".label3").innerText = `${label3}: ${maxlabel}`;

}

// GPA Chart
function renderChart() {
  const ctx = document.getElementById("chart1");
  const isDark = document.body.classList.contains("dark");

  // Destroy old chart before creating new one
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: students.map(s => s.Student_ID),
      datasets: [{
        label: "HSC Result",
        data: students.map(s => s.HSC_Result),
        fill: false,
        borderColor: isDark ? "#00ff88" : "#2d7ef7",
        backgroundColor: isDark ? "#00ff88" : "#2d7ef7",
        pointBackgroundColor: isDark ? "#00ff88" : "#2d7ef7",
      }]
    },
    options: {
      scales: {
        x: {
          ticks: { color: isDark ? "#00ff88" : "#000" },
          grid: { display: isDark }
        },
        y: {
          ticks: { color: isDark ? "#00ff88" : "#000" },
          grid: { display: isDark }
        }
      },
      plugins: {
        legend: {
          labels: { color: isDark ? "#00ff88" : "#000" }
        }
      }
    }
  });
}

// Attendance Chart
let lineChart;

function renderLineChart() {
  const ctx = document.getElementById("chart2").getContext("2d");
  const isDark = document.body.classList.contains("dark");

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: students.map(s => s.Student_ID),
      datasets: [{
        label: "Attendance (%)",
        data: students.map(s => s.Attendance),
        fill: false,
        borderColor: isDark ? "#00ff88" : "#2d7ef7",
        backgroundColor: isDark ? "#00ff88" : "#2d7ef7",
        pointBackgroundColor: isDark ? "#00ff88" : "#2d7ef7",
        tension: 0.3
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: isDark ? "#00ff88" : "#000"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? "#00ff88" : "#000" }
        },
        y: {
          ticks: { color: isDark ? "#00ff88" : "#000" }
        }
      }
    }
  });
}

//Study Hours Chart

let pieChart;

function renderPieChart() {
  const ctx = document.getElementById("chart3").getContext("2d");
  const isDark = document.body.classList.contains("dark");

  if (pieChart) pieChart.destroy();

  const labels = students.map(s => s.Student_ID).slice(0, 10);
  const data = students.map(s => s.Study_Hours_per_Week).slice(0, 10);

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Study Hours",
        data,
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffcd56",
          "#4bc0c0",
          "#9966ff",
          "#ff9f40",
          "#00c49a",
          "#e74c3c",
          "#3498db",
          "#9b59b6"
        ],
        borderColor: isDark ? "#000" : "#fff",
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: isDark ? "#00ff88" : "#000"
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

  showSelectedChart(currentChartType);
});

loadData();