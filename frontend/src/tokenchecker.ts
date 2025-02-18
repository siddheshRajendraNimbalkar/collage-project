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

    if (!refreshToken || isExpired(expireRefreshToken)) {
        return { success: false, message: "No refresh token found, please log in again." };
    }

    if (!token || isExpired(expireToken)) {

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/api/refreshToken`, { refreshToken },{
                headers: {
                  "Content-Type": "application/json",
                },
              });

               

            if (response.data) {
                const newToken = response.data.access_token;
                const newExpireToken = response.data.expire_access_token
                if (newToken && newExpireToken) {
                    console.log(newExpireToken)   
                    localStorage.setItem('token', newToken);
                    localStorage.setItem('expireToken', newExpireToken);
                    return { success: true, message: "Token refreshed successfully." };
                }
                return { success: false, message: "error occure while storing it to localStorage" };
            }
        } catch (error) {
            console.error("Failed to refresh token:", error);
            return { success: false, message: "Failed to refresh token. Please log in again." };
        }
    }

    return { success: true, message: "Token is valid." };
};

export default TokenChecker;
