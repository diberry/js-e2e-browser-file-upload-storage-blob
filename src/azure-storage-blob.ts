// <snippet_package>
// THIS IS SAMPLE CODE ONLY - NOT MEANT FOR PRODUCTION USE
import { BlobServiceClient } from '@azure/storage-blob';
import { AccountInfo } from "@azure/msal-browser";
import Sanitize from "sanitize-filename";

const containerName = `tutorial-container`;
const sasToken = process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT_NAME;
// </snippet_package>

// get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal

// <snippet_isStorageConfigured>
// Feature flag - disable storage feature to app if not configured
export const isStorageConfigured = () => {
  return (!storageAccountName || !sasToken) ? false : true;
}
// </snippet_isStorageConfigured>

export const getContainerName = (userAccount: AccountInfo | undefined) => {
  
  if (!userAccount || userAccount?.username.length === 0) throw Error("userAccount is invalid");
  
  const sanitizedName = userAccount?.username ? Sanitize(userAccount?.username) : null;
  const deepcleanName = sanitizedName?.replace(/[@.]/gi, '-');
  const userContainerName = `${containerName}-${deepcleanName}`;

  return userContainerName.toLowerCase();
}

const getContainerClient = async (userAccount: AccountInfo | undefined): Promise<any> => {
  
  if (!userAccount || userAccount?.username.length === 0) throw Error("userAccount is invalid");
  
  const blobService = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
  );
  
  const containerName = getContainerName(userAccount);

  // get Container - full public read access
  const containerClient = blobService.getContainerClient(containerName);
  
  // return client 
  const container = await containerClient.createIfNotExists({ access: 'container' });
  
  return { container, containerClient };
}

// reduce data set to manageable info
export type BlobInfo = {
  name: string
  createdOn: string,
  lastModified: string,
  etag: string,
  contentLength: number
  contentType: string,
  blobType: string,
  url: string
}

// <snippet_getBlobsInContainer>
// return list of blobs in container to display
export const getBlobsInContainer = async (userAccount: AccountInfo | undefined): Promise<BlobInfo[]> => {
  
  if (!userAccount || userAccount?.username.length === 0) return [];
  
  const returnedBlobUrls: BlobInfo[] = [];
  
  const container = await getContainerClient(userAccount);

  // get list of blobs in container
  // eslint-disable-next-line
  for await (const blob of container.containerClient.listBlobsFlat()) {
    
    const simplifiedBlob: BlobInfo = {
      name: blob.name,
      createdOn: blob.properties.createdOn,
      lastModified: blob.properties.lastModified,
      etag: blob.properties.etag,
      contentLength: blob.properties.contentLength,
      contentType: blob.properties.contentType,
      blobType: blob.properties.blobType,
      url: `https://${storageAccountName}.blob.core.windows.net/${getContainerName(userAccount)}/${blob.name}`
    }
    
    returnedBlobUrls.push(simplifiedBlob);
  }

  return returnedBlobUrls;
}
// </snippet_getBlobsInContainer>

// <snippet_createBlobInContainer>
export const createBlobInContainer = async (file: File, userAccount: AccountInfo | undefined) => {
  
  if (!file || !userAccount || userAccount?.username.length === 0) return;
  
  const container = await getContainerClient(userAccount);
  
  // create blobClient for container
  const blobClient = container.containerClient.getBlockBlobClient(file.name.toLowerCase());

  // set mimetype as determined from browser with file upload control
  const options = { blobHTTPHeaders: { blobContentType: file.type } };

  // upload file
  await blobClient.uploadBrowserData(file, options);
}
// </snippet_createBlobInContainer>

export const deleteContainer = async (userAccount: AccountInfo | undefined): Promise<any> => {
  
  // don't delete anonymous container
  if (!userAccount || userAccount?.username.length === 0) return;
  
  // get Container - full public read access
  const container = await getContainerClient(userAccount);
  
  // time dependent operation
  const deleteResults = await container.containerClient.deleteIfExists();
  
  console.log("deleteContainer done");
  
  return deleteResults;
};

export const deleteBlob = async (userAccount: AccountInfo | undefined, fileName:string): Promise<any> => {

  // don't delete anonymous container
  if ( userAccount===undefined || userAccount?.username.length === 0) {
    console.log("empty params");
    return;
  }

  // get Container - full public read access
  const container = await getContainerClient(userAccount);
  
  const blockBlobClient = container.containerClient.getBlockBlobClient(fileName);

  // @ts-ignore
  const deleteResults = await blockBlobClient.deleteIfExists();
  
  console.log("deleteBlob done");
  
  return deleteResults;

};

