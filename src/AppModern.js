import { useState, useEffect, useRef } from "react";

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
function formatDay(dateStr) {
  return new Intl.DateTimeFormat("ro", {
    weekday: "short",
  }).format(new Date(dateStr));
}
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}
// THE ABOVE CODE HAS NOTHING TO DO WITH THE OLD OR NEW WAY OF USING REACT (JUST PROF FUNCTIONS FOR LOGIC OF THE PROJECT ITSELF)

function App() {
  const [location, setLocation] = useState(
    localStorage.getItem("location") || "",
  );
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(false);

  function handleOnChange(e) {
    setLocation(e.target.value);
  }

  useEffect(
    function () {
      const abortController = new AbortController();
      const { signal } = abortController;

      async function fetchWeather() {
        if (location.length <= 1) return;

        localStorage.setItem("location", location);
        setIsLoading(true);
        setErrMsg("");
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
            { signal },
          );
          const geoData = await geoRes.json();
          if (!geoData.results)
            throw new Error(`Location not found for '${location}'`);

          const { country_code, latitude, longitude, name, timezone } =
            geoData.results.at(0);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
            { signal },
          );
          const weatherData = await weatherRes.json();
          setWeather(weatherData.daily);
          setIsLoading(false);
        } catch (err) {
          if (err.name !== "AbortError") {
            setIsLoading(false);
            setErrMsg(`Not found for "${location}"`);
            console.error("err:", err.message);
          }
        }
      }

      fetchWeather();

      return () => {
        abortController.abort();
      };
    },
    [location],
  );

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input
        location={location}
        onChangeInput={handleOnChange}
        setLocation={setLocation}
      />

      {isLoading && <div className="loader">Loading...</div>}
      {errMsg && <div>{errMsg}</div>}
      {weather?.weathercode && !isLoading && !errMsg && (
        <Weather weather={weather} location={displayLocation} />
      )}
      {!weather?.weathercode && "Opps. Nothing found."}
    </div>
  );
}

function Input({ location, onChangeInput, setLocation }) {
  const currElement = useRef(null);

  useEffect(() => {
    function callback(e) {
      if (e.key === "Enter") {
        if (document.activeElement === currElement.current) return;

        currElement.current.focus();
        setLocation("");
      }
    }

    window.addEventListener("keydown", callback);
    return () => {
      window.removeEventListener("keydown", callback);
    };
  }, [currElement]);

  return (
    <div>
      <input
        type="text"
        value={location}
        ref={currElement}
        placeholder="Search for weather"
        onChange={onChangeInput}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: code,
  } = weather;
  return (
    <div>
      <h2>Weather for {location}</h2>
      <ul className="weather">
        {dates.map((day, i) => (
          <Day
            max={max[i]}
            min={min[i]}
            time={day}
            code={code[i]}
            key={i}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ max, min, time, code, isToday }) {
  return (
    <li className={`day ${isToday ? "important" : null}`}>
      <p>{isToday ? "Today" : formatDay(time)}</p>
      <span>{getWeatherIcon(code)}</span>
      {max}&deg; / {min}&deg;
    </li>
  );
}

export default App;
