"use strict";

const pad2 = (value) => String(value).padStart(2, "0");

const getBasePath = () => {
	const body = document.body;
	if (!body || !body.dataset) {
		return "";
	}

	return body.dataset.base || "";
};

const loadPartials = async () => {
	const includeTargets = document.querySelectorAll("[data-include]");
	if (!includeTargets.length) {
		return;
	}

	const basePath = getBasePath();
	await Promise.all(
		Array.from(includeTargets).map(async (target) => {
			const filePath = target.getAttribute("data-include");
			if (!filePath) {
				return;
			}

			target.classList.add("is-loading");

			try {
				const response = await fetch(filePath);
				if (!response.ok) {
					throw new Error("Include fetch failed");
				}

				const html = await response.text();
				target.innerHTML = html.replaceAll("{{BASE}}", basePath);
				target.classList.remove("is-loading");
			} catch (error) {
				target.classList.add("include-error");
			}
		})
	);
};

const uiElements = {
	liveDateEl: null,
	weatherWidgetIconEl: null,
	weatherWidgetTempEl: null,
	weatherWidgetMetaEl: null,
	weatherHighlightTimeEl: null,
	weatherHighlightIconEl: null,
	weatherHighlightTempEl: null,
	weatherHighlightDescEl: null,
	weatherHighlightFeelEl: null,
	weatherHighlightHumidityEl: null,
	weatherHighlightWindEl: null,
	weatherHighlightUvEl: null,
	weatherHighlightAqiEl: null,
};

const bindUiElements = () => {
	uiElements.liveDateEl = document.getElementById("live-date");
	uiElements.weatherWidgetIconEl = document.getElementById("weather-widget-icon");
	uiElements.weatherWidgetTempEl = document.getElementById("weather-widget-temp");
	uiElements.weatherWidgetMetaEl = document.getElementById("weather-widget-meta");
	uiElements.weatherHighlightTimeEl = document.getElementById("weather-highlight-time");
	uiElements.weatherHighlightIconEl = document.getElementById("weather-highlight-icon");
	uiElements.weatherHighlightTempEl = document.getElementById("weather-highlight-temp");
	uiElements.weatherHighlightDescEl = document.getElementById("weather-highlight-desc");
	uiElements.weatherHighlightFeelEl = document.getElementById("weather-highlight-feel");
	uiElements.weatherHighlightHumidityEl = document.getElementById("weather-highlight-humidity");
	uiElements.weatherHighlightWindEl = document.getElementById("weather-highlight-wind");
	uiElements.weatherHighlightUvEl = document.getElementById("weather-highlight-uv");
	uiElements.weatherHighlightAqiEl = document.getElementById("weather-highlight-aqi");
};

const formatLiveDate = (date) => {
	const weekdayFormatter = new Intl.DateTimeFormat("vi-VN", {
		weekday: "long",
	});

	const weekdayRaw = weekdayFormatter.format(date);
	const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);

	const day = pad2(date.getDate());
	const month = pad2(date.getMonth() + 1);
	const year = date.getFullYear();

	return `${weekday}, ${day}/${month}/${year} · Cập nhật liên tục 24h`;
};

let liveDateTimerId = null;

const updateLiveDate = () => {
	if (!uiElements.liveDateEl) {
		return;
	}

	uiElements.liveDateEl.textContent = formatLiveDate(new Date());
};

const startLiveDate = () => {
	if (!uiElements.liveDateEl) {
		return;
	}

	updateLiveDate();
	if (liveDateTimerId) {
		clearInterval(liveDateTimerId);
	}
	liveDateTimerId = setInterval(updateLiveDate, 60 * 1000);
};

const WEATHER_CITY = "TP.HCM";
const WEATHER_LAT = 10.8231;
const WEATHER_LON = 106.6297;
const WEATHER_TZ = "Asia/Bangkok";

const formatUpdateTime = (date) => {
	const hours = date.getHours();
	const minutes = pad2(date.getMinutes());
	const period = hours >= 12 ? "chiều" : "sáng";
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;

	return `Cập nhật lúc ${pad2(hour12)}:${minutes} ${period}`;
};

const getWeatherDescription = (code) => {
	if (code === 0) {
		return { text: "Trời quang", icon: "☀️" };
	}
	if (code >= 1 && code <= 3) {
		return { text: "Ít mây", icon: "⛅" };
	}
	if (code === 45 || code === 48) {
		return { text: "Sương mù", icon: "🌫️" };
	}
	if (code >= 51 && code <= 67) {
		return { text: "Mưa phùn", icon: "🌦️" };
	}
	if (code >= 71 && code <= 77) {
		return { text: "Có tuyết", icon: "❄️" };
	}
	if (code >= 80 && code <= 82) {
		return { text: "Mưa rào", icon: "🌧️" };
	}
	if (code >= 95 && code <= 99) {
		return { text: "Dông", icon: "⛈️" };
	}

	return { text: "Nhiều mây", icon: "☁️" };
};

