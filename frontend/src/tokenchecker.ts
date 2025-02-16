import axios from 'axios';

const TokenChecker = async (): Promise<{ success: boolean; message: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const token = localStorage.getItem('token');
    const expireToken = localStorage.getItem('expireToken');
    const expireRefreshToken = localStorage.getItem('expireRefreshToken');

    const isExpired = (timestamp: string | null): boolean => {
        if (!timestamp) return true; 
        const expirationTime = new Date(timestamp);
        const bufferTime = 15 * 60 * 1000; 
        const adjustedExpirationTime = new Date(expirationTime.getTime() - bufferTime);
        return adjustedExpirationTime < new Date();
    };

    if (!refreshToken || !expireRefreshToken) {
        return { success: false, message: "No refresh token found, please log in again." };
    }

    if (!token || isExpired(expireToken)) {
        if (isExpired(expireRefreshToken)) {
            return { success: false, message: "Session expired, please log in again." };
        }

        try {
            const response = await axios.post('/api/auth/refresh', { refreshToken });

            if (response.data) {
                const newToken = response.data.token;
                const newRefreshToken = response.data.refreshToken;

                if (newToken) localStorage.setItem('token', newToken);
                if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
                if (response.data.expireToken) localStorage.setItem('expireToken', response.data.expireToken);
                if (response.data.expireRefreshToken) localStorage.setItem('expireRefreshToken', response.data.expireRefreshToken);

                return { success: true, message: "Token refreshed successfully." };
            }
        } catch (error) {
            console.error("Failed to refresh token:", error);
            return { success: false, message: "Failed to refresh token. Please log in again." };
        }
    }

    return { success: true, message: "Token is valid." };
};

export default TokenChecker;
