const faunadb = require('faunadb');
const fs = require('fs');

const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET });
const q = faunadb.query;

// Helper function to flatten objects (for the userinfo fields)
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = parent ? `${parent}_${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

// Helper function to convert JSON to CSV, flattening fields dynamically
const jsonToCSV = (items) => {
  const allKeys = Array.from(new Set(items.flatMap(item => Object.keys(item))));

  const csv = [
    allKeys.join(','), // header row with all keys
    ...items.map(row =>
      allKeys
        .map(key => JSON.stringify(row[key] || '', (k, v) => (v === null ? '' : v)))
        .join(',')
    ),
  ].join('\r\n');

  return csv;
};

// Recursive function to handle FaunaDB pagination
async function fetchAllPages(collectionName, after = null) {
  try {
    const queryOptions = after
      ? { after }
      : {}; // If `after` is present, use it to fetch the next page; otherwise, start from the beginning.

    const result = await client.query(
      q.Map(
        q.Paginate(q.Documents(q.Collection(collectionName)), queryOptions),
        q.Lambda('doc', q.Get(q.Var('doc')))
      )
    );

    const data = result.data.map((entry) => entry.data); // Extract the 'data' field from the response

    // If there is more data (indicated by the `after` field), fetch the next page recursively.
    if (result.after) {
      const nextPage = await fetchAllPages(collectionName, result.after); // Fetch the next page
      return data.concat(nextPage); // Combine current page data with subsequent pages
    }

    return data; // If no more pages, return the accumulated data
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

// Function to combine clicks with flattened userinfo fields
async function combineRequestsAndUserInfo() {
  const requestsData = await fetchAllPages('clicks'); // No need for userinfo fetch, it's part of clicks

  // Flatten the userinfo field inside each request and return combined data
  const combinedData = requestsData.map(request => {
    const flattenedUserInfo = flattenObject(request.userinfo || {}); // Flatten userinfo field if it exists
    return { ...request, ...flattenedUserInfo }; // Merge request and flattened userinfo
  });

  return combinedData;
}

// Function to export data to CSV
async function exportDataToCSV() {
  try {
    // Fetch all data from 'redirects' collection
    const redirectsData = await fetchAllPages('redirects');

    // Fetch and combine clicks (requests) and userinfo data
    const combinedRequestsUserInfo = await combineRequestsAndUserInfo();

    // Convert data to CSV
    const redirectsCSV = jsonToCSV(redirectsData);
    const requestsCSV = jsonToCSV(combinedRequestsUserInfo);

    // Write the CSV files
    fs.writeFileSync('redirects.csv', redirectsCSV);
    fs.writeFileSync('requests_and_userinfo.csv', requestsCSV);

    console.log('Data has been exported to CSV successfully!');
  } catch (error) {
    console.error('Error exporting data to CSV:', error);
  }
}

// Run the export function
exportDataToCSV();
