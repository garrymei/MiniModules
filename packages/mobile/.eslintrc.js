module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    jest: true,
  },
  globals: {
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
  },
}
