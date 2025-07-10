const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
let groupedChart, salesExpenseChart, currentData;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      currentData = data;
      document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
      document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
      document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
      drawGroupedExpenseChart(data);
      drawMonthlySalesExpenseChart(data);
    })
    .catch(err => console.error("Error fetching data:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", () => {
    if (currentData) drawGroupedExpenseChart(currentData);
  });
  document.getElementById("showPLBtn").addEventListener("click", showPL);
  fetchData();
});

function drawGroupedExpenseChart(data) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;
  const targets = data.targets;

  const months = monthOrder.filter(m => monthly[m]);
  const selectedCategory = document.getElementById("categoryFilter").value;

  const categories = ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = { foodandbeveragespurchases: "#007bff", fixedexpense: "#28a745", laborexpense: "#ffc107", operatingexpense: "#17a2b8", misc: "#6f42c1" };

  let catList = selectedCategory === "all" ? categories : [selectedCategory];

  const datasets = catList.map(cat => {
    return {
      label: categoryLabel(cat),
      data: months.map(m => {
        const amt = (monthly[m]?.[cat] || 0);
        const sales = (monthlySales[m] || 0);
        return sales > 0 ? (amt / sales) * 100 : 0;
      }),
      backgroundColor: colors[cat],
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        formatter: v => v.toFixed(1) + "%"
      }
    };
  });

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue"
        },
        legend: {
          display: true,
          position: 'bottom'
        },
        datalabels: {},
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw.toFixed(1);
              const m = ctx.label.toLowerCase();
              const sales = monthlySales[m] || 0;
              const peso = ((percent / 100) * sales).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
              return `${ctx.dataset.label}: ${percent}% (${peso})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 60,
          title: {
            display: true,
            text: "% of Revenue"
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawMonthlySalesExpenseChart(data) {
  const monthlySales = data.monthlySales;
  const monthlyExpenses = data.monthlyCategoryTotals;

  const months = monthOrder.filter(m => monthlySales[m]);
  const expenseTotals = months.map(m => {
    const row = monthlyExpenses[m] || {};
    return Object.values(row).reduce((sum, val) => sum + val, 0);
  });

  const sales = months.map(m => monthlySales[m] || 0);

  const ctx2 = document.getElementById("monthly-sales-expense-chart").getContext("2d");
  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: 'Sales',
          data: sales,
          backgroundColor: '#007bff'
        },
        {
          label: 'Expenses',
          data: expenseTotals,
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Monthly Sales vs Expenses'
        }
      }
    }
  });
}

function categoryLabel(key) {
  switch (key) {
    case "foodandbeveragespurchases": return "Food & Beverage";
    case "fixedexpense": return "Fixed";
    case "laborexpense": return "Labor";
    case "operatingexpense": return "Operating";
    case "misc": return "Misc";
    default: return key;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}

function showPL() {
  const pl = currentData.pl;
  const el = document.getElementById("plStatement");
  let html = `<h2>Profit & Loss Statement</h2>`;
  html += `<table><tbody>`;
  html += `<tr><td><strong>Sales</strong></td><td>${formatPeso(pl.sales)}</td></tr>`;
  html += `<tr><td>Less: Food & Beverage</td><td>${formatPeso(pl.foodandbeveragespurchases)}</td></tr>`;
  html += `<tr><td><strong>Gross Profit</strong></td><td>${formatPeso(pl.gross)}</td></tr>`;
  html += `<tr><td>Operating Expense</td><td>${formatPeso(pl.operatingexpense)}</td></tr>`;
  html += `<tr><td>Fixed Expense</td><td>${formatPeso(pl.fixedexpense)}</td></tr>`;
  html += `<tr><td>Labor Expense</td><td>${formatPeso(pl.laborexpense)}</td></tr>`;
  html += `<tr><td>Miscellaneous</td><td>${formatPeso(pl.misc)}</td></tr>`;
  html += `<tr><td><strong>Net Income</strong></td><td>${formatPeso(pl.net)}</td></tr>`;
  html += `</tbody></table>`;
  el.innerHTML = html;

  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("plView").style.display = "block";
}

function backToDashboard() {
  document.getElementById("dashboardView").style.display = "block";
  document.getElementById("plView").style.display = "none";
}
