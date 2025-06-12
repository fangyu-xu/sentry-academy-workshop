import express from "express";
import { createId } from "@paralleldrive/cuid2";
import * as Sentry from "@sentry/node";

const { logger } = Sentry;

export const authRoutes = express.Router();

// Simple mock user for email/password login
const mockUser = {
  id: "demo-user-id",
  email: "demo@example.com",
  name: "Demo User",
  role: "student",
  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
  preferences: {
    theme: "light",
  },
};

// @ts-expect-error - Express router type issue
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        error: "MISSING_CREDENTIALS",
        message: "Email and password are required",
      });
    }

    if (email === "admin@sentry.io") {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Admin access is not allowed. Please use the Admin portal.",
      });
    }

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo purposes, accept any email/password
    const responseData = {
      user: { ...mockUser, email },
      token: `token-${createId()}`,
      expiresIn: "24h",
    };

    console.log(`Successful login for ${email}`);
    res.json(responseData);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Authentication service error",
    });
  }
});

authRoutes.post("/sso/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    const { loginSignature } = req.body;

    await Sentry.startSpan(
      {
        name: "sso.authentication.server",
        op: "auth.sso.verify",
        attributes: {
          "auth.provider": provider,
          "auth.login_signature.provided": !!loginSignature,
          "http.method": req.method,
          "http.route": "/sso/:provider",
        },
      },
      async (span) => {
        logger.info(logger.fmt`SSO login attempt with ${provider}`);
        logger.info(logger.fmt`Login signature provided: ${!!loginSignature}`);

        // Add more attributes based on request data
        span.setAttributes({
          "auth.request.body_size": JSON.stringify(req.body).length,
          "auth.request.has_signature": loginSignature !== undefined,
        });

        // TOFIX Module 1: SSO Login with missing login signature
        const signaturePayload = JSON.parse(atob(loginSignature)); // This will throw when loginSignature is undefined

        // Add signature payload details to span
        span.setAttributes({
          "auth.signature.user_id": signaturePayload.sub || null,
          "auth.signature.email": signaturePayload.email || null,
          "auth.signature.name": signaturePayload.name || null,
          "auth.signature.provider": signaturePayload.provider || null,
          "auth.signature.issued_at": signaturePayload.iat || null,
          "auth.signature.expires_at": signaturePayload.exp || null,
          "auth.signature.has_user_data": !!signaturePayload.userData,
        });

        // Use the rich fake user data from the signature payload, with sensible defaults
        const fakeUserData = signaturePayload.userData || {};

        // Add user data details to span
        span.setAttributes({
          "auth.user.id": fakeUserData.id || null,
          "auth.user.email": fakeUserData.email || null,
          "auth.user.name": fakeUserData.name || null,
          "auth.user.company": fakeUserData.company || null,
          "auth.user.job_title": fakeUserData.jobTitle || null,
        });

        const ssoUser = {
          id: fakeUserData.id || createId(),
          email: fakeUserData.email || `${provider}.user@example.com`,
          name:
            fakeUserData.name ||
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          firstName: fakeUserData.firstName || "Demo",
          lastName: fakeUserData.lastName || "User",
          username: fakeUserData.username || "demo.user",
          avatar:
            fakeUserData.avatar ||
            "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
          company: fakeUserData.company || "Demo Company",
          jobTitle: fakeUserData.jobTitle || "Software Developer",
          phone: fakeUserData.phone || "+1-555-0123",
          workEmail: fakeUserData.workEmail || fakeUserData.email,
          role: "student",
          provider: provider,
          signatureClaims: {
            sub: signaturePayload.sub,
            exp: signaturePayload.exp,
            metadata: {
              permissions: [],
              roles: [],
            },
          },
          socialProfile: {
            profileImage:
              fakeUserData.avatar ||
              "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
            verified: true,
            provider: provider,
          },
          linkedAccounts: [
            {
              provider: provider,
              externalId: signaturePayload.sub,
              profile: {
                username:
                  fakeUserData.username ||
                  (
                    fakeUserData.email ||
                    signaturePayload.email ||
                    "user"
                  ).split("@")[0],
                avatar:
                  fakeUserData.avatar ||
                  "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
              },
            },
          ],
        };

        // Add final authentication result to span
        span.setAttributes({
          "auth.result.user_id": ssoUser.id,
          "auth.result.success": true,
          "auth.result.provider_verified": true,
        });

        const responseData = {
          user: ssoUser,
          token: `sso-token-${createId()}`,
          expiresIn: "24h",
        };

        logger.info(logger.fmt`Successful SSO login with ${provider}`);
        res.json(responseData);
      }
    );
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: {
        operation: "sso.authentication.backend",
        provider: req.params.provider,
      },
      extra: {
        provider: req.params.provider,
        hasLoginSignature: !!req.body.loginSignature,
        requestBody: req.body,
      },
    });

    logger.error(
      logger.fmt`SSO login error for ${req.params.provider}:`,
      error
    );

    throw error;
  }
});

authRoutes.post("/logout", async (req, res) => {
  try {
    console.log("User logout");
    res.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "LOGOUT_FAILED",
      message: "Failed to logout",
    });
  }
});
