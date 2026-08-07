import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div>Platforma Treningowa — frontend startuje ✅</div>
    </AuthProvider>
  );
}

export default App;