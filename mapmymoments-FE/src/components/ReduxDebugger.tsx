import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { setRouteName, setOrigin, setDestination, setStops } from '@/store/routeSlice';

export default function ReduxDebugger() {
  const routeState = useSelector((state: RootState) => state.route);
  const dispatch = useDispatch<AppDispatch>();

  const testRedux = () => {
    console.log('Testing Redux dispatch...');
    dispatch(setRouteName('Test Route ' + Date.now()));
    dispatch(setOrigin({
      id: 'test-origin',
      lat: 12.9716,
      lng: 77.5946,
      name: 'Test Origin',
      address: 'Test Origin Address'
    }));
    dispatch(setDestination({
      id: 'test-dest',
      lat: 12.9800,
      lng: 77.6000,
      name: 'Test Destination',
      address: 'Test Destination Address'
    }));
  };

  const loadSampleRoute = () => {
    console.log('Loading sample route...');
    dispatch(setRouteName('Bellandur to HSR Layout'));
    dispatch(setOrigin({
      id: 'wp-1748707912036-0p98gc40v',
      lat: 12.9304278,
      lng: 77.678404,
      name: 'Bellandur',
      address: 'Bellandur, Bengaluru, Karnataka, India'
    }));
    dispatch(setDestination({
      id: 'wp-1748707915420-bspatpatt',
      lat: 12.9137634,
      lng: 77.63727779999999,
      name: 'Hsr Bda Complex',
      address: 'Hsr Bda Complex, 12th Main Rd, Sector 6, HSR Layout, Bengaluru, Karnataka 560102, India'
    }));
    dispatch(setStops([
      {
        id: '1748707916280',
        name: 'Anand Sweets & Savories',
        lat: 12.9167105,
        lng: 77.6733224
      }
    ]));
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Redux State Debug:</h4>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testRedux}
          style={{ 
            marginRight: '5px',
            marginBottom: '5px', 
            padding: '5px 10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Test Redux
        </button>
        <button 
          onClick={loadSampleRoute}
          style={{ 
            marginBottom: '5px', 
            padding: '5px 10px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Load Sample Route
        </button>
      </div>
      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
        {JSON.stringify(routeState, null, 2)}
      </pre>
    </div>
  );
}
