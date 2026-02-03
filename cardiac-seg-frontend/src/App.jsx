// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SegmentationProvider } from "./contexts/SegmentationContext";


import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// >>> EKLENDİ <<<
import EditMask from "./pages/EditMask";

import { SnackbarProvider } from "./contexts/SnackbarContext";

// eslint-disable-next-line react/prop-types
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <SegmentationProvider>
          <BrowserRouter>
            <Routes>
              {/* Açılış sayfası */}
              <Route path="/" element={<Landing />} />

              {/* Auth sayfaları */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Edit Mask */}
              <Route
                path="/edit"
                element={
                  <PrivateRoute>
                    <EditMask />
                  </PrivateRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </SegmentationProvider>
      </SnackbarProvider>
    </AuthProvider>

  );
}

export default App;
