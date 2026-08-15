// ============================================================
// FLOWBASE — lógica principal
// ============================================================
const state = {
  puntos: [],
  saldos: [],
  tasas: {},      // { USD: 320, EUR: 350, MXN: 17 }
  comisiones: [],
  clientes: [],
  transacciones: [],
  selectedPuntoId: null,
  selectedMonto: null,
};

const MONTOS_DISPONIBLES = [10, 20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

// ---------- Conversión de monedas (USD como base, CUP con tasa=1) ----------
function rateOf(moneda) {
  if (moneda === 'CUP') return 1;
  return state.tasas[moneda] || 1;
}
function convert(amountUsd, targetMoneda) {
  const rUSD = state.tasas['USD'] || 1;
  return round2(amountUsd * (rUSD / rateOf(targetMoneda)));
}
function round2(n) { return Math.round(n * 100) / 100; }

// ---------- Carga de datos ----------
async function loadAll() {
  const sb = window.supabaseClient;
  const [puntos, saldos, tasas, comisiones, clientes, transacciones] = await Promise.all([
    sb.from('puntos').select('*').eq('activo', true).order('orden'),
    sb.from('saldos').select('*'),
    sb.from('tasas_cambio').select('*').order('vigente_desde', { ascending: false }),
    sb.from('comisiones').select('*').eq('activo', true).order('monto'),
    sb.from('clientes').select('*').order('nombre'),
    sb.from('transacciones').select('*, clientes(nombre), origen:punto_origen_id(nombre), destino:punto_destino_id(nombre)')
      .order('creado_en', { ascending: false }).limit(300),
  ]);
  state.puntos = puntos.data || [];
  state.saldos = saldos.data || [];
  state.comisiones = comisiones.data || [];
  state.clientes = clientes.data || [];
  state.transacciones = transacciones.data || [];

  const latestByMoneda = {};
  (tasas.data || []).forEach(t => {
    if (!latestByMoneda[t.moneda]) latestByMoneda[t.moneda] = t.valor;
  });
  state.tasas = latestByMoneda;

  renderAll();
}

function saldoDe(puntoId, moneda) {
  const s = state.saldos.find(x => x.punto_id === puntoId && x.moneda === moneda);
  return s ? Number(s.monto) : 0;
}

async function actualizarSaldo(puntoId, moneda, delta) {
  const existing = state.saldos.find(x => x.punto_id === puntoId && x.moneda === moneda);
  const nuevo = round2((existing ? Number(existing.monto) : 0) + delta);
  const sb = window.supabaseClient;
  if (existing) {
    await sb.from('saldos').update({ monto: nuevo }).eq('id', existing.id);
  } else {
    await sb.from('saldos').insert({ punto_id: puntoId, moneda, monto: nuevo });
  }
}

function comisionPara(monto) {
  const row = state.comisiones.find(c => Number(c.monto) === Number(monto));
  return row ? Number(row.comision) : 0;
}

// ============================================================
// RENDER
// ============================================================
function renderAll() {
  renderSummary();
  renderPoints();
  renderHistory();
  renderClients();
  renderSettings();
}

function renderSummary() {
  let totalUsd = 0, comisionUsd = 0;
  state.saldos.forEach(s => { totalUsd += convertToUsd(Number(s.monto), s.moneda); });
  const cuba = state.puntos.find(p => p.es_cuba);
  state.transacciones.forEach(t => {
    if (t.tipo === 'remesa') comisionUsd += Number(t.comision || 0);
  });
  document.getElementById('sum-total').textContent = fmt(totalUsd) + ' USD';
  document.getElementById('sum-comision').textContent = fmt(comisionUsd) + ' USD';
}
function convertToUsd(amount, moneda) {
  if (moneda === 'USD') return amount;
  if (moneda === 'CUP') return round2(amount / (state.tasas['USD'] || 1));
  const rUSD = state.tasas['USD'] || 1;
  const r = state.tasas[moneda] || 1;
  return round2(amount * (r / rUSD));
}
function fmt(n) { return Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function renderPoints() {
  const wrap = document.getElementById('points-grid');
  wrap.innerHTML = '';
  state.puntos.forEach(p => {
    const monedas = p.es_cuba ? ['USD', 'CUP'] : monedasDePunto(p.id);
    const balancesHtml = monedas.map(m =>
      `<span class="amt">${fmt(saldoDe(p.id, m))}</span> ${m}`
    ).join(' · ');
    const card = document.createElement('div');
    card.className = 'point-card';
    card.innerHTML = `
      <div>
        <div class="name"><span class="dot" style="background:${p.color}"></span>${p.nombre}${p.es_cuba ? ' (Stock)' : ''}</div>
        <div class="balances">${balancesHtml || 'sin saldo'}</div>
      </div>
      <button class="add-btn" data-punto="${p.id}">+</button>
    `;
    wrap.appendChild(card);
  });
  const addCard = document.createElement('button');
  addCard.className = 'add-point-card';
  addCard.style.width = '100%';
  addCard.textContent = '+ Agregar país / punto';
  addCard.onclick = openAddPointSheet;
  wrap.appendChild(addCard);

  wrap.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => openRemesaSheet(btn.dataset.punto);
  });
}
function monedasDePunto(puntoId) {
  const set = new Set(state.saldos.filter(s => s.punto_id === puntoId).map(s => s.moneda));
  return Array.from(set);
}

