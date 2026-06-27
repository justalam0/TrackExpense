import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navbarStyles } from '../assets/dummyStyles';
import img1 from '../assets/logo.png';
import { ChevronDown, User, LogOut } from 'lucide-react';
import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

const Navbar = ({ user: popUser, onLogout }) => {

    const navigate = useNavigate();
    const menuRef = useRef(null);

    const [menuOpen, setMenuOpen] = useState(false);

    const [user, setUser] = useState(
        popUser || {
            name: "",
            email: "",
        }
    );

    // fetch user profile data
    useEffect(() => {

        const fetchUserData = async () => {

            try {

                const token = localStorage.getItem("token");

                if (!token) return;

                const response = await axios.get(
                    `${BASE_URL}/user/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const userData = response.data.user || response.data;

                setUser(userData);

            } catch (err) {

                console.error("Failed to load profile:", err);

            }

        };

        if (popUser) {
            setUser(popUser);
        } else {
            fetchUserData();
        }

    }, [popUser]);

    // toggle dropdown menu
    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    // logout function
    const handleLogout = () => {

        setMenuOpen(false);

        localStorage.removeItem("token");

        if (onLogout) {
            onLogout();
        }

        navigate("/login");
    };

    // close dropdown when click outside
    useEffect(() => {

        const handleClickOutside = (e) => {

            if (
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {
                setMenuOpen(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    return (

        <header className={navbarStyles.header}>

            <div className={navbarStyles.container}>

                {/* logo */}
                <div
                    onClick={() => navigate('/')}
                    className={navbarStyles.logoContainer}
                >

                    <div className={navbarStyles.logoImage}>

                        <img
                            src={img1}
                            alt="logo"
                            className="w-full h-full object-contain"
                        />

                    </div>

                    <span className={navbarStyles.logoText}>
                        TrackExpense
                    </span>

                </div>

                {/* user profile */}
                {user && (

                    <div
                        className={navbarStyles.userContainer}
                        ref={menuRef}
                    >

                        <button
                            onClick={toggleMenu}
                            className={navbarStyles.userButton}
                        >

                            <div className="relative">

                                <div className={navbarStyles.userAvatar}>
                                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </div>

                                <div className={navbarStyles.statusIndicator}></div>

                            </div>

                            <div className={navbarStyles.userTextContainer}>

                                <p className={navbarStyles.userName}>
                                    {user?.name || "User"}
                                </p>

                                <p className={navbarStyles.userEmail}>
                                    {user?.email || "user@example.com"}
                                </p>

                            </div>

                            <ChevronDown
                                className={navbarStyles.chevronIcon(menuOpen)}
                            />

                        </button>

                        {/* dropdown menu */}
                        {menuOpen && (

                            <div className={navbarStyles.dropdownMenu}>

                                <div className={navbarStyles.dropdownHeader}>

                                    <div className="flex items-center gap-3">

                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                        </div>

                                        <div>

                                            <p className={navbarStyles.dropdownName}>
                                                {user?.name || "User"}
                                            </p>

                                            <p className={navbarStyles.dropdownEmail}>
                                                {user?.email || "user@example.com"}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <div className={navbarStyles.menuItemContainer}>

                                    <button
                                        onClick={() => {

                                            setMenuOpen(false);

                                            navigate("/profile");

                                        }}
                                        className={navbarStyles.menuItem}
                                    >

                                        <User className="w-4 h-4" />

                                        <span>My Profile</span>

                                    </button>

                                </div>

                                <div className={navbarStyles.menuItemBorder}>

                                    <button
                                        onClick={handleLogout}
                                        className={navbarStyles.logoutButton}
                                    >

                                        <LogOut className="w-4 h-4" />

                                        <span>Log Out</span>

                                    </button>

                                </div>

                            </div>

                        )}

                    </div>

                )}

            </div>

        </header>

    );
};

export default Navbar;