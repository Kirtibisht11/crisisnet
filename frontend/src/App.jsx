import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthorityDashboard from "./pages/authority"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/authority" element={<AuthorityDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
