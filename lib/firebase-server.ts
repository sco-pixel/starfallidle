import { createRemoteJWKSet, jwtVerify } from "jose";
import { FIREBASE_PROJECT_ID } from "./firebase-config";

const issuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type FirebaseIdentity = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export async function getFirebaseIdentity(request: Request): Promise<FirebaseIdentity | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub || typeof payload.sub !== "string") return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      displayName: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}
