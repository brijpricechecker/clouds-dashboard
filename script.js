document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("grouped-expense-chart").getContext("2d");
  const salesCtx = document.getElementById("sales-expense-chart").getContext("2d");

  let groupedChart, salesExpenseChart;

  const monthOrder = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  function fetchData() {
    const year = document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        updateKPIs(data);
        drawGroupedExpenseChart(data, category);
        drawSalesVsExpensesChart(data);
        renderPnLTable(data.pnlData);
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
    const months = monthOrder.filter(m => monthly[m]);
    const targets = data.targets;

    const allCategories = ["cogs", "fixedexpense", "laborexpense", "operatingexpense", "misc"];
    const colors = {
      cogs: "#007bff",
      fixedexpense: "#28a745",
      laborexpense: "#ffc107",
      operatingexpense: "#17a2b8",
      misc: "#6f42c1"
    };

    const categories = filterCategory === "all" ? allCategories : [filterCategory];

    const datasets = categories.map(cat => ({
      label: categoryLabel(cat),
      data: months.map(month => {
        const expense = monthly[month]?.[cat] || 0;
        const sales = monthlySales[month] || 1;
        return (expense / sales) * 100;
      }),
      backgroundColor: colors[cat],
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: v => v.toFixed(1) + "%",
        color: "#000"
      }
    }));

    if (groupedChart) groupedChart.destroy();

    groupedChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months.map(capitalize),
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: { display: true },
          title: {
            display: true,
            text: "Monthly Expenses as % of Revenue",
            font: { size: 16 }
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          },
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "% of Net Sales" }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function drawSalesVsExpensesChart(data) {
    const months = monthOrder.filter(m => data.monthlySales[m] || data.monthlyExpenseTotals[m]);
    const salesData = months.map(m => data.monthlySales[m] || 0);
    const expensesData = months.map(m => data.monthlyExpenseTotals[m] || 0);

    if (salesExpenseChart) salesExpenseChart.destroy();

    salesExpenseChart = new Chart(salesCtx, {
      type: "bar",
      data: {
        labels: months.map(capitalize),
        datasets: [
          {
            label: "Sales",
            data: salesData,
            backgroundColor: "#28a745"
          },
          {
            label: "Expenses",
            data: expensesData,
            backgroundColor: "#dc3545"
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

  function renderPnLTable(pnlData) {
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

  // Event bindings
  document.getElementById("yearSelect").addEventListener("change", fetchData);
  document.getElementById("monthSelect").addEventListener("change", fetchData);
  document.getElementById("categoryFilter").addEventListener("change", fetchData);

  fetchData();
});
