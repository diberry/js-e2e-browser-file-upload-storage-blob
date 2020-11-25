// <snippet_package>
// THIS IS SAMPLE CODE ONLY - NOT MEANT FOR PRODUCTION USE
import { BlobServiceClient, ContainerClient} from '@azure/storage-blob';
import { AccountInfo } from "@azure/msal-browser";
import Sanitize from "sanitize-filename";

const containerName = `tutorial-container`;
const sasToken = process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT_NAME;
// </snippet_package>

// <snippet_isStorageConfigured>
// Feature flag - disable storage feature to app if not configured
export const isStorageConfigured = () => {
  return (!storageAccountName || !sasToken) ? false : true;
}
// </snippet_isStorageConfigured>

const getContainerName = (userAccount: AccountInfo | undefined) => {
  const sanitizedName = userAccount?.username ? Sanitize(userAccount?.username) : null;
  const deepcleanName = sanitizedName?.replace(/[@.]/gi, '-');
  const userContainerName = deepcleanName ? `${containerName}-${deepcleanName}` : `${containerName}-anon`;
  console.log(`userContainerName = ${userContainerName}`);
  return userContainerName.toLowerCase();
}


// <snippet_getBlobsInContainer>
// return list of blobs in container to display
const getBlobsInContainer = async (containerClient: ContainerClient, userAccount: AccountInfo | undefined) => {
  const returnedBlobUrls: string[] = [];

  // get list of blobs in container
  // eslint-disable-next-line
  for await (const blob of containerClient.listBlobsFlat()) {
    // if image is public, just construct URL
    returnedBlobUrls.push(
      `https://${storageAccountName}.blob.core.windows.net/${getContainerName(userAccount)}/${blob.name}`
    );
  }

  return returnedBlobUrls;
}
// </snippet_getBlobsInContainer>

// <snippet_createBlobInContainer>
const createBlobInContainer = async (containerClient: ContainerClient, file: File, user: AccountInfo | undefined) => {
  
  // create blobClient for container
  const blobClient = containerClient.getBlockBlobClient(file.name.toLowerCase());

  // set mimetype as determined from browser with file upload control
  const options = { blobHTTPHeaders: { blobContentType: file.type } };

  // upload file
  await blobClient.uploadBrowserData(file, options);
}
// </snippet_createBlobInContainer>

// <snippet_uploadFileToBlob>
const uploadFileToBlob = async (file: File | null, userAccount:AccountInfo | undefined ): Promise<string[]> => {
  if (!file) return [];

  // get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal
  const blobService = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
  );

  // get Container - full public read access
  const containerClient: ContainerClient = blobService.getContainerClient(getContainerName(userAccount));
  await containerClient.createIfNotExists({
    access: 'container',
  });

  // upload file
  await createBlobInContainer(containerClient, file, userAccount);

  // get list of blobs in container
  return getBlobsInContainer(containerClient, userAccount);
};
// </snippet_uploadFileToBlob>

export default uploadFileToBlob;

