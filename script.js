const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
const salesCtx = document.getElementById("sales-expense-chart").getContext("2d");
let groupedChart, salesExpenseChart;

const monthOrder = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

function fetchData() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;
  const category = document.getElementById("categoryFilter").value;
  const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      updateKPIs(data);
      drawGroupedExpenseChart(data, category);
      drawSalesVsExpensesChart(data);
      updatePLTable(data.pnlData);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data) {
  document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
}

function drawGroupedExpenseChart(data, filterCategory) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;
  const targets = data.targets;

  const months = monthOrder.filter(m => monthly[m]);
  const allCategories = ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = {
    foodandbeveragespurchases: "#007bff",
    fixedexpense: "#28a745",
    laborexpense: "#ffc107",
    operatingexpense: "#17a2b8",
    misc: "#6f42c1"
  };

  const filtered = filterCategory !== "all" ? [filterCategory] : allCategories;

  const datasets = filtered.map(cat => {
    return {
      label: categoryLabel(cat),
      data: months.map(m => {
        const amt = monthly[m][cat] || 0;
        const sales = monthlySales[m] || 0;
        return sales > 0 ? (amt / sales) * 100 : 0;
      }),
      backgroundColor: colors[cat],
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: v => v.toFixed(1) + "%",
        color: "#000"
      }
    };
  });

  const targetLines = filtered.map(cat => ({
    type: 'line',
    label: '',
    data: months.map(() => targets[cat] || 0),
    borderColor: colors[cat],
    borderDash: [5, 5],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
    yAxisID: 'y',
  }));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [...datasets, ...targetLines]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: {
          display: true
        },
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue",
          font: { size: 16 }
        },
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw.toFixed(1);
              const month = ctx.label.toLowerCase();
              const sales = monthlySales[month] || 0;
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
            text: "% of Monthly Sales"
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpensesChart(data) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;
  const monthlyExpenses = data.monthlyExpenseTotals;
  const months = monthOrder.filter(m => monthly[m]);

  const salesData = months.map(m => monthlySales[m] || 0);
  const expensesData = months.map(m => monthlyExpenses[m] || 0);

  if (salesExpenseChart) salesExpenseChart.destroy();

  salesExpenseChart = new Chart(salesCtx, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: "Sales",
          backgroundColor: "#28a745",
          data: salesData
        },
        {
          label: "Expenses",
          backgroundColor: "#dc3545",
          data: expensesData
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Monthly Total Sales vs Expenses"
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatPeso(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatPeso(value)
          }
        }
      }
    }
  });
}

function updatePLTable(pnlData) {
  const pnlView = document.getElementById("pnlView");
  const table = document.createElement("table");
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Category</th>` + monthOrder.map(m => `<th>${capitalize(m)}</th>`).join("");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  pnlData.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.category}</td>` +
      monthOrder.map(m => `<td>${formatPeso(row[m] || 0)}</td>`).join("");
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  pnlView.innerHTML = "<h3>P&L Table</h3>";
  pnlView.appendChild(table);
  pnlView.style.display = "block";
  document.getElementById("backBtn").style.display = "block";
  document.querySelector(".charts").style.display = "none";
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", () => {
    const category = document.getElementById("categoryFilter").value;
    fetchData(category);
  });

  document.getElementById("showPnlBtn").addEventListener("click", () => {
    document.querySelector(".charts").style.display = "none";
    document.getElementById("pnlView").style.display = "block";
    document.getElementById("backBtn").style.display = "block";
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    document.getElementById("pnlView").style.display = "none";
    document.querySelector(".charts").style.display = "flex";
    document.getElementById("backBtn").style.display = "none";
  });

  fetchData();
});

