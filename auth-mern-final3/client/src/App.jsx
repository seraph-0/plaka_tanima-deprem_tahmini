import "./App.css";
import { Routes, Route } from "react-router-dom";
import Navbar from "../src/components/Navbar"; // Adjust import path if needed
import Register from "./pages/Register";
import Login from "./pages/Login";
import axios from "axios";
import { Toaster } from 'react-hot-toast'
import { UserContextProvider } from "../context/userContext";
import Dashboard from "./pages/Dashboard"; 
import Plaka from "./pages/Plaka";
import Deprem from "./pages/Deprem";

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
       <Navbar />
       <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
       <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/plaka' element={<Plaka />} />
        <Route path='/deprem' element={<Deprem />} />
       </Routes>
    </UserContextProvider>
  );
}

export default App;
