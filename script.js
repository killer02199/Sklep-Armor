
let cart = {
    vestSelected: 'vest35',
    items: [],
    quantity: 1,
    faction: 'brak'
};

const factions = {
    'brak': { name: 'Brak', vestDiscount: 0, otherDiscount: 0 },
    'sluzba_wiezienna': { name: 'Służba Więzienna', vestDiscount: 25, otherDiscount: 25 },
    'sluzba_zarzad': { name: 'Służba Więzienna Zarząd', vestDiscount: 35, otherDiscount: 35 },
    'lspd_zarzad': { name: 'LSPD Zarząd', vestDiscount: 40, otherDiscount: 40 },
    'lspd_pracownik': { name: 'LSPD Pracownik', vestDiscount: 30, otherDiscount: 30 },
    'ssc': { name: 'SSC', vestDiscount: 0, otherDiscount: 0 },
    'tropical_pracownik': { name: 'Tropical Pracownik', vestDiscount: 15, otherDiscount: 15 },
    'tropical_zarzad': { name: 'Tropical Zarząd', vestDiscount: 20, otherDiscount: 20 },
    'vesuvio_pracownik': { name: 'Vesuvio Pracownik', vestDiscount: 25, otherDiscount: 25 },
    'vesuvio_zarzad': { name: 'Vesuvio Zarząd', vestDiscount: 35, otherDiscount: 35 },
    'rentmaster_pracownik': { name: 'Rent Master Pracownik', vestDiscount: 20, otherDiscount: 20 },
    'rentmaster_zarzad': { name: 'Rent Master Zarząd', vestDiscount: 25, otherDiscount: 25 },
    'uwu_pracownik': { name: 'UwU Pracownik', vestDiscount: 20, otherDiscount: 20 },
    'uwu_zarzad': { name: 'UwU Zarząd', vestDiscount: 25, otherDiscount: 25 },
    'gruppe6': { name: 'Gruppe 6', vestDiscount: 0, otherDiscount: 0 },
    'winiarnia_pracownik': { name: 'Winiarnia Pracownik', vestDiscount: 20, otherDiscount: 20 },
    'winiarnia_zarzad': { name: 'Winiarnia Zarząd', vestDiscount: 25, otherDiscount: 25 },
    'bahama': { name: 'Bahama Mamas', vestDiscount: 0, otherDiscount: 0 },
    'puffpass_pracownik': { name: 'Puff Puff Pass Pracownik', vestDiscount: 20, otherDiscount: 20 },
    'puffpass_zarzad': { name: 'Puff Puff Pass Zarząd', vestDiscount: 30, otherDiscount: 30 },
    'tuners': { name: 'Tuners', vestDiscount: 0, otherDiscount: 0 },
    'oslo': { name: 'Oslo Racing', vestDiscount: 0, otherDiscount: 0 },
    'tequila': { name: 'Tequila-la-la', vestDiscount: 0, otherDiscount: 0 }
};

const products = {
    vest35: { name: 'Kamizelka 35%', price: 10000, type: 'vest' },
    vest50: { name: 'Kamizelka 50%', price: 20000, type: 'vest' },
    vest75: { name: 'Kamizelka 75%', price: 35000, type: 'vest' },
    kabura: { name: 'Kabura', price: 250000, type: 'other' },
    latarka: { name: 'Latarka do broni', price: 25000, type: 'other' },
    magazynek: { name: 'Powiększony magazynek', price: 60000, type: 'other' },
    latarka_reczna: { name: 'Latarka ręczna', price: 50000, type: 'other' },
    zlote: { name: 'Złote malowanie', price: 280000, type: 'other' },
    mag_pistolet: { name: 'Magazynek do pistoletu', price: 3800, type: 'other' }
};

function getDiscountedPrice(product, factionKey) {
    const faction = factions[factionKey];
    const productData = products[product];
    
    let basePrice = productData.price;

    if (product === 'mag_pistolet') {
        if (factionKey === 'lspd_zarzad' || factionKey === 'lspd_pracownik') {
            basePrice = 3200;
        } else {
            basePrice = 3800;
        }
    }
    
    let discount = 0;
    if (productData.type === 'vest') {
        discount = faction.vestDiscount;
    } else {
        discount = faction.otherDiscount;
    }
    
    return Math.round(basePrice * (1 - discount / 100));
}

