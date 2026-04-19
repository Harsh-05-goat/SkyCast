(() => {
  const showBlockingMessage = (msg) => {
    document.body.innerHTML = `
      <main class="container">
        <section class="auth-shell">
          <div class="auth-card">
            <h1 class="auth-title">Setup required</h1>
            <p class="auth-subtitle">${msg}</p>
            <div class="auth-actions">
              <a class="topbar-link topbar-cta" href="./login.html">Go to login</a>
              <a class="topbar-link" href="./index.html">Reload</a>
            </div>
          </div>
        </section>
      </main>
    `;
  };

  const redirectToLogin = () => {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const params = new URLSearchParams({ next: current });
    window.location.replace(`./login.html?${params.toString()}`);
  };

  const run = async () => {
    if (window.__supabaseInitError) {
      showBlockingMessage(window.__supabaseInitError);
      return;
    }
    if (!window.sb?.auth) {
      showBlockingMessage("Supabase client is not initialized.");
      return;
    }

    const { data, error } = await window.sb.auth.getSession();
    if (error) {
      redirectToLogin();
      return;
    }
    if (!data?.session) {
      redirectToLogin();
      return;
    }
  };

  run();
})();

