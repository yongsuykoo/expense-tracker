// Expense Tracker - Yongskie
// Data Management
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let deleteId = null;
let categoryChart = null;
let dailyChart = null;

// Category colors and emojis
const categoryConfig = {
    'Food': { emoji: '🍔', color: '#FF6384' },
    'Transport': { emoji: '🚗', color: '#36A2EB' },
    'Shopping': { emoji: '🛒', color: '#FFCE56' },
    'Bills': { emoji: '📄', color: '#4BC0C0' },
    'Entertainment': { emoji: '🎮', color: '#9966FF' },
    'Health': { emoji: '💊', color: '#FF9F40' },
    'Other': { emoji: '📦', color: '#C9CBCF' }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    document.getElementById('date').valueAsDate = new Date();
    renderExpenses();
    updateCharts();
    updateSummary();
});

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Modal functions
function openModal(id = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('expenseForm');
    const title = document.getElementById('modalTitle');
    
    if (id) {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            title.textContent = 'Edit Expense';
            document.getElementById('expenseId').value = expense.id;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('category').value = expense.category;
            document.getElementById('date').value = expense.date;
            document.getElementById('notes').value = expense.notes || '';
        }
    } else {
        title.textContent = 'Add Expense';
        form.reset();
        document.getElementById('expenseId').value = '';
        document.getElementById('date').valueAsDate = new Date();
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function openDeleteModal(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    deleteId = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

function confirmDelete() {
    if (deleteId) {
        expenses = expenses.filter(e => e.id !== deleteId);
        saveToStorage();
        renderExpenses();
        updateCharts();
        updateSummary();
        closeDeleteModal();
    }
}

// Save expense
function saveExpense(event) {
    event.preventDefault();
    
    const id = document.getElementById('expenseId').value;
    const expense = {
        id: id || Date.now().toString(),
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        notes: document.getElementById('notes').value.trim()
    };
    
    if (id) {
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) expenses[index] = expense;
    } else {
        expenses.unshift(expense);
    }
    
    saveToStorage();
    closeModal();
    renderExpenses();
    updateCharts();
    updateSummary();
}

// Render expenses list
function renderExpenses() {
    const list = document.getElementById('expensesList');
    const emptyState = document.getElementById('emptyState');
    
    // Apply filters
    const filterCategory = document.getElementById('filterCategory').value;
    const filterDateFrom = document.getElementById('filterDateFrom').value;
    const filterDateTo = document.getElementById('filterDateTo').value;
    
    let filtered = [...expenses];
    
    if (filterCategory) {
        filtered = filtered.filter(e => e.category === filterCategory);
    }
    if (filterDateFrom) {
        filtered = filtered.filter(e => e.date >= filterDateFrom);
    }
    if (filterDateTo) {
        filtered = filtered.filter(e => e.date <= filterDateTo);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        list.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    list.innerHTML = filtered.map(expense => {
        const config = categoryConfig[expense.category] || categoryConfig['Other'];
        const date = new Date(expense.date).toLocaleDateString('en-PH', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="p-4 hover:bg-gray-50 transition flex items-center justify-between gap-4">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background-color: ${config.color}20">
                        ${config.emoji}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-gray-800">${expense.category}</span>
                            <span class="text-xs text-gray-400">${date}</span>
                        </div>
                        ${expense.notes ? `<p class="text-sm text-gray-500 truncate">${expense.notes}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold text-lg text-gray-800">₱${expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    <div class="flex gap-1">
                        <button onclick="openModal('${expense.id}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="openDeleteModal('${expense.id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Clear filters
function clearFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    renderExpenses();
}

// Update summary cards
function updateSummary() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    // This month total
    const monthTotal = expenses
        .filter(e => e.date >= monthStart)
        .reduce((sum, e) => sum + e.amount, 0);
    
    // Today total
    const todayTotal = expenses
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + e.amount, 0);
    
    // Average daily (this month)
    const daysInMonth = now.getDate();
    const avgDaily = monthTotal / daysInMonth;
    
    document.getElementById('monthTotal').textContent = `₱${monthTotal.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    document.getElementById('todayTotal').textContent = `₱${todayTotal.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    document.getElementById('totalEntries').textContent = expenses.length;
    document.getElementById('avgDaily').textContent = `₱${avgDaily.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Update charts
function updateCharts() {
    updateCategoryChart();
    updateDailyChart();
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Get current month data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthExpenses = expenses.filter(e => e.date >= monthStart);
    
    // Group by category
    const categoryTotals = {};
    monthExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map(cat => categoryConfig[cat]?.color || '#C9CBCF');
    
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => `${categoryConfig[l]?.emoji || '📦'} ${l}`),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function updateDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    // Get last 7 days
    const days = [];
    const totals = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('en-PH', { weekday: 'short' });
        
        days.push(dayLabel);
        
        const dayTotal = expenses
            .filter(e => e.date === dateStr)
            .reduce((sum, e) => sum + e.amount, 0);
        totals.push(dayTotal);
    }
    
    if (dailyChart) dailyChart.destroy();
    
    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Daily Spending',
                data: totals,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '₱' + value.toLocaleString()
                    }
                }
            }
        }
    });
}

// Export to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }
    
    const headers = ['Date', 'Category', 'Amount', 'Notes'];
    const rows = expenses.map(e => [
        e.date,
        e.category,
        e.amount.toFixed(2),
        `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Close modals on outside click
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
});

document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') closeDeleteModal();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
    if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        openModal();
    }
});