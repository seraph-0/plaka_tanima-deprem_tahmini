import React, { useContext, useEffect } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import CardComponent from '../components/CardComponent';
import projelerImage from '../resimler/plakaTanıma.jpg';
import projelerImage2 from '../resimler/depremTahminNew.jpg';
import { Container, Row, Col, Button, Navbar, Nav, NavItem, NavLink, NavbarBrand } from 'reactstrap';
import NavbarComponent from './Navbar';

export default function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleButtonClick = () => {
    navigate('/Plaka');
  };

  const handleButtonClick2 = () => {
    navigate('/Deprem');
  };

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

  // style={{ background: '#9c1818', position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>

  return (
    <div style={{ width: '100%', height: '100%' }}>
   <NavbarComponent onLogout={logout} />

      <div className="main-container" style={{ backgroundColor: '#F2EDF3', width: '100%', height: '1900px' }}>
        <Container fluid style={{ flex: 1 }}>
        <Row className="align-items-center no-gutters" style={{ flex: 1, paddingTop:"40px" }}>
  <Col md="6" className="text-center" style={{ padding: '2rem' }}>
    <img
      src={projelerImage}
      alt="Plaka Tanıma"
      style={{ width: '80%', height: 'auto', borderRadius: '8px', boxSizing: 'border-box' }}
    />
  </Col>
  <Col md="6" className="text-center" style={{ padding: '2rem' }}>
    <h1 className="display-3">Plaka Tanıma</h1>
    <p className="lead">Plaka tanıma sistemi, araç plakalarını türüne ve şehrine göre bulmaya çalışır.</p>
    <Button style={{ backgroundColor: '#9c1818' }} onClick={handleButtonClick}>Projeye Git</Button>
  </Col>
</Row>

<Row className="align-items-center no-gutters" style={{ flex: 1 }}>
  <Col md="6" className="text-center" style={{ padding: '2rem' }}>
    <img
      src={projelerImage2}
      alt="Deprem Tahmini"
      style={{ width: '80%', height: 'auto', borderRadius: '8px', boxSizing: 'border-box' }}
    />
  </Col>
  <Col md="6" className="text-center" style={{ padding: '2rem' }}>
    <h1 className="display-3">Deprem Tahmini</h1>
    <p className="lead">Deprem tahmin sistemi, önceki depremlerin verilerini kullanarak oluşabilecek yeni depremlerin büyüklük tahminini yapar.</p>
    <Button style={{ backgroundColor: '#9c1818' }} onClick={handleButtonClick2}>Projeye Git</Button>
  </Col>
</Row>


          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: '2rem' }}>
            <CardComponent
              title="Ali Koç"
              subtitle="Front-End"
              text="Login sayfasından sonra yönlendirilen sayfaların front-end tasarımını tamamladım. Bu sayfalar modern bir arayüz ve işlevsel özellikler sunuyor"
              backgroundColor="#F6C100"
              link="https://www.linkedin.com/in/ali-koç-07ak/"
              imageSrc={projelerImage}
            />
            <CardComponent
              title="Erdem Muslu"
              subtitle="Login - Signup & Backend"
              text="Login ve signup işlemlerinde üst düzey güvenlik önlemleri aldım. Şifreleme, captcha ve güvenli session yönetimi ile sistemi korudum."
              backgroundColor="#28A745"
              link="https://www.linkedin.com/in/erdem-muslu-39963625b/"
              imageSrc={projelerImage}
            />
            <CardComponent
              title="Abdullah Yılmaz"
              subtitle="Plaka Tanıma & Backend"
              text="Plaka tanıma sisteminde plaka tespiti için görüntü işleme algoritması tasarladım ve plakanın görüntüdeki konumunu ve rengini tespit ettim."
              backgroundColor="#027BFF"
              link="https://www.linkedin.com/in/abdullah-yilmaz-5a857231b/"
              imageSrc={projelerImage}
            />
            <CardComponent
              title="Gökay Sardoğan"
              subtitle="Plaka Tanıma"
              text="Plaka tanıma sisteminde PytesseractOCR kullanarak metin işleme ve plakanın şehir ve tür analizini yaptım."
              backgroundColor="#F05B18"
              link="https://www.linkedin.com/in/gökay-sardoğan-a51008208/"
              imageSrc={projelerImage}
            />
            <CardComponent
              title="Mustafa İlhan"
              subtitle="Deprem Tahmini & Backend"
              text="Alınan veriler sayesinde eğittiğim model ile seçilen lokasyonda ve tarihte oluşabilecek depremin büyüklüğünü tahmin ettim."
              backgroundColor="#F60004"
              link="https://www.linkedin.com/in/mustafa-ilhan-73b1a3225/"
              imageSrc={projelerImage}
            />
          </div>
        </Container>
      </div>
    </div>
  );
}
