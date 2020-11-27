import React, { useState } from 'react';
import {
  createBlobInContainer,
  getBlobsInContainer,
  isStorageConfigured,
  BlobInfo,
  deleteBlob,
  deleteContainer,
  getContainerName,
} from './azure-storage-blob';
import AzureAuthenticationButton from './azure-authentication-component';
import { AccountInfo } from '@azure/msal-browser';

const storageConfigured = isStorageConfigured();

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<BlobInfo[]>([]);

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
    const blobsInContainer: BlobInfo[] = await getBlobsInContainer(userAccountInfo);
    setBlobList(blobsInContainer);
  };

  // Display JSON data in readable format
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

  // display form
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

  // display file name and image
  const DisplayImagesFromContainer = ({ user }: any) => {
    return (
      <div>
        <hr />
        <h4>
          {getContainerName(currentUser)} images: ({blobList.length}){' '}
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

  const ImageUpload = ({ user }: any) => {
    return (
      <div id="ImageUpload">
        {!storageConfigured ? (
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
            <div>Sign in to upload image</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
