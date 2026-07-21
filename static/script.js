document.addEventListener('DOMContentLoaded', () => {
    const iconGrid = document.getElementById('iconGrid');
    const categoryList = document.getElementById('categoryList');
    const topCategoryList = document.getElementById('topCategoryList');
    const searchInput = document.getElementById('searchInput');
    const searchShortcut = document.getElementById('searchShortcut');
    const themeToggle = document.getElementById('themeToggle');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const toast = document.getElementById('toast');
    const currentViewTitle = document.getElementById('currentViewTitle');
    const resultSummary = document.getElementById('resultSummary');

    let allIcons = []; // Stores the raw data
    let currentCategory = 'all';

    // 0. Fetch Config
    async function fetchConfig() {
        try {
            const res = await fetch('/api/config.json');
            const config = await res.json();

            // Update Title
            const siteName = (config.SITE_NAME && config.SITE_NAME.trim()) ? config.SITE_NAME.trim() : 'XG-icons';
            document.title = siteName;
            const siteTitle = document.getElementById('siteTitle');
            if (siteTitle) siteTitle.textContent = siteName;

            // Update Logo
            let logoSrc = config.LOGO_IMG;
            if (!/^https?:\/\//.test(logoSrc)) {
                if (logoSrc === 'favicon.ico') {
                    logoSrc = '/static/favicon.ico';
                } else {
                    logoSrc = logoSrc.startsWith('/') ? logoSrc : `/${logoSrc}`;
                }
            }
            
            const siteLogo = document.getElementById('siteLogo');
            if (siteLogo) siteLogo.src = logoSrc;
            
            const faviconLink = document.getElementById('faviconLink');
            let faviconSrc = config.FAVICON || 'favicon.ico';
            if (!/^https?:\/\//.test(faviconSrc)) {
                faviconSrc = faviconSrc === 'favicon.ico' ? '/static/favicon.ico' : (faviconSrc.startsWith('/') ? faviconSrc : `/${faviconSrc}`);
            }
            if (faviconLink) faviconLink.href = faviconSrc;

            // Update Footer
            const siteFooter = document.getElementById('siteFooter');
            if (siteFooter) siteFooter.innerHTML = config.COPYRIGHT + (config.ICP ? `<br><a id="icpLink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow">${config.ICP}</a>` : '');
            
            const mobileFooter = document.getElementById('mobileFooter');
            if (mobileFooter) mobileFooter.innerHTML = config.COPYRIGHT + (config.ICP ? `<br><a id="icpLink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow">${config.ICP}</a>` : '');
            
            const descTag = document.querySelector('meta[name="description"]');
            if (descTag && config.SEO_DESC) descTag.setAttribute('content', config.SEO_DESC);

        } catch (error) {
            console.error('Error fetching config:', error);
        }
    }

    // 1. Theme Management
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 2. Fetch Data
    async function fetchIcons() {
        try {
            const response = await fetch('/api/icons.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allIcons = data;
            renderCategories();
            renderIcons();
            loading.classList.add('hidden');
        } catch (error) {
            console.error('Error fetching icons:', error);
            loading.innerText = '加载失败，请检查控制台';
            if (resultSummary) resultSummary.textContent = '读取失败';
        }
    }

    // 3. Render Categories
    // Scroll Management
    let allCategoryScrollTop = 0;
    const iconScrollArea = document.getElementById('iconScrollArea');
    const mobileCategorySelect = document.getElementById('mobileCategorySelect');
    const mobileCategoryWrapper = document.querySelector('.mobile-category-wrapper');
    const mobileCategoryTrigger = document.getElementById('mobileCategoryTrigger');
    const mobileCategoryLabel = document.getElementById('mobileCategoryLabel');
    const mobileCategoryMenu = document.getElementById('mobileCategoryMenu');
    const siteLogoEl = document.getElementById('siteLogo');
    const siteTitleEl = document.getElementById('siteTitle');

    const mobileCategoryPills = document.getElementById('mobileCategoryPills');

    function categoryItemMarkup(label, count) {
        return `<button type="button" class="menu-link"><span class="menu-label">${label}</span><span class="menu-count">${count}</span></button>`;
    }

    function renderCategories() {
        // Clear existing
        if (categoryList) categoryList.innerHTML = '';
        if (topCategoryList) topCategoryList.innerHTML = '';
        mobileCategorySelect.innerHTML = '';
        mobileCategoryMenu.innerHTML = '';
        if (mobileCategoryPills) mobileCategoryPills.innerHTML = '';

        // Add "All" option for Desktop
        const totalCount = allIcons.reduce((sum, cat) => sum + cat.icons.length, 0);
        let allLi = null;
        if (topCategoryList) {
            allLi = document.createElement('li');
            allLi.dataset.category = 'all';
            allLi.classList.add('active');
            allLi.innerHTML = categoryItemMarkup('全部', totalCount);
            allLi.addEventListener('click', () => {
                switchCategory('all', allLi);
            });
            topCategoryList.appendChild(allLi);
        } else if (categoryList) {
            allLi = document.createElement('li');
            allLi.dataset.category = 'all';
            allLi.classList.add('active');
            allLi.innerHTML = categoryItemMarkup('全部', totalCount);
            allLi.addEventListener('click', () => {
                switchCategory('all', allLi);
            });
            categoryList.appendChild(allLi);
        }

        // Add "All" option for Mobile
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '全部';
        mobileCategorySelect.appendChild(allOption);
        appendMobileCategoryOption('全部', 'all');

        // Mobile pill: "All"
        if (mobileCategoryPills) {
            const allPill = document.createElement('li');
            allPill.textContent = '全部';
            allPill.dataset.category = 'all';
            allPill.classList.add('active');
            allPill.setAttribute('role', 'button');
            allPill.setAttribute('tabindex', '0');
            allPill.addEventListener('click', () => {
                switchCategory('all', allLi || allPill);
            });
            allPill.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    switchCategory('all', allLi || allPill);
                }
            });
            mobileCategoryPills.appendChild(allPill);
        }

        allIcons.forEach(cat => {
            // Desktop List Item(s)
            const text = `${cat.name} (${cat.icons.length})`;
            if (topCategoryList) {
                const liTop = document.createElement('li');
                liTop.textContent = text;
                liTop.dataset.category = cat.name;
                liTop.addEventListener('click', () => {
                    switchCategory(cat.name, liTop);
                });
                topCategoryList.appendChild(liTop);
            }
            if (categoryList) {
                const liSide = document.createElement('li');
                liSide.dataset.category = cat.name;
                liSide.innerHTML = categoryItemMarkup(cat.name, cat.icons.length);
                liSide.addEventListener('click', () => {
                    switchCategory(cat.name, liSide);
                });
                categoryList.appendChild(liSide);
            }

            // Mobile Option
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            mobileCategorySelect.appendChild(option);
            appendMobileCategoryOption(cat.name, cat.name);

            // Mobile Pill
            if (mobileCategoryPills) {
                const pill = document.createElement('li');
                pill.textContent = cat.name;
                pill.dataset.category = cat.name;
                pill.setAttribute('role', 'button');
                pill.setAttribute('tabindex', '0');
                pill.addEventListener('click', () => {
                    const target = Array.from((categoryList || topCategoryList)?.children || []).find(li => li.dataset.category === cat.name);
                    switchCategory(cat.name, target || pill);
                });
                pill.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        const target = Array.from((categoryList || topCategoryList)?.children || []).find(li => li.dataset.category === cat.name);
                        switchCategory(cat.name, target || pill);
                    }
                });
                mobileCategoryPills.appendChild(pill);
            }
        });

        syncMobileCategoryMenu('all');
        
        // Mobile Select Event Listener
        mobileCategorySelect.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            // Find corresponding list item to pass as activeElement (to keep states synced if resized)
            let activeLi = allLi;
            if (selectedCategory !== 'all') {
                const found = Array.from(categoryList.children).find(li => li.dataset.category === selectedCategory);
                if (found) activeLi = found;
            }
            switchCategory(selectedCategory, activeLi);
        });
    }

    function appendMobileCategoryOption(label, value) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'mobile-category-option';
        option.dataset.category = value;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.textContent = label;
        option.addEventListener('click', () => {
            mobileCategorySelect.value = value;
            mobileCategorySelect.dispatchEvent(new Event('change', { bubbles: true }));
            closeMobileCategoryMenu();
        });
        mobileCategoryMenu.appendChild(option);
    }

    function syncMobileCategoryMenu(categoryName) {
        const selectedOption = mobileCategoryMenu.querySelector(`[data-category="${CSS.escape(categoryName)}"]`);
        if (mobileCategoryLabel) {
            mobileCategoryLabel.textContent = selectedOption ? selectedOption.textContent : categoryName;
        }
        if (mobileCategoryTrigger) {
            mobileCategoryTrigger.setAttribute('aria-label', `选择分类，当前为 ${categoryName === 'all' ? '全部' : categoryName}`);
        }
        mobileCategoryMenu.querySelectorAll('.mobile-category-option').forEach(option => {
            const isSelected = option.dataset.category === categoryName;
            option.classList.toggle('active', isSelected);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    function setMobileCategoryMenuOpen(open) {
        if (!mobileCategoryMenu || !mobileCategoryTrigger) return;
        mobileCategoryMenu.classList.toggle('hidden', !open);
        mobileCategoryTrigger.setAttribute('aria-expanded', String(open));
    }

    function closeMobileCategoryMenu() {
        setMobileCategoryMenuOpen(false);
    }

    mobileCategoryTrigger.addEventListener('click', () => {
        const isOpen = mobileCategoryTrigger.getAttribute('aria-expanded') === 'true';
        setMobileCategoryMenuOpen(!isOpen);
    });

    mobileCategoryTrigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setMobileCategoryMenuOpen(true);
        }
    });

    document.addEventListener('click', event => {
        if (mobileCategoryWrapper && !mobileCategoryWrapper.contains(event.target)) {
            closeMobileCategoryMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMobileCategoryMenu();
    });

    function switchCategory(categoryName, activeElement) {
        // Save scroll position if we are currently on 'all'
        if (currentCategory === 'all') {
            allCategoryScrollTop = iconScrollArea.scrollTop;
        }

        currentCategory = categoryName;
        
        // Sync Desktop UI
        updateActiveCategory(activeElement);
        
        // Sync Mobile UI
        mobileCategorySelect.value = categoryName;
        syncMobileCategoryMenu(categoryName);

        renderIcons();

        // Restore or Reset scroll position
        if (currentCategory === 'all') {
            iconScrollArea.scrollTop = allCategoryScrollTop;
        } else {
            iconScrollArea.scrollTop = 0;
        }
    }

    window.__xgSelectCategory = (categoryName, filename) => {
        const target = Array.from(categoryList?.children || []).find(li => li.dataset.category === categoryName);
        if (!target) return false;
        switchCategory(categoryName, target);

        if (filename) {
            const card = Array.from(iconGrid.children).find(item => item.dataset.filename === filename);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    if (!card.isConnected) return;
                    card.classList.remove('locate-flash');
                    requestAnimationFrame(() => card.classList.add('locate-flash'));
                }, 550);
            }
        }
        return true;
    };

    function updateActiveCategory(activeElement) {
        document.querySelectorAll('.category-nav li, .top-category-nav li').forEach(el => el.classList.remove('active'));
        activeElement.classList.add('active');

        // Sync mobile pills active state
        if (mobileCategoryPills) {
            const cat = activeElement.dataset && activeElement.dataset.category ? activeElement.dataset.category : 'all';
            mobileCategoryPills.querySelectorAll('li').forEach(p => {
                p.classList.toggle('active', p.dataset.category === cat);
            });
            // Scroll active pill into view
            const activePill = mobileCategoryPills.querySelector('li.active');
            if (activePill && activePill.scrollIntoView) {
                activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }

    // 4. Render Icons
    function renderIcons() {
        iconGrid.innerHTML = '';
        const query = searchInput.value.toLowerCase();
        let resultCount = 0;

        if (currentCategory === 'all') {
            const aggregated = [];
            allIcons.forEach(cat => {
                cat.icons.forEach(iconName => {
                    const displayName = iconName.replace(/\.[^/.]+$/, "");
                    if (query && !displayName.toLowerCase().includes(query)) return;
                    aggregated.push({ category: cat.name, iconName, displayName });
                });
            });
            aggregated.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN', { sensitivity: 'base' }) || a.category.localeCompare(b.category, 'zh-CN'));
            aggregated.forEach(item => {
                resultCount++;
                const card = createIconCard(item.category, item.iconName);
                iconGrid.appendChild(card);
            });
        } else {
            allIcons.forEach(cat => {
                if (cat.name !== currentCategory) return;
                cat.icons.forEach(iconName => {
                    const displayName = iconName.replace(/\.[^/.]+$/, "");
                    if (query && !displayName.toLowerCase().includes(query)) return;
                    resultCount++;
                    const card = createIconCard(cat.name, iconName);
                    iconGrid.appendChild(card);
                });
            });
        }

        if (currentViewTitle) {
            currentViewTitle.textContent = currentCategory === 'all' ? '全部图标' : `分类：${currentCategory}`;
        }
        if (resultSummary) {
            resultSummary.textContent = query ? `找到 ${resultCount} 个` : `${resultCount} 个图标`;
        }

        if (resultCount === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function createIconCard(category, filename) {
        const div = document.createElement('div');
        div.className = 'icon-card';
        div.dataset.category = category;
        div.dataset.filename = filename;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        // Construct URL
        const url = `${window.location.origin}/images/${category}/${filename}`;

        // Display Name (hide extension)
        const displayName = filename.replace(/\.[^/.]+$/, "");

        div.innerHTML = `
            <div class="icon-category-badge" aria-hidden="true">${category}</div>
            <div class="icon-img-wrapper">
                <img src="${url}" alt="${filename}" loading="lazy" onerror="this.src='/static/favicon.ico';this.style.opacity=0.5;">
            </div>
            <div class="icon-name" title="${displayName}">
                <span>${displayName}</span>
            </div>
        `;

        div.addEventListener('click', () => {
            openIconModal(url, displayName, category, filename);
        });
        div.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openIconModal(url, displayName, category, filename);
            }
        });

        return div;
    }

    // Lazy-loaded icon modal bridge: loads modal.js on first click, then calls it.
    function openIconModal(url, displayName, category, filename) {
        if (window.__xgOpenModal) {
            window.__xgOpenModal(url, displayName, category, filename);
            return;
        }
        const s = document.createElement('script');
        s.src = '/static/modal.js';
        s.onload = () => {
            if (window.__xgOpenModal) window.__xgOpenModal(url, displayName, category, filename);
        };
        s.onerror = () => {
            // Fallback to copy if the modal fails to load
            copyToClipboard(url, displayName);
        };
        document.body.appendChild(s);
    }

    // 5. Search
    const clearSearchBtn = document.getElementById('clearSearch');

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';
    const shortcutKey = searchShortcut?.querySelector('kbd');
    if (shortcutKey) shortcutKey.textContent = shortcutLabel;

    function focusSearch() {
        if (document.body.classList.contains('modal-open')) return;
        searchInput.focus();
        searchInput.select();
    }

    function toggleClearBtn() {
        const hasValue = searchInput.value.length > 0;
        clearSearchBtn.classList.toggle('hidden', !hasValue);
        if (searchShortcut) searchShortcut.classList.toggle('hidden', hasValue);
    }

    searchInput.addEventListener('input', () => {
        toggleClearBtn();
        renderIcons();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        toggleClearBtn();
        renderIcons();
        searchInput.focus();
    });

    if (searchShortcut) searchShortcut.addEventListener('click', focusSearch);
    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            focusSearch();
        }
    });

    // 6. Copy to Clipboard
    async function copyToClipboard(text, label) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`已复制：${label || text}`);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("Copy");
            textArea.remove();
            showToast(`已复制：${label || text}`);
        }
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Expose toast so the lazily-loaded modal.js can reuse the frosted-glass toast
    window.__xgToast = showToast;

    // 7. Back to Top
    const backToTopBtn = document.getElementById('backToTop');

    iconScrollArea.addEventListener('scroll', () => {
        if (iconScrollArea.scrollTop > 300) {
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        iconScrollArea.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 8. Click Logo/Title to scroll to top
    function scrollTopViaLogo() {
        iconScrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (siteLogoEl) siteLogoEl.addEventListener('click', scrollTopViaLogo);
    if (siteTitleEl) siteTitleEl.addEventListener('click', scrollTopViaLogo);

    // Init
    fetchConfig();
    fetchIcons();
});
