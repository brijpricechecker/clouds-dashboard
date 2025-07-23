const deployedWebAppUrl = 'https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec';

document.addEventListener('DOMContentLoaded', () => {
  populateYearDropdown();
  showSection('dashboard');
  loadDashboard();
});

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';

  if (sectionId === 'reportSection') loadReport();
  if (sectionId === 'plSection') loadPL();
}

function populateYearDropdown() {
  const select = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
  select.value = currentYear;
}

function loadDashboard() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data.kpis);
      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function updateKPIs(kpi) {
  document.getElementById('salesKPI').innerText = `₱${kpi.totalSales.toLocaleString()}`;
  document.getElementById('expensesKPI').innerText = `₱${kpi.totalExpenses.toLocaleString()}`;
  document.getElementById('revenueKPI').innerText = `₱${kpi.revenue.toLocaleString()}`;
  document.getElementById('cashoutKPI').innerText = `₱${kpi.cashout.toLocaleString()}`;
}

let expenseChartInstance;
function drawExpenseChart(data) {
  const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
  if (expenseChartInstance) expenseChartInstance.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    data: group.values,
    backgroundColor: group.color,
  }));

  expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Expense % of Sales',
          font: { size: 18 }
        },
        datalabels: {
          formatter: val => val + '%',
          color: '#333'
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value + '%'
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

let salesExpenseChart;
function drawSalesExpenseChart(data) {
  const ctx = document.getElementById('sales-expense-chart').getContext('2d');
  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctx, {
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
          backgroundColor: '#FF6B6B'
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Sales vs Expenses',
          font: { size: 18 }
        },
        datalabels: {
          color: '#444',
          anchor: 'end',
          align: 'top',
          formatter: val => '₱' + val.toLocaleString()
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => '₱' + val.toLocaleString()
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function loadPL() {
  // If you have a separate endpoint, fetch it here.
  document.getElementById('plTable').innerHTML = '<p>Coming soon...</p>';
}

function loadReport() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('reportContainer').innerHTML = data.reportHTML;
    })
    .catch(err => {
      document.getElementById('reportContainer').innerText = "Failed to load report.";
      console.error("Error loading report:", err);
    });
}

function exportToPDF() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  const url = `${deployedWebAppUrl}?action=pdf&year=${year}&month=${month}`;
  window.open(url, '_blank');
}

function emailReport() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?action=email&year=${year}&month=${month}`)
    .then(res => res.text())
    .then(msg => {
      alert(msg || "Report email sent.");
    })
    .catch(err => {
      alert("Failed to send report.");
      console.error("Email error:", err);
    });
}
