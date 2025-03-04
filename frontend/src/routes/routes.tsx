import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home.tsx"
import Hub from "../pages/Hub.tsx"

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hub" element={<Hub />} />
         </Routes>
    );
}
