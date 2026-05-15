import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import Counter from "./Counter";
import AppGOF from "./AppGOF";
import AppModern from "./AppModern";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppModern />
  </React.StrictMode>,
);
