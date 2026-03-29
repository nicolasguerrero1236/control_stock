function parseAuthorizationHeader(authorizationHeader) {
  if (!authorizationHeader?.startsWith('Basic ')) {
    return null;
  }

  const base64Credentials = authorizationHeader.slice(6);
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex === -1) {
    return null;
  }

  return {
    username: decodedCredentials.slice(0, separatorIndex),
    password: decodedCredentials.slice(separatorIndex + 1)
  };
}

export function basicAuthMiddleware(request, response, next) {
  const isEnabled = process.env.ENABLE_BASIC_AUTH === 'true';

  if (!isEnabled) {
    return next();
  }

  const credentials = parseAuthorizationHeader(request.headers.authorization);
  const expectedUsername = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!credentials || credentials.username !== expectedUsername || credentials.password !== expectedPassword) {
    response.setHeader('WWW-Authenticate', 'Basic realm="Stock"');
    return response.status(401).json({ message: 'No autorizado.' });
  }

  return next();
}