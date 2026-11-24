// ==UserScript==
// @name         IU Kaltura Video-Verlauf Tracker
// @namespace    https://github.com/Daniel-Haug/iu-videogalerie-verlauf
// @version      3.2
// @description  Lokaler Watch-History-Tracker, "✓ Gesehen"-Badges und Leertasten-Steuerung für die IU Kaltura Videogalerie
// @match        *://mycampus-classic.iu.org/*
// @match        *://videogallery.iu.org/*
// @all-frames   true
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/Daniel-Haug/iu-videogalerie-verlauf/main/iu-kaltura-verlauf.user.js
// @downloadURL  https://raw.githubusercontent.com/Daniel-Haug/iu-videogalerie-verlauf/main/iu-kaltura-verlauf.user.js
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'iu_kaltura_watch_history_v2';
    const COURSE_KEY = 'iu_kaltura_current_course';
    const COURSE_URL_KEY = 'iu_kaltura_current_course_url';
    const OPEN_MODAL_KEY = 'iu_kaltura_open_modal_trigger';
    const MODAL_ID = 'iu-kaltura-history-modal';
    const BTN_ID = 'iu-kaltura-inline-history-btn';
    const isTopFrame = window.self === window.top;
    const host = window.location.hostname;

    function getHistory() {
        try {
            return JSON.parse(GM_getValue(STORAGE_KEY, '[]'));
        } catch (e) {
            return [];
        }
    }

    function setHistory(list) {
        GM_setValue(STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"');
    }

    function triggerOpenModal() {
        GM_setValue(OPEN_MODAL_KEY, JSON.stringify({ ts: Date.now(), nonce: Math.random() }));
    }

    // Nur im obersten Hauptfenster das Modal anzeigen und verwalten
    if (isTopFrame) {
        function closeHistoryModal() {
            const existing = document.getElementById(MODAL_ID);
            if (existing) existing.remove();
        }

        function openHistoryModal() {
            const existing = document.getElementById(MODAL_ID);
            if (existing) existing.remove();

            const list = getHistory();

            const rowsHtml = list.length === 0
                ? `<div class="iu-kh-empty">Noch keine Videos erfasst.</div>`
                : list.map((item, idx) => {
                    const targetUrl = item.url || 'https://mycampus-classic.iu.org/';
                    return `
                        <div class="iu-kh-item" data-index="${idx}" data-url="${escapeHtml(targetUrl)}" data-title="${escapeHtml(item.title)}" title="Kursseite in neuem Tab öffnen (Titel wird kopiert)">
                            <div class="iu-kh-index">#${idx + 1}</div>
                            <div class="iu-kh-main">
                                ${item.course ? `<span class="iu-kh-course">${escapeHtml(item.course)}</span>` : ''}
                                <div class="iu-kh-title">${escapeHtml(item.title)}</div>
                                <div class="iu-kh-time">${escapeHtml(item.watchedAt)}</div>
                            </div>
                            <button type="button" class="iu-kh-del-item" data-index="${idx}" title="Eintrag löschen">🗑️</button>
                        </div>
                    `;
                }).join('');

            const modal = document.createElement('div');
            modal.id = MODAL_ID;
            modal.innerHTML = `
                <style>
                    #${MODAL_ID} {
                        position: fixed;
                        inset: 0;
                        z-index: 2147483647;
                        background: rgba(8, 11, 18, 0.84);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        transform: translateZ(0);
                    }
                    #${MODAL_ID} .iu-kh-card {
                        width: 100%;
                        max-width: 650px;
                        max-height: 82vh;
                        background: #141820;
                        color: #f8fafc !important;
                        border: 1px solid rgba(255, 255, 255, 0.14);
                        border-radius: 14px;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        transform: translateZ(0);
                    }
                    #${MODAL_ID} .iu-kh-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                        padding: 15px 20px;
                        background: #1b212c;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.09);
                    }
                    #${MODAL_ID} .iu-kh-header h2 {
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 16px !important;
                        font-weight: 600 !important;
                        color: #ffffff !important;
                        line-height: 1.3 !important;
                    }
                    #${MODAL_ID} .iu-kh-actions {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    #${MODAL_ID} .iu-kh-clear-all {
                        background: rgba(239, 68, 68, 0.16);
                        color: #fecaca !important;
                        border: 1px solid rgba(239, 68, 68, 0.35);
                        border-radius: 8px;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    #${MODAL_ID} .iu-kh-clear-all:hover {
                        background: rgba(239, 68, 68, 0.28);
                    }
                    #${MODAL_ID} .iu-kh-close {
                        background: rgba(255, 255, 255, 0.1);
                        color: #ffffff !important;
                        border: none;
                        border-radius: 8px;
                        width: 32px;
                        height: 32px;
                        font-size: 15px;
                        cursor: pointer;
                    }
                    #${MODAL_ID} .iu-kh-close:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    #${MODAL_ID} .iu-kh-list {
                        padding: 14px 20px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(148, 163, 184, 0.35) #141820;
                    }
                    #${MODAL_ID} .iu-kh-list::-webkit-scrollbar {
                        width: 9px;
                    }
                    #${MODAL_ID} .iu-kh-list::-webkit-scrollbar-track {
                        background: #141820;
                    }
                    #${MODAL_ID} .iu-kh-list::-webkit-scrollbar-thumb {
                        background: rgba(148, 163, 184, 0.3);
                        border-radius: 999px;
                        border: 2px solid #141820;
                    }
                    #${MODAL_ID} .iu-kh-list::-webkit-scrollbar-thumb:hover {
                        background: rgba(148, 163, 184, 0.5);
                    }
                    #${MODAL_ID} .iu-kh-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 11px 14px;
                        border-radius: 10px;
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid rgba(255, 255, 255, 0.07);
                        cursor: pointer;
                    }
                    #${MODAL_ID} .iu-kh-item:hover {
                        background: rgba(59, 130, 246, 0.14);
                        border-color: rgba(96, 165, 250, 0.4);
                    }
                    #${MODAL_ID} .iu-kh-index {
                        font-weight: 700;
                        color: #60a5fa !important;
                        font-size: 13px;
                        flex-shrink: 0;
                    }
                    #${MODAL_ID} .iu-kh-main {
                        flex: 1;
                        min-width: 0;
                    }
                    #${MODAL_ID} .iu-kh-course {
                        display: inline-block;
                        font-size: 11px;
                        font-weight: 600;
                        color: #bfdbfe !important;
                        background: rgba(59, 130, 246, 0.18);
                        padding: 2px 8px;
                        border-radius: 999px;
                        margin-bottom: 4px;
                    }
                    #${MODAL_ID} .iu-kh-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #ffffff !important;
                        word-break: break-word;
                    }
                    #${MODAL_ID} .iu-kh-time {
                        font-size: 12px;
                        color: #94a3b8 !important;
                        margin-top: 3px;
                    }
                    #${MODAL_ID} .iu-kh-del-item {
                        background: rgba(255, 255, 255, 0.06);
                        color: #e2e8f0 !important;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 9px;
                        width: 38px;
                        height: 38px;
                        font-size: 18px;
                        line-height: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        flex-shrink: 0;
                    }
                    #${MODAL_ID} .iu-kh-del-item:hover {
                        color: #fecaca !important;
                        background: rgba(239, 68, 68, 0.24);
                        border-color: rgba(239, 68, 68, 0.45);
                    }
                    #${MODAL_ID} .iu-kh-empty {
                        text-align: center;
                        padding: 32px 12px;
                        color: #94a3b8 !important;
                        font-size: 14px;
                    }
                </style>
                <div class="iu-kh-card">
                    <div class="iu-kh-header">
                        <h2>Zuletzt angesehene Videos</h2>
                        <div class="iu-kh-actions">
                            <button type="button" class="iu-kh-clear-all">Verlauf löschen</button>
                            <button type="button" class="iu-kh-close" title="Schließen">✕</button>
                        </div>
                    </div>
                    <div class="iu-kh-list">${rowsHtml}</div>
                </div>
            `;

            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('iu-kh-close')) {
                    closeHistoryModal();
                    return;
                }

                if (e.target.classList.contains('iu-kh-clear-all')) {
                    if (confirm('Gesamten gespeicherten Videoverlauf wirklich löschen?')) {
                        setHistory([]);
                        openHistoryModal();
                    }
                    return;
                }

                const delBtn = e.target.closest('.iu-kh-del-item');
                if (delBtn) {
                    e.stopPropagation();
                    const idx = Number(delBtn.getAttribute('data-index'));
                    const updated = getHistory().filter((_, i) => i !== idx);
                    setHistory(updated);
                    openHistoryModal();
                    return;
                }

                const itemEl = e.target.closest('.iu-kh-item');
                if (itemEl) {
                    const url = itemEl.getAttribute('data-url');
                    const title = itemEl.getAttribute('data-title');
                    if (title && typeof GM_setClipboard === 'function') {
                        GM_setClipboard(title);
                    }
                    if (url) {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }
                }
            });

            document.body.appendChild(modal);
        }

        if (typeof GM_addValueChangeListener === 'function') {
            GM_addValueChangeListener(OPEN_MODAL_KEY, (_name, _oldVal, _newVal, remote) => {
                if (remote) openHistoryModal();
            });

            GM_addValueChangeListener(STORAGE_KEY, (_name, _oldVal, _newVal, remote) => {
                if (remote && document.getElementById(MODAL_ID)) {
                    openHistoryModal();
                }
            });
        }

        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('Angesehene Videos anzeigen', openHistoryModal);
            GM_registerMenuCommand('Videoverlauf löschen', () => {
                if (confirm('Gesamten gespeicherten Videoverlauf wirklich löschen?')) {
                    setHistory([]);
                    if (document.getElementById(MODAL_ID)) {
                        openHistoryModal();
                    }
                }
            });
        }

        if (host === 'mycampus-classic.iu.org') {
            function detectAndSaveCourse() {
                const heading = Array.from(document.querySelectorAll('h1, h2, .page-header-headings'))
                    .map(el => el.textContent.replace(/\s+/g, ' ').trim())
                    .find(t => t.toLowerCase().includes('videogalerie'));

                let courseName = '';
                if (heading) {
                    courseName = heading.replace(/:\s*videogalerie.*/i, '').trim();
                } else if (document.title) {
                    courseName = document.title.split(':')[0].split('|')[0].trim();
                }

                if (courseName && courseName.length >= 2) {
                    GM_setValue(COURSE_KEY, courseName);
                }

                if (window.location.href.includes('courseid=')) {
                    GM_setValue(COURSE_URL_KEY, window.location.href);
                }
            }

            detectAndSaveCourse();
            setInterval(detectAndSaveCourse, 2000);
        }
    }

    // Im eingebetteten Kaltura-Frame tracken UND den Button in #stats_wrap einbauen
    if (!isTopFrame && host === 'videogallery.iu.org') {
        let lastEntryKey = '';

        function setImportantStyle(el, prop, value) {
            if (!el) return;
            el.style.setProperty(prop, value, 'important');
        }

        function clearImportantStyle(el, prop) {
            if (!el) return;
            el.style.removeProperty(prop);
        }

        function updatePlaylistWatchedBadges() {
            const items = document.querySelectorAll('[data-testid="playlist_item"]');
            if (!items.length) return;

            const watchedTitles = new Set(
                getHistory()
                    .map(entry => (entry.title || '').replace(/\s+/g, ' ').trim())
                    .filter(Boolean)
            );

            items.forEach(item => {
                const titleEl = item.querySelector('[class*="playlistItemTitle"]');
                const metaEl = item.querySelector('[class*="playlistItemMetadata"]');
                if (!titleEl) return;

                const itemTitle = titleEl.textContent.replace(/\s+/g, ' ').trim();
                const isWatched = watchedTitles.has(itemTitle);
                let badge = item.querySelector('.iu-kaltura-watched-badge');

                if (isWatched) {
                    if (metaEl) {
                        setImportantStyle(metaEl, 'display', 'flex');
                        setImportantStyle(metaEl, 'flex-direction', 'row');
                        setImportantStyle(metaEl, 'flex-wrap', 'nowrap');
                        setImportantStyle(metaEl, 'align-items', 'center');
                        setImportantStyle(metaEl, 'justify-content', 'space-between');
                        setImportantStyle(metaEl, 'gap', '10px');
                        setImportantStyle(metaEl, 'flex', '1 1 auto');
                        setImportantStyle(metaEl, 'min-width', '0');
                        setImportantStyle(metaEl, 'height', 'auto');
                    }

                    setImportantStyle(titleEl, 'display', 'flex');
                    setImportantStyle(titleEl, 'align-items', 'center');
                    setImportantStyle(titleEl, 'width', 'auto');
                    setImportantStyle(titleEl, 'max-width', '100%');
                    setImportantStyle(titleEl, 'flex', '1 1 auto');
                    setImportantStyle(titleEl, 'min-width', '0');
                    setImportantStyle(titleEl, 'margin', '0');
                    setImportantStyle(titleEl, 'padding', '0');
                    setImportantStyle(titleEl, 'text-align', 'left');
                    setImportantStyle(titleEl, 'line-height', '1.25');

                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'iu-kaltura-watched-badge';
                        badge.textContent = '✓ Gesehen';
                        badge.style.cssText = [
                            'display: inline-flex',
                            'align-items: center',
                            'justify-content: center',
                            'gap: 4px',
                            'margin: 0',
                            'padding: 3px 8px',
                            'border-radius: 999px',
                            'background: rgba(34, 197, 94, 0.18)',
                            'border: 1px solid rgba(74, 222, 128, 0.45)',
                            'color: #86efac',
                            'font-size: 11px',
                            'font-weight: 700',
                            'line-height: 1.2',
                            'flex: 0 0 auto',
                            'white-space: nowrap'
                        ].join(';');

                        if (metaEl) {
                            metaEl.appendChild(badge);
                        } else {
                            item.appendChild(badge);
                        }
                    }
                } else {
                    [
                        'display', 'flex-direction', 'flex-wrap', 'align-items',
                        'justify-content', 'gap', 'flex', 'min-width', 'height'
                    ].forEach(prop => clearImportantStyle(metaEl, prop));

                    [
                        'display', 'align-items', 'width', 'max-width',
                        'flex', 'min-width', 'margin', 'padding', 'text-align', 'line-height'
                    ].forEach(prop => clearImportantStyle(titleEl, prop));

                    if (badge) badge.remove();
                }
            });
        }

        function ensureInlineButton() {
            const sharedBtnStyle = [
                'display: inline-flex',
                'align-items: center',
                'justify-content: center',
                'padding: 12px 18px',
                'margin-top: 6px',
                'margin-bottom: 6px',
                'border-radius: 10px',
                'border: 1px solid rgba(96, 165, 250, 0.5)',
                'background: #1b212c',
                'color: #ffffff',
                'font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                'font-size: 16px',
                'font-weight: 700',
                'line-height: 18px',
                'cursor: pointer',
                'float: right'
            ].join(';');

            function bindButtonEvents(buttonEl) {
                buttonEl.addEventListener('mouseenter', () => {
                    buttonEl.style.background = '#263042';
                    buttonEl.style.borderColor = '#93c5fd';
                });
                buttonEl.addEventListener('mouseleave', () => {
                    buttonEl.style.background = '#1b212c';
                    buttonEl.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                });
                buttonEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerOpenModal();
                });
            }

            const tabWrapper = document.querySelector('.category-tabs__wrapper');
            if (tabWrapper && !document.getElementById('iu-kaltura-gallery-history-btn')) {
                const galBtn = document.createElement('button');
                galBtn.id = 'iu-kaltura-gallery-history-btn';
                galBtn.type = 'button';
                galBtn.textContent = 'Video Verlauf';
                galBtn.style.cssText = sharedBtnStyle;
                bindButtonEvents(galBtn);
                tabWrapper.insertBefore(galBtn, tabWrapper.firstChild);
            }

            const statsWrap = document.getElementById('stats_wrap');
            if (statsWrap && !document.getElementById(BTN_ID)) {
                const btn = document.createElement('button');
                btn.id = BTN_ID;
                btn.type = 'button';
                btn.textContent = 'Video Verlauf';
                btn.style.cssText = `${sharedBtnStyle}; margin-top: 8px; margin-bottom: 4px;`;
                bindButtonEvents(btn);
                statsWrap.appendChild(btn);
            }
        }

        let trackedTitle = '';
        let playedSecondsForCurrentVideo = 0;
        let lastTickTime = Date.now();

        function hasPlayedMoreThanFiveSeconds(title) {
            const now = Date.now();
            const deltaSec = Math.min((now - lastTickTime) / 1000, 2);
            lastTickTime = now;

            if (title !== trackedTitle) {
                trackedTitle = title;
                playedSecondsForCurrentVideo = 0;
                lastEntryKey = '';
            }

            const video = document.querySelector('video');
            if (!video) return false;

            const isActivelyPlaying = !video.paused && !video.ended && video.readyState >= 2;
            if (isActivelyPlaying && deltaSec > 0) {
                playedSecondsForCurrentVideo += deltaSec;
            }

            return playedSecondsForCurrentVideo > 5;
        }

        function saveWatchedVideo(title) {
            if (!title) return;
            const course = GM_getValue(COURSE_KEY, '').trim();
            const courseUrl = GM_getValue(COURSE_URL_KEY, '').trim() || 'https://mycampus-classic.iu.org/';
            const entryKey = `${course}::${title}`;
            if (entryKey === lastEntryKey) return;
            lastEntryKey = entryKey;

            const list = getHistory();
            const entry = {
                course,
                title,
                url: courseUrl,
                watchedAt: new Date().toLocaleString('de-DE')
            };

            if (list.length === 0 || list[0].title !== title || list[0].course !== course) {
                list.unshift(entry);
                setHistory(list);
            }
        }

        function getEntryTitle() {
            const el = document.querySelector('h1.entryTitle');
            if (!el) return '';
            return el.textContent.replace(/\s+/g, ' ').trim();
        }

        function syncTrackerState() {
            const title = getEntryTitle();
            if (!title) return;

            const course = GM_getValue(COURSE_KEY, '').trim();
            document.title = course ? `${title} (${course}) | IU Videogalerie` : `${title} | IU Videogalerie`;

            if (hasPlayedMoreThanFiveSeconds(title)) {
                saveWatchedVideo(title);
            }
        }

        setInterval(() => {
            ensureInlineButton();
            updatePlaylistWatchedBadges();
            syncTrackerState();
        }, 500);
    }

    // Leertaste (Space) zum Starten/Pausieren des Kaltura-Videos nutzen
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space' && e.key !== ' ') return;
        if (e.repeat) return;

        const active = document.activeElement;
        const isTyping = active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            active.isContentEditable
        );
        if (isTyping || document.getElementById(MODAL_ID)) return;

        const video = document.querySelector('video');
        if (!video) return;

        e.preventDefault();
        e.stopPropagation();

        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, true);
})();
