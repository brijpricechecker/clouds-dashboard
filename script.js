document.addEventListener('DOMContentLoaded', function () {
  const yearSelect = document.getElementById("year");
  const monthSelect = document.getElementById("month");

  yearSelect.addEventListener("change", loadDashboard);
  monthSelect.addEventListener("change", loadDashboard);
  document.getElementById("downloadPDF").addEventListener("click", downloadPDF);
  document.getElementById("emailReport").addEventListener("click", sendEmail);

  loadDashboard();
});

function loadDashboard() {
  const year = document.getElementById("year").value;
  const month = document.getElementById("month").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      displayKPIs(data.kpis);
      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
      document.getElementById("reportContainer").innerHTML = data.reportHTML;
    })
    .catch(err => {
      console.error("Dashboard data fetch failed:", err);
    });
}

function displayKPIs(kpis) {
  document.getElementById("totalSales").innerText = `₱${kpis.totalSales.toLocaleString()}`;
  document.getElementById("totalExpenses").innerText = `₱${kpis.totalExpenses.toLocaleString()}`;
  document.getElementById("revenue").innerText = `₱${kpis.revenue.toLocaleString()}`;
  document.getElementById("cashout").innerText = `₱${kpis.cashout.toLocaleString()}`;
}

let expenseChartInstance, salesExpenseChartInstance;

function drawExpenseChart(data) {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (expenseChartInstance) expenseChartInstance.destroy();

  const datasets = data.groups.map(group => ({
    label: group.name,
    data: group.values.map(val => parseFloat(val.toFixed(2))),
    backgroundColor: group.color,
  }));

  expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}%`
          }
        }
      },
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value}%`
          },
          title: {
            display: true,
            text: 'Percentage of Sales'
          }
        },
        x: {
          stacked: false
        }
      }
    }
  });
}

function drawSalesExpenseChart(data) {
  const ctx = document.getElementById("salesExpenseChart").getContext("2d");
  if (salesExpenseChartInstance) salesExpenseChartInstance.destroy();

  salesExpenseChartInstance = new Chart(ctx, {
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
          backgroundColor: '#e04f5f',
          data: data.expenses
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => `₱${val.toLocaleString()}`
          },
          title: {
            display: true,
            text: 'Amount (₱)'
          }
        }
      }
    }
  });
}

function downloadPDF() {
  const element = document.getElementById("reportContainer");
  const opt = {
    margin: 0.5,
    filename: `Sales_Expense_Report_${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

function sendEmail() {
  const year = document.getElementById("year").value;
  const month = document.getElementById("month").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=email&year=${year}&month=${month}`)
    .then(res => res.text())
    .then(msg => {
      alert(msg);
    })
    .catch(err => {
      console.error("Email sending failed:", err);
      alert("Failed to send email.");
    });
}