// ============================================================
// SHEET: nueva remesa
// ============================================================
function openRemesaSheet(puntoId) {
  state.selectedPuntoId = puntoId;
  state.selectedMonto = null;
  const punto = state.puntos.find(p => p.id === puntoId);
  const sheet = document.getElementById('sheet');
  const monedasDestino = puntoId === state.puntos.find(p=>p.es_cuba)?.id ? [] : ['USD','MXN','EUR'];

  sheet.innerHTML = `
    <h2>Nueva remesa · ${punto.nombre}</h2>
    <label>Monto (valor de referencia en USD)</label>
    <div class="amount-grid" id="amount-grid">
      ${MONTOS_DISPONIBLES.map(m => `<button type="button" class="amount-chip" data-m="${m}">${m}</button>`).join('')}
    </div>
    <label>Entregas en Cuba en</label>
    <select id="moneda-entrega">
      <option value="USD">USD</option>
      <option value="CUP">CUP</option>
    </select>
    <label>Llega al punto en</label>
    <select id="moneda-destino">
      <option value="USD">USD</option>
      <option value="MXN">MXN</option>
      <option value="EUR">EUR</option>
    </select>
    <label>Cliente (opcional)</label>
    <select id="cliente-select">
      <option value="">— sin asignar —</option>
      ${state.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
    </select>
    <div class="commission-preview hidden" id="preview"></div>
    <div id="dup-warning" class="error-text hidden"></div>
    <button class="btn-primary" id="confirm-remesa" style="margin-top:12px">Confirmar remesa</button>
  `;
  openSheet();

  sheet.querySelectorAll('.amount-chip').forEach(chip => {
    chip.onclick = () => {
      sheet.querySelectorAll('.amount-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      state.selectedMonto = Number(chip.dataset.m);
      updatePreview();
    };
  });
  sheet.querySelector('#moneda-entrega').onchange = updatePreview;
  sheet.querySelector('#moneda-destino').onchange = updatePreview;
  sheet.querySelector('#confirm-remesa').onclick = confirmarRemesa;

  function updatePreview() {
    if (!state.selectedMonto) return;
    const comision = comisionPara(state.selectedMonto);
    const monedaEntrega = sheet.querySelector('#moneda-entrega').value;
    const entregaConvertida = monedaEntrega === 'USD' ? state.selectedMonto : convert(state.selectedMonto, 'CUP');
    const monedaDestino = sheet.querySelector('#moneda-destino').value;
    const recibeConvertido = convert(state.selectedMonto + comision, monedaDestino);
    const prev = sheet.querySelector('#preview');
    prev.classList.remove('hidden');
    prev.innerHTML = `
      Comisión: <span class="big">${fmt(comision)} USD</span><br>
      Entregas en Cuba: <b>${fmt(entregaConvertida)} ${monedaEntrega}</b><br>
      Recibes en ${punto.nombre}: <b>${fmt(recibeConvertido)} ${monedaDestino}</b> (incluye comisión)
    `;
  }
}

async function confirmarRemesa() {
  if (!state.selectedMonto) return alert('Selecciona un monto');
  const sheet = document.getElementById('sheet');
  const monedaEntrega = sheet.querySelector('#moneda-entrega').value;
  const monedaDestino = sheet.querySelector('#moneda-destino').value;
  const clienteId = sheet.querySelector('#cliente-select').value || null;
  const puntoId = state.selectedPuntoId;
  const monto = state.selectedMonto;
  const comision = comisionPara(monto);

  // Detector de duplicados: mismo monto + mismo punto + mismo cliente en < 2 min
  const dupWindow = Date.now() - 2 * 60 * 1000;
  const posibleDup = state.transacciones.find(t =>
    t.tipo === 'remesa' && t.punto_destino_id === puntoId &&
    Number(t.monto) === monto && t.cliente_id === clienteId &&
    new Date(t.creado_en).getTime() > dupWindow
  );
  if (posibleDup && !confirm('Ya registraste una remesa igual hace menos de 2 minutos. ¿Seguro que es una nueva y no un doble toque?')) {
    return;
  }

  const cubaId = state.puntos.find(p => p.es_cuba).id;
  const tasaUsd = state.tasas['USD'] || 1;
  const entregaConvertida = monedaEntrega === 'USD' ? monto : convert(monto, 'CUP');
  const recibeConvertido = convert(monto + comision, monedaDestino);

  const sb = window.supabaseClient;
  await sb.from('transacciones').insert({
    tipo: 'remesa',
    punto_origen_id: cubaId,
    punto_destino_id: puntoId,
    monto, comision,
    moneda_origen: 'USD',
    moneda_destino: monedaDestino,
    moneda_entrega: monedaEntrega,
    tasa_usada: tasaUsd,
    cliente_id: clienteId,
    usuario_id: Auth.currentUser.id,
  });

  await actualizarSaldo(cubaId, monedaEntrega, -entregaConvertida);
  await actualizarSaldo(puntoId, monedaDestino, recibeConvertido);

  closeSheet();
  await loadAll();
}

// ============================================================
// SHEET: transferencia entre puntos
// ============================================================
function openTransferSheet() {
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `
    <h2>Transferencia entre puntos</h2>
    <label>Desde</label>
    <select id="tr-origen">${state.puntos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}</select>
    <label>Hacia</label>
    <select id="tr-destino">${state.puntos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}</select>
    <label>Moneda origen</label>
    <select id="tr-moneda-origen"><option>USD</option><option>CUP</option><option>MXN</option><option>EUR</option></select>
    <label>Moneda destino</label>
    <select id="tr-moneda-destino"><option>USD</option><option>CUP</option><option>MXN</option><option>EUR</option></select>
    <label>Monto (en moneda origen)</label>
    <input type="number" id="tr-monto" placeholder="0.00">
    <button class="btn-primary" id="tr-confirm" style="margin-top:8px">Confirmar transferencia</button>
  `;
  openSheet();
  sheet.querySelector('#tr-confirm').onclick = async () => {
    const origenId = sheet.querySelector('#tr-origen').value;
    const destinoId = sheet.querySelector('#tr-destino').value;
    const monedaOrigen = sheet.querySelector('#tr-moneda-origen').value;
    const monedaDestino = sheet.querySelector('#tr-moneda-destino').value;
    const monto = Number(sheet.querySelector('#tr-monto').value);
    if (!monto || monto <= 0) return alert('Ingresa un monto válido');
    const montoUsd = convertToUsd(monto, monedaOrigen);
    const montoDestino = convert(montoUsd, monedaDestino);

    await window.supabaseClient.from('transacciones').insert({
      tipo: 'transferencia', punto_origen_id: origenId, punto_destino_id: destinoId,
      monto: montoUsd, moneda_origen: monedaOrigen, moneda_destino: monedaDestino,
      tasa_usada: state.tasas['USD'] || 1, usuario_id: Auth.currentUser.id,
    });
    await actualizarSaldo(origenId, monedaOrigen, -monto);
    await actualizarSaldo(destinoId, monedaDestino, montoDestino);
    closeSheet();
    await loadAll();
  };
}

// ============================================================
// SHEET: inyección de stock (reposición de efectivo en Cuba)
// ============================================================
function openStockSheet() {
  const cuba = state.puntos.find(p => p.es_cuba);
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `
    <h2>Reponer stock (Cuba)</h2>
    <label>Moneda</label>
    <select id="st-moneda"><option>USD</option><option>CUP</option></select>
    <label>Monto a agregar</label>
    <input type="number" id="st-monto" placeholder="0.00">
    <button class="btn-primary" id="st-confirm" style="margin-top:8px">Agregar al stock</button>
  `;
  openSheet();
  sheet.querySelector('#st-confirm').onclick = async () => {
    const moneda = sheet.querySelector('#st-moneda').value;
    const monto = Number(sheet.querySelector('#st-monto').value);
    if (!monto || monto <= 0) return alert('Ingresa un monto válido');
    await window.supabaseClient.from('transacciones').insert({
      tipo: 'ajuste_stock', punto_destino_id: cuba.id, monto: convertToUsd(monto, moneda),
      moneda_origen: moneda, usuario_id: Auth.currentUser.id, nota: 'Reposición de stock',
    });
    await actualizarSaldo(cuba.id, moneda, monto);
    closeSheet();
    await loadAll();
  };
}

// ============================================================
// SHEET: agregar punto/país
// ============================================================
function openAddPointSheet() {
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `
    <h2>Agregar país / punto</h2>
    <label>Nombre</label>
    <input type="text" id="pt-nombre" placeholder="Ej. Canadá">
    <label>Color</label>
    <input type="text" id="pt-color" placeholder="#f97316" value="#f97316">
    <button class="btn-primary" id="pt-confirm" style="margin-top:8px">Crear punto</button>
  `;
  openSheet();
  sheet.querySelector('#pt-confirm').onclick = async () => {
    const nombre = sheet.querySelector('#pt-nombre').value.trim();
    if (!nombre) return alert('Ponle un nombre');
    const color = sheet.querySelector('#pt-color').value || '#f97316';
    await window.supabaseClient.from('puntos').insert({
      nombre, color, orden: state.puntos.length,
    });
    closeSheet();
    await loadAll();
  };
}

// ============================================================
// HISTORIAL
// ============================================================
function renderHistory(filterText = '') {
  const list = document.getElementById('history-list');
  const f = filterText.trim().toLowerCase();
  const items = state.transacciones.filter(t => {
    if (!f) return true;
    const clienteNombre = t.clientes?.nombre?.toLowerCase() || '';
    return clienteNombre.includes(f) || String(t.monto).includes(f) || (t.destino?.nombre || '').toLowerCase().includes(f);
  });
  list.innerHTML = items.map(t => {
    const fecha = new Date(t.creado_en).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const destinoNombre = t.destino?.nombre || '—';
    const tipoLabel = t.tipo === 'remesa' ? destinoNombre : t.tipo === 'transferencia' ? `${t.origen?.nombre || ''} → ${destinoNombre}` : 'Reposición stock';
    return `<div class="history-item">
      <div>
        <div>${tipoLabel}${t.clientes?.nombre ? ' · ' + t.clientes.nombre : ''}</div>
        <div class="meta">${fecha}</div>
      </div>
      <div class="amt">${fmt(t.monto)} USD${t.comision ? ` <span style="color:var(--accent)">+${fmt(t.comision)}</span>` : ''}</div>
    </div>`;
  }).join('') || '<p style="padding:16px;color:var(--muted)">Sin remesas todavía.</p>';

  renderChart(items);
}

function renderChart(items) {
  const days = 14;
  const buckets = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  items.forEach(t => {
    const key = t.creado_en.slice(0, 10);
    if (key in buckets) buckets[key]++;
  });
  const max = Math.max(1, ...Object.values(buckets));
  const wrap = document.getElementById('chart-bars');
  wrap.innerHTML = Object.values(buckets).map(v =>
    `<div class="bar" style="height:${(v / max) * 100}%" title="${v}"></div>`
  ).join('');
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'history-search') renderHistory(e.target.value);
});

