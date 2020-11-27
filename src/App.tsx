import React, { useState } from 'react';
import {
  createBlobInContainer,
  getBlobsInContainer,
  isStorageConfigured,
  AppBlobInfo,
  deleteBlob,
  deleteContainer,
  getContainerNameWithUserName,
} from './azure/azure-storage-blob';
import AzureAuthenticationButton from './azure/azure-authentication-component';
import { AccountInfo } from '@azure/msal-browser';

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<AppBlobInfo[]>([]);

  // current file to upload into container
  const [fileSelected, setFileSelected] = useState<File | null>();

  // current authenticated user
  const [currentUser, setCurrentUser] = useState<AccountInfo>();

  // UI/form management
  const [uploading, setUploading] = useState<Boolean>(false);

  const onFileChange = (event: any) => {
    // capture file into state
    setFileSelected(event.target.files[0]);
  };

  const onFileDelete = async (filename: any) => {
    // *** DELETE BLOB IN AZURE STORAGE ***
    await deleteBlob(currentUser, filename);

    // *** GET BLOBS FROM AZURE STORAGE ***
    const filesFromContainer = await getBlobsInContainer(currentUser);
    setBlobList(filesFromContainer);
  };
  const onContainerDelete = async () => {
    setBlobList([]);

    // *** DELETE CONTAINER IN AZURE STORAGE ***
    await deleteContainer(currentUser);
  };

  const onFileUpload = async () => {
    
    if (fileSelected) {
      
      // prepare UI
      setUploading(true);

      // *** UPLOAD TO AZURE STORAGE ***
      await createBlobInContainer(fileSelected, currentUser);

      // *** GET BLOBS FROM AZURE STORAGE ***
      const filesFromContainer = await getBlobsInContainer(currentUser);
      setBlobList(filesFromContainer);

      // reset state/form
      setFileSelected(null);
      setUploading(false);
    }
  };

  const onAuthenticated = async (userAccountInfo: AccountInfo) => {
    setCurrentUser(userAccountInfo);
    const blobsInContainer: AppBlobInfo[] = await getBlobsInContainer(userAccountInfo);
    setBlobList(blobsInContainer);
  };

  // Render JSON data in readable format in collapsing section
  const PrettyPrintJson = ({ name, data }: any) => {
    return (
      <div>
        <details>
          <summary>{name}</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    );
  };

  // render upload form
  const DisplayForm = ({ user }: any) => {
    return (
      <div id="DisplayForm">
        <hr />
        <h4>Select an image</h4>
        {!fileSelected ? (
          <div>
            <input
              type="file"
              onChange={onFileChange}
              key={Math.random().toString(36) || ''}
              accept="image/gif, image/jpeg, image/png"
            />
          </div>
        ) : (
          <div>
            {!uploading ? (
              <button type="submit" onClick={onFileUpload}>
                Upload
              </button>
            ) : (
              <div>Uploading...</div>
            )}
            <div>
              <img height="75" src={URL.createObjectURL(fileSelected)} alt={fileSelected.name} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // render user's images
  const DisplayImagesFromContainer = ({ user }: any) => {
    return (
      <div>
        <hr />
        <h4>
          {getContainerNameWithUserName(currentUser)} images: ({blobList.length}){' '}
          <button onClick={() => onContainerDelete()}>X</button>
        </h4>
        <ol>
          {blobList.map((item, index) => {
            return (
              <li key={index} data-id={item.name}>
                <div>
                  <PrettyPrintJson name={item.name} data={item} />
                  <img src={item.url} alt={item.name} height="200" />
                  <button onClick={() => onFileDelete(item.name)}>X</button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  // render file upload form and list
  const ImageUpload = ({ user }: any) => {
    return (
      <div id="ImageUpload">
        {!isStorageConfigured() ? (
          <div>Storage is not configured.</div>
        ) : (
          <div>
            <DisplayForm user={user} />
            {blobList.length > 0 && <DisplayImagesFromContainer user={user} />}
          </div>
        )}
      </div>
    );
  };

  // render user account info
  const DisplayUser = ({ user }: any) => {
    return (
      <div id="DisplayUser">
        {!user ? (
          <div>Sign In to upload file to Storage</div>
        ) : (
          <div>
            <hr />
            <PrettyPrintJson name={`User Account Information`} data={user} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="App">
      <AzureAuthenticationButton onAuthenticated={onAuthenticated} />
      <div id="App.body">
        <h2>Upload file to Azure Blob Storage</h2>
        <div>
          {currentUser ? (
            <div>
              <DisplayUser user={currentUser} />
              <ImageUpload user={currentUser} />
            </div>
          ) : (
            <div>Log in to upload image</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
