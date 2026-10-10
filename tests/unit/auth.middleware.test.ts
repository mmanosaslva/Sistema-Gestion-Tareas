import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../src/api/middlewares/auth.middleware';
import { AuthenticationError } from '../../src/errors/AuthenticationError';

const SECRET = process.env.JWT_SECRET ?? 'test-secret';
const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

type FakeReq = {
  headers: Record<string, string | undefined>;
  user?: { id: string };
};

function tryAuthenticate(authorization: string | undefined): {
  error: unknown;
  nextCalled: boolean;
  user?: { id: string };
} {
  const req: FakeReq = { headers: {} };
  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }
  let error: unknown = null;
  let nextCalled = false;
  try {
    authenticate(req as never, {} as never, () => {
      nextCalled = true;
    });
  } catch (e) {
    error = e;
  }
  return { error, nextCalled, user: req.user };
}

describe('auth.middleware authenticate', () => {
  it('sin cabecera responde 401', () => {
    const r = tryAuthenticate(undefined);
    expect(r.error).toBeInstanceOf(AuthenticationError);
    expect((r.error as AuthenticationError).statusCode).toBe(401);
    expect(r.nextCalled).toBe(false);
  });

  it('cabecera mal formada responde 401', () => {
    const r = tryAuthenticate('Token abc');
    expect(r.error).toBeInstanceOf(AuthenticationError);
    expect(r.nextCalled).toBe(false);
  });

  it('token basura responde 401', () => {
    const r = tryAuthenticate('Bearer xxx');
    expect(r.error).toBeInstanceOf(AuthenticationError);
  });

  it('token expirado responde 401', () => {
    const expired = jwt.sign({ sub: USER_ID }, SECRET, {
      algorithm: 'HS256',
      expiresIn: '-10s',
    });
    const r = tryAuthenticate(`Bearer ${expired}`);
    expect(r.error).toBeInstanceOf(AuthenticationError);
  });

  it('algoritmo distinto de HS256 responde 401', () => {
    const wrongAlg = jwt.sign({ sub: USER_ID }, SECRET, { algorithm: 'HS384' });
    const r = tryAuthenticate(`Bearer ${wrongAlg}`);
    expect(r.error).toBeInstanceOf(AuthenticationError);
  });

  it('payload sin sub responde 401', () => {
    const noSub = jwt.sign({}, SECRET, { algorithm: 'HS256', expiresIn: '5m' });
    const r = tryAuthenticate(`Bearer ${noSub}`);
    expect(r.error).toBeInstanceOf(AuthenticationError);
  });

  it('token válido deja el id en req.user y llama next', () => {
    const valid = jwt.sign({ sub: USER_ID }, SECRET, { algorithm: 'HS256', expiresIn: '5m' });
    const r = tryAuthenticate(`Bearer ${valid}`);
    expect(r.error).toBeNull();
    expect(r.nextCalled).toBe(true);
    expect(r.user?.id).toBe(USER_ID);
  });
});
