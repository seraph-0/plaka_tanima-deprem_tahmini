import { useState, useContext, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { UserContext } from "../../context/userContext";
import { Container, Form, FormGroup, Label, Input, Button, Spinner, Alert } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  
  const [data, setData] = useState({
    email: '',
    password: '',
  });

  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lockTime, setLockTime] = useState(null);

  useEffect(() => {
    if (lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockTime]);

  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password } = data;

    if (!email || !password || !captchaValue) {
      toast.error('Please fill in all fields and complete the reCAPTCHA.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/login', {
        email,
        password,
        captchaValue,
      });

      const { data } = response;

      if (data.error) {
        if (data.error.includes('Too many failed attempts')) {
          const remainingSeconds = parseInt(data.error.match(/\d+/)[0]);
          setLockTime(remainingSeconds);
        }
        toast.error(data.error);
      } else {
        setUser({
          ...data.user,
          expiry: data.expiry, // Set the expiry time in the user context
        });
        localStorage.setItem('user', JSON.stringify({
          ...data.user,
          expiry: data.expiry,
        }));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <Container style={{ paddingLeft: "700px" }}>
          <Form onSubmit={loginUser}>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                id="email"
                type='email'
                placeholder='Enter your email'
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                disabled={lockTime > 0}
              />
            </FormGroup>
            <FormGroup>
              <Label for="password">Password</Label>
              <Input
                id="password"
                type='password'
                placeholder='Enter your password'
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                disabled={lockTime > 0}
              />
            </FormGroup>
            <div className="mb-3">
              <ReCAPTCHA
                sitekey="6LfrCRgqAAAAADD0njA4aRVW6va-0JE9m31o-NpZ"
                onChange={(value) => setCaptchaValue(value)}
              />
            </div>
            <Button color="primary" type='submit' disabled={loading || lockTime > 0} block>
              {loading ? <Spinner size="sm" /> : 'Login'}
            </Button>
          </Form>
          {lockTime > 0 && (
            <Alert color="danger" className="mt-3">
              Too many failed attempts. Please try again in {lockTime} seconds.
            </Alert>
          )}
        </Container>
      </div>
    </div>
  );
}
