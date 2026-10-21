export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}
