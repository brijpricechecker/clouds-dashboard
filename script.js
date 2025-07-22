function showDashboard() {
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('reportView').style.display = 'none';
  loadDashboardData();
}

function showReport() {
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('reportView').style.display = 'block';
  fetchReportHTML();
}

function fetchReportHTML() {
  fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
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

function loadDashboardData() {
  const year = document.getElementById('yearFilter')?.value || '2025';
  const month = document.getElementById('monthFilter')?.value || 'ALL';
  const category = document.getElementById('categoryFilter')?.value || 'ALL';

  const params = new URLSearchParams({ year, month, category });
  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      const { kpis, salesExpense, expenseChart } = data;

      document.getElementById("kpiSales").innerText = `₱${Number(kpis.totalSales).toLocaleString()}`;
      document.getElementById("kpiExpenses").innerText = `₱${Number(kpis.totalExpenses).toLocaleString()}`;
      document.getElementById("kpiRevenue").innerText = `₱${Number(kpis.revenue).toLocaleString()}`;
      document.getElementById("kpiCashout").innerText = `₱${Number(kpis.cashout).toLocaleString()}`;

      drawSalesExpenseChart(salesExpense);
      drawExpensePercentChart(expenseChart);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function drawSalesExpenseChart(data) {
  const ctx = document.getElementById("salesExpenseChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: [
        {
          label: "Sales",
          backgroundColor: "#2F8BCC",
          data: data.sales
        },
        {
          label: "Expenses",
          backgroundColor: "#f77",
          data: data.expenses
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function drawExpensePercentChart(data) {
  const ctx = document.getElementById("expensePercentChart").getContext("2d");
  const datasets = data.groups.map(group => ({
    label: group.name,
    backgroundColor: group.color || "#ccc",
    data: group.values.map(v => v * 100) // convert decimal to percent
  }));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: context => `${context.parsed.y.toFixed(1)}%`
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

document.addEventListener("DOMContentLoaded", () => {
  showDashboard();

  document.getElementById('yearFilter')?.addEventListener('change', loadDashboardData);
  document.getElementById('monthFilter')?.addEventListener('change', loadDashboardData);
  document.getElementById('categoryFilter')?.addEventListener('change', loadDashboardData);
});
