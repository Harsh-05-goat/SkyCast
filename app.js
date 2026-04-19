const statusEl = document.getElementById("status");
const weatherGridEl = document.getElementById("weather-grid");
const favoritesListEl = document.getElementById("favorites-list");
const formEl = document.getElementById("search-form");
const inputEl = document.getElementById("city-input");
const locationBtn = document.getElementById("location-btn");
const refreshFavoritesBtn = document.getElementById("refresh-favorites-btn");
const cityButtons = document.querySelectorAll(".city-btn");
const themeToggleBtn = document.getElementById("theme-toggle");
const unitToggleBtn  = document.getElementById("unit-toggle");


const WEATHER_FUNCTION_URL = "https://xzpimjnyrdhpgghtqlru.supabase.co/functions/v1/weather";

const getAuthHeaders = async () => {
  // Always include at minimum the anon key so Supabase doesn't reject with 401.
  // If a real session token is available, prefer that instead.
  const anonKey = window.SUPABASE_ANON_KEY || "";
  const headers = {
    "Content-Type": "application/json",
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`,
  };
  try {
    if (window.sb?.auth) {
      const { data } = await window.sb.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (_) {}
  return headers;
};

let currentCity        = null;
let currentWeatherData = null;
let isFahrenheit       = localStorage.getItem("skycast_unit") === "f";

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const weatherCodeToText = (code) => {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };
  return map[code] ?? "Unknown";
};

const weatherCodeToIcon = (code) => {
  if (code === 0) return "sun";
  if ([1, 2].includes(code)) return "partly cloudy";
  if (code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75].includes(code)) return "snow";
  if (code === 95) return "thunderstorm";
  return "weather";
};

const celsiusToFahrenheit = (c) => Math.round((c * 9) / 5 + 32);
const formatTemp = (celsius) =>
  isFahrenheit ? `${celsiusToFahrenheit(celsius)}\u00b0F` : `${celsius}\u00b0C`;

const buildForecastHtml = (forecast) => {
  if (!forecast?.length) return "";

  const rows = forecast
    .map((day) => {
      const date = new Date(day.date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return `
        <div class="forecast-row">
          <span>${date}</span>
          <span>${formatTemp(day.min_c)} / ${formatTemp(day.max_c)}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="forecast-list">
      <p class="forecast-title">Next 10 days</p>
      ${rows}
    </div>
  `;
};

const saveFavorite = async (city, country) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(WEATHER_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "save_favorite",
        city,
        country,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to save favorite.");
    setStatus(`${city} added to favorites.`);
    await loadFavorites();
  } catch (error) {
    setStatus(error.message || "Could not save favorite.", true);
  }
};

const removeFavorite = async (city) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(WEATHER_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "delete_favorite", city }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to remove favorite.");
    setStatus(`${city} removed from favorites.`);
    await loadFavorites();
  } catch (error) {
    setStatus(error.message || "Could not remove favorite.", true);
  }
};

const renderFavorites = (items) => {
  favoritesListEl.innerHTML = "";
  if (!items.length) {
    favoritesListEl.textContent = "No favorites saved yet.";
    return;
  }

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "favorite-chip";

    const label = document.createElement("button");
    label.type = "button";
    label.className = "chip-label";
    label.textContent = `${item.city}, ${item.country}`;
    label.addEventListener("click", async () => {
      await getWeatherByCity(item.city);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "chip-remove";
    removeBtn.setAttribute("aria-label", `Remove ${item.city} from favorites`);
    removeBtn.textContent = "\u00d7";
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await removeFavorite(item.city);
    });

    chip.appendChild(label);
    chip.appendChild(removeBtn);
    favoritesListEl.appendChild(chip);
  });
};

const loadFavorites = async () => {
  if (WEATHER_FUNCTION_URL.includes(" https://supabase.com/dashboard/project/xzpimjnyrdhpgghtqlru/functions")) return;
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${WEATHER_FUNCTION_URL}?action=list_favorites`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load favorites.");
    renderFavorites(data.favorites || []);
  } catch (error) {
    setStatus(error.message || "Could not load favorites.", true);
  }
};

