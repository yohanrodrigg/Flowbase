<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Flowbase</title>
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0f1419">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<div id="app">

  <!-- LOGIN -->
  <div id="login-screen" class="login-screen">
    <h1>Flowbase</h1>
    <p class="tag">Control de remesas multi-punto</p>
    <form id="login-form">
      <input type="email" id="login-email" placeholder="Correo" required>
      <input type="password" id="login-password" placeholder="Contraseña" required>
      <div id="login-error" class="error-text"></div>
      <button type="submit" class="btn-primary">Entrar</button>
    </form>
  </div>

  <!-- APP -->
  <div id="app-main" class="hidden">

    <!-- TAB: HOME -->
    <div id="tab-home" class="tab-panel active">
      <div class="summary-strip">
        <div class="summary-box">
          <div class="label">Total general</div>
          <div class="value numeral" id="sum-total">0.00 USD</div>
        </div>
        <div class="summary-box">
          <div class="label">Comisión acumulada</div>
          <div class="value numeral" id="sum-comision">0.00 USD</div>
        </div>
      </div>
      <div id="points-grid" class="points-grid"></div>
      <div style="display:flex;gap:10px;padding:0 16px 16px">
        <button class="btn-secondary" id="btn-transfer">Transferir entre puntos</button>
        <button class="btn-secondary" id="btn-stock">Reponer stock</button>
      </div>
    </div>

    <!-- TAB: HISTORIAL -->
    <div id="tab-historial" class="tab-panel">
      <div class="top-title">Historial</div>
      <div class="chart-wrap">
        <div class="chart-bars" id="chart-bars"></div>
      </div>
      <div class="search-bar">
        <input type="text" id="history-search" placeholder="Buscar por cliente, punto o monto">
      </div>
      <div id="history-list"></div>
    </div>

    <!-- TAB: CLIENTES -->
    <div id="tab-clientes" class="tab-panel">
      <div class="top-title">Clientes</div>
      <div style="padding:12px 16px">
        <button class="btn-primary" id="btn-add-client">+ Nuevo cliente</button>
      </div>
      <div id="clients-list"></div>
    </div>

    <!-- TAB: CONFIGURACIÓN -->
    <div id="tab-config" class="tab-panel">
      <div class="top-title">Configuración</div>

      <div class="section">
        <h3>Tasas de cambio (vs CUP)</h3>
        <div id="rates-fields"></div>
        <button class="btn-secondary" id="btn-guardar-tasas">Guardar tasas</button>
      </div>

      <div class="section">
        <h3>Tabla de comisiones</h3>
        <div id="comisiones-fields"></div>
        <button class="btn-secondary" id="btn-guardar-comisiones">Guardar comisiones</button>
      </div>

      <div class="section">
        <h3>Cierre de caja</h3>
        <button class="btn-secondary" id="btn-cierre">Cerrar caja de hoy</button>
      </div>

      <div class="section">
        <h3>Apariencia</h3>
        <div class="toggle-row">
          <span>Tema claro / oscuro</span>
          <button class="btn-secondary" id="btn-theme" style="width:auto">Cambiar</button>
        </div>
      </div>

      <div class="section">
        <button class="btn-danger" id="btn-logout" style="width:100%">Cerrar sesión</button>
      </div>
    </div>

    <!-- TAB BAR -->
    <div class="tabbar">
      <button data-tab="home" class="active"><span class="icon">🏠</span>Inicio</button>
      <button data-tab="historial"><span class="icon">📜</span>Historial</button>
      <button data-tab="clientes"><span class="icon">👤</span>Clientes</button>
      <button data-tab="config"><span class="icon">⚙️</span>Ajustes</button>
    </div>

    <!-- BOTTOM SHEET (compartido para todos los formularios) -->
    <div id="sheet-backdrop" class="sheet-backdrop"></div>
    <div id="sheet" class="sheet"></div>

  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>
<script src="js/app.js"></script>
</body>
</html>
