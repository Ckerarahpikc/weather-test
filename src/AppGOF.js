import React from "react";

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

class App extends React.Component {
  state = {
    location: localStorage.getItem("location") || "",
    displayLocation: "",
    weather: "",
    isLoading: false,
    isError: false,
    errMsg: "",
  };

  constructor(props) {
    super(props);
  }

  // componentDidMount() {
  //   window.addEventListener("keydown", this.fetchWeater);
  // }
  // componentWillUnmount() {
  //   window.removeEventListener("keydown", this.fetchWeater);
  // }

  // on enter key
  // handleKeydown = (event) => {
  //   if (event.key === "Enter") {
  //     this.fetchWeater();
  //   }
  // };

  // info: only runs on mount but not on re-render, similar to useEffect with empty dep
  componentDidMount() {
    if (this.state.location) {
      // run fetch on reload
      this.fetchWeater();
    }
  }
  // info: runs on re-render, similar to useEffect with some dep, but this runs only on re-render but not on mount also as useEffect
  componentDidUpdate(prevProps, prevState) {
    if (this.state.location !== prevState.location) {
      this.fetchWeater();
    }
  }

  handleOnChange = async (e) => {
    this.setState({ location: e.target.value });
  };

  fetchWeater = async () => {
    if (this.state.location.length <= 1) return this.setState({ weather: "" });

    const abortController = new AbortController();
    const { signal } = abortController;
    try {
      this.setState({ isLoading: true, isError: false, errMsg: "" });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`,
        { signal },
      );
      JSON.stringify(localStorage.setItem("location", this.state.location));
      const geoData = await geoRes.json();

      if (!geoData.results)
        throw new Error(`Location not found for '${this.state.location}'`);

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
      );
      const weatherData = await weatherRes.json();
      this.setState({
        weather: weatherData.daily,
        isLoading: false,
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });
    } catch (err) {
      this.setState({
        isError: true,
        errMsg: err.message,
        isLoading: false,
        weather: "",
        displayLocation: "",
      });
      console.error(err);
    }

    return () => {
      abortController.abort();
    };
  };

  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <Input
          location={this.state.location}
          handleOnChange={this.handleOnChange}
        />

        {this.state.isLoading && <div>Loading...</div>}
        {this.state.isError && !this.state.isLoading && (
          <div>{this.state.errMsg}</div>
        )}
        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search from location..."
          value={this.props.location}
          onChange={this.props.handleOnChange}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  componentWillUnmount() {
    console.log("Component will unmount.");
  }

  constructor(props) {
    super(props);
  }

  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: dates,
      weathercode: codes,
    } = this.props.weather;

    return (
      <div>
        <h2>Weather {this.props.location}</h2>
        <ul className="weather">
          {dates.map((time, i) => (
            <Day
              key={i}
              date={time}
              code={codes[i]}
              tempMax={max[i]}
              tempMin={min[i]}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { date, code, tempMax, tempMin } = this.props;
    const isToday = new Date().toISOString().split("T")[0] === date;

    return (
      <li className={`day ${isToday && "important"}`}>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <span>{getWeatherIcon(code)}</span>
        {tempMax}&deg; / {tempMin}&deg;
      </li>
    );
  }
}

export default App;
