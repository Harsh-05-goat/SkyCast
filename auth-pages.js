(() => {
  const statusEl = document.getElementById("auth-status");
  const formEl = document.querySelector("form.auth-form");

  const setStatus = (msg, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
  };

  const getNextUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (!next) return "./index.html";
    if (next.includes("login") || next.includes("signup")) return "./index.html";
    return `./${next}`;
  };

  const ensureClient = () => {
    if (window.__supabaseInitError) {
      setStatus(window.__supabaseInitError, true);
      return false;
    }
    if (!window.sb?.auth) {
      setStatus("Supabase client not initialized.", true);
      return false;
    }
    return true;
  };

  const maybeRedirectIfAlreadyAuthed = async () => {
    if (!ensureClient()) return;
    const { data } = await window.sb.auth.getSession();
    if (data?.session) window.location.replace(getNextUrl());
  };

  const handleLogin = async () => {
    const email = document.getElementById("login-email")?.value?.trim();
    const password = document.getElementById("login-password")?.value || "";

    if (!email || !password) {
      setStatus("Please enter email and password.", true);
      return;
    }

    setStatus("Signing you in...");
    const { error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message || "Login failed.", true);
      return;
    }
    setStatus("Logged in. Redirecting...");
    window.location.replace(getNextUrl());
  };

  const handleSignup = async () => {
    const email = document.getElementById("signup-email")?.value?.trim();
    const password = document.getElementById("signup-password")?.value || "";

    if (!email || !password) {
      setStatus("Please enter email and password.", true);
      return;
    }

    setStatus("Creating your account...");
    const { data, error } = await window.sb.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message || "Sign up failed.", true);
      return;
    }

    if (data?.session) {
      setStatus("Account created. Redirecting...");
      window.location.replace(getNextUrl());
      return;
    }

    setStatus("Account created. Check your email to confirm, then log in.");
  };

  const run = async () => {
    if (!formEl || !statusEl) return;
    if (!ensureClient()) return;

    const isLogin = !!document.getElementById("login-email");
    const isSignup = !!document.getElementById("signup-email");

    await maybeRedirectIfAlreadyAuthed();

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!ensureClient()) return;
      try {
        if (isLogin) await handleLogin();
        else if (isSignup) await handleSignup();
      } catch {
        setStatus("Something went wrong. Please try again.", true);
      }
    });
  };

  run();
})();

