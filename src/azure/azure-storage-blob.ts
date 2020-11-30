import { BlobServiceClient } from '@azure/storage-blob';
import { AccountInfo } from '@azure/msal-browser';
import Sanitize from 'sanitize-filename';

const containerNamePrefix = process.env.REACT_APP_AZURE_STORAGE_CONTAINER_PREFIX;
const sasToken = process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT_NAME;

const userContainer: any = {
  name: '',
  client: null,
};

export const isStorageConfigured = () => {
  return !storageAccountName || !sasToken ? false : true;
};

export const getContainerNameWithUserName = (userAccount: AccountInfo | undefined) => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('Azure userAccount.username is invalid');

  if (userContainer && userContainer.name !== '') return userContainer.name;

  const sanitizedName = Sanitize(userAccount?.username);
  const removeEmailChars = sanitizedName?.replace(/[@.]/gi, '-');
  userContainer.name = `${containerNamePrefix}-${removeEmailChars}`.toLowerCase();

  return userContainer.name;
};

const getContainerClient = async (userAccount: AccountInfo | undefined): Promise<any> => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');
  if (!storageAccountName || storageAccountName.length === 0) throw Error('storageAccountName is invalid');
  if (!sasToken || sasToken.length === 0) throw Error('sasToken is invalid');

  if (userContainer && userContainer.name !== '' && userContainer.client != null) return userContainer;

  const blobService = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net/?${sasToken}`);

  // create container name: username + env var container prefix
  userContainer.name = getContainerNameWithUserName(userAccount);

  // get Container - full public read access
  userContainer.client = blobService.getContainerClient(userContainer.name);

  // return client
  // `blob` access means you can share blob publicly but not container listing of blobs
  await userContainer.client.createIfNotExists({ access: 'blob' });

  return userContainer;
};

// reduce data set to manageable info
export type AppBlobInfo = {
  name: string;
  createdOn: string;
  lastModified: string;
  etag: string;
  contentLength: number;
  contentType: string;
  blobType: string;
  url: string;
};

// return list of blobs in container to display
export const getBlobsInContainer = async (userAccount: AccountInfo | undefined): Promise<AppBlobInfo[]> => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');
  if (!storageAccountName || storageAccountName.length === 0) throw Error('storageAccountName is invalid');

  const returnedBlobUrls: AppBlobInfo[] = [];

  const container = await getContainerClient(userAccount);

  // get list of blobs in container
  // eslint-disable-next-line
  for await (const blob of container.client.listBlobsFlat({
    includeMetadata: true,
  })) {
    const simplifiedBlob: AppBlobInfo = {
      name: blob.name,
      createdOn: blob.properties.createdOn,
      lastModified: blob.properties.lastModified,
      etag: blob.properties.etag,
      contentLength: blob.properties.contentLength,
      contentType: blob.properties.contentType,
      blobType: blob.properties.blobType,
      url: blob.metadata['url'],
    };

    returnedBlobUrls.push(simplifiedBlob);
  }

  return returnedBlobUrls;
};

export const createBlobInContainer = async (file: File, userAccount: AccountInfo) => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');
  if (!file) throw Error('file is invalid');

  const container = await getContainerClient(userAccount);

  // create blobClient for container, includes URL
  const blobClient = container.client.getBlockBlobClient(file.name.toLowerCase());

  // set mimetype as determined from browser with file upload control
  const options = { blobHTTPHeaders: { blobContentType: file.type } };

  // upload file
  const uploadBrowserData = await blobClient.uploadBrowserData(file, options);

  console.log(`${blobClient.url}`);

  // add url to metadata
  await setBlobMetadataProperties(file, userAccount, { url: blobClient.url });

  return { ...uploadBrowserData, url: blobClient.url };
};

export const getContainerProperties = async (userAccount: AccountInfo) => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');

  const container = await getContainerClient(userAccount);

  // get properties
  return await container.client.getProperties();
};

export const setBlobMetadataProperties = async (file: File, userAccount: AccountInfo, metaData: any) => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');
  if (!file) throw Error('file is invalid');
  if (!metaData) throw Error('metaData is invalid');

  const container = await getContainerClient(userAccount);

  // create blobClient for container
  const blobClient = container.client.getBlockBlobClient(file.name.toLowerCase());

  // upload file
  const setMetadataResults = await blobClient.setMetadata(metaData);

  return setMetadataResults;
};

export const deleteContainer = async (userAccount: AccountInfo): Promise<any> => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');

  // get Container - full public read access
  const container = await getContainerClient(userAccount);

  // time dependent operation - all subsequent operations should poll for completeness
  const deleteResults = await container.client.deleteIfExists();

  return deleteResults;
};

export const deleteBlob = async (userAccount: AccountInfo, fileName: string): Promise<any> => {
  if (!userAccount || userAccount?.username.length === 0) throw Error('userAccount is invalid');
  if (!fileName) throw Error('fileName is invalid');

  // get Container - full public read access
  const container = await getContainerClient(userAccount);

  // get blob client
  const blockBlobClient = container.client.getBlockBlobClient(fileName);

  // @ts-ignore
  const deleteResults = await blockBlobClient.deleteIfExists();

  return deleteResults;
};
