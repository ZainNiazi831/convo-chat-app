import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/chat" /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/chat" /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/chat" /> : <Register />}
      />
      <Route
        path="/chat"
        element={user ? <Chat /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;