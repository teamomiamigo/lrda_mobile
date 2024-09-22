import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Make sure to import SafeAreaProvider
import configureStore from 'redux-mock-store';
import LoginScreen from '../lib/screens/loginScreens/LoginScreen';
import moxios from 'moxios'
import { shallow } from 'enzyme';
// Create a mock store
const mockStore = configureStore([]);
const store = mockStore({
  navigation: {
    navState: 'login', // Mock the navigation state
  },
});

// Silence console warnings during the test
beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  moxios.install()
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore(); // Restore console.warn after the tests
  moxios.uninstall()
});

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    const navigationMock = { navigate: jest.fn() }; // Mock navigation prop
    const routeMock = { params: {} }; // Mock route prop

    const { toJSON } = render(
      <Provider store={store}>
        <SafeAreaProvider>
          <LoginScreen navigation={navigationMock} route={routeMock} />
        </SafeAreaProvider>
      </Provider>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('triggers login function when login button is pressed while keyboard is mounted', async () => {
    const navigationMock = { navigate: jest.fn() };
    const routeMock = { params: {} };

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <SafeAreaProvider>
          <LoginScreen navigation={navigationMock} route={routeMock} />
        </SafeAreaProvider>
      </Provider>
    );
    
    // Simulate user input for email and password
    const emailInput = await waitFor(() => getByPlaceholderText('Email...'));  // Wait for the email input to appear
    fireEvent.changeText(emailInput, 'testuser@example.com');
    
    const passwordInput = await waitFor(() => getByPlaceholderText('Password...'));  // Wait for the password input to appear
    fireEvent.changeText(passwordInput, 'password123');

    // Simulate pressing the login button
    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    // Assert that the navigation function was called with "HomeTab"
    await waitFor(() => {
      expect(navigationMock.navigate).toHaveBeenCalledWith('HomeTab');
    });
  });
  
});