function calc() {
    let total = 0;

    if (cart.vestSelected) {
        total += getDiscountedPrice(cart.vestSelected, cart.faction);
    }

    cart.items.forEach(item => {
        total += getDiscountedPrice(item, cart.faction);
    });

    total *= cart.quantity;
    
    document.getElementById('total').textContent = format(total);
    document.getElementById('factionName').textContent = factions[cart.faction].name;
}

function format(num) {
    return num.toLocaleString('pl-PL') + ' $';
}

function selectVest(vestId, el) {
    cart.vestSelected = vestId;
    
    document.querySelectorAll('.options .option').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    
    calc();
}

function toggleItem(itemId, el) {
    const index = cart.items.indexOf(itemId);
    
    if (index > -1) {
        cart.items.splice(index, 1);
        el.classList.remove('selected');
    } else {
        cart.items.push(itemId);
        el.classList.add('selected');
    }
    
    calc();
}

function updateQty(delta) {
    cart.quantity = Math.max(1, cart.quantity + delta);
    document.getElementById('qty').value = cart.quantity;
    calc();
}

function reset() {
    cart = {
        vestSelected: 'vest35',
        items: [],
        quantity: 1,
        faction: 'brak'
    };
    
    document.querySelectorAll('.option').forEach(i => i.classList.remove('selected'));
    document.querySelector('.option').classList.add('selected');
    document.getElementById('faction').value = 'brak';
    document.getElementById('qty').value = '1';
    
    calc();
}

function saveSale() {
    let accTotal = 0;
    cart.items.forEach(item => {
        accTotal += getDiscountedPrice(item, cart.faction);
    });
    let vestPrice = cart.vestSelected ? getDiscountedPrice(cart.vestSelected, cart.faction) : 0;
    let total = (vestPrice + accTotal) * cart.quantity;
    
    if (total === 0) {
        alert('Wybierz produkty najpierw!');
        return;
    }
    
    let sale = {
        date: new Date().toLocaleString('pl-PL'),
        faction: factions[cart.faction].name,
        vest: cart.vestSelected ? products[cart.vestSelected].name : 'Brak',
        items: cart.items.map(i => products[i].name),
        quantity: cart.quantity,
        total: total
    };
    
    let sales = JSON.parse(localStorage.getItem('armorSales') || '[]');
    sales.push(sale);
    localStorage.setItem('armorSales', JSON.stringify(sales));
    
    alert('Sprzedaż zapisana! Łącznie: ' + format(total));
    reset();
    loadStats();
}

function loadStats() {
    let sales = JSON.parse(localStorage.getItem('armorSales') || '[]');
    
    if (sales.length === 0) {
        document.getElementById('sellerStats').innerHTML = '<div style="color:#666;text-align:center;padding:20px;">Brak danych</div>';
        document.getElementById('productStats').innerHTML = '';
        return;
    }
    
    let productCounts = {};
    let totalRevenue = 0;
    let factionStats = {};
    
    sales.forEach(sale => {
        totalRevenue += sale.total;
        factionStats[sale.faction] = (factionStats[sale.faction] || 0) + sale.total;
        
        if (sale.vest !== 'Brak') {
            productCounts[sale.vest] = (productCounts[sale.vest] || 0) + sale.quantity;
        }
        
        sale.items.forEach(item => {
            productCounts[item] = (productCounts[item] || 0) + sale.quantity;
        });
    });

    let sortedSellers = Object.entries(factionStats).sort((a,b) => b[1] - a[1]).slice(0, 5);
    let sellerHtml = sortedSellers.map(([name, revenue]) => `
        <div class="seller-item">
            <span class="seller-name">${name}</span>
            <span class="seller-revenue">${format(revenue)}</span>
        </div>
    `).join('');
    document.getElementById('sellerStats').innerHTML = sellerHtml;

    let sortedProducts = Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    let productHtml = sortedProducts.map(([name, count]) => `
        <div class="product-item">
            <span class="product-name">${name}</span>
            <span class="product-count">${count} szt.</span>
        </div>
    `).join('');
    document.getElementById('productStats').innerHTML = productHtml;

    updateAdminStats(sales, totalRevenue);
}

