
import axios from 'axios';

const API_URL = 'https://claude-pofd.onrender.com/api';

async function verifyLogin() {
    try {
        console.log('Testing login to:', `${API_URL}/auth/login`);

        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@maintenance.com',
            password: 'Admin123!'
        });

        console.log('LOGIN SUCCESS!');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error: any) {
        console.error('LOGIN FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

verifyLogin();
