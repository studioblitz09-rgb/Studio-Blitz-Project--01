// Helper to render product card
function createProductCard(product, index = 0) {
    const card = document.createElement('div');
    card.className = 'card reveal'; // Added reveal class for animation
    card.style.setProperty('--i', index);

    // Generate tech spec lines
    const specLines = Object.entries(product.specs)
        .map(([key, value]) => `<li><span>${key}</span> <span>${value}</span></li>`)
        .join('');

    // Build metrics HTML
    let metricsHTML = '';
    if (product.antutu || product.cameraRating || product.gpuRating) {
        metricsHTML = '<div class="card-metrics">';
        if (product.antutu) {
            metricsHTML += `<div class="metric-badge antutu"><i class="fa-solid fa-microchip"></i> ${(product.antutu / 1000).toFixed(0)}K</div>`;
        }
        if (product.cameraRating) {
            metricsHTML += `<div class="metric-badge camera"><i class="fa-solid fa-camera"></i> ${product.cameraRating}/10</div>`;
        }
        if (product.gpuRating) {
            metricsHTML += `<div class="metric-badge gpu"><i class="fa-solid fa-display"></i> ${product.gpuRating}/10</div>`;
        }
        metricsHTML += '</div>';
    }

    // Segment badge
    const segmentClass = product.segment === 'COMING_SOON' ? 'segment-tag coming-soon' : 'segment-tag';
    const segmentHTML = product.segment ?
        `<div class="${segmentClass}">${product.segment.replace(/_/g, ' ')}</div>` : '';

    // Calculate Star Rating (From Reviews or Fallback)
    const ratingVal = getProductRating(product.id, product.cameraRating);
    const reviewCount = getReviewCount(product.id);

    const fullStars = Math.floor(ratingVal);
    const hasHalf = ratingVal % 1 >= 0.5;
    let starsHTML = '<div class="star-rating" style="display: flex; gap: 2px; color: #000; opacity: 0.8; margin-bottom: 5px; justify-content: flex-start; align-items: center;">';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<i class="fa-solid fa-star"></i>';
        } else if (i === fullStars && hasHalf) {
            starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            starsHTML += '<i class="fa-regular fa-star" style="opacity: 0.3;"></i>';
        }
    }
    starsHTML += `<span style="font-size: 0.7rem; color: var(--text-dim); margin-left: 5px;">(${reviewCount})</span>`;
    starsHTML += '</div>';

    card.innerHTML = `
        <div class="card-image">
            <a href="product.html?id=${product.id}"><img src="${product.image}" alt="${product.name}" onerror="this.src='assets/products/101.jpg'"></a>
            ${segmentHTML}
        </div>
        <div class="card-content">
            <h3><a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">${product.name}${product.segment === 'COMING_SOON' ? ' <span style="color: var(--accent-color); font-size: 0.8rem;">(COMING SOON)</span>' : ''}</a></h3>
            ${starsHTML}
            ${metricsHTML}
            <ul class="specs">
                ${specLines}
            </ul>
            <div class="card-footer">
                <span class="price">${product.price}</span>
                <div class="card-actions">
                    <a href="${product.link}" class="btn-primary" target="_blank">BUY NOW</a>
                    <a href="product.html?id=${product.id}" class="btn-outline">VIEW</a>
                </div>
        </div>
    `;
    return card;
}

