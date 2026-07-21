/* Icon preview modal, lazily loaded on first icon click. */
(function () {
    'use strict';

    let overlayEl = null;
    let modalEl = null;
    let previewEl = null;
    let previewToggle = null;
    let imgEl = null;
    let nameEl = null;
    let catEl = null;
    let categoryBtn = null;
    let copyBtn = null;
    let downloadLink = null;
    let appWindow = null;
    let lastFocus = null;
    let previewTheme = 'light';

    function build() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'icon-modal-overlay';
        overlayEl.setAttribute('role', 'dialog');
        overlayEl.setAttribute('aria-modal', 'true');
        overlayEl.setAttribute('aria-labelledby', 'iconModalTitle');
        overlayEl.setAttribute('aria-hidden', 'true');
        overlayEl.inert = true;

        modalEl = document.createElement('div');
        modalEl.className = 'icon-modal';
        modalEl.setAttribute('tabindex', '-1');
        modalEl.innerHTML =
            '<div class="icon-modal-header">' +
            '<div class="icon-modal-heading">' +
            '<svg class="icon-modal-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>' +
            '<span id="iconModalTitle" class="icon-modal-heading-text"></span>' +
            '</div>' +
            '<button class="icon-modal-close" type="button" aria-label="关闭">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="icon-modal-icon" data-preview-theme="light">' +
            '<button class="icon-modal-category" type="button"><span>分类：</span><strong class="icon-modal-cat"></strong></button>' +
            '<button class="icon-modal-preview-toggle" type="button" aria-label="切换为深色预览背景" title="切换预览背景">' +
            '<svg class="preview-toggle-icon preview-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' +
            '<svg class="preview-toggle-icon preview-toggle-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' +
            '</button>' +
            '<img alt="" />' +
            '</div>' +
            '<div class="icon-modal-actions">' +
            '<button class="icon-modal-btn icon-modal-copy" type="button">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
            '<span>复制链接</span></button>' +
            '<a class="icon-modal-btn icon-modal-download" download>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>' +
            '<span>下载图标</span></a>' +
            '</div>';

        overlayEl.appendChild(modalEl);
        document.body.appendChild(overlayEl);
        appWindow = document.querySelector('.app-window');

        previewEl = modalEl.querySelector('.icon-modal-icon');
        previewToggle = modalEl.querySelector('.icon-modal-preview-toggle');
        imgEl = modalEl.querySelector('.icon-modal-icon img');
        nameEl = modalEl.querySelector('.icon-modal-heading-text');
        catEl = modalEl.querySelector('.icon-modal-cat');
        categoryBtn = modalEl.querySelector('.icon-modal-category');
        copyBtn = modalEl.querySelector('.icon-modal-copy');
        downloadLink = modalEl.querySelector('.icon-modal-download');

        modalEl.querySelector('.icon-modal-close').addEventListener('click', close);
        overlayEl.addEventListener('click', function (event) {
            if (event.target === overlayEl) close();
        });
        document.addEventListener('keydown', onKeydown);
        copyBtn.addEventListener('click', onCopy);
        previewToggle.addEventListener('click', togglePreviewTheme);
        categoryBtn.addEventListener('click', openCategory);

        imgEl.addEventListener('error', function () {
            imgEl.src = '/static/favicon.ico';
            imgEl.style.opacity = 0.5;
        });

        setPreviewTheme(previewTheme);
    }

    function onKeydown(event) {
        if (event.key === 'Escape' && overlayEl && overlayEl.classList.contains('open')) {
            close();
        }
    }

    function setPreviewTheme(theme) {
        previewTheme = theme;
        previewEl.dataset.previewTheme = theme;
        const isDark = theme === 'dark';
        previewToggle.setAttribute('aria-pressed', String(isDark));
        previewToggle.setAttribute('aria-label', isDark ? '切换为浅色预览背景' : '切换为深色预览背景');
        previewToggle.setAttribute('title', isDark ? '切换为浅色预览背景' : '切换为深色预览背景');
    }

    function togglePreviewTheme() {
        setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light');
    }

    function openCategory() {
        const category = categoryBtn.dataset.category || '';
        const filename = categoryBtn.dataset.filename || '';
        if (category && window.__xgSelectCategory) {
            close(document.getElementById('currentViewTitle'));
            window.__xgSelectCategory(category, filename);
        }
    }

    function onCopy() {
        const url = copyBtn.dataset.url || '';
        const name = nameEl.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                toast('已复制：' + name);
            }).catch(function () {
                legacyCopy(url);
                toast('已复制：' + name);
            });
        } else {
            legacyCopy(url);
            toast('已复制：' + name);
        }
    }

    function legacyCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); } catch (error) {}
        document.body.removeChild(textarea);
    }

    function toast(message) {
        if (window.__xgToast) window.__xgToast(message);
    }

    function open(url, displayName, category, filename) {
        if (!overlayEl) build();
        imgEl.src = url;
        imgEl.alt = displayName;
        imgEl.style.opacity = '';
        nameEl.textContent = displayName;
        catEl.textContent = category;
        categoryBtn.dataset.category = category;
        categoryBtn.dataset.filename = filename || '';
        categoryBtn.setAttribute('aria-label', `跳转到 ${category} 分类`);
        copyBtn.dataset.url = url;
        downloadLink.href = url;
        downloadLink.setAttribute('download', filename || displayName);
        setPreviewTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
        lastFocus = document.activeElement;
        overlayEl.inert = false;
        overlayEl.setAttribute('aria-hidden', 'false');
        if (appWindow) appWindow.inert = true;
        overlayEl.classList.add('open');
        document.body.classList.add('modal-open');
        modalEl.focus({ preventScroll: true });
    }

    function close(focusTarget) {
        if (!overlayEl || !overlayEl.classList.contains('open')) return;
        overlayEl.classList.remove('open');
        document.body.classList.remove('modal-open');
        overlayEl.setAttribute('aria-hidden', 'true');
        overlayEl.inert = true;
        if (appWindow) appWindow.inert = false;

        const target = focusTarget || (lastFocus && lastFocus.isConnected ? lastFocus : document.getElementById('currentViewTitle'));
        if (target && target.focus) target.focus({ preventScroll: true });
    }

    window.__xgOpenModal = open;
    window.__xgCloseModal = close;
})();
