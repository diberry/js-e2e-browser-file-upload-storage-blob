import React, { useState } from 'react';
import Path from 'path';
import uploadFileToBlob, { isStorageConfigured } from './uploadToBlob';
import AzureAuthenticationButton from './azure-authentication-component-button';
import AzureLoggedOut from './azure-authentication-component-logout';
import { AccountInfo } from "@azure/msal-browser";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

const storageConfigured = isStorageConfigured();

const App = (): JSX.Element => {

  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);

  // current file to upload into container
  const [fileSelected, setFileSelected] = useState(null);

  // current authenticated user
  const [currentUser, setCurrentUser] = useState<AccountInfo>();
  
  // UI/form management
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const onFileChange = (event: any) => {
    // capture file into state
    setFileSelected(event.target.files[0]);
  };

  const onFileUpload = async () => {
    // prepare UI
    setUploading(true);

    // *** UPLOAD TO AZURE STORAGE ***
    const blobsInContainer: string[] = await uploadFileToBlob(fileSelected);

    // prepare UI for results
    setBlobList(blobsInContainer);

    // reset state/form
    setFileSelected(null);
    setUploading(false);
    setInputKey(Math.random().toString(36));
  };

  // display form
  const DisplayForm = () => (
    <div>
      <input type="file" onChange={onFileChange} key={inputKey || ''} />
      <button type="submit" onClick={onFileUpload}>
        Upload!
          </button>
    </div>
  )

  // display file name and image
  const DisplayImagesFromContainer = () => (
    <div>
      <h2>Container items</h2>
      <ul>
        {blobList.map((item) => {
          return (
            <li key={item}>
              <div>
                {Path.basename(item)}
                <br />
                <img src={item} alt={item} height="200" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const Home = () => {
    return (
      <div>
        <h1>Upload file to Azure Blob Storage</h1>
        { storageConfigured && !uploading && DisplayForm()}
        { storageConfigured && uploading && <div>Uploading</div>}
        <hr />
        { storageConfigured && blobList.length > 0 && DisplayImagesFromContainer()}
        { !storageConfigured && <div>Storage is not configured.</div>}
      </div >
    )
  }

  return (
    <Router>
      <div>
        <AzureAuthenticationButton currentUser={currentUser} />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/logout">
            <AzureLoggedOut />
          </Route>
        </Switch>        
      </div>
    </Router>
  );
};

export default App;


