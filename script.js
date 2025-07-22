// Replace with your actual Apps Script deployed URL:
const DEPLOYED_URL = 'https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec';

function showDashboard() {
  document.getElementById('dashboardView').style.display = 'block';
  document.getElementById('reportView').style.display = 'none';
  fetchDashboardData();
}

function showReport() {
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('reportView').style.display = 'block';
  fetchReportHTML();
}

function fetchDashboardData() {
  fetch(DEPLOYED_URL)
    .then(res => res.json())
    .then(data => {
      const kpi = data.kpis;

      document.getElementById('salesKPI').innerText = kpi.totalSales.toLocaleString();
      document.getElementById('expensesKPI').innerText = kpi.totalExpenses.toLocaleString();
      document.getElementById('revenueKPI').innerText = kpi.revenue.toLocaleString();
      document.getElementById('cashoutKPI').innerText = kpi.cashout.toLocaleString();

      renderGroupedExpenseChart(data.expenseChart);
      renderSalesExpenseChart(data.salesExpense);
    })
    .catch(err => {
      console.error('Dashboard data fetch failed:', err);
    });
}

function fetchReportHTML() {
  fetch(DEPLOYED_URL)
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
    if (index === 0) return; // skip header
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

function renderGroupedExpenseChart(data) {
  const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
  if (window.groupedExpenseChart) window.groupedExpenseChart.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    backgroundColor: group.color,
    data: group.values.map(v => parseFloat(v.toFixed(2)))
  }));

  window.groupedExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`
          }
        },
        legend: { position: 'top' },
        title: { display: true, text: 'Expense as % of Sales' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value + '%'
          }
        }
      }
    }
  });
}

function renderSalesExpenseChart(data) {
  const ctx = document.getElementById('sales-expense-chart').getContext('2d');
  if (window.salesExpenseChart) window.salesExpenseChart.destroy();

  window.salesExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Sales',
          data: data.sales,
          backgroundColor: '#2F8BCC'
        },
        {
          label: 'Expenses',
          data: data.expenses,
          backgroundColor: '#FFB64D'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Monthly Sales vs Expenses'
        }
      }
    }
  });
}
