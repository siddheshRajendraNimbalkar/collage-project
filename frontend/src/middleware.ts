import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, setCookie } from 'nookies';

export async function middleware(request: NextRequest) {
  // Parse cookies from the request
  const cookies = parseCookies({ req: request });

  const expireToken = cookies.expireToken;
  const expireRefreshToken = cookies.expireRefreshToken;
  const accessToken = cookies.access_token;  // Access token in the cookies
  const expireAccessToken = cookies.expire_access_token;  // Expiration time for access token

  // If the access token exists, check if it's expired
  if (accessToken && expireAccessToken) {
    const currentTime = new Date().toISOString();

    // Check if the access token is expired
    const isAccessTokenExpired = new Date(expireAccessToken) < new Date(currentTime);

    if (isAccessTokenExpired) {
      // If access token is expired, proceed with token refresh
      try {
        const response = await fetch('http://localhost:9090/v1/api/refreshToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: cookies.refresh_token, // Using refresh token from cookies
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh tokens');
        }

        // Parse the response to extract new tokens
        const data = await response.json();

        const { access_token, refresh_token, expire_access_token, expire_refresh_token, user } = data;

        // Store the new tokens and expiration times in cookies
        setCookie({ res: NextResponse }, 'access_token', access_token, {
          maxAge: new Date(expire_access_token).getTime() / 1000, // Set expiration time based on response
          path: '/',
        });
        setCookie({ res: NextResponse }, 'refresh_token', refresh_token, {
          maxAge: new Date(expire_refresh_token).getTime() / 1000, // Set expiration time based on response
          path: '/',
        });

        setCookie({ res: NextResponse }, 'expire_access_token', expire_access_token, {
          maxAge: new Date(expire_access_token).getTime() / 1000, 
          path: '/',
        });
        setCookie({ res: NextResponse }, 'expire_refresh_token', expire_refresh_token, {
          maxAge: new Date(expire_refresh_token).getTime() / 1000, 
          path: '/',
        });

        setCookie({ res: NextResponse }, 'user', JSON.stringify(user), {
          path: '/',
        });

        // Continue the request after refreshing tokens
        return NextResponse.next();
      } catch (error) {
        console.error('Error refreshing token:', error);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // If the tokens are still valid, or no expiration found, continue the request
  return NextResponse.next();
}
