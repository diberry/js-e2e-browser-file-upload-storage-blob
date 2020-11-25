import React, { useState } from 'react';
import AzureAuthenticationContext from "./azure-authentication-context";
import { AccountInfo } from "@azure/msal-browser";
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const isIE = msie > 0 || msie11 > 0;


const AzureAuthenticationButton = ({ currentUser }: any): JSX.Element => {

    const authenticationModule: AzureAuthenticationContext = new AzureAuthenticationContext();
    const [authenticated, setAuthenticated] = useState<Boolean>(false);
    const [user, setUser] = useState<AccountInfo>();
    //const { isAuthenticated, signOut } = AzureAuthenticationContext.init();

    //const authModule: any = AzureAuthenticationContext();
    /*
        window.addEventListener("load", async () => {
            AzureAuthenticationContext.loadAuthModule();
        });
    */
    const signIn = (method: string): any => {
        const typeName = "loginPopup";
        const signInType = isIE ? "loginRedirect" : typeName;
        authenticationModule.login(signInType, returnedAccountInfo);

    }

    const returnedAccountInfo = (user: AccountInfo) => {
        console.log(`WebsiteAuth = ${JSON.stringify(user)}`)
        setAuthenticated(user?.name ? true : false);
        currentUser = user;
        setUser(user);
    }
    const signOut = (): any => {
        if (user) {
            currentUser = undefined;
            authenticationModule.logout(user);
        }
    }

    const showSignInButton = (): any => (
        <button onClick={() => signIn("loginPopup")}>Sign in (Pop-up)</button>
    )
    const showSignOutButton = (): any => (
        <button onClick={() => signOut()}>{user?.name} Sign out</button>
    )
    const showButton = (): any => {
        console.log(`showButton = ${authenticated}`)
        return authenticated ? showSignInButton() : showSignOutButton();
    }

    return (
        <div>
            { authenticationModule.isAuthenticationConfigured ? showButton() : <div>Authentication Client ID is not configured.</div> }
        </div>
    )

    
};

export default AzureAuthenticationButton;


