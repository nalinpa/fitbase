import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";

// Security middleware functions
export const security = {
  // Basic authentication check
  requireAuth: (request: CallableRequest): string => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }
    return uid;
  },

  // Validate required parameters
  validateParams: (data: Record<string, unknown>, requiredParams: string[]) => {
    for (const param of requiredParams) {
      if (data[param] === undefined || data[param] === null) {
        throw new HttpsError("invalid-argument", `Missing required parameter: ${param}`);
      }
    }
  },

  // Validate email format
  validateEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email format.");
    }
  },

  // Check resource ownership
  checkOwnership: async (uid: string, resourceType: string, resourceId: string, db: FirebaseFirestore.Firestore) => {
    const doc = await db.collection(resourceType).doc(resourceId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", `${resourceType} not found.`);
    }

    const data = doc.data();
    if (data &&data.createdBy !== uid && data.userId !== uid) {
      throw new HttpsError("permission-denied", "You don't have permission to access this resource.");
    }

    return doc;
  },
};

export const secureCall = (
  handler: (request: CallableRequest, uid: string) => Promise<Record<string, unknown>>,
  options: {
    requiredParams?: string[];
    skipAuth?: boolean;
  } = {}
) => {
  return onCall(async (request) => {
    try {
      let uid = "";
      if (!options.skipAuth) {
        uid = security.requireAuth(request);
      }

      if (options.requiredParams) {
        security.validateParams(request.data, options.requiredParams);
      }

      return await handler(request, uid);
    } catch (error) {
      logger.error("Function error:", {
        functionName: handler.name,
        error: error.message,
        uid: request.auth?.uid,
        data: request.data,
      });
      throw error;
    }
  });
};
