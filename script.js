document.addEventListener("DOMContentLoaded", function () {
  const dashboard = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");

  const btnDashboard = document.getElementById("btnDashboard");
  const btnPL = document.getElementById("btnPL");
  const btnReport = document.getElementById("btnReport");

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");

  const salesKPI = document.getElementById("salesKPI");
  const expensesKPI = document.getElementById("expensesKPI");
  const revenueKPI = document.getElementById("revenueKPI");
  const cashoutKPI = document.getElementById("cashoutKPI");

  const plTable = document.getElementById("plTable");
  const reportContainer = document.getElementById("reportContainer");

  let dataCache = null;

  function showSection(section) {
    dashboard.style.display = section === "dashboard" ? "block" : "none";
    plSection.style.display = section === "pl" ? "block" : "none";
    reportSection.style.display = section === "report" ? "block" : "none";
  }

  btnDashboard.addEventListener("click", () => showSection("dashboard"));
  btnPL.addEventListener("click", () => {
    showSection("pl");
    renderPL();
  });
  btnReport.addEventListener("click", () => {
    showSection("report");
    renderReport();
  });

  yearSelect.addEventListener("change", fetchData);
  monthSelect.addEventListener("change", fetchData);

  function formatMoney(value) {
    if (value === "" || value === null || isNaN(value)) return "";
    return "₱" + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  async function fetchData() {
    const year = yearSelect.value;
    const month = monthSelect.value;

    try {
      const url = `https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec?year=${year}&month=${month}`;
      const response = await fetch(url);
      const result = await response.json();
      dataCache = result;

      salesKPI.textContent = formatMoney(result.kpis?.totalSales);
      expensesKPI.textContent = formatMoney(result.kpis?.totalExpenses);
      revenueKPI.textContent = formatMoney(result.kpis?.revenue);
      cashoutKPI.textContent = formatMoney(result.kpis?.cashout);

      renderCharts(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function renderCharts(data) {
    const ctx1 = document.getElementById("grouped-expense-chart").getContext("2d");
    const ctx2 = document.getElementById("sales-expense-chart").getContext("2d");

    const months = data.expenseChart?.months || [];
    const expenseGroups = data.expenseChart?.groups || [];

    // Custom category colors
    const categoryColors = {
      "LABOR": "#4B49AC",
      "OPERATING": "#98BDFF",
      "COGS": "#6F42C1",
      "MISC": "#34B1AA"
    };

    if (window.expenseChart) window.expenseChart.destroy();
    if (window.salesExpenseChart) window.salesExpenseChart.destroy();

    window.expenseChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: months,
        datasets: expenseGroups.map(group => ({
          label: group.name,
          data: group.percentages || [],
          backgroundColor: categoryColors[group.name.toUpperCase()] || "rgba(100,100,200,0.5)",
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label + ": " + ctx.raw.toFixed(2) + "%"
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => value + "%"
            },
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    window.salesExpenseChart = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Sales",
            data: data.salesExpense?.sales || [],
            backgroundColor: "#3B8FF3"
          },
          {
            label: "Expenses",
            data: data.salesExpense?.expenses || [],
            backgroundColor: "#F3797E"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label + ": ₱" + ctx.raw.toLocaleString()
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => "₱" + value.toLocaleString()
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  function renderPL() {
    if (!dataCache || !dataCache.plHTML) {
      plTable.innerHTML = "<p>No Profit & Loss Data</p>";
      return;
    }
    plTable.innerHTML = dataCache.plHTML;
  }

  function renderReport() {
    if (!dataCache || !dataCache.reportHTML) {
      reportContainer.innerHTML = "<p>No Sales and Expense Report Found</p>";
      return;
    }
    reportContainer.innerHTML = dataCache.reportHTML;
  }

  function populateYearDropdown() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      const option = document.createElement("option");
      option.value = y;
      option.textContent = y;
      yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
  }

  populateYearDropdown();
  fetchData();
});
