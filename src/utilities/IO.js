import fs from 'fs';
import path from 'path';
import uuid from 'uuid/v1';
import { promisify } from 'util';
import archiver from 'archiver';

const IOlib = {
  writeFileAsync(filePath, data) {
    const asyncWrite = promisify(fs.writeFile);
    return asyncWrite(path.resolve(filePath), data);
  },
  readFileAsync(filePath, type) {
    const readFile = promisify(fs.readFile);
    return readFile(path.resolve(filePath), type);
  },
  deleteFileAsync(filePath) {
    const deleteFile = promisify(fs.unlink);
    return deleteFile(path.resolve(filePath));
  },
  appendFileAsync(filePath, data) {
    const appendFile = promisify(fs.appendFile);
    return appendFile(path.resolve(filePath), data);
  },
  fileName(file) {
    return path.basename(path.resolve(file));
  },
  generateUUID() {
    return uuid();
  },
  async writeFileNameInDocument(filePath, type) {
    const regex = /{-{-{(.*?)}-}-}/;
    const resolvedFilePath = path.resolve(filePath);
    const fileName = this.fileName(filePath);
    let readFile = await this.readFileAsync(resolvedFilePath, type);
    if (!regex.test(readFile)) {
      await this.appendFileAsync(resolvedFilePath, `\n {-{-{${fileName}}-}-}`);
    } else {
      return false;
    }
  },

  async compressFiles(data, filePath) {
    const fileName = this.generateUUID();
    const output = fs.createWriteStream(
      path.resolve(`${filePath}/${fileName}.zip`)
    );
    const archive = archiver('zip', {
      zlib: { level: 1 }
    });
    //Listen archiving data
    output.on('close', () => {
      console.log(archive.pointer() + 'total bytes');
    });
    output.on('end', () => {
      console.log('Data has been drained');
    });

    output.on('warning', (err) => {
      if (err.code === 'ENOENT') console.log('No such a file!');
      console.log(err);
    });

    archive.on('error', (err) => {
      console.log(err);
    });

    archive.pipe(output);

    archive.file(data, { name: fileName }).finalize();
    return `${fileName}.zip`;
  }
};

export default IOlib;
