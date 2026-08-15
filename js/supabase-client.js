// Requiere que index.html cargue el SDK de Supabase antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.FLOWBASE_CONFIG;

if (SUPABASE_URL.includes('PEGA_TU')) {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML =
      '<div style="padding:40px;font-family:sans-serif;color:#e8ecf1;background:#0f1419;min-height:100vh">' +
      '<h2>Falta configurar Supabase</h2>' +
      '<p>Abre <code>js/config.js</code> y pega tu Project URL y anon key.</p></div>';
  });
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
