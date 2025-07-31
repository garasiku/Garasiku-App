import './App.css'
import { AuthProvider } from './lib/auth-context';
import AppRoutes from './routes/app-routes'
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster />
    </AuthProvider>
  )
}

export default App
