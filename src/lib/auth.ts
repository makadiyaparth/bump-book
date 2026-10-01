/* ============================================
   NextAuth Configuration
   Google OAuth with Drive (drive.file) scope
   ============================================ */

import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

import { resolveSpreadsheetId, setCachedSpreadsheetId } from './sheets';
 
 // Extend the built-in session types to include our custom fields
 declare module 'next-auth' {
   interface Session {
     accessToken?: string;
     refreshToken?: string;
     spreadsheetId?: string;
     error?: string;
     isDemo?: boolean;
   }
 }

 declare module 'next-auth/jwt' {
   interface JWT {
     accessToken?: string;
     refreshToken?: string;
     accessTokenExpires?: number;
     spreadsheetId?: string;
     error?: string;
     isDemo?: boolean;
   }
 }

 const GOOGLE_SCOPES = [
   'openid',
   'email',
   'profile',
   'https://www.googleapis.com/auth/drive.file',
 ].join(' ');

 export const authOptions: AuthOptions = {
   providers: [
     GoogleProvider({
       clientId: process.env.GOOGLE_CLIENT_ID!,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       authorization: {
         params: {
           scope: GOOGLE_SCOPES,
           access_type: 'offline',
           prompt: 'consent',
         },
       },
     }),
     CredentialsProvider({
       id: 'demo',
       name: 'Demo Mode',
       credentials: {},
       async authorize() {
         return {
           id: 'demo-guest-001',
           name: 'Priya Sharma (Demo)',
           email: 'priya.demo@bumpbook.app',
           image: '/bump-book-icon.png',
         };
       },
     }),
   ],

   session: {
     strategy: 'jwt',
     maxAge: 30 * 24 * 60 * 60, // 30 days
   },

   callbacks: {
     async jwt({ token, account, trigger, session }) {
       // Handle Demo Login
       if (account?.provider === 'demo') {
         token.isDemo = true;
         token.accessToken = 'demo-access-token';
         token.spreadsheetId = 'demo-sheet-id';
         token.accessTokenExpires = Date.now() + 30 * 24 * 3600 * 1000;
         token.name = 'Priya Sharma (Demo)';
         token.email = 'priya.demo@bumpbook.app';
         token.picture = '/bump-book-icon.png';
         return token;
       }

       // If existing token is demo, bypass Google logic
       if (token.isDemo) {
         return token;
       }

       // On initial sign-in, persist Google tokens
       if (account) {
         token.accessToken = account.access_token;
         token.refreshToken = account.refresh_token;
         token.accessTokenExpires = account.expires_at
           ? account.expires_at * 1000
           : Date.now() + 3600 * 1000;
       }

       // Handle session update (e.g. await update({ spreadsheetId }))
       if (trigger === 'update' && session?.spreadsheetId) {
         token.spreadsheetId = session.spreadsheetId;
         if (token.email) {
           setCachedSpreadsheetId(token.email as string, session.spreadsheetId);
         }
       }

       // Attempt to resolve spreadsheetId if not already stored in token
       if (!token.spreadsheetId && token.accessToken) {
         const id = await resolveSpreadsheetId(
           token.accessToken,
           token.email as string | undefined
         );
         if (id) {
           token.spreadsheetId = id;
         }
       }

       // If access token hasn't expired, return as-is
       if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
         return token;
       }

       // Access token expired — try to refresh
       return await refreshAccessToken(token);
     },

     async session({ session, token }) {
       session.isDemo = token.isDemo;

       if (token.isDemo) {
         session.accessToken = token.accessToken;
         session.spreadsheetId = token.spreadsheetId;
         if (session.user) {
           session.user.name = token.name || 'Priya Sharma (Demo)';
           session.user.email = token.email || 'priya.demo@bumpbook.app';
           session.user.image = (token.picture as string) || '/bump-book-icon.png';
         }
         return session;
       }

       session.accessToken = token.accessToken;
       session.refreshToken = token.refreshToken;
       session.spreadsheetId = token.spreadsheetId;
       session.error = token.error;

       // If session doesn't have spreadsheetId yet, resolve dynamically
       if (!session.spreadsheetId && session.accessToken) {
         const id = await resolveSpreadsheetId(
           session.accessToken,
           session.user?.email,
           token.spreadsheetId
         );
         if (id) {
           session.spreadsheetId = id;
           token.spreadsheetId = id;
         }
       }

       return session;
     },
   },

  pages: {
    signIn: '/',
  },
};

/**
 * Refresh the Google access token using the refresh token.
 */
async function refreshAccessToken(
  token: import('next-auth/jwt').JWT
): Promise<import('next-auth/jwt').JWT> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Keep the existing refresh token if a new one wasn't issued
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
