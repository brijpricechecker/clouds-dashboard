document.addEventListener("DOMContentLoaded", function () {
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  const targets = {
    operatingexpense: 8,
    laborexpense: 18,
    fixedexpense: 24,
    foodandbeveragespurchases: 35
  };

  function fetchData() {
    const year = yearSelect.value;
    const month = monthSelect.value;
    const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        document.getElementById("salesKPI").textContent = formatPeso(data.totalSales);
        document.getElementById("expensesKPI").textContent = formatPeso(data.totalExpenses);
        document.getElementById("revenueKPI").textContent = formatPeso(data.totalRevenue);

        drawTargetedColumnChart(
          "Operating Expense",
          data.monthlyBreakdowns.operatingexpense,
          "monthly-operating-chart",
          targets.operatingexpense
        );
        drawTargetedColumnChart(
          "Labor Expense",
          data.monthlyBreakdowns.laborexpense,
          "monthly-labor-chart",
          targets.laborexpense
        );
        drawTargetedColumnChart(
          "Fixed Expense",
          data.monthlyBreakdowns.fixedexpense,
          "monthly-fixed-chart",
          targets.fixedexpense
        );
        drawTargetedColumnChart(
          "Food & Beverage",
          data.monthlyBreakdowns.foodandbeveragespurchases,
          "monthly-fb-chart",
          targets.foodandbeveragespurchases
        );
      });
  }

  function drawTargetedColumnChart(title, data, canvasId, targetPercent) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (window[canvasId + "_chart"]) window[canvasId + "_chart"].destroy();

    const months = Object.keys(data);
    const totals = months.map(m => {
      const subCats = data[m] || {};
      return Object.values(subCats).reduce((sum, val) => sum + val, 0);
    });

    window[canvasId + "_chart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months.map(capitalize),
        datasets: [
          {
            label: "% of Sales",
            data: totals,
            backgroundColor: "#007bff"
          },
          {
            label: "Target",
            data: Array(months.length).fill(targetPercent),
            type: "line",
            borderColor: "#dc3545",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${title} vs Target (% of Revenue)`
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: val => `${val}%`
            },
            title: {
              display: true,
              text: "% of Revenue"
            }
          }
        }
      }
    });
  }

  function formatPeso(num) {
    return Number(num).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  yearSelect.addEventListener("change", fetchData);
  monthSelect.addEventListener("change", fetchData);
  fetchData();
});
