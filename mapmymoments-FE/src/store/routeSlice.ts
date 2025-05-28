import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface RouteState {
  routeName: string;
  origin: string;
  destination: string;
  stops: Stop[];
}

const initialState: RouteState = {
  routeName: '',
  origin: '',
  destination: '',
  stops: [],
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setRouteName(state, action: PayloadAction<string>) {
      state.routeName = action.payload;
    },
    setOrigin(state, action: PayloadAction<string>) {
      state.origin = action.payload;
    },
    setDestination(state, action: PayloadAction<string>) {
      state.destination = action.payload;
    },
    setStops(state, action: PayloadAction<Stop[]>) {
      state.stops = action.payload;
    },
    addStop(state, action: PayloadAction<Stop>) {
      state.stops.push(action.payload);
    },
    removeStop(state, action: PayloadAction<string>) {
      state.stops = state.stops.filter(stop => stop.id !== action.payload);
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
} = routeSlice.actions;

export default routeSlice.reducer;
