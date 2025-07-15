export default {
  'src/**/*.{js,ts}': (stagedFiles) => [
    `eslint --fix ${stagedFiles.join(' ')}`,
    `prettier --write ${stagedFiles.join(' ')}`,
  ],
  'src/**/*.{html,json,css,scss,md,mdx}': (stagedFiles) => [
    `prettier --write ${stagedFiles.join(' ')}`,
  ],
};
