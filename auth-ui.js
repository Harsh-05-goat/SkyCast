(() => {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const setHidden = (id, hidden) => {
    const el = document.getElementById(id);
    if (el) el.hidden = hidden;
  };

  const wireLogout = () => {
    const btn = document.getElementById("logout-btn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      if (!window.sb?.auth) return;
      await window.sb.auth.signOut();
      window.location.replace("./login.html");
    });
  };

  const run = async () => {
    wireLogout();

    if (window.__supabaseInitError || !window.sb?.auth) {
      setHidden("nav-authenticated", true);
      setHidden("nav-anon", false);
      setText("nav-user", "Not configured");
      return;
    }

    const { data } = await window.sb.auth.getUser();
    const email = data?.user?.email || "Account";

    const isAuthed = !!data?.user;
    setHidden("nav-authenticated", !isAuthed);
    setHidden("nav-anon", isAuthed);
    setText("nav-user", email);
  };

  run();
})();

