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

        drawStackedByCategoryChart("Expense Breakdown (% of Revenue)", data.stackedByMajorCategory, "stacked-category-chart");

        drawMonthlyBreakdownChart("Operating Expense - Monthly", data.monthlyBreakdowns.operatingexpense, "monthly-operating-chart");
        drawMonthlyBreakdownChart("Labor Expense - Monthly", data.monthlyBreakdowns.laborexpense, "monthly-labor-chart");
        drawMonthlyBreakdownChart("Fixed Expense - Monthly", data.monthlyBreakdowns.fixedexpense, "monthly-fixed-chart");
        drawMonthlyBreakdownChart("Food & Beverage - Monthly", data.monthlyBreakdowns.foodandbeveragespurchases, "monthly-fb-chart");
      });
  }

  function drawStackedByCategoryChart(title, data, canvasId) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (window[canvasId + "_chart"]) window[canvasId + "_chart"].destroy();

    const majorCategories = Object.keys(data);
    const subcategoriesSet = new Set();
    majorCategories.forEach(mcat => {
      Object.keys(data[mcat] || {}).forEach(sub => subcategoriesSet.add(sub));
    });

    const subcategories = [...subcategoriesSet];
    const datasets = subcategories.map((cat, i) => {
      return {
        label: cat,
        data: majorCategories.map(mcat => data[mcat]?.[cat] || 0),
        backgroundColor: getColor(i)
      };
    });

    window[canvasId + "_chart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: majorCategories.map(toTitleCase),
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            max: 100,
            ticks: {
              callback: value => `${value}%`
            }
          }
        }
      }
    });
  }

  function drawMonthlyBreakdownChart(title, data, canvasId) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    if (window[canvasId + "_chart"]) window[canvasId + "_chart"].destroy();

    const months = Object.keys(data);
    const subcategoriesSet = new Set();
    months.forEach(m => {
      Object.keys(data[m] || {}).forEach(cat => subcategoriesSet.add(cat));
    });

    const subcategories = [...subcategoriesSet];
    const datasets = subcategories.map((cat, i) => {
      return {
        label: cat,
        data: months.map(m => data[m]?.[cat] || 0),
        backgroundColor: getColor(i)
      };
    });

    window[canvasId + "_chart"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: months.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: title },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            max: 100,
            ticks: {
              callback: value => `${value}%`
            }
          }
        }
      }
    });
  }

  function formatPeso(num) {
    return Number(num).toLocaleString("en-PH", { minimumFractionDigits: 2 });
  }

  function toTitleCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  }

  function getColor(i) {
    const colors = [
      "#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1",
      "#20c997", "#fd7e14", "#6610f2", "#e83e8c", "#17a2b8"
    ];
    return colors[i % colors.length];
  }

  yearSelect.addEventListener("change", fetchData);
  monthSelect.addEventListener("change", fetchData);
  fetchData();
});
