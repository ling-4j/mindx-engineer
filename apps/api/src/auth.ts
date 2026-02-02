
import { Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client';
import express from 'express';
import session from 'express-session';

// OIDC Configuration
const oidcIssuer = (process.env.OIDC_ISSUER || 'https://id-dev.mindx.edu.vn').trim();
const clientId = (process.env.OIDC_CLIENT_ID || '').trim();
const clientSecret = (process.env.OIDC_CLIENT_SECRET || '').trim();
const redirectUri = (process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/auth/callback').trim();

// Extend the session type to include user info
declare module 'express-session' {
  interface SessionData {
    tokenSet?: TokenSet;
    user?: UserinfoResponse;
  }
}

const router = express.Router();

let client: any;

async function initializeOIDC() {
  try {
    const issuer = await Issuer.discover(oidcIssuer);
    console.log('OIDC Issuer discovered:', issuer.metadata.issuer);

    client = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUri],
      response_types: ['code'],
    });
  } catch (error) {
    console.error('Failed to discover OIDC issuer:', error);
  }
}

initializeOIDC();
console.log('Using Auth Router');
console.log('Auth module loaded');

// Login route - Redirect to Identity Provider
router.get('/login', (req, res) => {
  if (!client) {
    return res.status(500).send('OIDC client not initialized');
  }

  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    prompt: 'login',
    redirect_uri: redirectUri,
  });

  console.log('Redirecting to OIDC Provider:', {
    authUrl,
    sentRedirectUri: redirectUri
  });

  res.redirect(authUrl);
});

// Callback route - Handle OIDC response
router.get('/callback', async (req, res) => {
  if (!client) {
    return res.status(500).send('OIDC client not initialized');
  }

  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(redirectUri, params);
    let userInfo: any;
    try {
      userInfo = await client.userinfo(tokenSet);
    } catch (err: any) {
      if (err.name === 'RPError' && err.body) {
        console.log('OIDC Provider is non-compliant (missing sub in userinfo). Recovering from body.');
        userInfo = err.body;
        if (!userInfo.sub) {
          userInfo.sub = userInfo.firebaseId || userInfo.id;
        }
      } else {
        throw err;
      }
    }

    req.session.tokenSet = tokenSet;
    req.session.user = userInfo;

    console.log('ser logged in:', userInfo.email || userInfo.sub);
    const frontendUrl = process.env.FRONTEND_URL || '/';
    res.redirect(frontendUrl);
  } catch (error) {
    res.status(500).send(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).send('Logout failed');
    }

    //clear local session and go home
    res.redirect(process.env.FRONTEND_URL || '/');
  });
});

// Me route - Return current user info
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.user.id || req.session.user.sub,
        email: req.session.user.email
      }
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Middleware to protect routes
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', message: 'Please login to access this resource' });
};

export const authRouter = router;
