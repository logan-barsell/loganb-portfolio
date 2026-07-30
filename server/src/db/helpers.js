function escapeLike(value) {
  return String(value).replace(/([\\%_])/g, '\\$1');
}

module.exports = { escapeLike };
