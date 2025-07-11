const ctxGrouped = document.getElementById("grouped-expense-chart").getContext("2d");
const ctxSales = document.getElementById("sales-expense-chart").getContext("2d");

let groupedChart, salesChart;

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
      drawSalesVsExpenseChart(data);
      updatePnLTable(data.pnlData);
    })
    .catch(err => console.error("Error fetching data:", err));
}

function updateKPIs(data) {
  document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
  document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
  document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);
}

function drawGroupedExpenseChart(data, selectedCategory) {
  const monthly = data.monthlyCategoryTotals;
  const monthlySales = data.monthlySales;

  const months = monthOrder.filter(m => monthly[m]);
  const categories = selectedCategory === 'all'
    ? ["cogs", "fixedexpense", "laborexpense", "operatingexpense", "misc"]
    : [selectedCategory];

  const colors = {
    cogs: "#4e79a7",
    fixedexpense: "#f28e2b",
    laborexpense: "#e15759",
    operatingexpense: "#76b7b2",
    misc: "#59a14f"
  };

  const datasets = categories.map(cat => ({
    label: categoryLabel(cat),
    data: months.map(m => {
      const amount = (monthly[m] && monthly[m][cat]) || 0;
      const sales = monthlySales[m] || 0;
      return sales > 0 ? (amount / sales) * 100 : 0;
    }),
    backgroundColor: colors[cat],
    datalabels: {
      color: '#000',
      anchor: 'end',
      align: 'top',
      formatter: v => v.toFixed(1) + "%"
    }
  }));

  if (groupedChart) groupedChart.destroy();

  groupedChart = new Chart(ctxGrouped, {
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
          text: "Monthly Expenses as % of Revenue",
          font: { size: 16 }
        },
        legend: {
          display: categories.length > 1,
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        },
        datalabels: {
          display: true
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "% of Revenue" },
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawSalesVsExpenseChart(data) {
  const months = monthOrder.filter(m => data.monthlySales[m] || data.monthlyExpenseTotals[m]);
  const sales = months.map(m => data.monthlySales[m] || 0);
  const expenses = months.map(m => data.monthlyExpenseTotals[m] || 0);

  if (salesChart) salesChart.destroy();

  salesChart = new Chart(ctxSales, {
    type: "bar",
    data: {
      labels: months.map(capitalize),
      datasets: [
        {
          label: "Sales",
          data: sales,
          backgroundColor: "#4caf50"
        },
        {
          label: "Expenses",
          data: expenses,
          backgroundColor: "#f44336"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Sales vs Expenses"
        },
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatPeso(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount (₱)"
          }
        }
      }
    }
  });
}

function updatePnLTable(pnlData) {
  const table = document.getElementById("pnlTable");
  table.innerHTML = "";
  if (!pnlData || pnlData.length === 0) return;

  const headers = Object.keys(pnlData[0]);
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const trHead = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = capitalize(h);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  pnlData.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = typeof row[h] === 'number' ? formatPeso(row[h]) : row[h];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function categoryLabel(key) {
  switch (key) {
    case "cogs": return "COGS";
    case "fixedexpense": return "Fixed Expense";
    case "laborexpense": return "Labor Expense";
    case "operatingexpense": return "Operating Expense";
    case "misc": return "Miscellaneous";
    default: return key;
  }
}

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", fetchData);
});
