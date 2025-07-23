const deployedWebAppUrl = 'https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnDashboard').addEventListener('click', showDashboard);
  document.getElementById('btnPL').addEventListener('click', showPL);
  document.getElementById('btnReport').addEventListener('click', showReport);

  document.getElementById('monthSelect').addEventListener('change', loadDashboard);
  document.getElementById('yearSelect').addEventListener('change', loadDashboard);

  populateYearDropdown();
  showDashboard();
});

function showDashboard() {
  setActiveTab('dashboard');
  loadDashboard();
}

function showPL() {
  setActiveTab('plSection');
  loadPL();
}

function showReport() {
  setActiveTab('reportSection');
  loadReport();
}

function setActiveTab(tabId) {
  document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

function populateYearDropdown() {
  const select = document.getElementById('yearSelect');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2020; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    select.appendChild(option);
  }
  select.value = currentYear;
}

function loadDashboard() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('salesKPI').innerText = `₱${data.kpis.totalSales.toLocaleString()}`;
      document.getElementById('expensesKPI').innerText = `₱${data.kpis.totalExpenses.toLocaleString()}`;
      document.getElementById('revenueKPI').innerText = `₱${data.kpis.revenue.toLocaleString()}`;
      document.getElementById('cashoutKPI').innerText = `₱${data.kpis.cashout.toLocaleString()}`;

      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function drawExpenseChart(chartData) {
  const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
  if (window.expenseChartInstance) window.expenseChartInstance.destroy();

  const datasets = chartData.groups.map(group => ({
    label: group.name,
    data: group.values.map(v => v.toFixed(2)),
    backgroundColor: group.color
  }));

  window.expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.months,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Expense % of Sales'
        },
        datalabels: {
          formatter: (value) => `${value}%`,
          anchor: 'end',
          align: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => `${val}%` }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesExpenseChart(chartData) {
  const ctx = document.getElementById('sales-expense-chart').getContext('2d');
  if (window.salesExpenseInstance) window.salesExpenseInstance.destroy();

  window.salesExpenseInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.months,
      datasets: [
        {
          label: 'Sales',
          data: chartData.sales,
          backgroundColor: '#4b49ac'
        },
        {
          label: 'Expenses',
          data: chartData.expenses,
          backgroundColor: '#f66'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Sales vs Expenses'
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: val => `₱${Number(val).toLocaleString()}`
        }
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

function loadPL() {
  document.getElementById('plTable').innerHTML = "Loading...";
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('plTable').innerHTML = data.reportHTML;
    });
}

function loadReport() {
  document.getElementById('reportContainer').innerHTML = "Loading...";
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('reportContainer').innerHTML = `
        <div style="margin-bottom: 10px;">
          <button onclick="downloadPDF()" style="margin-right: 10px;">⬇️ Export to PDF</button>
          <button onclick="sendEmail()">📧 Email this Report</button>
        </div>
        ${data.reportHTML}
      `;
    });
}

function downloadPDF() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?action=pdf&year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.base64}`;
      link.download = data.filename || "report.pdf";
      link.click();
    })
    .catch(err => {
      alert("❌ Failed to download PDF.");
      console.error(err);
    });
}

function sendEmail() {
  const year = document.getElementById('yearSelect').value;
  const month = document.getElementById('monthSelect').value;

  fetch(`${deployedWebAppUrl}?action=email&year=${year}&month=${month}`)
    .then(res => res.text())
    .then(message => {
      alert(message);
    })
    .catch(err => {
      alert("❌ Failed to send email.");
      console.error(err);
    });
}
