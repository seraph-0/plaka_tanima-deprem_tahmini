import { useState } from "react";
import axios from 'axios';
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from 'react-google-recaptcha';
import { Container, Form, FormGroup, Label, Input, Button, Spinner } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function Register() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();
    const { name, email, password } = data;

    // Basic validation
    if (!name || !email || !password || !captchaValue) {
      toast.error('Please fill in all fields and complete the reCAPTCHA.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/register', {
        name,
        email,
        password,
        captchaValue
      });
      const { data } = response;

      if (data.error) {
        toast.error(data.error);
      } else {
        setData({ name: '', email: '', password: '' });
        setCaptchaValue(null);
        toast.success('Registration successful. Please log in.');
        navigate('/login');
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
        <Container style={{paddingLeft: "700px"}}>
          <Form onSubmit={registerUser}>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                id="name"
                type='text'
                placeholder='Enter your name'
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                id="email"
                type='email'
                placeholder='Enter your email'
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
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
              />
            </FormGroup>
            <div className="mb-3">
              <ReCAPTCHA
                sitekey="6LfrCRgqAAAAADD0njA4aRVW6va-0JE9m31o-NpZ"
                onChange={(value) => setCaptchaValue(value)}
              />
            </div>
            <Button color="primary" type='submit' disabled={loading} block>
              {loading ? <Spinner size="sm" /> : 'Submit'}
            </Button>
          </Form>
        </Container>
      </div>
    </div>
  );
}
