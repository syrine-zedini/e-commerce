import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginClient: (clientData: any) => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const loginClient = (clientData: any) => {
    const clientUser: User = {
      ...clientData,
      role: 'client',
    };
    setUser(clientUser);
    localStorage.setItem('user', JSON.stringify(clientUser));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      let mockUser: User | null = null;

      // Admin accounts are stored in the database (hashed passwords) —
      // checked server-side, see server/routes/adminAuth.ts.
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const admin = await res.json();
          mockUser = {
            id: admin.id,
            email: admin.email,
            name: admin.name || 'Admin',
            role: admin.role,
            isActive: true,
            createdAt: new Date().toISOString(),
          };
        }
      } catch {
        // Backend unreachable — fall through to the other login checks below.
      }

      if (mockUser) {
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return true;
      }

      if (email.toLowerCase() === 'client@example.com' && password === 'password') {
        mockUser = {
          id: '2',
          email,
          name: 'John Doe',
          role: 'client',
          isActive: true,
          createdAt: new Date().toISOString(),
          loyaltyPoints: 250,
          phone: '+1234567890',
          address: '123 Main St, City, Country',
        };
      } else {
        return false;
      }

      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email!,
        name: userData.name!,
        role: userData.role || 'client',
        isActive: true,
        createdAt: new Date().toISOString(),
        loyaltyPoints: userData.role === 'client' ? 0 : undefined,
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const resetPassword = async (_email: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginClient,
      register,
      logout,
      resetPassword,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};