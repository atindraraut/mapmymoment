import { useDispatch } from 'react-redux';
import { setRouteName, setOrigin, setDestination, setStops } from '@/store/routeSlice';

export const useRouteActions = () => {
  const dispatch = useDispatch();

  const loadRouteData = (routeData: {
    route: {
      routeName: string;
      origin: {
        id: string;
        lat: number;
        lng: number;
        name: string;
        address: string;
      };
      destination: {
        id: string;
        lat: number;
        lng: number;
        name: string;
        address: string;
      };
      stops: Array<{
        id: string;
        name: string;
        lat: number;
        lng: number;
      }>;
    };
  }) => {
    dispatch(setRouteName(routeData.route.routeName));
    dispatch(setOrigin(routeData.route.origin));
    dispatch(setDestination(routeData.route.destination));
    dispatch(setStops(routeData.route.stops));
  };

  return {
    loadRouteData,
  };
};
