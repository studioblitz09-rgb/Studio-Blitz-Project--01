
let selectedIds = [];

function renderSelectionGrid() {
    const { products } = window.techData;

    // Fill Phones
    const phoneGrid = document.getElementById('phone-selection-grid');
    if (phoneGrid) {
        phoneGrid.innerHTML = '';
        products.filter(p => p.category === 'Phone').forEach(p => {
            renderItemToGrid(p, phoneGrid);
        });
    }

    // Fill Laptops
    const laptopGrid = document.getElementById('laptop-selection-grid');
    if (laptopGrid) {
        laptopGrid.innerHTML = '';
        products.filter(p => p.category === 'Laptop').forEach(p => {
            renderItemToGrid(p, laptopGrid);
        });
    }

    // Fill Tablets
    const tabletGrid = document.getElementById('tablet-selection-grid');
    if (tabletGrid) {
        tabletGrid.innerHTML = '';
        products.filter(p => p.category === 'Tablet').forEach(p => {
            renderItemToGrid(p, tabletGrid);
        });
    }
}

function renderItemToGrid(p, grid) {
    const div = document.createElement('div');
    const isSelected = selectedIds.includes(p.id);

    div.className = 'card';
    div.style.cssText = `
        padding: 15px; 
        display: flex; 
        align-items: center; 
        gap: 15px; 
        cursor: pointer;
        border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'};
        transition: 0.3s;
        background: ${isSelected ? 'rgba(0, 0, 0, 0.05)' : 'var(--card)'};
    `;

    // dim other items if max selected or differing category
    if (selectedIds.length > 0) {
        const firstId = selectedIds[0];
        const { products } = window.techData;
        const firstItem = products.find(x => x.id === firstId);
        if (firstItem && firstItem.category !== p.category) {
            div.style.opacity = '0.2';
            div.style.pointerEvents = 'none';
            div.style.filter = 'grayscale(1)';
        }
    }

    div.innerHTML = `
        <img src="${p.image}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: contain; background: #000;" onerror="this.src='assets/products/101.jpg'">
        <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 1rem; color: var(--text);">${p.name}</div>
            <div style="font-size: 0.85rem; color: var(--text-dim);">${p.price}</div>
        </div>
        <div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${isSelected ? '#000' : 'var(--text-dim)'};">
            ${isSelected ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>'}
        </div>
    `;
    div.onclick = () => toggleSelection(p.id);
    grid.appendChild(div);
}

function toggleSelection(id) {
    if (selectedIds.includes(id)) {
        selectedIds = selectedIds.filter(i => i !== id);
    } else {
        if (selectedIds.length >= 3) {
            alert("Studio Blitz limit: Compare up to 3 devices.");
            return;
        }
        // Enforce same category
        if (selectedIds.length > 0) {
            const { products } = window.techData;
            const first = products.find(p => p.id === selectedIds[0]);
            const current = products.find(p => p.id === id);
            if (first && current && first.category !== current.category) {
                alert(`Blitz Mismatch: You cannot compare ${first.category}s with ${current.category}s.`);
                return;
            }
        }
        selectedIds.push(id);
    }
    renderSelectionGrid();
    renderComparisonTable();
}

function renderComparisonTable() {
    const { products } = window.techData;
    const container = document.getElementById('comparison-container');
    const emptyState = document.getElementById('empty-state');
    const thead = document.getElementById('comp-header');
    const tbody = document.getElementById('comp-body');

    if (selectedIds.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    const selectedProducts = products.filter(p => selectedIds.includes(p.id));

    // Headers
    let headerHTML = '<th class="spec-label">Blitz Specs</th>';
    selectedProducts.forEach(p => {
        headerHTML += `
            <th>
                <div class="comp-img-wrapper">
                    <img src="${p.image}" alt="${p.name}" class="comp-img" onerror="this.src='assets/products/101.jpg'">
                </div>
                <div class="comp-name">${p.name}</div>
                <div class="price">${p.price}</div>
            </th>
        `;
    });
    thead.innerHTML = `<tr>${headerHTML}</tr>`;

    // Rows
    const specsKeys = [...new Set(selectedProducts.flatMap(p => Object.keys(p.specs)))];
    let rowsHTML = '';

    // Add Specs properties
    specsKeys.forEach(key => {
        rowsHTML += `
            <tr>
                <td class="spec-label">${key}</td>
                ${selectedProducts.map(p => `<td style="color: var(--text);">${p.specs[key] || '-'}</td>`).join('')}
            </tr>
        `;
    });

    // Add Antutu Row
    rowsHTML += `
        <tr>
            <td class="spec-label">CPU Antutu Score</td>
            ${selectedProducts.map(p => `
                <td style="color: var(--primary); font-weight: 700; font-family: 'Outfit', sans-serif;">
                    ${p.antutu ? p.antutu.toLocaleString() : '-'}
                </td>
            `).join('')}
        </tr>
    `;

    // Add Special Ratings Row (Camera for Phones/Tablets, GPU for Laptops)
    rowsHTML += `
        <tr>
            <td class="spec-label">Review Rating</td>
            ${selectedProducts.map(p => {
        const rating = p.cameraRating || p.gpuRating;
        const type = p.cameraRating ? 'Camera' : 'GPU';
        return `<td>${rating ? `${rating}/10 (${type})` : '-'}</td>`;
    }).join('')}
        </tr>
    `;

    // Add Segment Row
    rowsHTML += `
        <tr>
            <td class="spec-label">Blitz Segment</td>
            ${selectedProducts.map(p => `<td>${p.segment ? p.segment.replace(/_/g, ' ') : '-'}</td>`).join('')}
        </tr>
    `;

    // Add Pros Row
    rowsHTML += `
        <tr>
            <td class="spec-label">Pros</td>
            ${selectedProducts.map(p => `
                <td style="text-align: left; vertical-align: top;">
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.75rem;">
                        ${(p.pros || []).map(pro => `<li style="margin-bottom: 4px; color: #000;">• ${pro}</li>`).join('')}
                    </ul>
                </td>
            `).join('')}
        </tr>
    `;

    // Add Cons Row
    rowsHTML += `
        <tr>
            <td class="spec-label">Cons</td>
            ${selectedProducts.map(p => `
                <td style="text-align: left; vertical-align: top;">
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.75rem;">
                        ${(p.cons || []).map(con => `<li style="margin-bottom: 4px; color: #666;">• ${con}</li>`).join('')}
                    </ul>
                </td>
            `).join('')}
        </tr>
    `;

    // Add Shop Row
    rowsHTML += `
        <tr>
            <td class="spec-label">Blitz Action</td>
            ${selectedProducts.map(p => `
                <td style="text-align: center;">
                    <a href="${p.link}" class="btn-primary" target="_blank" style="padding: 10px 20px; font-size: 0.8rem;">SHOP NOW</a>
                </td>
            `).join('')}
        </tr>
    `;

    tbody.innerHTML = rowsHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.techData) return;
    renderSelectionGrid();
});