// ============================================================
// CLIENTES
// ============================================================
function renderClients() {
  const list = document.getElementById('clients-list');
  list.innerHTML = state.clientes.map(c => `
    <div class="client-item">
      <div>
        <div>${c.nombre}</div>
        <div class="meta" style="color:var(--muted);font-size:0.8rem">${c.telefono || 'sin teléfono'}</div>
      </div>
    </div>
  `).join('') || '<p style="padding:16px;color:var(--muted)">Sin clientes guardados.</p>';
}

function openAddClientSheet() {
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `
    <h2>Nuevo cliente</h2>
    <label>Nombre *</label>
    <input type="text" id="cl-nombre">
    <label>Carnet (opcional)</label>
    <input type="text" id="cl-carnet">
    <label>Teléfono (opcional)</label>
    <input type="tel" id="cl-telefono">
    <label>Dirección (opcional)</label>
    <input type="text" id="cl-direccion">
    <label>Foto (opcional)</label>
    <input type="file" id="cl-foto" accept="image/*">
    <button class="btn-primary" id="cl-confirm" style="margin-top:8px">Guardar cliente</button>
  `;
  openSheet();
  sheet.querySelector('#cl-confirm').onclick = async () => {
    const nombre = sheet.querySelector('#cl-nombre').value.trim();
    if (!nombre) return alert('El nombre es obligatorio');
    const fotoFile = sheet.querySelector('#cl-foto').files[0];
    let foto_url = null;
    if (fotoFile) foto_url = await compressToDataUrl(fotoFile);
    await window.supabaseClient.from('clientes').insert({
      nombre,
      carnet: sheet.querySelector('#cl-carnet').value || null,
      telefono: sheet.querySelector('#cl-telefono').value || null,
      direccion: sheet.querySelector('#cl-direccion').value || null,
      foto_url,
    });
    closeSheet();
    await loadAll();
  };
}

