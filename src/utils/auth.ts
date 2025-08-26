export class SlidoAuthService {
  private static getDomain() {
    if (import.meta.env.DEV) {
      return '.sybil.localhost';
    }
    return '.sybil.cloud';
  }

  static getAuthToken(): string | null {
    // First try to get from URL parameter (for iframe communication)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('auth_token');
    
    if (tokenFromUrl) {
      return tokenFromUrl;
    }
    
    // Then try to get from cookies (for subdomain sharing)
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1] || null;
  }

  static setAuthToken(token: string) {
    const domain = this.getDomain();
    const secure = import.meta.env.PROD;
    
    document.cookie = `auth_token=${token}; domain=${domain}; path=/; secure=${secure}; samesite=strict; max-age=86400`;
  }

  static clearAuthToken() {
    const domain = this.getDomain();
    document.cookie = `auth_token=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  static redirectToLogin() {
    const loginUrl = import.meta.env.DEV
      ? 'http://sybil.localhost:5173/login'
      : 'https://sybil.cloud/login';
    window.location.href = loginUrl;
  }

  static getMainAppUrl(): string {
    if (import.meta.env.DEV) {
      return 'http://sybil.localhost:5173';
    }
    return 'https://sybil.cloud';
  }
}



