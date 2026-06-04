const API = '/api';

let currentEditor = null; 
let currentDocId = null;
let pptSlides = [];
let pptCurrentSlide = 0;
let excelData = {};
let selectedCell = null;


// DOM
// ============================================
const dashboard = document.getElementById('app-dashboard');
const editorView = document.getElementById('editor-view');

// ============================================
// API
// ============================================
async function api(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(`${API}${url}`, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        showToast('Bağlantı hatası!', 'error');
        throw err;
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadSavedDocs() {
    try {
        const data = await api('/documents');
        const list = document.getElementById('saved-list');
        const empty = document.getElementById('saved-empty');

        if (!data.documents || data.documents.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = data.documents.map(doc => {
            const d = doc.data || {};
            const type = d.type || 'word';
            const typeLabel = { word: 'Word', excel: 'Excel', powerpoint: 'PowerPoint' }[type] || 'Belge';
            const icon = { word: 'W', excel: 'X', powerpoint: 'P' }[type] || '📄';
            const dt = new Date(doc.datetime).toLocaleString('tr-TR');

            return `
            <div class="saved-item" onclick="viewDocument(${doc.id})">
                <div class="saved-item-left">
                    <div class="saved-item-icon ${type}">${icon}</div>
                    <div class="saved-item-info">
                        <h4>${typeLabel} Belgesi #${doc.id}</h4>
                        <p>📅 ${dt}</p>
                    </div>
                </div>
                <div class="saved-item-actions" onclick="event.stopPropagation()">
                    <button onclick="loadDocument(${doc.id})" title="Editörde Aç">📝</button>
                    <button class="delete" onclick="deleteDocument(${doc.id})" title="Sil">🗑️</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        document.getElementById('saved-list').innerHTML = '';
        document.getElementById('saved-empty').style.display = 'block';
    }
}

// ============================================
// EDITOR OPEN/CLOSE
// ============================================
function openEditor(type) {
    currentEditor = type;
    currentDocId = null;
    dashboard.style.display = 'none';
    editorView.style.display = 'flex';

    document.getElementById('editor-word').style.display = type === 'word' ? 'flex' : 'none';
    document.getElementById('editor-excel').style.display = type === 'excel' ? 'flex' : 'none';
    document.getElementById('editor-ppt').style.display = type === 'powerpoint' ? 'flex' : 'none';

    const titles = { word: '📄 Word Belgesi', excel: '📊 Excel Tablosu', powerpoint: '📽 PowerPoint Sunumu' };
    document.getElementById('editor-title').textContent = titles[type] || 'Belge';

    if (type === 'word') {
        document.getElementById('word-editor').innerHTML = '<h1>Yeni Belge</h1><p>Buraya yazmaya başlayın...</p>';
    } else if (type === 'excel') {
        initExcel();
    } else if (type === 'powerpoint') {
        initPPT();
    }
}

function closeEditor() {
    editorView.style.display = 'none';
    dashboard.style.display = 'block';
    currentEditor = null;
    currentDocId = null;
    loadSavedDocs();
}

// ============================================
// SAVE — JSON olarak MySQL'e kaydet
// ============================================
async function saveDocument() {
    let data = {};

    if (currentEditor === 'word') {
        data = {
            type: 'word',
            content: document.getElementById('word-editor').innerHTML,
            textContent: document.getElementById('word-editor').innerText,
        };
    } else if (currentEditor === 'excel') {
        data = {
            type: 'excel',
            cells: collectExcelData(),
            rows: 50,
            cols: 26,
        };
    } else if (currentEditor === 'powerpoint') {
        savePPTCurrentSlide();
        data = {
            type: 'powerpoint',
            slides: pptSlides.map(s => ({ content: s.content, bg: s.bg })),
            currentSlide: pptCurrentSlide,
        };
    }

    try {
        if (currentDocId) {
            await api(`/documents/${currentDocId}`, 'PUT', { data });
            showToast('💾 Belge güncellendi!', 'success');
        } else {
            const result = await api('/documents', 'POST', { data });
            currentDocId = result.id;
            showToast('💾 Belge MySQL veritabanına kaydedildi!', 'success');
        }
    } catch (e) {
        showToast('❌ Kaydetme hatası!', 'error');
    }
}

// ============================================
// LOAD DOCUMENT
// ============================================
async function loadDocument(id) {
    try {
        const doc = await api(`/documents/${id}`);
        const d = doc.data;
        const type = d.type || 'word';

        currentDocId = id;
        openEditor(type);

        if (type === 'word' && d.content) {
            document.getElementById('word-editor').innerHTML = d.content;
        } else if (type === 'excel' && d.cells) {
            initExcel();
            loadExcelData(d.cells);
        } else if (type === 'powerpoint' && d.slides) {
            pptSlides = d.slides.map(s => ({ content: s.content || '', bg: s.bg || '#ffffff' }));
            pptCurrentSlide = 0;
            renderPPTSlideList();
            showPPTSlide(0);
        }

        showToast('📝 Belge yüklendi', 'info');
    } catch (e) { /* handled */ }
}

// ============================================
// VIEW DOCUMENT
// ============================================
async function viewDocument(id) {
    try {
        const doc = await api(`/documents/${id}`);
        const d = doc.data;
        const type = d.type || 'word';
        const dt = new Date(doc.datetime).toLocaleString('tr-TR');

        document.getElementById('view-meta').innerHTML =
            `<span>📅 ${dt}</span><span>📝 ${type.toUpperCase()}</span><span>🔑 ID: ${doc.id}</span>`;

        let content = '';
        if (type === 'word') {
            content = d.content || '<p>İçerik yok</p>';
        } else if (type === 'excel') {
            content = '<table style="border-collapse:collapse;width:100%;">';
            if (d.cells) {
                const cells = d.cells;
                for (let r = 0; r < 10; r++) {
                    content += '<tr>';
                    for (let c = 0; c < 8; c++) {
                        const key = `${r}_${c}`;
                        const val = cells[key] || '';
                        content += `<td style="border:1px solid #ddd;padding:4px 8px;font-size:0.8rem;">${val}</td>`;
                    }
                    content += '</tr>';
                }
            }
            content += '</table>';
        } else if (type === 'powerpoint') {
            content = (d.slides || []).map((s, i) =>
                `<div style="border:1px solid #ddd;padding:16px;margin-bottom:12px;border-radius:8px;background:${s.bg || '#fff'};">
                    <small style="color:#999;">Slayt ${i + 1}</small>
                    <div>${s.content || ''}</div>
                </div>`
            ).join('');
        }

        document.getElementById('view-content').innerHTML = content;
        document.getElementById('btn-load-to-editor').onclick = () => {
            closeViewModal();
            loadDocument(id);
        };
        document.getElementById('modal-view').classList.add('active');
    } catch (e) { /* handled */ }
}

function closeViewModal() {
    document.getElementById('modal-view').classList.remove('active');
}

// ============================================
// DELETE
// ============================================
async function deleteDocument(id) {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/documents/${id}`, 'DELETE');
        showToast('🗑️ Belge silindi', 'info');
        loadSavedDocs();
    } catch (e) { /* handled */ }
}

// ============================================
// WORD EDITOR COMMANDS
// ============================================
function execCmd(cmd) {
    document.execCommand(cmd, false, null);
    document.getElementById('word-editor').focus();
}

function execCmdVal(cmd, val) {
    document.execCommand(cmd, false, val);
    document.getElementById('word-editor').focus();
}

// ============================================
// EXCEL
// ============================================
function initExcel() {
    const table = document.getElementById('excel-table');
    const rows = 50, cols = 26;
    let html = '<thead><tr><th class="corner"></th>';
    for (let c = 0; c < cols; c++) {
        html += `<th>${String.fromCharCode(65 + c)}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let r = 0; r < rows; r++) {
        html += `<tr><th class="row-header">${r + 1}</th>`;
        for (let c = 0; c < cols; c++) {
            const id = `cell_${r}_${c}`;
            html += `<td><input type="text" id="${id}" data-row="${r}" data-col="${c}"
                        onfocus="onCellFocus(this)" onblur="onCellBlur(this)" oninput="onCellInput(this)"></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;
    excelData = {};
}

function onCellFocus(el) {
    const r = el.dataset.row, c = el.dataset.col;
    const colLetter = String.fromCharCode(65 + parseInt(c));
    document.getElementById('cell-ref').value = `${colLetter}${parseInt(r) + 1}`;
    document.getElementById('formula-bar').value = el.value;
    if (selectedCell) selectedCell.parentElement.classList.remove('selected');
    el.parentElement.classList.add('selected');
    selectedCell = el;
}

function onCellBlur(el) {
    el.parentElement.classList.remove('selected');
}

function onCellInput(el) {
    const key = `${el.dataset.row}_${el.dataset.col}`;
    excelData[key] = el.value;
    document.getElementById('formula-bar').value = el.value;
}

function collectExcelData() {
    const cells = {};
    document.querySelectorAll('#excel-table input').forEach(input => {
        if (input.value.trim()) {
            cells[`${input.dataset.row}_${input.dataset.col}`] = input.value;
        }
    });
    return cells;
}

function loadExcelData(cells) {
    Object.entries(cells).forEach(([key, val]) => {
        const [r, c] = key.split('_');
        const el = document.getElementById(`cell_${r}_${c}`);
        if (el) el.value = val;
    });
    excelData = cells;
}

// Formula bar sync
document.getElementById('formula-bar').addEventListener('input', function () {
    if (selectedCell) {
        selectedCell.value = this.value;
        const key = `${selectedCell.dataset.row}_${selectedCell.dataset.col}`;
        excelData[key] = this.value;
    }
});

// ============================================
// POWERPOINT
// ============================================
function initPPT() {
    pptSlides = [{ content: '<h1 style="text-align:center;margin-top:120px;font-size:2.5rem;">Sunum Başlığı</h1><p style="text-align:center;color:#666;font-size:1.2rem;">Alt başlık buraya</p>', bg: '#ffffff' }];
    pptCurrentSlide = 0;
    renderPPTSlideList();
    showPPTSlide(0);
}

function renderPPTSlideList() {
    const list = document.getElementById('ppt-slide-list');
    list.innerHTML = pptSlides.map((s, i) => `
        <div class="ppt-thumb ${i === pptCurrentSlide ? 'active' : ''}"
             onclick="switchSlide(${i})" style="background:${s.bg || '#fff'}; color:#333;">
            Slayt ${i + 1}
        </div>
    `).join('');
}

function showPPTSlide(idx) {
    const slide = document.getElementById('ppt-slide');
    slide.innerHTML = pptSlides[idx].content;
    slide.style.background = pptSlides[idx].bg || '#ffffff';
    slide.style.color = pptSlides[idx].bg === '#1a1a2e' || pptSlides[idx].bg === '#2B579A' ? '#fff' : '#333';
    pptCurrentSlide = idx;
    renderPPTSlideList();
}

function savePPTCurrentSlide() {
    const slide = document.getElementById('ppt-slide');
    pptSlides[pptCurrentSlide].content = slide.innerHTML;
}

function switchSlide(idx) {
    savePPTCurrentSlide();
    showPPTSlide(idx);
}

document.getElementById('btn-add-slide').addEventListener('click', () => {
    savePPTCurrentSlide();
    pptSlides.push({ content: '<h2 style="text-align:center;margin-top:140px;">Yeni Slayt</h2>', bg: '#ffffff' });
    showPPTSlide(pptSlides.length - 1);
    showToast('➕ Slayt eklendi', 'info');
});

document.getElementById('btn-del-slide').addEventListener('click', () => {
    if (pptSlides.length <= 1) { showToast('⚠️ Son slayt silinemez', 'error'); return; }
    pptSlides.splice(pptCurrentSlide, 1);
    if (pptCurrentSlide >= pptSlides.length) pptCurrentSlide = pptSlides.length - 1;
    showPPTSlide(pptCurrentSlide);
    showToast('🗑️ Slayt silindi', 'info');
});

document.getElementById('ppt-bg-color').addEventListener('change', function () {
    pptSlides[pptCurrentSlide].bg = this.value;
    const slide = document.getElementById('ppt-slide');
    slide.style.background = this.value;
    slide.style.color = this.value === '#1a1a2e' || this.value === '#2B579A' || this.value === '#7c5cfc' ? '#fff' : '#333';
    renderPPTSlideList();
});

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('btn-new-word').addEventListener('click', () => openEditor('word'));
document.getElementById('btn-new-excel').addEventListener('click', () => openEditor('excel'));
document.getElementById('btn-new-ppt').addEventListener('click', () => openEditor('powerpoint'));
document.getElementById('btn-back').addEventListener('click', closeEditor);
document.getElementById('btn-save').addEventListener('click', saveDocument);
document.getElementById('btn-refresh').addEventListener('click', loadSavedDocs);
document.getElementById('btn-saved-docs').addEventListener('click', () => {
    document.getElementById('saved-section').scrollIntoView({ behavior: 'smooth' });
});

// Ctrl+S
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentEditor) saveDocument();
    }
    if (e.key === 'Escape') closeViewModal();
});

// ============================================
// TOAST
// ============================================
function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', loadSavedDocs);
