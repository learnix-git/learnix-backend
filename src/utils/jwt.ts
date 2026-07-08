import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const JWT_EXP = process.env.JWT_EXP || '7d';

const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, 'keys/private.pem'), 'utf8');
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, 'keys/public.pem'), 'utf8');

export interface Token {
  id: string;
  role: string;
}

export const generate = (payload: Token): string => {
  return jwt.sign(payload, PRIVATE_KEY, { 
    algorithm: 'ES256', 
    expiresIn: JWT_EXP as any 
  });
};

export const verify = (token: string): Token => {
  return jwt.verify(token, PUBLIC_KEY, { 
    algorithms: ['ES256'] 
  }) as Token;
};