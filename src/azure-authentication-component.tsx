import React, { useState } from 'react';
import AzureAuthenticationContext from './azure-authentication-context';
import { AccountInfo } from '@azure/msal-browser';

const ua = window.navigator.userAgent;
const msie = ua.indexOf('MSIE ');
const msie11 = ua.indexOf('Trident/');
const isIE = msie > 0 || msie11 > 0;

const AzureAuthenticationButton = ({ onAuthenticated }: any): JSX.Element => {
  const authenticationModule: AzureAuthenticationContext = new AzureAuthenticationContext();
  const [authenticated, setAuthenticated] = useState<Boolean>(false);
  const [user, setUser] = useState<AccountInfo>();

  const signIn = (method: string): any => {
    const typeName = 'loginPopup';
    const signInType = isIE ? 'loginRedirect' : typeName;
    authenticationModule.login(signInType, returnedAccountInfo);
  };

  const returnedAccountInfo = (user: AccountInfo) => {
    setAuthenticated(user?.name ? true : false);
    onAuthenticated(user);
    setUser(user);
  };
  const signOut = (): any => {
    if (user) {
      onAuthenticated(undefined);
      authenticationModule.logout(user);
    }
  };

  const showSignInButton = (): any => {
    return (
      <button id="authenticationButton" onClick={() => signIn('loginPopup')}>
        Sign in
      </button>
    );
  };
  const showSignOutButton = (): any => {
    return (
      <div id="authenticationButtonDiv">
        <div id="authentication">
          <button id="authenticationButton" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
        <div id="authenticationLabel">
          <label>{user?.name}</label>
        </div>
      </div>
    );
  };
  const showButton = (): any => {
    return authenticated ? showSignOutButton() : showSignInButton();
  };

  return (
    <div id="authentication">
      {authenticationModule.isAuthenticationConfigured ? (
        showButton()
      ) : (
        <div>Authentication Client ID is not configured.</div>
      )}
    </div>
  );
};

export default AzureAuthenticationButton;
