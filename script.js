document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('month').addEventListener('change', loadDashboard);
  document.getElementById('year').addEventListener('change', loadDashboard);
  document.getElementById('downloadPDF').addEventListener('click', downloadPDF);
  document.getElementById('emailReport').addEventListener('click', sendEmail);
  loadDashboard();
});

function loadDashboard() {
  const year = document.getElementById('year').value;
  const month = document.getElementById('month').value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data.kpis);
      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
      document.getElementById('reportSection').innerHTML = data.reportHTML;
    })
    .catch(err => {
      console.error('Dashboard data fetch failed:', err);
    });
}

function updateKPIs(kpis) {
  document.getElementById('totalSales').innerText = kpis.totalSales.toLocaleString();
  document.getElementById('totalExpenses').innerText = kpis.totalExpenses.toLocaleString();
  document.getElementById('revenue').innerText = kpis.revenue.toLocaleString();
  document.getElementById('cashout').innerText = kpis.cashout.toLocaleString();
}

function drawExpenseChart(chartData) {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  if (window.expenseChartInstance) window.expenseChartInstance.destroy();

  const datasets = chartData.groups.map(group => ({
    label: group.name,
    data: group.values,
    backgroundColor: group.color
  }));

  window.expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.months,
      datasets
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: '% of Sales by Expense Group'
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value}%`
          }
        }
      }
    }
  });
}

function drawSalesExpenseChart(chartData) {
  const ctx = document.getElementById('salesExpenseChart').getContext('2d');
  if (window.salesExpenseChartInstance) window.salesExpenseChartInstance.destroy();

  window.salesExpenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.months,
      datasets: [
        {
          label: 'Sales',
          data: chartData.sales,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Expenses',
          data: chartData.expenses,
          backgroundColor: '#F44336'
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Sales vs Expenses'
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ₱${ctx.raw.toLocaleString()}`
          }
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `₱${value}`
          }
        }
      }
    }
  });
}

function downloadPDF() {
  const element = document.getElementById('reportContainer');
  const opt = {
    margin: 0.5,
    filename: `Sales_Expense_Report_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

function sendEmail() {
  fetch('https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?action=email')
    .then(res => {
      if (res.ok) {
        alert('Report email sent successfully!');
      } else {
        alert('Failed to send email.');
      }
    })
    .catch(err => {
      console.error('Email failed:', err);
      alert('Email sending error. See console for details.');
    });
}
