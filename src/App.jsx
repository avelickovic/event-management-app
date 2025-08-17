import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import {lazy} from "react";


import {isAuthenticated} from "./tools/auth.js";
const Home=lazy(()=> import("./pages/Homepage.jsx"));
const Login=lazy(()=> import("./pages/Login.jsx"));
const Trending=lazy(()=> import("./pages/Trending.jsx"));
const Categories=lazy(()=> import("./pages/Categories.jsx"));
const Events=lazy(()=> import("./pages/Events.jsx"));
const UserCategories=lazy(()=> import("./pages/UserCategories.jsx"));
const Users=lazy(()=> import("./pages/Users.jsx"));
const EventDetail = lazy(() => import("./pages/EventDetails.jsx"));
const Tags = lazy(() => import("./pages/Tag.jsx"));
const Search = lazy(() => import("./pages/Search.jsx"));
const AuthSearch = lazy(() => import("./pages/SearchAuth.jsx"));
const PrivateRoute = ({element}) => {
    return isAuthenticated() ? element : <Navigate to="/login"/>;
};

export default function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/events" element={<PrivateRoute element={<Events />} />} />
                <Route path="/userCategories" element={<PrivateRoute element={<UserCategories />} />} />
                <Route path="/users" element={<PrivateRoute element={<Users />} />} />
                <Route path="/login" element={<Login />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/tags/:tagName" element={<Tags />} />
                <Route path="/search" element={<Search />} />
                <Route path="/authsearch" element={<AuthSearch />} />
            </Routes>
        </Router>
    );
}
