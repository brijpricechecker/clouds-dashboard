""document.addEventListener("DOMContentLoaded", function () {
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

      // Update KPI
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
    const ctx1 = document.getElementById("grouped-expense-chart")?.getContext("2d");
    const ctx2 = document.getElementById("sales-expense-chart")?.getContext("2d");

    if (!ctx1 || !ctx2) return;

    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE"];

    const salesData = months.map(m => data.kpiMonths?.[m]?.totalSales || 0);
    const expenseData = months.map(m => data.kpiMonths?.[m]?.totalExpenses || 0);

    const groupLabels = ["LABOR EXPENSE", "OPERATING EXPENSE", "FIXED EXPENSE", "MISC EXPENSE", "COGS"];
    const groupColors = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336"];

    const groupedExpenseData = groupLabels.map((label, i) => {
      return {
        name: label,
        values: months.map(m => data.kpiMonths?.[m]?.[label] || 0),
        color: groupColors[i]
      };
    });

    if (window.expenseChart) window.expenseChart.destroy();
    if (window.salesExpenseChart) window.salesExpenseChart.destroy();

    window.expenseChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: months,
        datasets: groupedExpenseData.map(group => ({
          label: group.name,
          data: group.values,
          backgroundColor: group.color,
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          y: {
            ticks: {
              callback: value => "₱" + value.toLocaleString()
            }
          }
        }
      }
    });

    window.salesExpenseChart = new Chart(ctx2, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Sales",
            data: salesData,
            borderColor: "green",
            fill: false
          },
          {
            label: "Expenses",
            data: expenseData,
            borderColor: "red",
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" }
        },
        scales: {
          y: {
            ticks: {
              callback: value => "₱" + value.toLocaleString()
            }
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

  // Initial setup
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
