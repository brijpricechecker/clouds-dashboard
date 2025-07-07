document.addEventListener("DOMContentLoaded", function () {
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

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

        drawBarChart("Operating Expense Breakdown", data.operatingexpenseBreakdown, "operatingexpense-chart");
        drawBarChart("Labor Expense Breakdown", data.laborexpenseBreakdown, "laborexpense-chart");
        drawBarChart("Fixed Expense Breakdown", data.fixedexpenseBreakdown, "fixedexpense-chart");
        drawBarChart("Food & Beverage Purchases", data.foodandbeveragespurchasesBreakdown, "foodandbeveragespurchases-chart");
      });
  }

  function drawBarChart(title, data, canvasId) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (!ctx) return;
    if (window[canvasId + "_chart"]) window[canvasId + "_chart"].destroy();

    window[canvasId + "_chart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(data || {}),
        datasets: [{
          label: title,
          data: Object.values(data || {}),
          backgroundColor: "#007bff"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            ticks: {
              callback: value => '₱' + value.toLocaleString()
            }
          }
        }
      }
    });
  }

  function formatPeso(num) {
    return Number(num).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  }

  yearSelect.addEventListener("change", fetchData);
  monthSelect.addEventListener("change", fetchData);
  fetchData(); // initial load
});
