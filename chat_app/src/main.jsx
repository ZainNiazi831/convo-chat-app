import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./redux/store";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";
import App from "./App.jsx";

// 🔄 Sync Redux auth state with localStorage on every change
store.subscribe(() => {
  const state = store.getState();
  const user = state.auth.user;
  const stored = localStorage.getItem("userInfo");

  if (user && stored) {
    try {
      const parsedStored = JSON.parse(stored);
      // If Redux user differs from localStorage, update localStorage
      if (parsedStored._id !== user._id) {
        console.log("🔄 Syncing localStorage with Redux user");
        localStorage.setItem("userInfo", JSON.stringify(user));
      }
    } catch {
      localStorage.setItem("userInfo", JSON.stringify(user));
    }
  }
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <SocketProvider>
        <App />
      </SocketProvider>
    </BrowserRouter>
  </Provider>
);