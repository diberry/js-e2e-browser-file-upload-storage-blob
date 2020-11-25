import React, { useState } from 'react';
import Path from 'path';
import { uploadFileToBlob, getBlobsInContainer, isStorageConfigured, BlobInfo, deleteBlob } from './azure-storage-blob';
import AzureAuthenticationButton from './azure-authentication-component';
import { AccountInfo } from "@azure/msal-browser";

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
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  const onFileChange = (event: any) => {
    // capture file into state
    setFileSelected(event.target.files[0]);

    console.log(`onFileChange = ${JSON.stringify(event.target.files[0])}`);
  };

  const onFileDelete = async (filename: any) => {
    if (filename) {
      console.log(`${filename}`)
      
      // *** DELETE BLOB IN AZURE STORAGE ***
      await deleteBlob(currentUser, filename);
      
      // *** GET BLOBS FROM AZURE STORAGE ***
      const filesFromContainer = await getBlobsInContainer(currentUser);
      setBlobList(filesFromContainer);
    }
  }
  
  const onFileUpload = async () => {

    if (fileSelected) {

      // prepare UI
      setUploading(true);

      // *** UPLOAD TO AZURE STORAGE ***
      await uploadFileToBlob(fileSelected, currentUser);

      // *** GET BLOBS FROM AZURE STORAGE ***
      const filesFromContainer = await getBlobsInContainer(currentUser);
      setBlobList(filesFromContainer);

      // reset state/form
      setFileSelected(null);
      setUploading(false);
      //setInputKey(Math.random().toString(36));
    }

  };

  const onAuthenticated = async (userAccountInfo: AccountInfo) => {
    setCurrentUser(userAccountInfo);
    const blobsInContainer: BlobInfo[] = await getBlobsInContainer(userAccountInfo);
    setBlobList(blobsInContainer);
  }

  // Display JSON data in readable format
  const PrettyPrintJson = (data: any) => {
    return (<div><pre>{JSON.stringify(data, null, 2)}</pre></div>);
  }

  // display form
  const DisplayForm = ({ user }: any) => {

    console.log(`DisplayForm fileSelected = ${JSON.stringify(fileSelected)}`)

    return (
      <div id="DisplayForm">
        <hr />
        <h4>Select an image</h4>
        { !fileSelected
          ? <div><input type="file" onChange={onFileChange} key={inputKey || ''} /></div>
          : <div>
              { !uploading
                ? <button type="submit" onClick={onFileUpload}>Upload</button>
                : <div>Uploading...</div>
              }
              <img height="75" src={URL.createObjectURL(fileSelected)} />
          </div>
        }
      </div>
    )
  }

  // display file name and image
  const DisplayImagesFromContainer = ({ user }:any) => {
    return (
      <div>
        <hr />
        <h4>Your images: ({ blobList.length})</h4>
          <ul>
            {blobList.map((item, index) => {
              return (
                <li key={index} data-id={item.name}>
                  <div>
                    {Path.basename(item.name)} <button onClick={() => onFileDelete(item.name)}>X</button>
                    <br />
                    <img src={item.url} alt={item.name} height="200" />
                  </div>
                </li>
              );
            })}
          </ul>
      </div>
    )
  };

  const ImageUpload = ({ user }: any) => {
    
    console.log(`ImageUpload ${JSON.stringify(user)}`)
    console.log(`ImageUpload storageConfigured = ${storageConfigured}`)
    
    return (
      <div id="ImageUpload">
        { !storageConfigured
          ? <div>Storage is not configured.</div>
          : <div>
            <DisplayForm user={ user }/>
            {blobList.length > 0 && <DisplayImagesFromContainer user={user} />}
          </div>
        }
      </div>
    )
  }

  const DisplayUser = ({ user }: any) => {
    
    console.log(`DisplayUser ${JSON.stringify(user)}`)
    
    return (
      <div id="DisplayUser">
        { !user
          ? <div>Sign In to upload file to Storage</div>
          : <div>
            <hr />
            <h4>User Account Information</h4>
            <PrettyPrintJson data={user} />
          </div>
        }
      </div>
    )
  }

  return (
    <div id="App">
      <AzureAuthenticationButton onAuthenticated={onAuthenticated} />
      <div id="App.body">
        <h2>Upload file to Azure Blob Storage</h2>
        <div>
          {currentUser
            ? <div>
                <DisplayUser user={currentUser} />
                <ImageUpload user={currentUser} />
              </div>
            : <div>Sign in to upload image</div>
        }
        </div>
      </div>
    </div>
  );
};

export default App;


