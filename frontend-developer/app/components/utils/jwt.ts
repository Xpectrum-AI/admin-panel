import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.NEXT_PUBLIC_DEMO_JWT_SECRET as string || 'default_secret';


export const EncryptToken = (payload : any) => {
     const token = jwt.sign(payload, secret)
     return token;
}

export const DecryptToken = (token : string) => {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error('Invalid token:', error);
        return null;
    }
}