import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
    }
  }, [navigate]);
}
