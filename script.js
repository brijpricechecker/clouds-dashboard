// script.js – Full updated version for KPI + grouped expense chart

const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
let groupedChart;

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
  console.log("Backend data:", data);

      // Update KPI boxes
      document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
      document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
      document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);

      // Draw grouped chart
      drawGroupedExpenseChart(data);
    })
    .catch(err => console.error("Error fetching data:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  fetchData();
});

function drawGroupedExpenseChart(data) {
  const monthly = data.monthlyCategoryTotals;
  const sales = data.totalSales;
  const targets = data.targets;

  const months = monthOrder.filter(m => monthly[m]);
  const categories = ["foodandbeveragespurchases", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
  const colors = ["#007bff", "#28a745", "#ffc107", "#17a2b8", "#6f42c1"];

  const datasets = categories.map((cat, i) => {
    return {
      label: categoryLabel(cat),
      data: months.map(m => {
        const amt = monthly[m][cat] || 0;
        return sales > 0 ? (amt / sales) * 100 : 0;
      }),
      backgroundColor: colors[i],
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        formatter: v => v.toFixed(1) + "%"
      }
    };
  });

  const targetLines = categories.map((cat, i) => {
    return {
      type: 'line',
      label: `${categoryLabel(cat)} Target (${targets[cat]}%)`,
      data: Array(months.length).fill(targets[cat]),
      borderColor: colors[i],
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      yAxisID: 'y',
    };
  });

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
        title: {
          display: true,
          text: "Monthly Expenses as % of Revenue"
        },
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const percent = ctx.raw.toFixed(1);
              const peso = ((percent / 100) * sales).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
              return `${ctx.dataset.label}: ${percent}% (${peso})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "% of Revenue"
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
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

function formatPeso(num) {
  return Number(num).toLocaleString("en-PH", { style: 'currency', currency: 'PHP' });
}
