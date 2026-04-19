# Weather Website (HTML/CSS/JS + Supabase Backend)

This project gives weather information for various cities with a clean UI and Supabase backend.

## Stack
- Frontend: `index.html`, `style.css`, `app.js`
- Backend: Supabase Edge Function at `supabase/functions/weather/index.ts`
- Weather provider used by backend: Open-Meteo (free API)
- Database: Supabase Postgres table `favorites`

## Features
- Search weather by city
- Quick city buttons
- Weather condition icon text
- 5-day forecast (min/max temperatures)
- Use current location (browser geolocation)
- Save favorite cities in Supabase and reload them

## Setup

1. Install Supabase CLI and login:
   - `supabase login`
2. Link your project:
   - `supabase link --project-ref YOUR_PROJECT_REF`
3. Push database migration:
   - `supabase db push`
4. Set function secrets (required for favorites):
   - `supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`
5. Deploy function:
   - `supabase functions deploy weather --no-verify-jwt`
6. Copy your function URL:
   - `https://YOUR_PROJECT_REF.supabase.co/functions/v1/weather`
7. Open `app.js` and replace:
   - `PASTE_YOUR_SUPABASE_FUNCTION_URL_HERE`
8. Run frontend locally (from project root):
   - `python -m http.server 5500`
   - Open `http://localhost:5500`

## API usage
- `GET ?city=London` -> weather by city + 5-day forecast
- `GET ?lat=...&lon=...` -> weather by coordinates + 5-day forecast
- `GET ?action=list_favorites` -> list favorite cities
- `POST` with `{ "action": "save_favorite", "city": "...", "country": "..." }` -> save a favorite city

## How it works
- Frontend sends city name or coordinates to your Supabase function.
- Edge Function uses Open-Meteo geocoding/reverse-geocoding + forecast API.
- Edge Function returns normalized JSON with current weather and 5-day forecast.
- Frontend renders weather cards and favorite city chips.
