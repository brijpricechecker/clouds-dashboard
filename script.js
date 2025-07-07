const apiBase = "https://script.google.com/macros/s/AKfycbyGmjvGLIhEIBZByb33_vpYC8P1NPh_wCm4C5hI7IfyL7jsUaxerXWQBuUx0-ohHS7q/exec"; // replace with your Web App URL

document.getElementById('yearFilter').addEventListener('change', fetchData);
document.getElementById('monthFilter').addEventListener('change', fetchData);

let chart;

function fetchData() {
  const year = document.getElementById('yearFilter').value;
  const month = document.getElementById('monthFilter').value;

  fetch(`${apiBase}?year=${year}&month=${month}`)
    .then(res => res.json())
    .then(data => updateDashboard(data));
}

function updateDashboard(data) {
  document.getElementById('sales').textContent = `₱${formatNumber(data.totalSales)}`;
  document.getElementById('expenses').textContent = `₱${formatNumber(data.totalExpenses)}`;
  document.getElementById('revenue').textContent = `₱${formatNumber(data.totalRevenue)}`;

  const labels = Object.keys(data.categoryBreakdown);
  const values = Object.values(data.categoryBreakdown);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('categoryChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Expenses by Category',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => '₱' + formatNumber(value) }
        }
      }
    }
  });
}

function formatNumber(num) {
  return Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

window.onload = fetchData;
