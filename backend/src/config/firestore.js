import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let firestoreInstance;

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const defaultServiceAccountPaths = [
  path.resolve(currentDirectory, '../../firebase-key.json'),
  path.resolve(currentDirectory, '../../firebase-key.json.json')
];

function getCredentialsFromServiceAccountFile() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const candidatePaths = configuredPath
    ? [path.resolve(configuredPath), ...defaultServiceAccountPaths]
    : defaultServiceAccountPaths;

  const serviceAccountPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));

  if (!serviceAccountPath) {
    return null;
  }

  const parsedCredentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  if (!parsedCredentials.project_id || !parsedCredentials.client_email || !parsedCredentials.private_key) {
    throw new Error(
      `El archivo de Firebase no tiene el formato esperado: ${serviceAccountPath}`
    );
  }

  return {
    projectId: parsedCredentials.project_id,
    clientEmail: parsedCredentials.client_email,
    privateKey: parsedCredentials.private_key
  };
}

function getFirebaseCredentials() {
  const fileCredentials = getCredentialsFromServiceAccountFile();

  if (fileCredentials) {
    return fileCredentials;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Faltan credenciales de Firebase. Usa backend/firebase-key.json o define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.${
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
          ? ` Tambien puedes revisar FIREBASE_SERVICE_ACCOUNT_PATH=${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}.`
          : ''
      }`
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

export function getFirestore() {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(getFirebaseCredentials())
    });
  }

  firestoreInstance = admin.firestore();

  return firestoreInstance;
}