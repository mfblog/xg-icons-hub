/* Icon preview modal — lazily loaded on first icon click.
   Reuses the main script's frosted-glass toast via window.__xgToast. */
(function () {
    'use strict';

    let overlayEl = null;
    let modalEl = null;
    let imgEl = null;
    let nameEl = null;
    let catEl = null;
    let copyBtn = null;
    let downloadLink = null;
    let lastFocus = null;

    function build() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'icon-modal-overlay';
        overlayEl.setAttribute('role', 'dialog');
        overlayEl.setAttribute('aria-modal', 'true');
        overlayEl.setAttribute('aria-label', '图标预览');

        modalEl = document.createElement('div');
        modalEl.className = 'icon-modal';
        modalEl.innerHTML =
            '<button class="icon-modal-close" type="button" aria-label="关闭">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
            '</button>' +
            '<div class="icon-modal-icon"><img alt="" /></div>' +
            '<div class="icon-modal-info">' +
            '<div class="icon-modal-name"></div>' +
            '<div class="icon-modal-cat"></div>' +
            '</div>' +
            '<div class="icon-modal-actions">' +
            '<button class="icon-modal-btn icon-modal-copy" type="button">复制链接</button>' +
            '<a class="icon-modal-btn icon-modal-download" download>下载图标</a>' +
            '</div>';

        overlayEl.appendChild(modalEl);
        document.body.appendChild(overlayEl);

        imgEl = modalEl.querySelector('.icon-modal-icon img');
        nameEl = modalEl.querySelector('.icon-modal-name');
        catEl = modalEl.querySelector('.icon-modal-cat');
        copyBtn = modalEl.querySelector('.icon-modal-copy');
        downloadLink = modalEl.querySelector('.icon-modal-download');

        modalEl.querySelector('.icon-modal-close').addEventListener('click', close);
        overlayEl.addEventListener('click', function (e) {
            if (e.target === overlayEl) close();
        });
        document.addEventListener('keydown', onKeydown);
        copyBtn.addEventListener('click', onCopy);

        imgEl.addEventListener('error', function () {
            imgEl.src = '/static/favicon.ico';
            imgEl.style.opacity = 0.5;
        });
    }

    function onKeydown(e) {
        if (e.key === 'Escape' && overlayEl && overlayEl.classList.contains('open')) {
            close();
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
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
    }

    function toast(msg) {
        if (window.__xgToast) window.__xgToast(msg);
    }

    function open(url, displayName, category, filename) {
        if (!overlayEl) build();
        imgEl.src = url;
        imgEl.alt = displayName;
        imgEl.style.opacity = '';
        nameEl.textContent = displayName;
        catEl.textContent = category;
        copyBtn.dataset.url = url;
        downloadLink.href = url;
        downloadLink.setAttribute('download', filename || displayName);
        lastFocus = document.activeElement;
        overlayEl.classList.add('open');
        document.body.classList.add('modal-open');
        const closeBtn = modalEl.querySelector('.icon-modal-close');
        if (closeBtn) closeBtn.focus();
    }

    function close() {
        if (!overlayEl || !overlayEl.classList.contains('open')) return;
        overlayEl.classList.remove('open');
        document.body.classList.remove('modal-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    window.__xgOpenModal = open;
    window.__xgCloseModal = close;
})();
