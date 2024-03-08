/**
 * @file common_utils.js
 * @brief Collection of utility functions to abstract scraper.js
 * @author luethan2025
 * @release 2024
 */
const { existsSync, readFileSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { BadConnectionError } = require('./lib/error');

/**
 * Loads lines of a text file into a Set
 * @param {String} filePath Path to already existing text file
 * @return {Object} Set
 */
function loadVisitedPolicies(filePath) {
  const policy = new Set();
  if (filePath.endsWith('.txt') === false) {
    console.log('Could not parse file');
    return policy;
  }

  if (existsSync(filePath) === true) {
    const visitedPolicies = readFileSync(filePath, {
      encoding: 'utf8',
      flag: 'r'
    }).split('\n');
    for (const item of visitedPolicies) {
      policy.add(item);
    }
  }
  return policy;
}

/**
 * Return an Array of related applications found on the current page
 * @param {Object} page Puppeteer page instance
 * @return {Array} Array of related applications found on the current page
 */
async function getNeighbors(page) {
  const similar = await page.$x(
    '//span[text()="Similar games" or text()="Similar apps"]' +
      '/../../../../..//a[contains(@href, "/store/apps/details?id")]'
  );
  if (similar.length === 0) {
    return [];
  }

  // decode selected tags for their href value
  const apps = await Promise.all(
    similar.map(
      async (item) => await (await item.getProperty('href')).jsonValue()
    )
  );
  return apps;
}

/**
 * Adds a privacy policy to the dataset (if privacy policy is found)
 * @param {Object} page Puppeteer page instance
 * @param {Object} visitedPolicies Set
 */
async function getPolicy(page, visitedPolicies) {
  const seeDetails = await page.$x('//span[text()="See details"]');
  if (seeDetails.length === 0) {
    console.log('Could not find policy. Skipping\n');
    return;
  }

  await seeDetails[0].click();
  await page.waitForTimeout(2000);

  const privacyPolicy = await page.$x('//a[text()="privacy policy"]');
  if (privacyPolicy.length === 0) {
    console.log('Could not find policy. Skipping\n');
    return;
  }

  // decode selected tags for their href value
  const policy = await (await privacyPolicy[0].getProperty('href')).jsonValue();
  if (policy === null) {
    console.log('Could not find policy. Skipping\n');
  } else {
    if (visitedPolicies.has(policy)) {
      console.log('Policy has already been seen. Skipping\n');
    } else {
      visitedPolicies.add(policy);
      console.log(`Adding policy: ${policy}\n`);
    }
  }
}

/**
 * Traverses the Google Play store for privacy policies
 * @param {Object} page Puppeteer page instance
 * @param {Object} visitedPolicies Set
 * @param {Number} depth Maximum depth (decreases by 1 every recursive call)
 */
async function collectPolicies(page, visitedPolicies, depth) {
  if (depth === 0) {
    return;
  }

  const apps = await getNeighbors(page);
  for (const url of apps) {
    try {
      console.log(`Navigating to ${url}`);
      const response = await page.goto(url, {
        waitUntil: 'networkidle2'
      });
      const status = response.status();
      if (status !== 200) {
        console.log('Connection was unsucessful');
        throw new BadConnectionError(
          `Status expected HTTP ${200} ${getReasonPhrase(200)}, ` +
            `but was HTTP ${status} ${getReasonPhrase(status)}`
        );
      }
      console.log('Connection was sucessful');
    } catch (err) {
      console.log(err);
      continue;
    }

    try {
      await getPolicy(page, visitedPolicies);
    } catch {
      console.log('Something went wrong. Skipping\n');
      continue;
    }

    await collectPolicies(page, visitedPolicies, depth - 1);
  }
}

/**
 * Writes the dataset into a file
 * @param {Object} visitedPolicies Set
 * @param {String} directory Destination directory
 * @param {String} filePath Path to destination file
 * @param {boolean} append If true appends to a file, otherwise rewrite the
 *                         entire file
 */
function log_policies(visitedPolicies, directory, filePath, append) {
  if (existsSync(directory) === false) {
    mkdirSync(directory, { recursive: true });
    console.log(`${directory} was created successfully`);
  } else {
    console.log(`${directory} was found`);
  }

  console.log(`Started writing data to ${filePath}`);
  const policies = Array.from(visitedPolicies);
  if (append === true) {
    writeFileSync(filePath, policies.join('\n'), { flag: 'a' });
  } else {
    writeFileSync(filePath, policies.join('\n'), { flag: 'w' });
  }
  console.log('Finished writing data');
}

/**
 * Curator main routine
 * @param {Object} page Puppeteer page instance
 * @param {Number} depth Maximum depth
 * @param {String} directory Destination directory
 * @param {String} filename Destination file
 * @param {boolean} append If true appends to a file, otherwise rewrite the
 *                         entire file
 */
async function searchForPolicies(page, depth, directory, filename, append) {
  const filePath = join(directory, filename);
  const visitedPolicies = append ? loadVisitedPolicies(filePath) : new Set();

  await getPolicy(page, visitedPolicies);
  await collectPolicies(page, visitedPolicies, depth);

  log_policies(visitedPolicies, directory, filePath, append);
}

module.exports = { searchForPolicies };
