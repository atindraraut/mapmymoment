import { configureStore } from '@reduxjs/toolkit';
import routeReducer from '@/store/routeSlice';

const store = configureStore({
  reducer: {
    route: routeReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
