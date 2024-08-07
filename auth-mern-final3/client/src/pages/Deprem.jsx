import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import NavbarComponent from './Navbar'; // Navbar bileşenini içe aktarın
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: '../../node_modules/leaflet/dist/images/marker-icon-2x.png',
    iconUrl: '../../node_modules/leaflet/dist/images/marker-icon.png',
    shadowUrl: '../../node_modules/leaflet/dist/images/marker-shadow.png',
});

const Deprem = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Kullanıcı yoksa login sayfasına yönlendir
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Çıkış yapma fonksiyonunu tanımlayın
    const logout = async () => {
        try {
          await axios.post('/logout'); // Assuming you have a logout endpoint on the server
        } catch (error) {
          console.error(error);
        } finally {
          setUser(null);
          navigate('/login');
        }
      };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await axios.get('/profile');
                const { data } = response;
                if (data.error) {
                    toast.error('Session expired. Please log in again.');
                    logout();
                }
            } catch (error) {
                console.error(error);
                toast.error('An error occurred. Please log in again.');
                logout();
            }
        };

        const startSessionTimer = () => {
            const expiry = user?.expiry;
            if (!expiry) return;

            const currentTime = Date.now();
            const warningTime = expiry - currentTime - 30000; // 30 seconds before expiry
            const expiryTime = expiry - currentTime;

            if (warningTime > 0) {
                setTimeout(() => {
                    toast('Your session will expire in 30 seconds.', {
                        icon: '⚠️',
                    });
                }, warningTime);
            }

            if (expiryTime > 0) {
                setTimeout(() => {
                    toast.error('Session expired. Please log in again.');
                    logout();
                }, expiryTime);
            }
        };

        checkSession();
        startSessionTimer();

        // Cleanup timers on unmount
        return () => {
            clearTimeout(startSessionTimer);
        };
    }, [user, navigate, setUser]);

    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        depth: '',
        month: '',
        day: ''
    });

    const [result, setResult] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('http://localhost:8000/run-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            setResult(result.prediction);
            document.body.classList.add('shake');
            setTimeout(() => {
                document.body.classList.remove('shake');
            }, 1000);
        })
        .catch(error => {
            console.error('Hata:', error);
        });
    };

    // Custom Marker component to handle map clicks
    const LocationMarker = () => {
        const map = useMapEvents({
            click(e) {
                setFormData({
                    ...formData,
                    latitude: e.latlng.lat.toFixed(5),
                    longitude: e.latlng.lng.toFixed(5)
                });
                map.setView(e.latlng, map.getZoom());
            }
        });

        return formData.latitude && formData.longitude ? (
            <Marker position={[formData.latitude, formData.longitude]} />
        ) : null;
    };

    return (
        <div>
            <NavbarComponent onLogout={logout} /> {/* Navbar bileşenini ekleyin */}
            <style jsx>{`
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    overflow: hidden;
                }
                .container {
                    display: flex;
                    background-color: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                    width: 1000px;
                }
                .map-container {
                    flex: 1;
                    margin-right: 10px;
                }
                .form-container {
                    flex: 1;
                }
                h1 {
                    margin-top: 0;
                    text-align: center;
                    font-size: 1.5em;
                }
                .form-group {
                    margin-bottom: 10px;
                }
                label {
                    display: block;
                    margin-bottom: 3px;
                    font-size: 0.9em;
                }
                input {
                    width: 100%;
                    padding: 6px;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1em;
                }
                button:hover {
                    background-color: #45a049;
                }
                #result {
                    margin-top: 15px;
                    font-size: 1.1em;
                    text-align: center;
                }
                .leaflet-container {
                    height: 100%;
                    width: 100%;
                    border-radius: 8px;
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
                }
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                .shake {
                    animation: shake 0.5s;
                    animation-iteration-count: 2;
                }
            `}</style>
            <div className="container">
                <div className="map-container">
                    <MapContainer center={[39.9637, 32.2433]} zoom={6} className="leaflet-container">
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker />
                    </MapContainer>
                </div>
                <div className="form-container">
                    <h1>DEPREM TAHMİN ET</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="latitude">Enlem(N)(35-42):</label>
                            <input 
                                type="number" 
                                id="latitude" 
                                name="latitude" 
                                step="0.00001"
                                min="35"
                                max="42" 
                                required
                                value={formData.latitude} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="longitude">Boylam(E)(26-45):</label>
                            <input 
                                type="number" 
                                id="longitude" 
                                name="longitude" 
                                step="0.00001"
                                min="26"
                                max="45" 
                                required
                                value={formData.longitude} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="depth">Derinlik(km)(0-50):</label>
                            <input 
                                type="number" 
                                id="depth" 
                                name="depth" 
                                step="0.1"
                                min="0"
                                max="50" 
                                required
                                value={formData.depth} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="month">Ay:</label>
                            <input 
                                type="number" 
                                id="month" 
                                name="month" 
                                min="1" 
                                max="12" 
                                required
                                value={formData.month} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="day">Gün:</label>
                            <input 
                                type="number" 
                                id="day" 
                                name="day" 
                                min="1" 
                                max="31" 
                                required
                                value={formData.day} 
                                onChange={handleChange} 
                            />
                        </div>
                        <button type="submit">TAHMİN</button>
                    </form>
                    <div id="result">{result}</div>
                </div>
            </div>
        </div>
    );
};

export default Deprem;