// Comprime la foto a ~400px de ancho antes de guardarla como base64
function compressToDataUrl(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 400 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
function renderSettings() {
  const ratesWrap = document.getElementById('rates-fields');
  ratesWrap.innerHTML = ['USD', 'EUR', 'MXN'].map(m => `
    <div class="field-row">
      <label>${m} → CUP</label>
      <input type="number" step="0.01" id="rate-${m}" value="${state.tasas[m] || ''}">
    </div>
  `).join('');

  const comWrap = document.getElementById('comisiones-fields');
  comWrap.innerHTML = state.comisiones.map(c => `
    <div class="field-row">
      <label>Monto ${c.monto}</label>
      <input type="number" step="0.01" data-id="${c.id}" class="com-input" value="${c.comision}">
    </div>
  `).join('');
}

async function guardarTasas() {
  const sb = window.supabaseClient;
  for (const m of ['USD', 'EUR', 'MXN']) {
    const val = Number(document.getElementById(`rate-${m}`).value);
    if (val > 0 && val !== state.tasas[m]) {
      await sb.from('tasas_cambio').insert({ moneda: m, valor: val, creado_por: Auth.currentUser.id });
    }
  }
  await loadAll();
  alert('Tasas actualizadas');
}

async function guardarComisiones() {
  const sb = window.supabaseClient;
  const inputs = document.querySelectorAll('.com-input');
  for (const inp of inputs) {
    await sb.from('comisiones').update({ comision: Number(inp.value) }).eq('id', inp.dataset.id);
  }
  await loadAll();
  alert('Comisiones actualizadas');
}

async function hacerCierreCaja() {
  const hoy = new Date().toISOString().slice(0, 10);
  const snapshot = {
    saldos: state.saldos,
    comision_total: state.transacciones
      .filter(t => t.tipo === 'remesa' && t.creado_en.slice(0, 10) === hoy)
      .reduce((s, t) => s + Number(t.comision || 0), 0),
    remesas_hoy: state.transacciones.filter(t => t.tipo === 'remesa' && t.creado_en.slice(0, 10) === hoy).length,
  };
  const { error } = await window.supabaseClient.from('cierres_caja')
    .insert({ fecha: hoy, snapshot, creado_por: Auth.currentUser.id });
  if (error && error.code === '23505') return alert('Ya cerraste la caja de hoy.');
  alert('Caja cerrada: ' + snapshot.remesas_hoy + ' remesas, ' + fmt(snapshot.comision_total) + ' USD en comisión.');
}

function toggleTheme() {
  const html = document.documentElement;
  const next = html.dataset.theme === 'light' ? 'dark' : 'light';
  html.dataset.theme = next;
  localStorage.setItem('flowbase-theme', next);
}

// ============================================================
// SHEET / TABS helpers
// ============================================================
function openSheet() {
  document.getElementById('sheet-backdrop').classList.add('open');
  document.getElementById('sheet').classList.add('open');
}
function closeSheet() {
  document.getElementById('sheet-backdrop').classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.tabbar button[data-tab="${tab}"]`).classList.add('active');
}

// ============================================================
// REALTIME — sincronización automática entre dispositivos
// ============================================================
function subscribeRealtime() {
  window.supabaseClient
    .channel('flowbase-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transacciones' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'saldos' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasas_cambio' }, loadAll)
    .subscribe();
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('flowbase-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  document.getElementById('sheet-backdrop').onclick = closeSheet;
  document.getElementById('btn-transfer').onclick = openTransferSheet;
  document.getElementById('btn-stock').onclick = openStockSheet;
  document.getElementById('btn-add-client').onclick = openAddClientSheet;
  document.getElementById('btn-theme').onclick = toggleTheme;
  document.getElementById('btn-cierre').onclick = hacerCierreCaja;
  document.getElementById('btn-guardar-tasas').onclick = guardarTasas;
  document.getElementById('btn-guardar-comisiones').onclick = guardarComisiones;
  document.getElementById('btn-logout').onclick = () => Auth.logout();
  document.querySelectorAll('.tabbar button').forEach(b => {
    b.onclick = () => switchTab(b.dataset.tab);
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const err = await Auth.login(email, pass);
    document.getElementById('login-error').textContent = err ? 'Correo o contraseña incorrectos' : '';
  });

  Auth.init(async (loggedIn) => {
    document.getElementById('login-screen').classList.toggle('hidden', loggedIn);
    document.getElementById('app-main').classList.toggle('hidden', !loggedIn);
    if (loggedIn) {
      await loadAll();
      subscribeRealtime();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
