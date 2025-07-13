let rawData = {};
let reportData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchDashboardData();
  fetchReportData();
});

function fetchDashboardData() {
  fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=summary")
    .then(res => res.json())
    .then(data => {
      rawData = data;
      updateKPIs(data);
      drawSalesChart(data);
      drawExpensesChart(data);
    })
    .catch(err => console.error("Error fetching summary data:", err));
}

function fetchReportData() {
  fetch("https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?mode=report")
    .then(res => res.json())
    .then(data => {
      reportData = data;
      drawReportTable();
    })
    .catch(err => console.error("Error fetching report data:", err));
}

function updateKPIs(data) {
  const format = val => Number(val || 0).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP'
  });

  const sales = data.totalSales || 0;
  const expenses = data.totalExpenses || 0;
  const revenue = sales - expenses;
  const cashouts = data.totalCashouts || 0;

  document.getElementById("salesKPI").textContent = format(sales);
  document.getElementById("expensesKPI").textContent = format(expenses);
  document.getElementById("revenueKPI").textContent = format(revenue);
  document.getElementById("cashoutKPI").textContent = format(cashouts);
}

function drawSalesChart(data) {
  const ctx = document.getElementById("salesChart").getContext("2d");
  const months = data.months;
  const sales = data.monthlySales;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Monthly Sales",
        data: months.map(m => sales[m] || 0),
        backgroundColor: "#28a745"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Sales"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "₱" + value.toLocaleString()
          }
        }
      }
    }
  });
}

function drawExpensesChart(data) {
  const ctx = document.getElementById("expensesChart").getContext("2d");
  const months = data.months;
  const expenses = data.monthlyExpenses;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Monthly Expenses",
        data: months.map(m => expenses[m] || 0),
        backgroundColor: "#dc3545"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Expenses"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => "₱" + value.toLocaleString()
          }
        }
      }
    }
  });
}

function drawReportTable() {
  const table = document.getElementById("reportTable");
  if (!reportData || reportData.length === 0) {
    table.innerHTML = "<tr><td>No report data available.</td></tr>";
    return;
  }

  const months = Object.keys(reportData[0]).filter(k => k !== "Account");

  const header = `<tr><th>Account</th>${months.map(m => `<th>${m}</th>`).join("")}</tr>`;
  const rows = reportData.map(row => {
    const cells = months.map(m => {
      const val = row[m];
      if (!val || val === "0" || val === "0.00") return `<td></td>`;
      return `<td>${Number(val).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' })}</td>`;
    });
    return `<tr><td>${row.Account}</td>${cells.join("")}</tr>`;
  });

  table.innerHTML = header + rows.join("");
}

function showSection(view) {
  document.getElementById("dashboardSection").style.display = view === "dashboard" ? "block" : "none";
  document.getElementById("reportSection").style.display = view === "report" ? "block" : "none";
}