function updateAdminStats(sales, totalRevenue) {
    document.getElementById('adminTotalSales').textContent = sales.length;
    document.getElementById('adminTotalRevenue').textContent = format(totalRevenue);
    
    let productCounts = {};
    sales.forEach(sale => {
        if (sale.vest !== 'Brak') {
            productCounts[sale.vest] = (productCounts[sale.vest] || 0) + sale.quantity;
        }
        sale.items.forEach(item => {
            productCounts[item] = (productCounts[item] || 0) + sale.quantity;
        });
    });
    
    let sorted = Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);
    let topHtml = sorted.map(([name, count], idx) => 
        `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
            <span>${idx + 1}. ${name}</span>
            <span style="color:#00ff88">${count} szt.</span>
        </div>`
    ).join('');
    document.getElementById('adminTopProducts').innerHTML = topHtml || 'Brak danych';
}

function resetStats() {
    if (confirm('Czy na pewno chcesz usunąć wszystkie statystyki?')) {
        localStorage.removeItem('armorSales');
        loadStats();
        updateAdminStats([], 0);
        alert('Statystyki zostały zresetowane!');
    }
}

function clearAllData() {
    if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane? Ta operacja jest nieodwracalna!')) {
        localStorage.clear();
        loadStats();
        reset();
        updateAdminStats([], 0);
        alert('Wszystkie dane zostały usunięte!');
    }
}

function exportData() {
    let sales = JSON.parse(localStorage.getItem('armorSales') || '[]');
    let dataStr = JSON.stringify(sales, null, 2);
    let blob = new Blob([dataStr], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'armor_sales_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Dane zostały wyeksportowane!');
}

function importData() {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = event => {
            try {
                let sales = JSON.parse(event.target.result);
                let existing = JSON.parse(localStorage.getItem('armorSales') || '[]');
                let merged = existing.concat(sales);
                localStorage.setItem('armorSales', JSON.stringify(merged));
                loadStats();
                alert('Zaimportowano ' + sales.length + ' sprzedaży!');
            } catch(err) {
                alert('Błąd importu!');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function addTestData() {
    let testSales = [];
    let companies = Object.keys(factions);
    
    for (let i = 0; i < 20; i++) {
        let randomCompany = companies[Math.floor(Math.random() * companies.length)];
        let randomVest = ['vest35', 'vest50', 'vest75'][Math.floor(Math.random() * 3)];
        let items = [];
        if (Math.random() > 0.5) items.push('kabura');
        if (Math.random() > 0.6) items.push('latarka');
        
        testSales.push({
            date: new Date(Date.now() - Math.random() * 30*24*60*60*1000).toLocaleString('pl-PL'),
            faction: factions[randomCompany].name,
            vest: products[randomVest].name,
            items: items,
            quantity: Math.floor(Math.random() * 3) + 1,
            total: (products[randomVest].price + items.length * 25000) * (Math.floor(Math.random() * 3) + 1)
        });
    }
    
    let existing = JSON.parse(localStorage.getItem('armorSales') || '[]');
    let merged = existing.concat(testSales);
    localStorage.setItem('armorSales', JSON.stringify(merged));
    loadStats();
    alert('Dodano ' + testSales.length + ' testowych sprzedaży!');
}

let secretCode = '';
document.addEventListener('keydown', function(e) {
    secretCode += e.key.toLowerCase();
    if (secretCode.includes('killer02')) {
        showAdminPanel();
        secretCode = '';
    }
    if (secretCode.length > 20) secretCode = secretCode.slice(-10);
});

function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel.style.display === 'none' || !adminPanel.style.display) {
        loadStats();
        adminPanel.style.display = 'block';
        adminPanel.style.opacity = '0';
        adminPanel.style.transform = 'scale(0.8) translate(-50%, -50%)';
        setTimeout(() => {
            adminPanel.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            adminPanel.style.opacity = '1';
            adminPanel.style.transform = 'scale(1) translate(-50%, -50%)';
        }, 10);
    } else {
        adminPanel.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const factionSelect = document.getElementById('faction');
    factionSelect.addEventListener('change', function() {
        cart.faction = this.value;
        calc();
    });
    
    calc();
    loadStats();
});
