document.addEventListener('DOMContentLoaded', function () {
  const dashboard = document.getElementById('dashboard');
  const plSection = document.getElementById('plSection');
  const reportSection = document.getElementById('reportSection');
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');
  const salesKPI = document.getElementById('salesKPI');
  const expensesKPI = document.getElementById('expensesKPI');
  const revenueKPI = document.getElementById('revenueKPI');
  const cashoutKPI = document.getElementById('cashoutKPI');
  const reportContainer = document.getElementById('reportContainer');

  document.getElementById('btnDashboard').addEventListener('click', showDashboard);
  document.getElementById('btnPL').addEventListener('click', showPL);
  document.getElementById('btnReport').addEventListener('click', showReport);

  let selectedYear = new Date().getFullYear();
  let selectedMonth = 'all';

  function populateYearSelect() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2023; y--) {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      if (y === selectedYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  }

  yearSelect.addEventListener('change', () => {
    selectedYear = yearSelect.value;
    loadDashboard();
  });

  monthSelect.addEventListener('change', () => {
    selectedMonth = monthSelect.value;
    loadDashboard();
  });

  function showDashboard() {
    dashboard.style.display = 'block';
    plSection.style.display = 'none';
    reportSection.style.display = 'none';
    loadDashboard();
  }

  function showPL() {
    dashboard.style.display = 'none';
    plSection.style.display = 'block';
    reportSection.style.display = 'none';
    loadPL();
  }

  function showReport() {
    dashboard.style.display = 'none';
    plSection.style.display = 'none';
    reportSection.style.display = 'block';
    loadReport();
  }

  function loadDashboard() {
    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${selectedYear}&month=${selectedMonth}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const { kpis, expenseChart, salesExpense } = data;

        salesKPI.innerText = `₱${kpis.totalSales.toLocaleString()}`;
        expensesKPI.innerText = `₱${kpis.totalExpenses.toLocaleString()}`;
        revenueKPI.innerText = `₱${kpis.revenue.toLocaleString()}`;
        cashoutKPI.innerText = `₱${kpis.cashout.toLocaleString()}`;

        drawExpenseChart(expenseChart);
        drawSalesExpenseChart(salesExpense);
      })
      .catch(err => console.error("Dashboard data fetch failed:", err));
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
    if (window.expenseChart) window.expenseChart.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      data: group.values.map(v => v.toFixed(2)),
      backgroundColor: group.color
    }));

    window.expenseChart = new Chart(ctx, {
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
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
            }
          },
          datalabels: {
            formatter: value => `${value}%`,
            anchor: 'end',
            align: 'top'
          }
        },
        scales: {
          y: {
            title: { display: true, text: '% of Sales' },
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById('sales-expense-chart').getContext('2d');
    if (window.salesChart) window.salesChart.destroy();

    window.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: [
          {
            label: 'Sales',
            backgroundColor: '#4b49ac',
            data: data.sales
          },
          {
            label: 'Expenses',
            backgroundColor: '#98BDFF',
            data: data.expenses
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `₱${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Amount (₱)'
            }
          }
        }
      }
    });
  }

  function loadPL() {
    document.getElementById('plTable').innerHTML = "Loading...";
    fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
      .then(res => res.json())
      .then(data => {
        document.getElementById('plTable').innerHTML = data.reportHTML;
      });
  }

  function loadReport() {
    reportContainer.innerHTML = "Loading...";
    fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
      .then(res => res.json())
      .then(data => {
        reportContainer.innerHTML = `
          <div style="margin-bottom:10px;">
            <button onclick="downloadPDF()">Export to PDF</button>
            <button onclick="emailReport()">Email this Report</button>
          </div>
          ${data.reportHTML}
        `;
      });
  }

  // === Export PDF ===
  window.downloadPDF = function () {
    const reportHtml = encodeURIComponent(document.getElementById('reportContainer').innerHTML);
    const pdfUrl = `document.addEventListener('DOMContentLoaded', function () {
  const dashboard = document.getElementById('dashboard');
  const plSection = document.getElementById('plSection');
  const reportSection = document.getElementById('reportSection');
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');
  const salesKPI = document.getElementById('salesKPI');
  const expensesKPI = document.getElementById('expensesKPI');
  const revenueKPI = document.getElementById('revenueKPI');
  const cashoutKPI = document.getElementById('cashoutKPI');
  const reportContainer = document.getElementById('reportContainer');

  document.getElementById('btnDashboard').addEventListener('click', showDashboard);
  document.getElementById('btnPL').addEventListener('click', showPL);
  document.getElementById('btnReport').addEventListener('click', showReport);

  let selectedYear = new Date().getFullYear();
  let selectedMonth = 'all';

  function populateYearSelect() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2023; y--) {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      if (y === selectedYear) option.selected = true;
      yearSelect.appendChild(option);
    }
  }

  yearSelect.addEventListener('change', () => {
    selectedYear = yearSelect.value;
    loadDashboard();
  });

  monthSelect.addEventListener('change', () => {
    selectedMonth = monthSelect.value;
    loadDashboard();
  });

  function showDashboard() {
    dashboard.style.display = 'block';
    plSection.style.display = 'none';
    reportSection.style.display = 'none';
    loadDashboard();
  }

  function showPL() {
    dashboard.style.display = 'none';
    plSection.style.display = 'block';
    reportSection.style.display = 'none';
    loadPL();
  }

  function showReport() {
    dashboard.style.display = 'none';
    plSection.style.display = 'none';
    reportSection.style.display = 'block';
    loadReport();
  }

  function loadDashboard() {
    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${selectedYear}&month=${selectedMonth}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const { kpis, expenseChart, salesExpense } = data;

        salesKPI.innerText = `₱${kpis.totalSales.toLocaleString()}`;
        expensesKPI.innerText = `₱${kpis.totalExpenses.toLocaleString()}`;
        revenueKPI.innerText = `₱${kpis.revenue.toLocaleString()}`;
        cashoutKPI.innerText = `₱${kpis.cashout.toLocaleString()}`;

        drawExpenseChart(expenseChart);
        drawSalesExpenseChart(salesExpense);
      })
      .catch(err => console.error("Dashboard data fetch failed:", err));
  }

  function drawExpenseChart(data) {
    const ctx = document.getElementById('grouped-expense-chart').getContext('2d');
    if (window.expenseChart) window.expenseChart.destroy();

    const datasets = data.groups.map(group => ({
      label: group.name,
      data: group.values.map(v => v.toFixed(2)),
      backgroundColor: group.color
    }));

    window.expenseChart = new Chart(ctx, {
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
              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
            }
          },
          datalabels: {
            formatter: value => `${value}%`,
            anchor: 'end',
            align: 'top'
          }
        },
        scales: {
          y: {
            title: { display: true, text: '% of Sales' },
            ticks: {
              callback: value => value + '%'
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesExpenseChart(data) {
    const ctx = document.getElementById('sales-expense-chart').getContext('2d');
    if (window.salesChart) window.salesChart.destroy();

    window.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.months,
        datasets: [
          {
            label: 'Sales',
            backgroundColor: '#4b49ac',
            data: data.sales
          },
          {
            label: 'Expenses',
            backgroundColor: '#98BDFF',
            data: data.expenses
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `₱${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Amount (₱)'
            }
          }
        }
      }
    });
  }

  function loadPL() {
    document.getElementById('plTable').innerHTML = "Loading...";
    fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
      .then(res => res.json())
      .then(data => {
        document.getElementById('plTable').innerHTML = data.reportHTML;
      });
  }

  function loadReport() {
    reportContainer.innerHTML = "Loading...";
    fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec')
      .then(res => res.json())
      .then(data => {
        reportContainer.innerHTML = `
          <div style="margin-bottom:10px;">
            <button onclick="downloadPDF()">Export to PDF</button>
            <button onclick="emailReport()">Email this Report</button>
          </div>
          ${data.reportHTML}
        `;
      });
  }

  // === Export PDF ===
  window.downloadPDF = function () {
    const reportHtml = encodeURIComponent(document.getElementById('reportContainer').innerHTML);
    const pdfUrl = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?action=downloadPDF&html=${reportHtml}`;
    window.open(pdfUrl, '_blank');
  };

  // === Email Report ===
  window.emailReport = function () {
    fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?action=email`)
      .then(res => res.text())
      .then(msg => alert(msg))
      .catch(err => alert("Failed to send report."));
  };

  // === Show deployed web app URL ===
  const scriptUrl = window.location.href.split('?')[0];
  const urlBox = document.getElementById('webAppUrl');
  if (urlBox) {
    urlBox.innerText = `Web App URL: ${scriptUrl}`;
  }

  populateYearSelect();
  showDashboard(); // Default view
});
?action=downloadPDF&html=${reportHtml}`;
    window.open(pdfUrl, '_blank');
  };

  // === Email Report ===
  window.emailReport = function () {
    fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?action=email`)
      .then(res => res.text())
      .then(msg => alert(msg))
      .catch(err => alert("Failed to send report."));
  };

  // === Show deployed web app URL ===
  const scriptUrl = window.location.href.split('?')[0];
  const urlBox = document.getElementById('webAppUrl');
  if (urlBox) {
    urlBox.innerText = `Web App URL: ${scriptUrl}`;
  }

  populateYearSelect();
  showDashboard(); // Default view
});
