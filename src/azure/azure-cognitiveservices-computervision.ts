// Azure SDK client libraries
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

// Authentication requirements
const key = process.env.REACT_APP_AZURE_COGNITIVE_SERVICES_TEXT_ANALYTICS_KEY;
const endpoint = process.env.REACT_APP_AZURE_COGNITIVE_SERVICES_TEXT_ANALYTICS_ENDPOINT;

// Cognitive service features
const visualFeatures: any[] = [
  'ImageType',
  'Faces',
  'Adult',
  'Categories',
  'Color',
  'Tags',
  'Description',
  'Objects',
  'Brands',
];

export const isConfigured = () => {
  return (key && endpoint && (key.length > 0) && (endpoint.length > 0)) ? true : false;
};

// Computer Vision detected Printed Text
const includesText = async (tags:any) => {
  return tags.filter((el: any) => {
    return el.name.toLowerCase() === 'text';
  });
};
// Computer Vision detected Handwriting
const includesHandwriting = async (tags: any) => {
  return tags.filter((el: any) => {
    return el.name.toLowerCase() === 'handwriting';
  });
};
// Wait for text detection to succeed
const wait = (timeout: any) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

// Analyze Image from URL
export const computerVision = async (url: any) => {
  
  if (!endpoint || endpoint.length === 0) throw Error('endpoint is invalid');
    if (!key || endpoint.length === 0) throw Error('endpoint is invalid');
  
  // authenticate to Azure service
  const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
    endpoint
  );

  // analyze image
  const analysis = await computerVisionClient.analyzeImage(url, { visualFeatures });
  
  // add additional property
  const metaAnalysis = { ...analysis, text: '' };
  
  // text detected - what does it say and where is it
  if (includesText(analysis.tags) || includesHandwriting(analysis.tags)) {
    metaAnalysis.text = await readTextFromURL(computerVisionClient, url);
  }

  // all information about image
  return { URL: url, ...metaAnalysis };
};
// analyze text in image
const readTextFromURL = async (client: any, url: any) => {
  let result = await client.read(url);
  let operationID = result.operationLocation.split('/').slice(-1)[0];

  // Wait for read recognition to complete
  // result.status is initially undefined, since it's the result of read
  const start = Date.now();

  while (result.status !== 'succeeded') {
    await wait(500);
    console.log(`${Date.now() - start} -${result?.status} `);
    result = await client.getReadResult(operationID);
  }

  // Return the first page of result.
  // Replace[0] with the desired page if this is a multi-page file such as .pdf or.tiff.
  return result.analyzeResult;
};
