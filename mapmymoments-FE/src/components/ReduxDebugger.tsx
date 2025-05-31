import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { setRouteName, setOrigin, setDestination } from '@/store/routeSlice';

export default function ReduxDebugger() {
  const routeState = useSelector((state: RootState) => state.route);
  const dispatch = useDispatch<AppDispatch>();

  const testRedux = () => {
    console.log('Testing Redux dispatch...');
    dispatch(setRouteName('Test Route ' + Date.now()));
    dispatch(setOrigin('Test Origin ' + Date.now()));
    dispatch(setDestination('Test Destination ' + Date.now()));
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
      <button 
        onClick={testRedux}
        style={{ 
          marginBottom: '10px', 
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
      <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
        {JSON.stringify(routeState, null, 2)}
      </pre>
    </div>
  );
}
