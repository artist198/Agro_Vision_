# Agro Vision

Smart farming / irrigation recommendation prototype.

## Current calculation model
- Uses the selected crop water requirement.
- Uses current live weather from the user’s location (temperature, humidity, wind and weather/rain condition).
- Uses soil moisture directly in the calculation: dry soil increases irrigation demand, medium soil is neutral, and wet soil reduces demand.
- Does not use historical weather baselines.
- Does not use a simulated live sensor stream.
- If live weather is unavailable, the dashboard clearly reports that it is unavailable instead of substituting historical data.

## Run
Open `index.html` in a browser, then open the dashboard. For best results, serve the folder through a local web server.

## Real-time weather
- Browser location permission is used to obtain the current location.
- Current conditions are fetched from Open-Meteo.
- Weather is refreshed automatically every 10 minutes.
- Existing crop images, farmer photo, logo, layout, and other project assets are preserved.
