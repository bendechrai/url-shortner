const faunadb = require('faunadb');
const fs = require('fs');

const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET });
const q = faunadb.query;

// Helper function to convert JSON to CSV, dynamically accounting for all fields
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
      : {}; // Start from the beginning if `after` is null

    const result = await client.query(
      q.Map(
        q.Paginate(q.Documents(q.Collection(collectionName)), queryOptions),
        q.Lambda('doc', q.Get(q.Var('doc')))
      )
    );

    const data = result.data.map((entry) => entry.data); // Extract data part

    // If there's another page, recursively fetch the next one
    if (result.after) {
      const nextPage = await fetchAllPages(collectionName, result.after);
      return data.concat(nextPage); // Combine current page data with the next pages
    }

    return data; // If no more pages, return data
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

// Function to export data to CSV
async function exportDataToCSV() {
  try {
    // Fetch all data from 'redirects' and 'clicks' collections using pagination
    const redirectsData = await fetchAllPages('redirects');
    const clicksData = await fetchAllPages('clicks');

    // Convert data to CSV
    const redirectsCSV = jsonToCSV(redirectsData);
    const clicksCSV = jsonToCSV(clicksData);

    // Write the CSV files
    fs.writeFileSync('redirects.csv', redirectsCSV);
    fs.writeFileSync('clicks.csv', clicksCSV);

    console.log('Data has been exported to CSV successfully!');
  } catch (error) {
    console.error('Error exporting data to CSV:', error);
  }
}

// Run the export function
exportDataToCSV();
