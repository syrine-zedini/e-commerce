// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';
import { apiPost } from '@/lib/api';

interface LoginFormProps {
  onToggleForm?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  const { login, loginClient, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Trim partout pour éviter les espaces invisibles
    const emailClean = email.trim().toLowerCase();
    const passwordClean = password.trim();

    // Try the admin accounts (checked against the database, see
    // AuthContext.login / server/routes/adminAuth.ts) before falling back
    // to a regular client login — no email pattern needed client-side.
    const adminSuccess = await login(emailClean, passwordClean);
    if (adminSuccess) {
      setLocation('/dashboard');
      return;
    }

    // Not an admin account — login client via API
    try {
      let data: any;
      try {
        data = await apiPost('/api/auth/login', { email: emailClean, password: passwordClean });
      } catch (loginError) {
        setError('Email ou mot de passe invalide');
        return;
      }

      if (!data) {
        setError('Email ou mot de passe invalide');
        return;
      }

      // Session client
      localStorage.setItem('clientSession', JSON.stringify(data));
      loginClient(data);

      // Redirection unique
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        localStorage.removeItem('redirectAfterLogin');
        setLocation(redirectAfterLogin);
      } else {
        setLocation('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la connexion');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-full max-w-[110px] h-auto mx-auto mb-4 flex justify-center items-center">
            <img
              src="/figmaAssets/logo YJPARA.jpeg"
              alt="Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D8EE6] focus:border-transparent transition-all"
                placeholder="Entrez votre email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D8EE6] focus:border-transparent transition-all"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#1D8EE6] to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-[#1D8EE6] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(29,142,230,0.3)]"
          >
            {isLoading ? 'Connexion...' : 'Sign In'}
          </button>

          {/* {onForgotPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-[#1D8EE6] hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )} */}
        </form>
      </div>
    </div>
  );
};