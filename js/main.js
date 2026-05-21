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
	weatherHighlightCityEl: null,
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
	uiElements.weatherHighlightCityEl = document.getElementById("weather-highlight-city");
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

const DEFAULT_WEATHER_LOCATION = {
	name: "TP.HCM",
	latitude: 10.8231,
	longitude: 106.6297,
	timezone: "Asia/Bangkok",
};

let activeWeatherLocation = DEFAULT_WEATHER_LOCATION;

const formatUpdateTime = (date) => {
	const hours = date.getHours();
	const minutes = pad2(date.getMinutes());
	const period = hours >= 12 ? "chiều" : "sáng";
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;

	return `Cập nhật lúc ${pad2(hour12)}:${minutes} ${period}`;
};

const formatForecastDay = (dateText) => {
	const date = new Date(`${dateText}T00:00:00`);
	const dayRaw = new Intl.DateTimeFormat("vi-VN", {
		weekday: "long",
	}).format(date);

	return dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1);
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

const updateForecastUI = (daily) => {
	if (!daily) {
		return;
	}

	const forecastItems = document.querySelectorAll(".weather-highlight__forecast-item");
	if (!forecastItems.length) {
		return;
	}

	const dailyForecasts = (daily.time || []).map((dateText, index) => ({
		dateText,
		weatherCode: daily.weather_code?.[index],
		maxTemp: daily.temperature_2m_max?.[index],
		minTemp: daily.temperature_2m_min?.[index],
	})).slice(1, 4);

	forecastItems.forEach((item, index) => {
		const forecast = dailyForecasts[index];
		if (!forecast) {
			return;
		}

		const { text, icon } = getWeatherDescription(forecast.weatherCode);
		const dayEl = item.querySelector(".weather-highlight__forecast-day");
		const iconEl = item.querySelector(".weather-highlight__forecast-icon");
		const tempEl = item.querySelector(".weather-highlight__forecast-temp");
		const descEl = item.querySelector(".weather-highlight__forecast-desc");

		if (dayEl) {
			dayEl.textContent = formatForecastDay(forecast.dateText);
		}
		if (iconEl) {
			iconEl.textContent = icon;
		}
		if (tempEl && Number.isFinite(forecast.maxTemp) && Number.isFinite(forecast.minTemp)) {
			tempEl.textContent = `${Math.round(forecast.maxTemp)}°/${Math.round(forecast.minTemp)}°`;
		}
		if (descEl) {
			descEl.textContent = text;
		}
	});
};

const updateWeatherUI = (current, daily, aqiValue, location) => {
	if (!current) {
		return;
	}

	const temperature = Math.round(current.temperature_2m);
	const apparent = Math.round(current.apparent_temperature);
	const humidity = Math.round(current.relative_humidity_2m);
	const wind = Math.round(current.wind_speed_10m);
	const uvIndex = Math.round(current.uv_index ?? 0);
	const weatherCode = current.weather_code;
	const { text, icon } = getWeatherDescription(weatherCode);
	const locationName = location?.name || DEFAULT_WEATHER_LOCATION.name;

	if (uiElements.weatherWidgetIconEl) {
		uiElements.weatherWidgetIconEl.textContent = icon;
	}
	if (uiElements.weatherWidgetTempEl) {
		uiElements.weatherWidgetTempEl.textContent = `${locationName} ${temperature}°C`;
	}
	if (uiElements.weatherWidgetMetaEl) {
		uiElements.weatherWidgetMetaEl.textContent = `${text} · Độ ẩm ${humidity}%`;
	}

	if (uiElements.weatherHighlightCityEl) {
		uiElements.weatherHighlightCityEl.textContent = locationName;
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

	updateForecastUI(daily);
};

const getProvinceNameFromCoords = async (latitude, longitude) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 4000);
	const locationUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;

	try {
		const response = await fetch(locationUrl, {
			signal: controller.signal,
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const provinceName = data.principalSubdivision || data.city || data.locality || data.countryName;
		return typeof provinceName === "string" && provinceName.trim() ? provinceName.trim() : null;
	} catch (error) {
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
};

const getBrowserWeatherLocation = () => new Promise((resolve) => {
	if (!navigator.geolocation) {
		resolve(DEFAULT_WEATHER_LOCATION);
		return;
	}

	if (uiElements.weatherHighlightTimeEl) {
		uiElements.weatherHighlightTimeEl.textContent = "Đang xác định vị trí...";
	}

	navigator.geolocation.getCurrentPosition(
		async (position) => {
			const latitude = position.coords.latitude;
			const longitude = position.coords.longitude;
			const provinceName = await getProvinceNameFromCoords(latitude, longitude);

			resolve({
				name: provinceName || "Vị trí hiện tại",
				latitude,
				longitude,
				timezone: "auto",
			});
		},
		() => resolve(DEFAULT_WEATHER_LOCATION),
		{
			enableHighAccuracy: false,
			maximumAge: 15 * 60 * 1000,
			timeout: 6000,
		}
	);
});

const setActiveWeatherLocation = async () => {
	activeWeatherLocation = await getBrowserWeatherLocation();
};

const fetchWeather = async () => {
	const { latitude, longitude, timezone } = activeWeatherLocation;
	const encodedTimezone = encodeURIComponent(timezone);
	const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=${encodedTimezone}`;
	const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi&timezone=${encodedTimezone}`;

	const [weatherResponse, aqiResponse] = await Promise.all([
		fetch(weatherUrl),
		fetch(aqiUrl).catch(() => null),
	]);

	if (!weatherResponse.ok) {
		throw new Error("Weather fetch failed");
	}

	const weatherData = await weatherResponse.json();
	const aqiData = aqiResponse?.ok ? await aqiResponse.json() : null;
	const aqiValue = aqiData?.current?.us_aqi;

	updateWeatherUI(weatherData.current, weatherData.daily, aqiValue, activeWeatherLocation);
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

	setActiveWeatherLocation().finally(runFetch);
	weatherTimerId = setInterval(runFetch, 10 * 60 * 1000);
};

document.addEventListener("DOMContentLoaded", () => {
	loadPartials().finally(() => {
		bindUiElements();
		startLiveDate();
		startWeatherUpdates();
	});
});
