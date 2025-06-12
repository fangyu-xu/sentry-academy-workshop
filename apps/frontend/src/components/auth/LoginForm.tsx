import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GithubIcon,
  FileIcon as GoogleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import {
  fetchSSOUserCredentials,
  createAuthenticationToken,
} from "../../utils/fakeUserGenerator";
import * as Sentry from "@sentry/react";

const SSOButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  provider: string;
  onClick: (provider: string) => void;
  isLoading?: boolean;
}> = ({ icon, label, provider, onClick, isLoading = false }) => (
  <button
    type="button"
    onClick={() => onClick(provider)}
    disabled={isLoading}
    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    <span>{label}</span>
    {isLoading && (
      <div className="ml-2 w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    )}
  </button>
);

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { logger } = Sentry;

  const { login, ssoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: string) => {
    setError("");
    setIsLoading(true);

    try {
      await Sentry.startSpan(
        {
          name: "sso.authentication.frontend",
          op: "auth.sso",
          attributes: {
            "auth.provider": provider,
          },
        },
        async (span) => {
          const userCredentials = fetchSSOUserCredentials(provider);

          logger.info(
            logger.fmt`Logging user ${userCredentials.email} in using ${provider}`
          );

          span.setAttributes({
            "auth.user.id": userCredentials.id,
            "auth.user.email": userCredentials.email,
            "auth.user.name": userCredentials.name,
            "auth.user.avatar": userCredentials.avatar,
          });

          const loginSignature = createAuthenticationToken(
            userCredentials,
            provider
          );

          span.setAttributes({
            "auth.login_signature.defined":
              loginSignature !== undefined && loginSignature !== null,
          });

          await ssoLogin(provider);
        }
      );

      navigate("/");
    } catch (err: any) {
      logger.error(
        logger.fmt`Failed to login with ${provider} - issue with loginSignature`
      );
      setError(`Failed to login with ${provider} - issue with loginSignature`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to Sentry Academy
        </h1>
        <p className="text-gray-600 mt-2">Sign in to continue learning</p>
      </div>

      {/* Primary SSO Login Options */}
      <div className="space-y-3 mb-6">
        <SSOButton
          icon={<GoogleIcon size={20} />}
          label="Continue with Google"
          provider="google"
          onClick={handleSSO}
          isLoading={isLoading}
        />
        <SSOButton
          icon={<GithubIcon size={20} />}
          label="Continue with Github"
          provider="github"
          onClick={handleSSO}
          isLoading={isLoading}
        />
      </div>

      {/* Alternative Login Method Checkbox */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showUsernamePassword}
            onChange={(e) => setShowUsernamePassword(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span>Use Username/Password Login instead</span>
        </label>
      </div>

      {/* Username/Password Form (Hidden by default) */}
      {showUsernamePassword && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Username & Password
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  placeholder="•••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>
        </>
      )}

      {/* Footer */}
      <div className="mt-6">
        {error && !showUsernamePassword && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 mb-4">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="#"
            className="font-medium text-purple-600 hover:text-purple-800"
          >
            Create one now
          </a>
        </p>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Experiencing issues? Try the username/password option above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
