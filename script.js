document.addEventListener("DOMContentLoaded", function () {
  const dashboard = document.getElementById("dashboard");
  const plSection = document.getElementById("plSection");
  const reportSection = document.getElementById("reportSection");

  const btnDashboard = document.getElementById("btnDashboard");
  const btnPL = document.getElementById("btnPL");
  const btnReport = document.getElementById("btnReport");

  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const categorySelect = document.getElementById("categorySelect");

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

      populateCategoryDropdown(result.expenseChart?.groups || []);
      renderCharts(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function populateCategoryDropdown(groups) {
    categorySelect.innerHTML = `<option value="all">All Categories</option>`;
    groups.forEach(group => {
      const opt = document.createElement("option");
      opt.value = group.name;
      opt.textContent = group.name;
      categorySelect.appendChild(opt);
    });
    categorySelect.addEventListener("change", () => renderCharts(dataCache));
  }

  function renderCharts(data) {
    const ctx1 = document.getElementById("grouped-expense-chart").getContext("2d");
    const ctx2 = document.getElementById("sales-expense-chart").getContext("2d");

    const months = data.expenseChart?.months || [];
    const groups = data.expenseChart?.groups || [];
    const totalSales = data.salesExpense?.sales || [];

    // Convert expense to % of sales
    const percentGroups = groups.map(group => {
      const percents = group.values.map((val, i) => {
        const sales = totalSales[i] || 0;
        return sales ? (val / sales * 100) : 0;
      });
      return {
        name: group.name,
        values: percents,
        color: group.color
      };
    });

    const selected = categorySelect.value || "all";
    const filteredGroups = selected === "all" ? percentGroups : percentGroups.filter(g => g.name === selected);

    if (window.expenseChart) window.expenseChart.destroy();
    if (window.salesExpenseChart) window.salesExpenseChart.destroy();

    window.expenseChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: months,
        datasets: filteredGroups.map(group => ({
          label: group.name,
          data: group.values,
          backgroundColor: group.color || "rgba(100,100,200,0.5)"
        }))
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: context => context.dataset.label + ": " + context.raw.toFixed(2) + "%"
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => value + "%"
            }
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
            backgroundColor: "rgba(0, 200, 100, 0.6)"
          },
          {
            label: "Expenses",
            data: data.salesExpense?.expenses || [],
            backgroundColor: "rgba(255, 99, 132, 0.6)"
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
    plTable.innerHTML = dataCache?.plHTML || "<p>No Profit & Loss Data</p>";
  }

  function renderReport() {
    reportContainer.innerHTML = dataCache?.reportHTML || "<p>No Sales and Expense Report Found</p>";
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
