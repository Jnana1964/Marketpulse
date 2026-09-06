import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Watchlist } from './pages/Watchlist';
import { Changes } from './pages/Changes';
import { StockDetails } from './pages/StockDetails';
import { StockSearchPage } from './pages/StockSearchPage';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/changes" element={<Changes />} />
            <Route path="/stocks/:symbol" element={<StockDetails />} />
            <Route path="/search" element={<StockSearchPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