const renderWeatherCard = (data) => {
  const card = document.createElement("article");
  card.className = "weather-card";
  card.innerHTML = `
    <div class="weather-top">
      <h2>${data.city}</h2>
      <span class="weather-icon">${weatherCodeToIcon(data.weather_code)}</span>
    </div>
    <p class="country">${data.country}</p>
    <p class="temp">${formatTemp(data.temperature_c)}</p>
    <div class="meta">
      <span>Condition: ${weatherCodeToText(data.weather_code)}</span>
      <span>Wind: ${data.wind_kmh} km/h</span>
      <span>Time: ${new Date(data.time).toLocaleString()}</span>
    </div>
    ${buildForecastHtml(data.forecast)}
    <button class="save-btn" type="button">Save to Favorites</button>
  `;
  card.querySelector(".save-btn").addEventListener("click", async () => {
    await saveFavorite(data.city, data.country);
  });
  weatherGridEl.innerHTML = "";
  weatherGridEl.appendChild(card);
};

const checkUrl = () => {
  if (WEATHER_FUNCTION_URL.includes("https://supabase.com/dashboard/project/xzpimjnyrdhpgghtqlru/functions")) {
    setStatus("Please add your Supabase function URL in app.js.", true);
    return false;
  }
  return true;
};

const getWeatherByCity = async (cityName) => {
  if (!cityName || !cityName.trim()) return;
  if (!checkUrl()) return;

  setStatus(`Loading weather for ${cityName}...`);

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${WEATHER_FUNCTION_URL}?city=${encodeURIComponent(cityName.trim())}`,
      { headers }
    );
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Request failed");

    currentCity = cityName.trim().toLowerCase();
    currentWeatherData = data;
    renderWeatherCard(data);
    setStatus(`Weather loaded for ${data.city}.`);
  } catch (error) {
    setStatus(error.message || "Could not fetch weather data.", true);
  }
};

const getWeatherByCoordinates = async (lat, lon) => {
  if (!checkUrl()) return;

  setStatus("Loading weather for your location...");

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${WEATHER_FUNCTION_URL}?lat=${lat}&lon=${lon}`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    currentCity = data.city.trim().toLowerCase();
    currentWeatherData = data;
    renderWeatherCard(data);
    setStatus(`Weather loaded for ${data.city}.`);
  } catch (error) {
    setStatus(error.message || "Could not fetch weather data.", true);
  }
};

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = inputEl.value.trim();
  await getWeatherByCity(city);
  inputEl.value = "";
});

cityButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await getWeatherByCity(button.dataset.city);
  });
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.", true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await getWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
    },
    () => {
      setStatus("Could not read your location. Please allow location permission.", true);
    }
  );
});

refreshFavoritesBtn.addEventListener("click", loadFavorites);

// ── Dark / Light theme ────────────────────────────────────────
const applyTheme = () => {
  const isDark = localStorage.getItem("skycast_theme") !== "light";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggleBtn.textContent = isDark ? "\u2600\ufe0f" : "\ud83c\udf19";
};

themeToggleBtn.addEventListener("click", () => {
  const goingLight = document.documentElement.dataset.theme !== "light";
  localStorage.setItem("skycast_theme", goingLight ? "light" : "dark");
  applyTheme();
});

applyTheme();

// ── \u00b0C / \u00b0F unit toggle ─────────────────────────────────────────
const applyUnit = () => {
  unitToggleBtn.textContent = isFahrenheit ? "\u00b0C" : "\u00b0F";
  unitToggleBtn.title = isFahrenheit ? "Switch to Celsius" : "Switch to Fahrenheit";
};

unitToggleBtn.addEventListener("click", () => {
  isFahrenheit = !isFahrenheit;
  localStorage.setItem("skycast_unit", isFahrenheit ? "f" : "c");
  applyUnit();
  if (currentWeatherData) renderWeatherCard(currentWeatherData);
});

applyUnit();

loadFavorites();
