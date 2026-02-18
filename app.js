// Expense Tracker — localStorage-based app

let chart = null;

function getExpenses() {
  return JSON.parse(localStorage.getItem("expenses") || "[]");
}

function saveExpenses(data) {
  localStorage.setItem("expenses", JSON.stringify(data));
}

function addExpense() {
  const desc = document.getElementById("desc").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value || new Date().toISOString().split("T")[0];
  const notes = document.getElementById("notes").value.trim();

  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Please enter a description and valid amount.");
    return;
  }

  const expenses = getExpenses();
  expenses.push({ id: Date.now(), desc, amount, category, date, notes });
  saveExpenses(expenses);

  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("notes").value = "";

  renderAll();
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  renderAll();
}

function editExpense(id) {
  const expenses = getExpenses();
  const e = expenses.find(x => x.id === id);
  if (!e) return;
  const newDesc = prompt("Description:", e.desc);
  const newAmt = parseFloat(prompt("Amount:", e.amount));
  if (!newDesc || isNaN(newAmt)) return;
  e.desc = newDesc;
  e.amount = newAmt;
  saveExpenses(expenses);
  renderAll();
}

function getFiltered() {
  const cat = document.getElementById("filterCat").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;
  return getExpenses().filter(e => {
    if (cat && e.category !== cat) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });
}

function renderAll() {
  const expenses = getFiltered();
  const list = document.getElementById("expenseList");
  const noMsg = document.getElementById("noExpenses");

  list.innerHTML = "";
  if (expenses.length === 0) {
    noMsg.style.display = "block";
  } else {
    noMsg.style.display = "none";
    expenses.slice().reverse().forEach(e => {
      const div = document.createElement("div");
      div.className = "flex justify-between items-center border rounded-lg p-3 hover:bg-gray-50";
      div.innerHTML = `
        <div>
          <span class="font-semibold">${e.desc}</span>
          <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${e.category}</span>
          <span class="ml-2 text-xs text-gray-400">${e.date}</span>
          ${e.notes ? '<span class="ml-2 text-xs text-gray-400 italic">' + e.notes + '</span>' : ''}
        </div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-red-500">$${parseFloat(e.amount).toFixed(2)}</span>
          <button onclick="editExpense(${e.id})" class="text-blue-500 hover:text-blue-700 text-sm">✏️</button>
          <button onclick="deleteExpense(${e.id})" class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
        </div>`;
      list.appendChild(div);
    });
  }

  updateSummary(expenses);
  updateChart(expenses);
}

function updateSummary(expenses) {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const monthTotal = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById("monthTotal").textContent = "$" + monthTotal.toFixed(2);
  document.getElementById("totalAll").textContent = "$" + total.toFixed(2);
  document.getElementById("expenseCount").textContent = expenses.length;
}

function updateChart(expenses) {
  const cats = {};
  expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const labels = Object.keys(cats);
  const data = Object.values(cats);
  const colors = ["#3B82F6","#EF4444","#10B981","#F59E0B","#8B5CF6","#EC4899","#6B7280"];

  const ctx = document.getElementById("pieChart").getContext("2d");
  if (chart) chart.destroy();
  if (labels.length === 0) return;
  chart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length) }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });
}

function exportCSV() {
  const expenses = getFiltered();
  if (expenses.length === 0) { alert("No expenses to export."); return; }
  const rows = [["Date","Description","Category","Amount","Notes"],
    ...expenses.map(e => [e.date, e.desc, e.category, e.amount.toFixed(2), e.notes || ""])];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
}

// Set today as default date
document.getElementById("date").value = new Date().toISOString().split("T")[0];
renderAll();
