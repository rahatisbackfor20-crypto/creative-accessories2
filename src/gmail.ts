import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import app from './firebase';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add Gmail scopes
const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

SCOPES.forEach(scope => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to get Gmail access token
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Convert string to base64url encoded RFC 2822 message
function createRawEmail(to: string, subject: string, htmlMessage: string, fromName = 'Creative Accessories Factory'): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlMessage
  ];
  const emailString = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(emailString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Send an email using Gmail REST API
export async function sendGmailMessage(to: string, subject: string, htmlBody: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Gmail authorization required. Please connect your Google account.' };
  }

  try {
    const raw = createRawEmail(to, subject, htmlBody);
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gmail API error HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Failed to send Gmail message:', err);
    return { success: false, error: err?.message || 'Failed to send email' };
  }
}
