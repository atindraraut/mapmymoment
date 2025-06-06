import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthGuard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
      return;
    }
    
    // Get user data from local storage
    const userDataString = localStorage.getItem('user_data');
    if (userDataString) {
      try {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, [navigate]);
  
  return userData;
}
