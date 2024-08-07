const axios = require('axios');

const verifyRecaptcha = async (token) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    try {
        const response = await axios.post(url);
        const data = response.data;

        if (!data.success) {
            if (data['error-codes'] && data['error-codes'].includes('invalid-input-secret')) {
                throw new Error('Geçersiz site anahtarı');
            }
            return { success: false, error: 'Invalid reCAPTCHA. Please try again.' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { verifyRecaptcha };
