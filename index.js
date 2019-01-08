"use strict";

const fs = require("fs");
const moment = require("moment");
const Url = require("url-parse");
const BaseAdapter = require("ghost-storage-base");
const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

class DropboxAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);

    this.config = config;

    this.client = new Dropbox({
      accessToken: config.accessToken,
      fetch
    });
  }

  save(file) {
    const _this = this;

    const date = moment();
    const month = date.format("MM");
    const year = date.format("YYYY");

    return new Promise(function(resolve, reject) {
      _this.client
        .filesUpload({
          path: `/${year}/${month}/${file.filename}${file.ext}`,
          contents: fs.createReadStream(file.path),
          mode: "overwrite"
        })
        .then(function(response) {
          console.log("response", response);
          _this.client
            .sharingCreateSharedLink({
              path: response.path_display,
              short_url: false
            })
            .then(value => {
              const url = new Url(value.url);

              // https://blogs.dropbox.com/developers/2013/08/programmatically-download-content-from-share-links/
              resolve(`${url.origin}${url.pathname}?raw=1`);
            })
            .catch(function(error) {
              console.error("sharing link", error);
              reject(error);
            });
        })
        .catch(function(error) {
          console.error("file upload", error.error.error.reason);
          reject(error);
        });
    });
  }

  exists(fileName, targetDir) {
    return true;
  }

  serve() {
    return function customServe(req, res, next) {
      next();
    };
  }

  /**
   * Not implemented.
   */
  delete() {}

  /**
   * Not implemented.
   */
  read() {}
}

module.exports = DropboxAdapter;
