let currentYear = new Date().getFullYear();

document.getElementById("btnDashboard").onclick = showDashboard;
document.getElementById("btnPL").onclick = showPL;
document.getElementById("btnReport").onclick = showReport;
document.getElementById("yearSelect").onchange = loadDashboard;
document.getElementById("monthSelect").onchange = loadDashboard;

function showDashboard() {
  showSection("dashboard");
  loadDashboard();
}

function showPL() {
  showSection("plSection");
  // Add load logic if needed
}

function showReport() {
  showSection("reportSection");
  loadReport();
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

// Load years in dropdown
function populateYearDropdown() {
  const select = document.getElementById("yearSelect");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
  select.value = currentYear;
}

// Load dashboard data
function loadDashboard() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("salesKPI").innerText = formatCurrency(data.kpis.totalSales);
      document.getElementById("expensesKPI").innerText = formatCurrency(data.kpis.totalExpenses);
      document.getElementById("revenueKPI").innerText = formatCurrency(data.kpis.revenue);
      document.getElementById("cashoutKPI").innerText = formatCurrency(data.kpis.cashout);

      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function formatCurrency(num) {
  return "₱" + Number(num).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function drawExpenseChart(data) {
  const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
  if (window.expenseChartInstance) window.expenseChartInstance.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    backgroundColor: group.color,
    data: group.values
  }));

  window.expenseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      plugins: {
        datalabels: {
          formatter: val => val + "%",
          color: "#444"
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => val + "%" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesExpenseChart(data) {
  const ctx = document.getElementById("sales-expense-chart").getContext("2d");
  if (window.salesChartInstance) window.salesChartInstance.destroy();

  window.salesChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: [
        {
          label: "Sales",
          backgroundColor: "#4b49ac",
          data: data.sales
        },
        {
          label: "Expenses",
          backgroundColor: "#34b1aa",
          data: data.expenses
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          formatter: value => "₱" + value.toLocaleString(),
          anchor: "end",
          align: "top",
          color: "#000"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => "₱" + val.toLocaleString()
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function loadReport() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("reportContainer").innerHTML = data.reportHTML;
    })
    .catch(err => {
      console.error("Report load failed:", err);
    });
}

function exportToPDF() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?pdf=1&year=${year}&month=${month}`;
  window.open(url, "_blank");
}

function sendEmail() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?email=1&year=${year}&month=${month}`)
    .then(res => res.text())
    .then(msg => {
      alert("Report email sent!");
    })
    .catch(err => {
      console.error("Email send failed:", err);
      alert("Failed to send email.");
    });
}

// Init
populateYearDropdown();
showDashboard();
