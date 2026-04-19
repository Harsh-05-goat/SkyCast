(() => {
  const url = window.SUPABASE_URL;
  const anonKey = window.SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("PASTE_") || anonKey.includes("PASTE_")) {
    window.__supabaseInitError =
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY in supabase-config.js.";
    return;
  }

  if (!window.supabase?.createClient) {
    window.__supabaseInitError =
      "Supabase library not loaded. Make sure the supabase-js script is included.";
    return;
  }

  window.sb = window.supabase.createClient(url, anonKey);
})();

