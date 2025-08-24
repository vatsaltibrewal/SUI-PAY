// Simple authentication without database
// Uses localStorage for client-side session management

export interface AuthSession {
  id: string;
  creatorId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface JWTPayload {
  creatorId: string;
  email: string;
  username: string;
  exp: number;
}

export class AuthService {
  // Simple token generation (in production, use proper JWT)
  static generateToken(payload: Omit<JWTPayload, 'exp'>): string {
    const tokenData = {
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      iat: Date.now()
    };
    
    // Simple base64 encoding (in production, use proper JWT signing)
    return btoa(JSON.stringify(tokenData));
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = JSON.parse(atob(token)) as JWTPayload;
      
      // Check if token is expired
      if (decoded.exp < Date.now()) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static async createSession(creatorId: string, email: string, username: string): Promise<string> {
    const token = this.generateToken({ creatorId, email, username });
    
    // In a real app, you might want to store sessions server-side
    // For now, the token contains all necessary information
    
    return token;
  }

  static async validateSession(token: string): Promise<{ creator: any } | null> {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    // In a real app, you'd fetch the creator from the database
    // For now, we'll return a basic creator object
    return {
      creator: {
        id: payload.creatorId,
        email: payload.email,
        username: payload.username
      }
    };
  }

  static async deleteSession(token: string): Promise<void> {
    // In localStorage-based auth, we just remove the token client-side
    // No server-side cleanup needed with this simple approach
    console.log('Session deleted:', token);
  }
}

// Middleware for API route authentication
export function withAuth(handler: Function) {
  return async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.substring(7);
      const session = await AuthService.validateSession(token);

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Add creator info to request
      req.creator = session.creator;
      req.token = token;

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Client-side auth utilities
export class ClientAuth {
  private static readonly TOKEN_KEY = 'sui-pay-token';
  private static readonly CREATOR_KEY = 'sui-pay-creator';

  static saveAuth(token: string, creator: any): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.CREATOR_KEY, JSON.stringify(creator));
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getCreator(): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const creator = localStorage.getItem(this.CREATOR_KEY);
      return creator ? JSON.parse(creator) : null;
    } catch {
      return null;
    }
  }

  static clearAuth(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CREATOR_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = AuthService.verifyToken(token);
    return payload !== null;
  }
}