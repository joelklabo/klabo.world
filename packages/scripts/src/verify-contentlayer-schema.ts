import { Post, AppDoc, ContextDoc, DashboardDoc } from '../../../app/contentlayer.config.ts';

type ExpectedFields = Record<string, string[]>;

const expectedFields: ExpectedFields = {
  Post: ['title', 'summary', 'date', 'publishDate', 'tags', 'featuredImage'],
  AppDoc: [
    'name',
    'slug',
    'version',
    'publishDate',
    'icon',
    'screenshots',
    'features',
    'fullDescription',
    'appStoreURL',
    'githubURL',
  ],
  ContextDoc: ['title', 'summary', 'createdDate', 'updatedDate', 'tags', 'isPublished'],
  DashboardDoc: ['title', 'summary', 'panelType', 'tags', 'chartType', 'kqlQuery', 'iframeUrl', 'externalUrl', 'refreshIntervalSeconds'],
};

async function main() {
  const docTypes = [Post, AppDoc, ContextDoc, DashboardDoc];
  const missingFields: string[] = [];

  for (const docType of docTypes) {
    const expected = expectedFields[docType.name];
    if (!expected) {
      continue;
    }
    const definedFields = Object.keys(docType.fields ?? {});
    const missingForDoc = expected.filter((field) => !definedFields.includes(field));
    if (missingForDoc.length > 0) {
      missingFields.push(`${docType.name}: ${missingForDoc.join(', ')}`);
    } else {
      console.info(`[verify-contentlayer] ${docType.name} defines all expected fields.`);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing expected fields:\n${missingFields.join('\n')}`);
  }

  console.info('[verify-contentlayer] All expected fields are defined.');
}

if (process.argv[1] && process.argv[1].endsWith('verify-contentlayer-schema.ts')) {
  main().catch((err) => {
    console.error('[verify-contentlayer] failed', err);
    process.exitCode = 1;
  });
}
