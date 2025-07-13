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
    if (value === "" || value === null || isNaN(value)) return "₱0.00";
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

      // Update KPIs
      salesKPI.textContent = formatMoney(result.kpi?.totalSales);
      expensesKPI.textContent = formatMoney(result.kpi?.totalExpenses);
      revenueKPI.textContent = formatMoney(result.kpi?.revenue);
      cashoutKPI.textContent = formatMoney(result.kpi?.cashout);

      // Update Charts
      renderCharts(result);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function renderCharts(data) {
    const ctx1 = document.getElementById("grouped-expense-chart").getContext("2d");
    const ctx2 = document.getElementById("sales-expense-chart").getContext("2d");

    if (window.expenseChart) window.expenseChart.destroy();
    if (window.salesExpenseChart) window.salesExpenseChart.destroy();

    const months = data.expenseChart?.months || [];
    const expenseGroups = data.expenseChart?.groups || [];

    window.expenseChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: months,
        datasets: expenseGroups.map(group => ({
          label: group.name,
          data: group.values,
          backgroundColor: group.color || "rgba(100, 100, 200, 0.6)"
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false }
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

    const sales = data.salesExpense?.sales || [];
    const expenses = data.salesExpense?.expenses || [];

    window.salesExpenseChart = new Chart(ctx2, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Sales",
            data: sales,
            borderColor: "green",
            borderWidth: 2,
            fill: false
          },
          {
            label: "Expenses",
            data: expenses,
            borderColor: "red",
            borderWidth: 2,
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
    } else {
      plTable.innerHTML = dataCache.plHTML;
    }
  }

  function renderReport() {
    if (!dataCache || !dataCache.reportHTML) {
      reportContainer.innerHTML = "<p>No Sales and Expense Report Found</p>";
    } else {
      reportContainer.innerHTML = dataCache.reportHTML;
    }
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
