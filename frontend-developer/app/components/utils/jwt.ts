import jwt from 'jsonwebtoken';

export const EncryptToken = (payload : any) => {
     const token = jwt.sign(payload, 'default_secret')
     return token;
}

export const DecryptToken = (token : string) => {
    try {
        const decoded = jwt.verify(token, 'default_secret');
        return decoded;
    } catch (error) {
        console.error('Invalid token:', error);
        return null;
    }
}