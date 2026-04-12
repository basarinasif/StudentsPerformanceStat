let students = [];
let currentPage = 1;
const rowsPerPage = 10;

async function loadData() {
  const res = await fetch("/api/students");
  students = await res.json();

  // =========================
  // TOP KPIs (existing)
  // =========================
  document.getElementById("total").innerText = students.length;

  const gpas = students.map(d => d.HSC_Result);
  const avg = (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);
  const max = Math.max(...gpas);

  document.getElementById("avg").innerText = avg;
  document.getElementById("max").innerText = max;

  // =========================
  // CHART
  // =========================
  const ctx = document.getElementById("chart1");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: students.map(s => s.Student_ID),
      datasets: [{
        label: "HSC Result",
        data: gpas
      }]
    }
  });

  // =========================
  // 🔽 NEW: BOTTOM DASHBOARD KPIs
  // =========================

  // Total Students
  document.getElementById("totalStudents").innerText = students.length;

  // Average Attendance
  const avgAttendance = (
    students.reduce((a, b) => a + b.Attendance, 0) / students.length
  ).toFixed(1);
  document.getElementById("avgAttendance").innerText = avgAttendance + "%";

  const highAttendance = students.filter(s => s.Attendance >= 80).length;

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
  // =========================
 


  renderTable();
  setupPagination();
}

function renderTable() {
  const table = document.getElementById("student-table-body");

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageData = students.slice(start, end);

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

  document.getElementById("pageInfo").innerText =
    `Page ${currentPage} of ${Math.ceil(students.length / rowsPerPage)}`;
}

function setupPagination() {
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentPage < Math.ceil(students.length / rowsPerPage)) {
      currentPage++;
      renderTable();
    }
  });
}

loadData();