// Helper to render news card
function createNewsCard(item, index = 0) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--i', index);
    card.innerHTML = `
        <div class="card-image" style="height: 180px;">
            <img src="${item.image}" alt="${item.title}" style="mix-blend-mode: normal;">
        </div>
        <div class="card-content">
            <div style="font-family: 'JetBrains Mono'; font-size: 0.6rem; color: var(--primary); margin-bottom: 10px;">
                ${item.category} // ${item.date}
            </div>
            <h3 style="font-size: 1rem;">${item.title}</h3>
            <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 15px;">${item.excerpt}</p>
            <a href="${item.url}" target="_blank" class="btn-primary" style="display: block; width: 100%;">READ MORE</a>
        </div>
    `;
    return card;
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Studio Blitz Initializing...");

    if (!window.techData) {
        console.error("Data source missing!");
        return;
    }

    // --- CLOUD SYNC SYSTEM (FIREBASE) ---
    try {
        const { db, collection, getDocs } = await import('./firebase-config.js');

        // 1. Fetch Cloud Overrides (Launched devices)
        const overSnap = await getDocs(collection(db, "overrides"));
        const cloudOverrides = {};
        overSnap.forEach(doc => cloudOverrides[doc.id] = doc.data());

        // 2. Fetch Extra Products from Cloud
        const prodSnap = await getDocs(collection(db, "products"));
        const cloudProducts = [];
        prodSnap.forEach(doc => cloudProducts.push(doc.data()));

        // 3. Fetch News from Cloud
        const newsSnap = await getDocs(collection(db, "news"));
        const cloudNews = [];
        newsSnap.forEach(doc => cloudNews.push(doc.data()));

        // --- MERGE LOGIC ---
        const deletedIds = JSON.parse(localStorage.getItem('deleted_tech_ids') || '[]');
        const deletedNewsIds = JSON.parse(localStorage.getItem('deleted_tech_news_ids') || '[]');

        // Merge Products
        let allProducts = [...window.techData.products, ...cloudProducts];
        if (deletedIds.length > 0) {
            allProducts = allProducts.filter(p => !deletedIds.includes(p.id));
        }
        window.techData.products = allProducts.map(product => {
            if (cloudOverrides[product.id]) {
                return { ...product, ...cloudOverrides[product.id] };
            }
            return product;
        });

        // Merge News
        let allNews = [...window.techData.news, ...cloudNews];
        if (deletedNewsIds.length > 0) {
            allNews = allNews.filter(n => !deletedNewsIds.includes(n.id));
        }
        window.techData.news = allNews;

        console.log("Botronics Cloud Sync: SUCCESS");
    } catch (e) {
        console.warn("Cloud Sync Offline: Using local data.", e);
    }

    const { products, news } = window.techData;

    const renderToGrid = (items, gridId) => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = '';
            const container = grid.closest('.price-tier') || grid.closest('.category-section');

            if (items.length === 0) {
                if (container) {
                    container.style.display = 'none';
                }
            } else {
                if (container) {
                    container.style.display = 'block';
                }
                items.forEach((p, idx) => grid.appendChild(createProductCard(p, idx)));
            }
        }
    };

    const renderAll = (filter = '') => {
        const query = filter.toLowerCase().trim();
        const p = products.filter(x => {
            if (!query) return true;
            const nameMatch = x.name && x.name.toLowerCase().includes(query);
            const specMatch = x.specs && Object.values(x.specs).some(s => s && String(s).toLowerCase().includes(query));
            const categoryMatch = x.category && x.category.toLowerCase().includes(query);
            const brandMatch = x.name && x.name.toLowerCase().split(' ')[0].includes(query);
            return nameMatch || specMatch || categoryMatch || brandMatch;
        });

        // Track global visibility
        let totalVisible = 0;
        const grids = [
            'grid-under-10', 'grid-10-20', 'grid-20-30', 'grid-30-40', 'grid-40-50', 'grid-50-60', 'grid-60-80',
            'grid-lap-30-40', 'grid-lap-40-50', 'grid-lap-50-60', 'grid-lap-60-70', 'grid-lap-70-plus',
            'grid-tablets', 'grid-foldables'
        ];

        // Phone Price Logic
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue < 10000), 'grid-under-10');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 10000 && x.priceValue < 20000), 'grid-10-20');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 20000 && x.priceValue < 30000), 'grid-20-30');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 30000 && x.priceValue < 40000), 'grid-30-40');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 40000 && x.priceValue < 50000), 'grid-40-50');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 50000 && x.priceValue < 60000), 'grid-50-60');
        renderToGrid(p.filter(x => x.category === 'Phone' && x.priceValue >= 60000), 'grid-60-80');

        // Laptop Price Logic
        renderToGrid(p.filter(x => x.category === 'Laptop' && x.priceValue < 40000), 'grid-lap-30-40');
        renderToGrid(p.filter(x => x.category === 'Laptop' && x.priceValue >= 40000 && x.priceValue < 50000), 'grid-lap-40-50');
        renderToGrid(p.filter(x => x.category === 'Laptop' && x.priceValue >= 50000 && x.priceValue < 60000), 'grid-lap-50-60');
        renderToGrid(p.filter(x => x.category === 'Laptop' && x.priceValue >= 60000 && x.priceValue < 70000), 'grid-lap-60-70');
        renderToGrid(p.filter(x => x.category === 'Laptop' && x.priceValue >= 70000), 'grid-lap-70-plus');

        // Others
        renderToGrid(p.filter(x => x.category === 'Tablet'), 'grid-tablets');
        renderToGrid(p.filter(x => x.category === 'Foldable'), 'grid-foldables');

        // Toggle Category Headers (Phones, Laptops, etc.)
        const categories = [
            { id: 'phone-category-section', items: p.filter(x => x.category === 'Phone') },
            { id: 'laptop-category-section', items: p.filter(x => x.category === 'Laptop') },
            { id: 'tablet-category-section', items: p.filter(x => x.category === 'Tablet') },
            { id: 'foldable-category-section', items: p.filter(x => x.category === 'Foldable') }
        ];

        categories.forEach(cat => {
            const header = document.getElementById(cat.id);
            if (header) {
                header.style.display = cat.items.length === 0 ? 'none' : 'block';
            }
        });

        // Global empty state
        const emptyMsg = document.getElementById('global-no-results');
        if (emptyMsg) {
            emptyMsg.style.display = p.length === 0 ? 'block' : 'none';
        }
    };

    // Initial Render
    renderAll();

    // Search Interaction
    const searchInput = document.getElementById('lineupSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderAll(e.target.value);
        });
    }


    // Quick Nexus Hub Integration
    const nexus = document.getElementById('quick-nexus');
    if (nexus) {
        nexus.addEventListener('change', (e) => {
            const targetId = e.target.value;
            if (targetId) {
                const element = document.getElementById(targetId);
                if (element) {
                    const offset = 100; // Account for sticky header
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = element.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
                // Reset selector
                e.target.value = '';
            }
        });
    }

    const newsPage = document.getElementById('news-grid-page');
    if (newsPage) {
        // Initial Render
        const renderNews = (filterCategory = 'ALL') => {
            newsPage.innerHTML = '';
            const filteredNews = filterCategory === 'ALL'
                ? news
                : news.filter(n => n.category === filterCategory);

            if (filteredNews.length === 0) {
                newsPage.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px; border: 1px dashed var(--border);">// NO_LOGS_FOUND_FOR_QUERY</div>';
            } else {
                filteredNews.forEach((n, idx) => newsPage.appendChild(createNewsCard(n, idx)));
            }
        };
        renderNews();

        // Filter Logic
        const filters = document.querySelectorAll('.feed-filters .filter-btn');
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update UI
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Get Category from text: "[HARDWARE]" -> "HARDWARE"
                const rawText = btn.textContent.trim();
                const category = rawText.replace('[', '').replace(']', '').replace('_LOGS', '');

                // Map ALL to ALL, otherwise pass category
                renderNews(category === 'ALL' ? 'ALL' : category);
            });
        });
    }

    // Populate Main Hub News (Top 3)
    const mainNews = document.getElementById('main-news-grid');
    if (mainNews) {
        mainNews.innerHTML = '';
        news.slice(0, 3).forEach((n, idx) => mainNews.appendChild(createNewsCard(n, idx)));
    }

    console.log("Render Complete.");
}); // Close DOMContentLoaded



// --- REVIEWS & RATINGS SYSTEM ---

// Helper to get average rating
function getProductRating(productId, fallbackRating) {
    const reviews = JSON.parse(localStorage.getItem('blitzReviews') || '{}');
    const productReviews = reviews[productId] || [];

    if (productReviews.length > 0) {
        const sum = productReviews.reduce((acc, r) => acc + parseInt(r.rating), 0);
        return (sum / productReviews.length).toFixed(1);
    }

    // Fallback if no user ratings yet
    return fallbackRating ? (fallbackRating / 2).toFixed(1) : (4.5).toFixed(1);
}

// Helper to get review count
function getReviewCount(productId) {
    const reviews = JSON.parse(localStorage.getItem('blitzReviews') || '{}');
    return (reviews[productId] || []).length;
}

// --- VISUAL EFFECTS ---

// Scroll Reveal Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Scanline removed
/* 
const scanline = document.createElement('div');
scanline.className = 'scanline';
document.body.appendChild(scanline);
*/

// Observe Elements (Running on window load to ensure DOM is ready)
window.addEventListener('load', () => {
    document.querySelectorAll('.card, .section-title, .hero-content, .category-header').forEach((el) => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});
