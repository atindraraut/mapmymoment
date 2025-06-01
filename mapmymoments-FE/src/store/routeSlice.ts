import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface RouteState {
  routeName: string;
  origin: Place | null;
  destination: Place | null;
  stops: Stop[];
  routeInfo: {
    distance: string;
    duration: string;
  } | null;
}

const initialState: RouteState = {
  routeName: '',
  origin: null,
  destination: null,
  stops: [],
  routeInfo: null,
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setRouteName(state, action: PayloadAction<string>) {
      console.log('Redux: setRouteName called with:', action.payload);
      state.routeName = action.payload;
    },
    setOrigin(state, action: PayloadAction<Place | null>) {
      console.log('Redux: setOrigin called with:', action.payload);
      state.origin = action.payload;
    },
    setDestination(state, action: PayloadAction<Place | null>) {
      console.log('Redux: setDestination called with:', action.payload);
      state.destination = action.payload;
    },
    setStops(state, action: PayloadAction<Stop[]>) {
      console.log('Redux: setStops called with:', action.payload);
      state.stops = action.payload;
    },
    addStop(state, action: PayloadAction<Stop>) {
      console.log('Redux: addStop called with:', action.payload);
      state.stops.push(action.payload);
    },
    removeStop(state, action: PayloadAction<string>) {
      console.log('Redux: removeStop called with:', action.payload);
      state.stops = state.stops.filter(stop => stop.id !== action.payload);
    },
    setRouteInfo(state, action: PayloadAction<{ distance: string; duration: string } | null>) {
      console.log('Redux: setRouteInfo called with:', action.payload);
      state.routeInfo = action.payload;
    },
  },
});

export const {
  setRouteName,
  setOrigin,
  setDestination,
  setStops,
  addStop,
  removeStop,
  setRouteInfo,
} = routeSlice.actions;

export default routeSlice.reducer;
