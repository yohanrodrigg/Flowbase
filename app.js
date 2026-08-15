@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

:root {
  --bg: #0f1419;
  --surface: #171d26;
  --surface-2: #1f2733;
  --border: #2a3341;
  --text: #e8ecf1;
  --muted: #8b95a3;
  --accent: #2dd4bf;
  --accent-ink: #0a2320;
  --danger: #f87171;

  --usd: #34d399;
  --cup: #60a5fa;
  --mxn: #fbbf24;
  --eur: #c084fc;

  --radius: 14px;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}

[data-theme="light"] {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --surface-2: #eef0f3;
  --border: #dfe3e8;
  --text: #16191f;
  --muted: #6b7280;
  --accent: #0d9488;
  --accent-ink: #ffffff;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
}

.numeral {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

#app { max-width: 480px; margin: 0 auto; min-height: 100vh; padding-bottom: 76px; position: relative; }

/* ---- Login ---- */
.login-screen { display: flex; flex-direction: column; justify-content: center; min-height: 100vh; padding: 32px; }
.login-screen h1 { font-family: var(--font-display); font-size: 2rem; margin-bottom: 4px; }
.login-screen p.tag { color: var(--muted); margin-top: 0; margin-bottom: 32px; }
input[type="email"], input[type="password"], input[type="text"], input[type="number"], input[type="tel"], select {
  width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--surface); color: var(--text); font-size: 1rem; margin-bottom: 12px; font-family: var(--font-body);
}
button {
  font-family: var(--font-body); font-weight: 600; border: none; border-radius: 10px;
  padding: 14px 18px; font-size: 1rem; cursor: pointer;
}
.btn-primary { background: var(--accent); color: var(--accent-ink); width: 100%; }
.btn-secondary { background: var(--surface-2); color: var(--text); width: 100%; }
.btn-danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
.error-text { color: var(--danger); font-size: 0.9rem; margin: -6px 0 12px; }

/* ---- Header / summary strip ---- */
.summary-strip { display: flex; gap: 12px; padding: 20px 16px 8px; }
.summary-box { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.summary-box .label { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
.summary-box .value { font-family: var(--font-display); font-size: 1.4rem; margin-top: 4px; }

/* ---- Point cards ---- */
.points-grid { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.point-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.point-card .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 8px; }
.point-card .name { font-weight: 600; }
.point-card .balances { color: var(--muted); font-size: 0.85rem; margin-top: 4px; }
.point-card .balances .amt { font-family: var(--font-display); }
.add-btn {
  width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: var(--accent-ink);
  font-size: 1.4rem; line-height: 1; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.add-point-card {
  border: 1px dashed var(--border); border-radius: var(--radius); padding: 16px;
  text-align: center; color: var(--muted); background: transparent;
}

/* ---- Bottom sheet ---- */
.sheet-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; z-index: 40;
}
.sheet-backdrop.open { display: block; }
.sheet {
  position: fixed; left: 0; right: 0; bottom: -100%; max-width: 480px; margin: 0 auto;
  background: var(--surface); border-radius: 20px 20px 0 0; padding: 20px 20px 28px;
  z-index: 50; transition: bottom 0.25s ease; max-height: 85vh; overflow-y: auto;
}
.sheet.open { bottom: 0; }
.sheet h2 { font-family: var(--font-display); margin-top: 0; }
.amount-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
.amount-chip {
  background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px;
  padding: 10px 4px; text-align: center; color: var(--text); font-family: var(--font-display);
}
.amount-chip.selected { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.commission-preview { background: var(--surface-2); border-radius: 10px; padding: 12px; margin: 12px 0; font-size: 0.9rem; }
.commission-preview .big { font-family: var(--font-display); font-size: 1.3rem; }

/* ---- Bottom tab bar ---- */
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0; max-width: 480px; margin: 0 auto;
  background: var(--surface); border-top: 1px solid var(--border);
  display: flex; z-index: 30;
}
.tabbar button {
  flex: 1; background: none; color: var(--muted); border-radius: 0; padding: 12px 4px 10px;
  font-size: 0.7rem; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.tabbar button.active { color: var(--accent); }
.tabbar .icon { font-size: 1.2rem; }

.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* ---- History ---- */
.history-item {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.history-item .meta { color: var(--muted); font-size: 0.78rem; }
.history-item .amt { font-family: var(--font-display); }
.search-bar { padding: 12px 16px 0; }
.chart-wrap { padding: 12px 16px; }
.chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 100px; }
.chart-bars .bar { flex: 1; background: var(--accent); border-radius: 3px 3px 0 0; min-height: 2px; }

/* ---- Sections / settings ---- */
.section { padding: 16px; }
.section h3 { font-family: var(--font-display); font-size: 1rem; margin: 0 0 10px; }
.field-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
.field-row label { flex: 1; color: var(--muted); font-size: 0.9rem; }
.field-row input { margin-bottom: 0; width: 110px; }
.toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
.client-item { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.pill { padding: 3px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill.usd { background: color-mix(in srgb, var(--usd) 20%, transparent); color: var(--usd); }
.pill.cup { background: color-mix(in srgb, var(--cup) 20%, transparent); color: var(--cup); }
.pill.mxn { background: color-mix(in srgb, var(--mxn) 20%, transparent); color: var(--mxn); }
.pill.eur { background: color-mix(in srgb, var(--eur) 20%, transparent); color: var(--eur); }

.hidden { display: none !important; }
.top-title { padding: 20px 16px 0; font-family: var(--font-display); font-size: 1.5rem; }
