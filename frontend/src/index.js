import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ChakraProvider, Theme } from "@chakra-ui/react";
import { Toaster } from "react-hot-toast";
import { system } from "./theme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <Theme appearance="dark">
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "rgba(15, 21, 45, 0.95)",
              color: "#f4f7ff",
              border: "1px solid rgba(138,123,255,0.3)",
              borderRadius: "12px",
              fontSize: "0.9rem",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(2,6,23,0.5)",
            },
            success: { iconTheme: { primary: "#5be4a8", secondary: "#040714" } },
            error:   { iconTheme: { primary: "#ff6b81", secondary: "#040714" } },
          }}
        />
      </Theme>
    </ChakraProvider>
  </React.StrictMode>
);

reportWebVitals();

