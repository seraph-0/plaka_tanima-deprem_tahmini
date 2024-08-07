import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import NavbarComponent from './Navbar'; // Navbar bileşenini içe aktarın

const UploadImageAndRunPython = () => {
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

    const [dropZoneText, setDropZoneText] = useState('Dosyayı yüklemek için Sürükleyin veya Basın');
    const [output, setOutput] = useState('');
    const [isOutputVisible, setIsOutputVisible] = useState(false);
    const [isFileUploaded, setIsFileUploaded] = useState(false);

    const handleDragOver = (event) => {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    };

    const handleDragLeave = (event) => {
        event.currentTarget.classList.remove('dragover');
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const formData = new FormData();
            formData.append('image', files[0]);

            try {
                const response = await fetch('http://localhost:8000/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    setDropZoneText('Dosyanız yüklendi');
                    setIsFileUploaded(true);
                } else {
                    console.error('Upload failed');
                    setDropZoneText('Dosya yükleme başarısız');
                }
            } catch (error) {
                console.error('Error:', error);
                setDropZoneText('Dosya yükleme başarısız');
            }
        }
    };

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const formData = new FormData();
            formData.append('image', files[0]);

            try {
                const response = await fetch('http://localhost:8000/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    setDropZoneText('Dosyanız yüklendi');
                    setIsFileUploaded(true);
                } else {
                    console.error('Upload failed');
                    setDropZoneText('Dosya yükleme başarısız');
                }
            } catch (error) {
                console.error('Error:', error);
                setDropZoneText('Dosya yükleme başarısız');
            }
        }
    };

    const handleRunPython = () => {
        if (!isFileUploaded) {
            toast.error('Lütfen önce bir dosya yükleyin.');
            return;
        }

        fetch('http://localhost:8000/run-python', {
            method: 'POST'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            setOutput(data.output);
            setIsOutputVisible(true);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
    
    return (
        <div>
            <NavbarComponent onLogout={logout} /> {/* Navbar bileşenine çıkış yapma işlevini ekleyin */}
            <div className="container">
                <div
                    id="dropZone"
                    className={isOutputVisible ? '' : 'dragover'}
                    onClick={() => document.getElementById('image').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: '2px dashed #cccccc',
                        borderRadius: '5px',
                        padding: '150px',
                        marginBottom: '20px',
                        backgroundColor: '#ffffff',
                        color: '#666666',
                        fontSize: '1.2em',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        textAlign: 'center'
                    }}
                >
                    {dropZoneText}
                </div>
                <input
                    type="file"
                    name="image"
                    id="image"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <button
                    id="runPython"
                    onClick={handleRunPython}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1em',
                        color: '#ffffff',
                        backgroundColor: '#3333cc',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5555ff'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#3333cc'}
                    onMouseDown={(e) => e.target.style.backgroundColor = '#3333cc'}
                >
                    Tespit Et
                </button>
                <style jsx>{`
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f0f0f0;
                    }
                    .container {
                        text-align: center;
                        max-width: 600px;
                    }
                    #dropZone {
                        border: 2px dashed #cccccc;
                        border-radius: 5px;
                        padding: 150px;
                        margin-bottom: 20px;
                        background-color: #ffffff;
                        color: #666666;
                        font-size: 1.2em;
                        cursor: pointer;
                        box-sizing: border-box;
                    }
                    #dropZone.dragover {
                        border-color: #3333cc;
                        color: #3333cc;
                        cursor: copy;
                    }
                    button {
                        padding: 10px 20px;
                        font-size: 1em;
                        color: #ffffff;
                        background-color: #3333cc;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    button:hover {
                        background-color: #5555ff;
                    }
                    button:active {
                        background-color: #3333cc;
                    }
                    input[type="file"] {
                        display: none;
                    }
                    #output {
                        margin-top: 20px;
                        text-align: center;
                        white-space: pre-wrap;
                        display: none;
                    }
                `}</style>
                {isOutputVisible && (
                    <h2>
                        <pre id="outputContent">
                            {output}
                        </pre>
                    </h2>
                )}
            </div>
        </div>
    );
};

export default UploadImageAndRunPython;
