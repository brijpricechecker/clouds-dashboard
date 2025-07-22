document.getElementById("btnDashboard").addEventListener("click", showDashboard);
document.getElementById("btnPL").addEventListener("click", showPL);
document.getElementById("btnReport").addEventListener("click", showReport);
document.getElementById("yearSelect").addEventListener("change", loadDashboard);
document.getElementById("monthSelect").addEventListener("change", loadDashboard);

function showDashboard() {
  showSection("dashboard");
  loadDashboard();
}

function showPL() {
  showSection("plSection");
}

function showReport() {
  showSection("reportSection");
  loadSalesReport();
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(section => section.style.display = "none");
  document.getElementById(id).style.display = "block";
}

// Populate year dropdown
function populateYearDropdown() {
  const yearSelect = document.getElementById("yearSelect");
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2023; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;
}

populateYearDropdown();

function loadDashboard() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data.kpis);
      drawSalesExpenseChart(data.salesExpense);
      drawExpenseChart(data.expenseChart);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function updateKPIs(kpis) {
  document.getElementById("salesKPI").innerText = `₱${kpis.totalSales.toLocaleString()}`;
  document.getElementById("expensesKPI").innerText = `₱${kpis.totalExpenses.toLocaleString()}`;
  document.getElementById("revenueKPI").innerText = `₱${kpis.revenue.toLocaleString()}`;
  document.getElementById("cashoutKPI").innerText = `₱${kpis.cashout.toLocaleString()}`;
}

let salesExpenseChart;
function drawSalesExpenseChart(data) {
  const ctx = document.getElementById("sales-expense-chart").getContext("2d");
  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: [
        {
          label: "Sales",
          backgroundColor: "#4B49AC",
          data: data.sales
        },
        {
          label: "Expenses",
          backgroundColor: "#FF6384",
          data: data.expenses
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: value => `₱${value.toLocaleString()}`
        },
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

let expenseChart;
function drawExpenseChart(data) {
  const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
  if (expenseChart) expenseChart.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    data: group.values.map(v => parseFloat(v.toFixed(2))),
    backgroundColor: group.color
  }));

  expenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: value => `${value.toFixed(1)}%`
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw;
              return `${context.dataset.label}: ${val.toFixed(1)}%`;
            }
          }
        },
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + "%";
            }
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function loadSalesReport() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("reportContainer").innerHTML = data.reportHTML;
    })
    .catch(err => {
      console.error("Report load failed:", err);
      document.getElementById("reportContainer").innerText = "Failed to load report.";
    });
}

// Load default dashboard
showDashboard();
