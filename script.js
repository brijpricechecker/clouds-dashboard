document.addEventListener('DOMContentLoaded', () => {
  setupTabButtons();
  loadInitialData();
});

function setupTabButtons() {
  document.getElementById('btnDashboard').addEventListener('click', () => {
    showSection('dashboard');
  });

  document.getElementById('btnPL').addEventListener('click', () => {
    showSection('plSection');
  });

  document.getElementById('btnReport').addEventListener('click', () => {
    showSection('reportSection');
    fetchReportHTML();
  });
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

function loadInitialData() {
  const yearSelect = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  document.getElementById('monthSelect').addEventListener('change', loadDashboardData);
  yearSelect.addEventListener('change', loadDashboardData);

  loadDashboardData();
}

function loadDashboardData() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data.kpis);
      renderGroupedExpenseChart(data.expenseChart);
      renderSalesExpenseChart(data.salesExpense);
      document.getElementById('reportContainer').innerHTML = styleReportHTML(data.reportHTML);
    })
    .catch(err => {
      console.error('Error loading dashboard:', err);
    });
}

function updateKPIs(kpis) {
  document.getElementById('salesKPI').textContent = `₱${kpis.totalSales.toLocaleString()}`;
  document.getElementById('expensesKPI').textContent = `₱${kpis.totalExpenses.toLocaleString()}`;
  document.getElementById('revenueKPI').textContent = `₱${kpis.revenue.toLocaleString()}`;
  document.getElementById('cashoutKPI').textContent = `₱${kpis.cashout.toLocaleString()}`;
}

function renderGroupedExpenseChart(data) {
  const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
  if (window.expenseChartInstance) window.expenseChartInstance.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    data: group.values,
    backgroundColor: group.color
  }));

  window.expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: '% of Sales per Expense Group'
        },
        datalabels: {
          display: true,
          formatter: v => `${v}%`,
          color: '#000'
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function renderSalesExpenseChart(data) {
  const ctx = document.getElementById('sales-expense-chart').getContext('2d');
  if (window.salesExpenseChartInstance) window.salesExpenseChartInstance.destroy();

  window.salesExpenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Sales',
          data: data.sales,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Expenses',
          data: data.expenses,
          backgroundColor: '#FF6B6B'
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Sales vs Expenses'
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: v => `₱${v.toLocaleString()}`
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function fetchReportHTML() {
  fetch('https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec')
    .then(res => res.json())
    .then(data => {
      const styledHTML = styleReportHTML(data.reportHTML);
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
    if (index === 0) return; // Header
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
