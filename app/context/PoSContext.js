import React, { createContext, useReducer, useContext } from 'react';

const PoSContext = createContext();

const initialState = {
  cart: [], // { medicationId, name, price, quantity }
};

function posReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART':
      // Check if item exists
      const existing = state.cart.find(item => item.medicationId === action.payload.medicationId);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.medicationId === action.payload.medicationId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, action.payload],
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.medicationId !== action.payload.medicationId),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };
    default:
      return state;
  }
}

export const PoSProvider = ({ children }) => {
  const [state, dispatch] = useReducer(posReducer, initialState);
  return (
    <PoSContext.Provider value={{ state, dispatch }}>
      {children}
    </PoSContext.Provider>
  );
};

export const usePoS = () => useContext(PoSContext); 