document.getElementById("btnDashboard").addEventListener("click", showDashboard);
document.getElementById("btnPL").addEventListener("click", showPL);
document.getElementById("btnReport").addEventListener("click", showReport);

let expenseChart, salesExpenseChart;

function showDashboard() {
  showSection("dashboard");
  loadDashboard();
}

function showPL() {
  showSection("plSection");
  loadPL();
}

function showReport() {
  showSection("reportSection");
  loadReport();
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(section => section.style.display = "none");
  document.getElementById(id).style.display = "block";
}

function loadDashboard() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("salesKPI").innerText = `₱${data.kpis.totalSales.toLocaleString()}`;
      document.getElementById("expensesKPI").innerText = `₱${data.kpis.totalExpenses.toLocaleString()}`;
      document.getElementById("revenueKPI").innerText = `₱${data.kpis.revenue.toLocaleString()}`;
      document.getElementById("cashoutKPI").innerText = `₱${data.kpis.cashout.toLocaleString()}`;

      drawExpenseChart(data.expenseChart);
      drawSalesExpenseChart(data.salesExpense);
    })
    .catch(err => console.error("Dashboard data fetch failed:", err));
}

function drawExpenseChart(data) {
  if (expenseChart) expenseChart.destroy();

  const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
  expenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: data.groups.map(group => ({
        label: group.name,
        data: group.values,
        backgroundColor: group.color
      }))
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          formatter: val => `${val.toFixed(0)}%`,
          color: '#000'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => `${val}%`
          }
        },
        x: { stacked: false }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesExpenseChart(data) {
  if (salesExpenseChart) salesExpenseChart.destroy();

  const ctx = document.getElementById("sales-expense-chart").getContext("2d");
  salesExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.months,
      datasets: [
        {
          label: "Sales",
          data: data.sales,
          backgroundColor: "#4b49ac"
        },
        {
          label: "Expenses",
          data: data.expenses,
          backgroundColor: "#34b1aa"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          formatter: val => `₱${val.toLocaleString()}`,
          anchor: 'end',
          align: 'top',
          color: '#444'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => `₱${val.toLocaleString()}`
          }
        },
        x: { stacked: false }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function loadPL() {
  fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec")
    .then(res => res.json())
    .then(data => {
      document.getElementById("plTable").innerHTML = data.reportHTML;
    })
    .catch(err => {
      document.getElementById("plTable").innerText = "Failed to load.";
    });
}

function loadReport() {
  fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec")
    .then(res => res.json())
    .then(data => {
      document.getElementById("reportContainer").innerHTML = data.reportHTML;
    })
    .catch(err => {
      document.getElementById("reportContainer").innerText = "Failed to load.";
    });
}

function exportPDF() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  fetch(`https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=exportPdf&year=${year}&month=${month}`)
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Expense_Report_${month}_${year}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => alert("Failed to export PDF."));
}

function sendPDFEmail() {
  fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=emailFullReport`)
    .then(res => res.text())
    .then(msg => alert("Email sent: " + msg))
    .catch(err => alert("Failed to send email."));
}

function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  const yearSelect = document.getElementById("yearSelect");

  for (let i = currentYear; i >= currentYear - 5; i--) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
  }

  yearSelect.value = currentYear;
}

populateYearDropdown();
showDashboard();
