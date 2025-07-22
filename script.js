let salesExpenseChart, expenseChart;

function showDashboard() {
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('reportView').style.display = 'none';
  loadDashboard();
}

function showReport() {
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('reportView').style.display = 'block';
  fetchReportHTML();
}

// === LOAD DASHBOARD DATA ===
function loadDashboard() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const category = document.getElementById("categorySelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}&category=${category}`)
    .then(res => res.json())
    .then(data => {
      drawKPIs(data.kpis);
      drawCharts(data.expenseChart, data.salesExpense);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

// === DRAW KPIs ===
function drawKPIs(kpis) {
  const kpiHTML = `
    <div class="kpi-box">
      <h3>Total Sales</h3><p>₱${kpis.totalSales.toLocaleString()}</p>
    </div>
    <div class="kpi-box">
      <h3>Total Expenses</h3><p>₱${kpis.totalExpenses.toLocaleString()}</p>
    </div>
    <div class="kpi-box">
      <h3>Revenue</h3><p>₱${kpis.revenue.toLocaleString()}</p>
    </div>
    <div class="kpi-box">
      <h3>Total Cashout</h3><p>₱${kpis.cashout.toLocaleString()}</p>
    </div>
  `;
  document.getElementById("kpis").innerHTML = kpiHTML;
}

// === DRAW CHARTS ===
function drawCharts(expenseChartData, salesExpenseData) {
  const months = salesExpenseData.months;

  // Sales vs Expense Chart
  if (salesExpenseChart) salesExpenseChart.destroy();
  const ctx1 = document.getElementById("salesExpenseChart").getContext("2d");
  salesExpenseChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Sales",
          data: salesExpenseData.sales,
          backgroundColor: "#4B49AC"
        },
        {
          label: "Expenses",
          data: salesExpenseData.expenses,
          backgroundColor: "#FF8C94"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Expense % Chart
  if (expenseChart) expenseChart.destroy();
  const ctx2 = document.getElementById("expenseChart").getContext("2d");
  const datasets = expenseChartData.groups.map(group => ({
    label: group.name,
    data: group.values.map(p => (p * 100).toFixed(1)), // convert 0.36 → 36.0
    backgroundColor: group.color
  }));

  expenseChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: expenseChartData.months,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val + "%"
          }
        }
      }
    }
  });
}

// === LOAD REPORT VIEW ===
function fetchReportHTML() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=report&year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      const rawHTML = data.reportHTML;
      const styledHTML = styleReportHTML(rawHTML);
      document.getElementById('reportContainer').innerHTML = styledHTML;
    })
    .catch(err => {
      document.getElementById('reportContainer').innerHTML = "Failed to load report.";
      console.error("Error loading report:", err);
    });
}

// === STYLE REPORT ROWS ===
function styleReportHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('tr');

  const styleMap = {
    "net sales": "highlight-net-sales",
    "FOOD & BEVERAGES PURCHASES": "section-label",
    "gross income": "highlight-gross-income",
    "FIXED EXPENSE": "section-label",
    "total fixed expense": "highlight-total",
    "LABOR": "section-label",
    "total labor expense": "highlight-total",
    "OPERATING EXPENSE": "section-label",
    "total operating expense": "highlight-total",
    "MISCELLANEOUS EXPENSES": "section-label",
    "total misc expense": "highlight-total",
    "TOTAL EXPENSES (CASHOUT)": "highlight-total-expenses",
    "NET CASH FLOW FROM OPERATIONS": "highlight-net-cash-flow"
  };

  rows.forEach((tr, index) => {
    if (index === 0) return;
    const label = (tr.cells[0]?.textContent || "").toLowerCase().trim();
    for (const key in styleMap) {
      if (label.includes(key.toLowerCase())) {
        tr.classList.add(styleMap[key]);
        break;
      }
    }
  });

  return doc.body.innerHTML;
}

// === PDF EXPORT ===
function downloadPDF() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  window.open(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=download&year=${year}&month=${month}`, '_blank');
}

function sendPDFEmail() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=email&year=${year}&month=${month}`)
    .then(res => res.text())
    .then(msg => alert("Email sent: " + msg))
    .catch(err => alert("Error sending email."));
}

// Load dashboard by default
showDashboard();