const getUvLabel = (uv) => {
	if (uv < 3) {
		return "Thấp";
	}
	if (uv < 6) {
		return "Trung bình";
	}
	if (uv < 8) {
		return "Cao";
	}
	if (uv < 11) {
		return "Rất cao";
	}

	return "Nguy hiểm";
};

const getAqiLabel = (aqi) => {
	if (aqi <= 50) {
		return "Tốt";
	}
	if (aqi <= 100) {
		return "Trung bình";
	}
	if (aqi <= 150) {
		return "Không tốt cho nhóm nhạy cảm";
	}
	if (aqi <= 200) {
		return "Không tốt";
	}
	if (aqi <= 300) {
		return "Rất không tốt";
	}

	return "Nguy hại";
};

const updateWeatherUI = (current, aqiValue) => {
	if (!current || !uiElements.weatherWidgetTempEl) {
		return;
	}

	const temperature = Math.round(current.temperature_2m);
	const apparent = Math.round(current.apparent_temperature);
	const humidity = Math.round(current.relative_humidity_2m);
	const wind = Math.round(current.wind_speed_10m);
	const uvIndex = Math.round(current.uv_index ?? 0);
	const weatherCode = current.weather_code;
	const { text, icon } = getWeatherDescription(weatherCode);

	if (uiElements.weatherWidgetIconEl) {
		uiElements.weatherWidgetIconEl.textContent = icon;
	}
	uiElements.weatherWidgetTempEl.textContent = `${WEATHER_CITY} ${temperature}°C`;
	if (uiElements.weatherWidgetMetaEl) {
		uiElements.weatherWidgetMetaEl.textContent = `${text} · Độ ẩm ${humidity}%`;
	}

	if (uiElements.weatherHighlightIconEl) {
		uiElements.weatherHighlightIconEl.textContent = icon;
	}
	if (uiElements.weatherHighlightTempEl) {
		uiElements.weatherHighlightTempEl.textContent = `${temperature}°`;
	}
	if (uiElements.weatherHighlightDescEl) {
		uiElements.weatherHighlightDescEl.textContent = text;
	}
	if (uiElements.weatherHighlightFeelEl) {
		uiElements.weatherHighlightFeelEl.textContent = `Cảm giác như ${apparent}°C`;
	}
	if (uiElements.weatherHighlightHumidityEl) {
		uiElements.weatherHighlightHumidityEl.textContent = `${humidity}%`;
	}
	if (uiElements.weatherHighlightWindEl) {
		uiElements.weatherHighlightWindEl.textContent = `${wind} km/h`;
	}
	if (uiElements.weatherHighlightUvEl) {
		uiElements.weatherHighlightUvEl.textContent = getUvLabel(uvIndex);
	}

	if (uiElements.weatherHighlightAqiEl) {
		if (Number.isFinite(aqiValue)) {
			uiElements.weatherHighlightAqiEl.textContent = `${getAqiLabel(aqiValue)} (${aqiValue})`;
		} else {
			uiElements.weatherHighlightAqiEl.textContent = "Chưa có dữ liệu";
		}
	}
	if (uiElements.weatherHighlightTimeEl) {
		uiElements.weatherHighlightTimeEl.textContent = formatUpdateTime(new Date());
	}
};

const fetchWeather = async () => {
	const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&timezone=${encodeURIComponent(WEATHER_TZ)}`;
	const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=us_aqi&timezone=${encodeURIComponent(WEATHER_TZ)}`;

	const [weatherResponse, aqiResponse] = await Promise.all([
		fetch(weatherUrl),
		fetch(aqiUrl),
	]);

	if (!weatherResponse.ok) {
		throw new Error("Weather fetch failed");
	}

	const weatherData = await weatherResponse.json();
	const aqiData = aqiResponse.ok ? await aqiResponse.json() : null;
	const aqiValue = aqiData?.current?.us_aqi;

	updateWeatherUI(weatherData.current, aqiValue);
};

let weatherTimerId = null;

const startWeatherUpdates = () => {
	if (!uiElements.weatherWidgetTempEl && !uiElements.weatherHighlightTempEl) {
		return;
	}

	if (weatherTimerId) {
		clearInterval(weatherTimerId);
	}

	const runFetch = () =>
		fetchWeather().catch(() => {
			if (uiElements.weatherHighlightTimeEl) {
				uiElements.weatherHighlightTimeEl.textContent = "Không lấy được dữ liệu thời tiết";
			}
		});

	runFetch();
	weatherTimerId = setInterval(runFetch, 10 * 60 * 1000);
};

document.addEventListener("DOMContentLoaded", () => {
	loadPartials().finally(() => {
		bindUiElements();
		startLiveDate();
		startWeatherUpdates();
	});
});
